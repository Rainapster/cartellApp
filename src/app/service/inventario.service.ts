import { inject, Injectable } from '@angular/core';
import { Articolo } from '../models/articolo.model';
import { Spesa } from '../models/spesa.model';
import { StorageService } from './storage';

export interface RigaAcquisto {
  descrizione: string;
  quantita: number;
  costoUnitario: number;
}

export interface FatturaImportata {
  fornitore: string;
  numero: string;
  data: string; // yyyy-mm-dd
  righe: RigaAcquisto[];
  totale: number; // totale documento IVA inclusa (quanto si paga davvero)
}

// Categoria usata per le spese generate dagli acquisti di merce
const CATEGORIA_ACQUISTO = 'Merce da vendere';
// Aliquota IVA ordinaria applicata al prezzo di vendita quando richiesto
const ALIQUOTA_IVA = 22;

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private storage = inject(StorageService);

  get articoli(): Articolo[] {
    return this.storage.data.inventario;
  }

  get ricaricoDefault(): number {
    return this.storage.data.ricaricoDefault;
  }
  set ricaricoDefault(v: number) {
    this.storage.data.ricaricoDefault = Number(v) || 0;
  }

  get ivaInclusa(): boolean {
    return this.storage.data.ivaInclusa;
  }
  set ivaInclusa(v: boolean) {
    this.storage.data.ivaInclusa = v;
  }

  get aliquotaIva(): number {
    return ALIQUOTA_IVA;
  }

  // Ricarico effettivo di un articolo: il suo, se impostato, altrimenti il predefinito
  ricaricoEffettivo(a: Articolo): number {
    return Number(a.ricarico ?? this.ricaricoDefault) || 0;
  }

  // Prezzo di vendita = costo + ricarico %, con IVA se la spunta è attiva
  prezzoVendita(a: Articolo): number {
    const conRicarico = Number(a.costoUnitario) * (1 + this.ricaricoEffettivo(a) / 100);
    return this.ivaInclusa ? conRicarico * (1 + ALIQUOTA_IVA / 100) : conRicarico;
  }

  // Carica gli articoli in magazzino (al costo netto delle righe) e crea un'unica
  // spesa pari a `importoSpesa` (IVA inclusa: quanto si paga davvero).
  // Ritorna l'importo della spesa registrata. Lancia se non c'è nessuna riga valida.
  async registraAcquisto(
    righe: RigaAcquisto[],
    meta: { data: string; fornitore?: string; importoSpesa: number }
  ): Promise<number> {
    const valide = righe
      .map((r) => ({
        descrizione: (r.descrizione ?? '').trim(),
        quantita: Number(r.quantita),
        costoUnitario: Number(r.costoUnitario),
      }))
      .filter((r) => r.descrizione && r.quantita > 0 && r.costoUnitario >= 0);

    if (valide.length === 0) throw new Error('Nessuna riga valida da registrare');

    for (const riga of valide) {
      const esistente = this.trovaPerDescrizione(riga.descrizione);
      if (esistente) {
        esistente.quantita = Number(esistente.quantita) + riga.quantita;
        esistente.costoUnitario = riga.costoUnitario; // allineo all'ultimo costo d'acquisto
      } else {
        this.articoli.push({
          _id: crypto.randomUUID(),
          descrizione: riga.descrizione,
          quantita: riga.quantita,
          costoUnitario: riga.costoUnitario,
        });
      }
    }

    const importoSpesa = Math.round(Number(meta.importoSpesa) * 100) / 100;
    const descrizione = meta.fornitore?.trim()
      ? `Acquisto merce — ${meta.fornitore.trim()}`
      : 'Acquisto merce';
    const spesa: Spesa = {
      _id: crypto.randomUUID(),
      descrizione,
      importo: importoSpesa,
      data: meta.data,
      categoria: CATEGORIA_ACQUISTO,
    };
    this.storage.data.spese.push(spesa);

    await this.storage.save();
    return importoSpesa;
  }

  // Salva le modifiche fatte direttamente sugli articoli (es. quantità corretta a mano)
  salva(): Promise<void> {
    return this.storage.save();
  }

  async rimuoviArticolo(articolo: Articolo): Promise<void> {
    this.storage.data.inventario = this.articoli.filter((a) => a !== articolo);
    await this.storage.save();
  }

  private trovaPerDescrizione(descrizione: string): Articolo | undefined {
    const chiave = descrizione.trim().toLowerCase();
    return this.articoli.find((a) => a.descrizione.trim().toLowerCase() === chiave);
  }

  // Legge una fattura elettronica FatturaPA (XML) ed estrae fornitore, data,
  // numero e le righe prodotto. Non modifica nulla: serve solo a pre-compilare
  // il form di acquisto, che l'utente conferma a mano.
  parseFattura(testoXml: string): FatturaImportata {
    const doc = new DOMParser().parseFromString(testoXml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('il file non è un XML valido');
    }

    const cedente = this.primo(doc, 'CedentePrestatore');
    const fornitore = cedente
      ? this.testo(cedente, 'Denominazione') ||
        [this.testo(cedente, 'Nome'), this.testo(cedente, 'Cognome')].filter(Boolean).join(' ')
      : '';

    const intestazione = this.primo(doc, 'DatiGeneraliDocumento');
    const data = intestazione ? this.testo(intestazione, 'Data') : '';
    const numero = intestazione ? this.testo(intestazione, 'Numero') : '';

    const righe = this.elementi(doc, 'DettaglioLinee')
      .map((linea) => {
        const quantita = this.testo(linea, 'Quantita');
        return {
          descrizione: this.testo(linea, 'Descrizione'),
          // la quantità può mancare nelle righe di servizio: in quel caso 1
          quantita: quantita ? this.numeroXml(quantita) : 1,
          costoUnitario: this.numeroXml(this.testo(linea, 'PrezzoUnitario')),
        };
      })
      .filter((r) => r.descrizione);

    if (righe.length === 0) throw new Error('nessuna riga prodotto trovata nel file');

    return { fornitore, numero, data, righe, totale: this.totaleDocumento(doc, intestazione) };
  }

  // Totale documento IVA inclusa: uso ImportoTotaleDocumento se presente,
  // altrimenti sommo imponibile + imposta di tutti i riepiloghi IVA.
  private totaleDocumento(doc: Document, intestazione: Element | undefined): number {
    const dichiarato = intestazione
      ? this.numeroXml(this.testo(intestazione, 'ImportoTotaleDocumento'))
      : 0;
    if (dichiarato > 0) return Math.round(dichiarato * 100) / 100;

    const daRiepiloghi = this.elementi(doc, 'DatiRiepilogo').reduce(
      (acc, r) =>
        acc + this.numeroXml(this.testo(r, 'ImponibileImporto')) + this.numeroXml(this.testo(r, 'Imposta')),
      0
    );
    return Math.round(daRiepiloghi * 100) / 100;
  }

  // --- helper di parsing XML (ignorano namespace/prefissi) ---
  private elementi(root: Document | Element, nome: string): Element[] {
    return Array.from(root.getElementsByTagNameNS('*', nome));
  }
  private primo(root: Document | Element, nome: string): Element | undefined {
    return this.elementi(root, nome)[0];
  }
  private testo(root: Element, nome: string): string {
    return this.primo(root, nome)?.textContent?.trim() ?? '';
  }
  // Nell'XML i decimali usano sempre il punto (es. "120.582000")
  private numeroXml(v: string): number {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
}
