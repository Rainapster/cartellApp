import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartellaService } from '../service/cartella.service';
import { SpesaService } from '../service/spesa.service';
import { aEuro, differenzaEuro, sommaEuro } from '../service/money';

interface VoceCategoria {
  categoria: string;
  totale: number;
  perc: number; // larghezza barra, 0–100, relativa alla categoria più alta
}

// Un movimento datato (una rata incassata o una spesa)
interface Movimento {
  anno: number;
  mese: number; // 1–12
  importo: number;
}

interface GruppoGrafico {
  label: string;
  incassi: number;
  spese: number;
}

const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

@Component({
  selector: 'app-riepilogo',
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="riepilogo-container">
      <h1>Statistiche</h1>

      <!-- Filtro periodo -->
      <div class="filtro">
        <label>Periodo:</label>
        <select [(ngModel)]="annoSel" (ngModelChange)="onAnnoChange()">
          <option [ngValue]="'tutti'">Tutti gli anni</option>
          <option *ngFor="let a of anniDisponibili" [ngValue]="a">{{ a }}</option>
        </select>
        <select [(ngModel)]="meseSel" (ngModelChange)="aggiorna()" [disabled]="annoSel === 'tutti'">
          <option [ngValue]="'tutti'">Tutto l'anno</option>
          <option *ngFor="let m of mesi; let i = index" [ngValue]="i + 1">{{ m }}</option>
        </select>
      </div>

      <!-- KPI del periodo -->
      <div class="kpi-grid">
        <div class="kpi">
          <span class="kpi-label">Incassato</span>
          <span class="kpi-value">{{ incassatoPeriodo | currency }}</span>
          <small>{{ etichettaPeriodo }}</small>
        </div>
        <div class="kpi">
          <span class="kpi-label">Spese</span>
          <span class="kpi-value spesa">{{ spesePeriodo | currency }}</span>
          <small>{{ etichettaPeriodo }}</small>
        </div>
        <div class="kpi evidenza">
          <span class="kpi-label">Utile Netto</span>
          <span class="kpi-value" [class.spesa]="utilePeriodo < 0" [class.ok]="utilePeriodo >= 0">
            {{ utilePeriodo | currency }}
          </span>
          <small>Incassato − Spese · {{ etichettaPeriodo }}</small>
        </div>
      </div>

      <!-- KPI cumulativi (non dipendono dal periodo) -->
      <div class="kpi-grid">
        <div class="kpi">
          <span class="kpi-label">Merce Venduta (totale)</span>
          <span class="kpi-value">{{ totaleMerceVenduta | currency }}</span>
        </div>
        <div class="kpi evidenza">
          <span class="kpi-label">Credito da Incassare</span>
          <span class="kpi-value attesa">{{ creditoDaIncassare | currency }}</span>
          <small>{{ clientiSaldoAperto }} client{{ clientiSaldoAperto === 1 ? 'e' : 'i' }} con saldo aperto · totale</small>
        </div>
      </div>

      <!-- Grafico incassi vs spese nel tempo -->
      <div class="card-grafico">
        <div class="grafico-testa">
          <h3>Incassi e spese nel tempo</h3>
          <div class="legenda">
            <span><i class="box inc"></i> Incassi</span>
            <span><i class="box sp"></i> Spese</span>
          </div>
        </div>
        <p *ngIf="grafico.length === 0" class="vuoto">Nessun movimento nel periodo.</p>
        <div class="grafico" *ngIf="grafico.length > 0">
          <div class="gruppo" *ngFor="let g of grafico">
            <div class="colonne">
              <div
                class="col inc"
                [style.height.%]="altezza(g.incassi)"
                [title]="'Incassi: ' + (g.incassi | currency)"
              ></div>
              <div
                class="col sp"
                [style.height.%]="altezza(g.spese)"
                [title]="'Spese: ' + (g.spese | currency)"
              ></div>
            </div>
            <span class="etichetta">{{ g.label }}</span>
          </div>
        </div>
      </div>

      <!-- Spese per categoria -->
      <div class="card-spese">
        <h3>Spese per categoria <small>· {{ etichettaPeriodo }}</small></h3>
        <p *ngIf="spesePerCategoria.length === 0" class="vuoto">Nessuna spesa nel periodo.</p>
        <div class="barra-riga" *ngFor="let v of spesePerCategoria">
          <div class="barra-testa">
            <span>{{ v.categoria }}</span>
            <span class="barra-importo">{{ v.totale | currency }}</span>
          </div>
          <div class="barra-track">
            <div class="barra-fill" [style.width.%]="v.perc"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
  .riepilogo-container { max-width: 800px; margin: 2rem auto; padding: 1rem; }
  h1 { text-align: center; color: #0d6efd; margin-bottom: 1.5rem; }

  .filtro {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .filtro label { font-weight: 500; color: #495057; }
  .filtro select {
    border: 1px solid #ced4da;
    border-radius: 0.375rem;
    padding: 0.4rem 0.6rem;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .kpi {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
  }
  .kpi.evidenza { border-left: 4px solid #0d6efd; }
  .kpi-label { color: #495057; font-size: 0.95rem; }
  .kpi-value { font-size: 1.5rem; font-weight: bold; color: #198754; }
  .kpi-value.spesa { color: #c42e29; }
  .kpi-value.ok { color: #198754; }
  .kpi-value.attesa { color: #0d6efd; }
  .kpi small { color: #6c757d; font-size: 0.8rem; }

  .card-grafico, .card-spese {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
    margin-bottom: 1.5rem;
  }
  .grafico-testa { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
  .card-grafico h3, .card-spese h3 { color: #495057; }
  .card-spese h3 small { color: #6c757d; font-weight: normal; font-size: 0.85rem; }
  .legenda { display: flex; gap: 1rem; font-size: 0.85rem; color: #495057; }
  .legenda .box { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: middle; margin-right: 0.25rem; }
  .box.inc { background: #198754; }
  .box.sp { background: #c42e29; }

  .grafico {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    height: 180px;
    margin-top: 1rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  .gruppo { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; min-width: 34px; flex: 1; }
  .colonne { display: flex; align-items: flex-end; gap: 2px; height: 150px; width: 100%; justify-content: center; }
  .col { width: 45%; min-height: 2px; border-radius: 3px 3px 0 0; }
  .col.inc { background: #198754; }
  .col.sp { background: #c42e29; }
  .etichetta { font-size: 0.75rem; color: #6c757d; white-space: nowrap; }

  .vuoto { color: #6c757d; }
  .barra-riga { margin-bottom: 0.9rem; }
  .barra-testa { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem; color: #495057; }
  .barra-importo { font-weight: 600; }
  .barra-track { background-color: #e9ecef; border-radius: 999px; height: 12px; overflow: hidden; }
  .barra-fill { background-color: #0d6efd; height: 100%; border-radius: 999px; transition: width 0.3s ease; }
  `,
})
export class RiepilogoComponent {
  private srv = inject(CartellaService);
  private srvSpese = inject(SpesaService);

  mesi = MESI;
  anniDisponibili: number[] = [];
  annoSel: number | 'tutti' = 'tutti';
  meseSel: number | 'tutti' = 'tutti';

  // Sorgenti datate, raccolte una volta
  private incassi: Movimento[] = [];
  private uscite: Movimento[] = [];

  // Risultati mostrati
  incassatoPeriodo = 0;
  spesePeriodo = 0;
  utilePeriodo = 0;
  totaleMerceVenduta = 0;
  creditoDaIncassare = 0;
  clientiSaldoAperto = 0;
  spesePerCategoria: VoceCategoria[] = [];
  grafico: GruppoGrafico[] = [];
  etichettaPeriodo = 'tutti gli anni';
  private maxGrafico = 0;

  ngOnInit(): void {
    const cartelle = this.srv.cartelle.filter((c) => !c.isPreventivo);

    // Incassi = rate con data
    this.incassi = cartelle
      .flatMap((c) => c.rate)
      .map((r) => ({ ...this.annoMese(r.data), importo: Number(r.importo) }))
      .filter((m) => m.anno > 0);

    // Totali cumulativi (non dipendono dal periodo)
    this.totaleMerceVenduta = sommaEuro(
      cartelle.flatMap((c) => c.merce),
      (m) => m.importo
    );
    const incassatoTotale = sommaEuro(cartelle.flatMap((c) => c.rate), (r) => r.importo);
    this.creditoDaIncassare = differenzaEuro(this.totaleMerceVenduta, incassatoTotale);
    this.clientiSaldoAperto = cartelle.filter((c) => this.srv.calculateTotal(c) > 0).length;

    // Le spese arrivano dal servizio
    this.srvSpese.getSpesa().subscribe((spese) => {
      this.uscite = spese
        .map((s) => ({ ...this.annoMese(s.data), importo: Number(s.importo) }))
        .filter((m) => m.anno > 0);
      this.speseGrezze = spese; // conservo le spese intere per il grafico categorie
      this.calcolaAnni();
      this.aggiorna();
    });
  }

  private speseGrezze: { categoria: string; importo: number; data: string }[] = [];

  private calcolaAnni() {
    const anni = new Set<number>();
    this.incassi.forEach((m) => anni.add(m.anno));
    this.uscite.forEach((m) => anni.add(m.anno));
    this.anniDisponibili = [...anni].sort((a, b) => b - a);
  }

  onAnnoChange() {
    if (this.annoSel === 'tutti') this.meseSel = 'tutti';
    this.aggiorna();
  }

  aggiorna() {
    this.etichettaPeriodo = this.descriviPeriodo();

    const incassiPeriodo = this.incassi.filter((m) => this.inPeriodo(m));
    const uscitePeriodo = this.uscite.filter((m) => this.inPeriodo(m));

    this.incassatoPeriodo = sommaEuro(incassiPeriodo, (m) => m.importo);
    this.spesePeriodo = sommaEuro(uscitePeriodo, (m) => m.importo);
    this.utilePeriodo = differenzaEuro(this.incassatoPeriodo, this.spesePeriodo);

    this.spesePerCategoria = this.raggruppaPerCategoria();
    this.grafico = this.costruisciGrafico();
    this.maxGrafico = Math.max(0, ...this.grafico.flatMap((g) => [g.incassi, g.spese]));
  }

  // Un movimento rientra nel periodo scelto
  private inPeriodo(m: Movimento): boolean {
    if (this.annoSel !== 'tutti' && m.anno !== this.annoSel) return false;
    if (this.meseSel !== 'tutti' && m.mese !== this.meseSel) return false;
    return true;
  }

  private raggruppaPerCategoria(): VoceCategoria[] {
    const totali = new Map<string, number>();
    for (const s of this.speseGrezze) {
      const d = this.annoMese(s.data);
      if (!this.inPeriodo({ ...d, importo: 0 })) continue;
      const cat = s.categoria || 'Senza categoria';
      totali.set(cat, (totali.get(cat) ?? 0) + Number(s.importo));
    }
    const voci = [...totali.entries()]
      .map(([categoria, totale]) => ({ categoria, totale: aEuro(Math.round(totale * 100)), perc: 0 }))
      .filter((v) => v.totale > 0)
      .sort((a, b) => b.totale - a.totale);
    const max = voci[0]?.totale ?? 0;
    for (const v of voci) v.perc = max > 0 ? (v.totale / max) * 100 : 0;
    return voci;
  }

  // Grafico: per mese se è selezionato un anno, per anno se "tutti"
  private costruisciGrafico(): GruppoGrafico[] {
    if (this.annoSel === 'tutti') {
      return this.anniDisponibili
        .slice()
        .sort((a, b) => a - b)
        .map((anno) => ({
          label: String(anno),
          incassi: sommaEuro(this.incassi.filter((m) => m.anno === anno), (m) => m.importo),
          spese: sommaEuro(this.uscite.filter((m) => m.anno === anno), (m) => m.importo),
        }))
        .filter((g) => g.incassi > 0 || g.spese > 0);
    }
    const anno = this.annoSel;
    return MESI.map((label, i) => {
      const mese = i + 1;
      return {
        label,
        incassi: sommaEuro(this.incassi.filter((m) => m.anno === anno && m.mese === mese), (m) => m.importo),
        spese: sommaEuro(this.uscite.filter((m) => m.anno === anno && m.mese === mese), (m) => m.importo),
      };
    });
  }

  altezza(valore: number): number {
    return this.maxGrafico > 0 ? (valore / this.maxGrafico) * 100 : 0;
  }

  private descriviPeriodo(): string {
    if (this.annoSel === 'tutti') return 'tutti gli anni';
    if (this.meseSel === 'tutti') return String(this.annoSel);
    return `${MESI[this.meseSel - 1]} ${this.annoSel}`;
  }

  // Estrae anno e mese da una data "yyyy-mm-dd" (0 se non valida)
  private annoMese(data: string | undefined): { anno: number; mese: number } {
    if (!data || data.length < 7) return { anno: 0, mese: 0 };
    const anno = Number(data.slice(0, 4));
    const mese = Number(data.slice(5, 7));
    if (!Number.isInteger(anno) || !Number.isInteger(mese) || mese < 1 || mese > 12) {
      return { anno: 0, mese: 0 };
    }
    return { anno, mese };
  }
}
