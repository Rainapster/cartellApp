import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CartellaService } from '../service/cartella.service';
import { SpesaService } from '../service/spesa.service';

interface VoceCategoria {
  categoria: string;
  totale: number;
  perc: number; // larghezza barra, 0–100, relativa alla categoria più alta
}

@Component({
  selector: 'app-riepilogo',
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="riepilogo-container">
      <h1>Statistiche</h1>

      <div class="kpi-grid">
        <div class="kpi">
          <span class="kpi-label">Incassato</span>
          <span class="kpi-value">{{ totaleRatePagate | currency }}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Merce Venduta</span>
          <span class="kpi-value">{{ totaleMerceVenduta | currency }}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Spese</span>
          <span class="kpi-value spesa">{{ totaleUscite | currency }}</span>
        </div>

        <div class="kpi evidenza">
          <span class="kpi-label">Utile Netto</span>
          <span class="kpi-value" [class.spesa]="utileNetto < 0" [class.ok]="utileNetto >= 0">
            {{ utileNetto | currency }}
          </span>
          <small>Incassato − Spese</small>
        </div>
        <div class="kpi evidenza">
          <span class="kpi-label">Credito da Incassare</span>
          <span class="kpi-value attesa">{{ creditoDaIncassare | currency }}</span>
          <small>{{ clientiSaldoAperto }} client{{ clientiSaldoAperto === 1 ? 'e' : 'i' }} con saldo aperto</small>
        </div>
      </div>

      <div class="card-spese">
        <h3>Spese per categoria</h3>
        <p *ngIf="spesePerCategoria.length === 0" class="vuoto">Nessuna spesa registrata.</p>
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
  .riepilogo-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
  }
  h1 {
    text-align: center;
    color: #0d6efd;
    margin-bottom: 1.5rem;
  }

  /* --- KPI --- */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
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
  .kpi.evidenza {
    border-left: 4px solid #0d6efd;
  }
  .kpi-label {
    color: #495057;
    font-size: 0.95rem;
  }
  .kpi-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #198754;
  }
  .kpi-value.spesa { color: #c42e29; }
  .kpi-value.ok { color: #198754; }
  .kpi-value.attesa { color: #0d6efd; }
  .kpi small {
    color: #6c757d;
    font-size: 0.8rem;
  }

  /* --- Grafico spese per categoria --- */
  .card-spese {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
  }
  .card-spese h3 {
    color: #495057;
    margin-bottom: 1rem;
  }
  .vuoto { color: #6c757d; }
  .barra-riga { margin-bottom: 0.9rem; }
  .barra-testa {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
    color: #495057;
  }
  .barra-importo { font-weight: 600; }
  .barra-track {
    background-color: #e9ecef;
    border-radius: 999px;
    height: 12px;
    overflow: hidden;
  }
  .barra-fill {
    background-color: #0d6efd;
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
  }
  `,
})
export class RiepilogoComponent {
  totaleRatePagate = 0;
  totaleMerceVenduta = 0;
  totaleUscite = 0;
  clientiSaldoAperto = 0;
  spesePerCategoria: VoceCategoria[] = [];

  private srv = inject(CartellaService);
  private srvSpese = inject(SpesaService);

  // Derivati: calcolati al volo dai totali, così non dipendono dall'ordine
  // con cui arrivano (le spese sono asincrone).
  get utileNetto(): number {
    return this.totaleRatePagate - this.totaleUscite;
  }
  get creditoDaIncassare(): number {
    return this.totaleMerceVenduta - this.totaleRatePagate;
  }

  ngOnInit(): void {
    this.calcolaTotali();
    this.srvSpese.getSpesa().subscribe((spese) => {
      this.totaleUscite = spese.reduce((acc, spesa) => acc + Number(spesa.importo), 0);
      this.spesePerCategoria = this.raggruppaPerCategoria(spese);
    });
  }

  private calcolaTotali(): void {
    // I preventivi non sono vendite: si contano solo le cartelle vere
    const cartelle = this.srv.cartelle.filter((c) => !c.isPreventivo);

    this.totaleRatePagate = cartelle.reduce(
      (acc, c) => acc + c.rate.reduce((s, r) => s + Number(r.importo), 0),
      0
    );
    this.totaleMerceVenduta = cartelle.reduce(
      (acc, c) => acc + c.merce.reduce((s, m) => s + Number(m.importo), 0),
      0
    );
    // Saldo aperto = merce ancora non coperta dalle rate (oltre mezzo centesimo)
    this.clientiSaldoAperto = cartelle.filter((c) => this.srv.calculateTotal(c) > 0.005).length;
  }

  private raggruppaPerCategoria(spese: { categoria: string; importo: number }[]): VoceCategoria[] {
    const totali = new Map<string, number>();
    for (const s of spese) {
      const cat = s.categoria || 'Senza categoria';
      totali.set(cat, (totali.get(cat) ?? 0) + Number(s.importo));
    }
    const voci = [...totali.entries()]
      .map(([categoria, totale]) => ({ categoria, totale, perc: 0 }))
      .filter((v) => v.totale > 0)
      .sort((a, b) => b.totale - a.totale);

    const max = voci[0]?.totale ?? 0;
    for (const v of voci) v.perc = max > 0 ? (v.totale / max) * 100 : 0;
    return voci;
  }
}
