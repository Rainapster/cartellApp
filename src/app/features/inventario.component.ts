import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Articolo } from '../models/articolo.model';
import { InventarioService, RigaAcquisto } from '../service/inventario.service';
import { sommaEuro } from '../service/money';

@Component({
  selector: 'app-inventario',
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="inv-container">
      <h1>Magazzino</h1>

      <!-- ===== Registra acquisto ===== -->
      <div class="card">
        <h3>Registra acquisto (da fattura)</h3>

        <div class="meta">
          <div>
            <label>Data</label>
            <input type="date" [(ngModel)]="dataAcquisto" />
          </div>
          <div class="grow">
            <label>Fornitore / n° fattura (facoltativo)</label>
            <input type="text" [(ngModel)]="fornitore" placeholder="Es. Rossi srl — fatt. 123" />
          </div>
        </div>

        <div class="righe">
          <div class="riga intestazione">
            <span>Descrizione</span>
            <span>Quantità</span>
            <span>Costo unit.</span>
            <span>Totale</span>
            <span></span>
          </div>
          <div class="riga" *ngFor="let r of righe; let i = index">
            <input type="text" [(ngModel)]="r.descrizione" placeholder="Descrizione articolo" />
            <input type="number" [(ngModel)]="r.quantita" min="0" />
            <input type="number" [(ngModel)]="r.costoUnitario" min="0" step="0.01" />
            <span class="riga-tot">{{ r.quantita * r.costoUnitario | currency }}</span>
            <button class="remove" (click)="rimuoviRiga(i)" [disabled]="righe.length === 1">✕</button>
          </div>
        </div>

        <div class="azioni-righe">
          <button class="ghost" (click)="aggiungiRiga()">+ Aggiungi riga</button>
          <label class="ghost file-btn">
            Importa fattura XML
            <input
              type="file"
              accept=".xml,application/xml,text/xml"
              (change)="importaXml($event)"
              hidden
            />
          </label>
        </div>

        <details class="incolla">
          <summary>Incolla righe (da Excel / gestionale)</summary>
          <p class="hint">
            Una riga per articolo, con <strong>descrizione</strong>, <strong>quantità</strong> e
            <strong>costo</strong> separati da tab, punto e virgola o virgola.<br />
            Es: <code>Sedia rossa; 10; 25,50</code>
          </p>
          <textarea [(ngModel)]="testoIncolla" rows="5" placeholder="Sedia rossa; 10; 25,50
Tavolo; 2; 120"></textarea>
          <button class="ghost" (click)="importaTesto()">Importa righe</button>
        </details>

        <div class="riepilogo-acquisto">
          <div class="totali">
            <span>Totale netto righe: {{ totaleAcquisto() | currency }}</span>
            <span class="spesa-riga">
              <ng-container *ngIf="totaleFatturaImport === null">
                <label>IVA</label>
                <input type="number" [(ngModel)]="ivaPercent" min="0" step="1" class="iva-input" /> %
              </ng-container>
              <strong>Spesa (IVA incl.): {{ importoSpesa() | currency }}</strong>
              <small *ngIf="totaleFatturaImport !== null" class="hint">
                dal totale della fattura XML —
                <a href="javascript:void(0)" (click)="usaNettoPiuIva()">usa netto + IVA%</a>
              </small>
            </span>
          </div>
          <button class="primary" (click)="registra()">Registra acquisto</button>
        </div>
        <p class="hint">
          Verrà creata una spesa di {{ importoSpesa() | currency }} in categoria «Merce da
          vendere». Gli articoli entrano in magazzino al costo netto.
        </p>
      </div>

      <!-- ===== Inventario ===== -->
      <div class="card">
        <div class="inv-testa">
          <h3>Articoli in magazzino</h3>
          <span class="valore">Valore: {{ valoreMagazzino() | currency }}</span>
        </div>

        <div class="ricarico-default">
          <label>Ricarico predefinito</label>
          <input type="number" [(ngModel)]="srv.ricaricoDefault" min="0" step="1" (change)="salva()" />
          <span>%</span>
          <small class="hint">Vale per tutti gli articoli, salvo quelli con un ricarico proprio.</small>
        </div>

        <label class="iva-toggle">
          <input type="checkbox" [(ngModel)]="srv.ivaInclusa" (change)="salva()" />
          Includi IVA {{ srv.aliquotaIva }}% nel prezzo di vendita
        </label>

        <div class="cerca-articoli" *ngIf="srv.articoli.length > 0">
          <input
            type="text"
            [(ngModel)]="filtroArticoli"
            placeholder="Cerca articolo per descrizione…"
          />
          <button *ngIf="filtroArticoli" class="ghost" (click)="filtroArticoli = ''">✕</button>
        </div>

        <p *ngIf="srv.articoli.length === 0" class="hint">Nessun articolo in magazzino.</p>
        <p *ngIf="srv.articoli.length > 0 && articoliFiltrati().length === 0" class="hint">
          Nessun articolo corrisponde a «{{ filtroArticoli }}».
        </p>
        <div class="tabella-scroll" *ngIf="articoliFiltrati().length > 0">
          <table>
            <thead>
              <tr>
                <th>Descrizione</th>
                <th>Quantità</th>
                <th>Costo unit.</th>
                <th>Ricarico %</th>
                <th>Prezzo vendita{{ srv.ivaInclusa ? ' (IVA incl.)' : '' }}</th>
                <th>Valore</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of articoliFiltrati()" [class.esaurito]="a.quantita <= 0">
                <td><input type="text" [(ngModel)]="a.descrizione" (change)="salva()" /></td>
                <td>
                  <input type="number" [(ngModel)]="a.quantita" min="0" (change)="salva()" class="q" />
                </td>
                <td>
                  <input
                    type="number"
                    [(ngModel)]="a.costoUnitario"
                    min="0"
                    step="0.01"
                    (change)="salva()"
                    class="q"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    [(ngModel)]="a.ricarico"
                    min="0"
                    step="1"
                    (change)="salva()"
                    class="q ric"
                    [placeholder]="srv.ricaricoDefault"
                    title="Lascia vuoto per usare il ricarico predefinito"
                  />
                </td>
                <td class="prezzo-vendita">{{ srv.prezzoVendita(a) | currency }}</td>
                <td>{{ a.quantita * a.costoUnitario | currency }}</td>
                <td><button class="remove" (click)="elimina(a)">Elimina</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: `
  .inv-container { max-width: 900px; margin: 2rem auto; padding: 1rem; }
  h1 { text-align: center; color: #0d6efd; margin-bottom: 1.5rem; }
  .card {
    background: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  .card h3 { color: #495057; margin-bottom: 1rem; }
  label { display: block; font-weight: 500; color: #495057; margin-bottom: 0.25rem; font-size: 0.9rem; }
  input, textarea {
    border: 1px solid #ced4da;
    border-radius: 0.375rem;
    padding: 0.4rem 0.6rem;
    width: 100%;
  }
  input:focus, textarea:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.2);
  }

  .meta { display: flex; gap: 1rem; margin-bottom: 1rem; }
  .meta .grow { flex: 1; }

  .righe { margin-bottom: 0.75rem; }
  .riga {
    display: grid;
    grid-template-columns: 1fr 90px 110px 100px 36px;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.4rem;
  }
  .riga.intestazione {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 600;
  }
  .riga-tot { text-align: right; font-weight: 600; color: #495057; }

  button {
    border: none;
    border-radius: 0.375rem;
    padding: 0.45rem 0.9rem;
    cursor: pointer;
    font-weight: 500;
  }
  .primary { background: #198754; color: #fff; }
  .primary:hover { background: rgb(23, 122, 76); }
  .ghost { background: #e9ecef; color: #495057; }
  .ghost:hover { background: #dde1e5; }
  .azioni-righe { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
  .file-btn { display: inline-block; }
  .remove { background: #c42e29; color: #fff; }
  .remove:hover { background: #842029; }
  .remove:disabled { background: #e9a5a2; cursor: not-allowed; }

  .incolla { margin: 0.5rem 0 1rem; }
  .incolla summary { cursor: pointer; color: #0d6efd; }
  .incolla textarea { margin: 0.5rem 0; font-family: monospace; }
  .hint { color: #6c757d; font-size: 0.85rem; }
  code { background: #f1f3f5; padding: 0 0.25rem; border-radius: 3px; }

  .riepilogo-acquisto {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    border-top: 1px solid #dee2e6;
    padding-top: 1rem;
    margin-top: 0.5rem;
    font-size: 1.1rem;
  }
  .riepilogo-acquisto .totali { display: flex; flex-direction: column; gap: 0.3rem; }
  .riepilogo-acquisto .totali > span { font-size: 0.95rem; color: #495057; }
  .spesa-riga { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
  .spesa-riga label { margin: 0; }
  .iva-input { width: 70px; }
  .spesa-riga strong { color: #198754; }

  .inv-testa { display: flex; justify-content: space-between; align-items: baseline; }
  .valore { font-weight: 600; color: #198754; }

  .ricarico-default {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    background: #f8f9fa;
    border-radius: 0.375rem;
    padding: 0.6rem 0.8rem;
    margin: 0.75rem 0 1rem;
  }
  .ricarico-default label { margin: 0; white-space: nowrap; }
  .ricarico-default input { width: 90px; }
  .ricarico-default .hint { flex: 1; min-width: 180px; }
  .iva-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-weight: 500;
    color: #495057;
    cursor: pointer;
  }
  .iva-toggle input { width: auto; }

  .cerca-articoli { display: flex; gap: 0.5rem; margin: 0.5rem 0 1rem; }
  .cerca-articoli input { flex: 1; }
  .tabella-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
  th, td { padding: 0.4rem; text-align: left; border-bottom: 1px solid #f1f3f5; white-space: nowrap; }
  th { font-size: 0.85rem; color: #6c757d; }
  td input.q { max-width: 110px; }
  td input.ric { max-width: 80px; }
  .prezzo-vendita { font-weight: 600; color: #0d6efd; }
  tr.esaurito { background: #fff5f5; }
  tr.esaurito td:first-child { color: #c42e29; }
  `,
})
export class InventarioComponent {
  srv = inject(InventarioService);

  dataAcquisto = new Date().toISOString().slice(0, 10);
  fornitore = '';
  righe: RigaAcquisto[] = [this.rigaVuota()];
  testoIncolla = '';
  ivaPercent = 22; // usata per calcolare la spesa negli acquisti manuali
  // Totale reale letto dalla fattura XML: se valorizzato, è l'importo della spesa
  totaleFatturaImport: number | null = null;
  filtroArticoli = ''; // ricerca nella tabella del magazzino

  // Articoli del magazzino filtrati per descrizione (ricerca "contiene")
  articoliFiltrati(): Articolo[] {
    const q = this.filtroArticoli.trim().toLowerCase();
    if (!q) return this.srv.articoli;
    return this.srv.articoli.filter((a) => a.descrizione.toLowerCase().includes(q));
  }

  private rigaVuota(): RigaAcquisto {
    return { descrizione: '', quantita: 0, costoUnitario: 0 };
  }

  // Importo della spesa: totale reale della fattura XML se presente,
  // altrimenti il netto delle righe maggiorato dell'IVA indicata
  importoSpesa(): number {
    if (this.totaleFatturaImport !== null) return this.totaleFatturaImport;
    return this.totaleAcquisto() * (1 + Number(this.ivaPercent) / 100);
  }

  // Ignora il totale XML e torna al calcolo netto + IVA%
  usaNettoPiuIva() {
    this.totaleFatturaImport = null;
  }

  aggiungiRiga() {
    this.righe.push(this.rigaVuota());
  }
  rimuoviRiga(i: number) {
    if (this.righe.length > 1) this.righe.splice(i, 1);
  }

  totaleAcquisto(): number {
    return sommaEuro(this.righe, (r) => Number(r.quantita) * Number(r.costoUnitario));
  }

  // Trasforma il testo incollato in righe. Separatori ammessi: tab, ; o ,
  importaTesto() {
    const nuove = this.testoIncolla
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split(/\t|;|,/).map((c) => c.trim()))
      .map((celle) => ({
        descrizione: celle[0] ?? '',
        quantita: this.numero(celle[1]),
        costoUnitario: this.numero(celle[2]),
      }))
      .filter((r) => r.descrizione);

    if (nuove.length === 0) {
      alert('Nessuna riga riconosciuta nel testo incollato.');
      return;
    }
    // Sostituisco le righe vuote iniziali, altrimenti aggiungo in coda
    const esistentiValide = this.righe.filter((r) => r.descrizione.trim());
    this.righe = [...esistentiValide, ...nuove];
    this.testoIncolla = '';
  }

  async importaXml(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const fattura = this.srv.parseFattura(await file.text());
      if (fattura.data) this.dataAcquisto = fattura.data;
      this.fornitore = [fattura.fornitore, fattura.numero ? `fatt. ${fattura.numero}` : '']
        .filter(Boolean)
        .join(' — ');
      this.righe = fattura.righe;
      this.totaleFatturaImport = fattura.totale > 0 ? fattura.totale : null;
      const totaleMsg =
        fattura.totale > 0 ? `\nSpesa = totale fattura: ${this.euro(fattura.totale)}.` : '';
      alert(
        `Importate ${fattura.righe.length} righe dalla fattura.` +
          totaleMsg +
          '\nControlla e rimuovi le voci che non sono merce (contributi, note, righe a 0) prima di registrare.'
      );
    } catch (e: any) {
      alert('Impossibile leggere la fattura: ' + (e?.message ?? 'errore sconosciuto'));
    } finally {
      input.value = ''; // consente di re-importare lo stesso file
    }
  }

  async registra() {
    try {
      const totale = await this.srv.registraAcquisto(this.righe, {
        data: this.dataAcquisto,
        fornitore: this.fornitore,
        importoSpesa: this.importoSpesa(),
      });
      alert(`Acquisto registrato: spesa di ${this.euro(totale)} creata e magazzino aggiornato.`);
      this.righe = [this.rigaVuota()];
      this.fornitore = '';
      this.totaleFatturaImport = null;
    } catch (e: any) {
      alert(e?.message ?? 'Impossibile registrare l’acquisto');
    }
  }

  salva() {
    this.srv.salva().catch((e) => alert('Errore nel salvataggio: ' + e.message));
  }

  elimina(a: Articolo) {
    if (!confirm(`Eliminare «${a.descrizione}» dal magazzino?`)) return;
    this.srv.rimuoviArticolo(a).catch((e) => alert('Errore: ' + e.message));
  }

  valoreMagazzino(): number {
    return sommaEuro(this.srv.articoli, (a) => Number(a.quantita) * Number(a.costoUnitario));
  }

  // Converte "25,50", "1.250,00" o "25.50" in numero.
  // Se c'è una virgola la tratto come decimale (e i punti come migliaia);
  // altrimenti lascio il punto come decimale.
  private numero(v: string | undefined): number {
    if (!v) return 0;
    const s = v.includes(',') ? v.replace(/\./g, '').replace(',', '.') : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  private euro(n: number): string {
    return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  }
}
