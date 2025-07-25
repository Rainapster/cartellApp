import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartellaService } from '../service/cartella.service';
import { SpeseComponent } from './spese.component';
import { SpesaService } from '../service/spesa.service';
@Component({
  selector: 'app-riepilogo',
  imports: [CurrencyPipe],
  template: `
    <div class="riepilogo-container">
      <div class="riepilogo-container">
        <h1>Statistiche</h1>
      </div>
      <div class="riepilogo-item">
        <h3>Totale Rate Pagate</h3>
        <p>{{ totaleRatePagate | currency }}</p>
      </div>
      <div class="riepilogo-item">
        <h3>Totale Merce Venduta</h3>
        <p>{{ totaleMerceVenduta | currency }}</p>
      </div>
      <div class="riepilogo-item">
        <h3>Totale Spese</h3>
        <p>{{ calcolaSpese() }}</p>
        <p>{{ totaleUscite | currency }}</p>
      </div>
    </div>
  `,
  styles: `
  .riepilogo-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem;
        background-color: #f8f9fa;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .riepilogo-item {
        margin-bottom: 1.5rem;
      }
      h1 {
        text-align: center;
        color: #0d6efd;
      }
      h3 {
        color: #495057;
      }
      p {
        font-size: 1.25rem;
        font-weight: bold;
        color: #198754;
      }`,
})
export class RiepilogoComponent {
  totaleRatePagate = 0;
  totaleMerceVenduta = 0;
  totaleUscite = 0;
  srv = inject(CartellaService);
  srvSpese = inject(SpesaService);

  ngOnInit(): void {
    // Carico le cartelle
    this.srv.loadCartelleClienti();

    // Calcolo i totali
    this.calcolaTotali();

    // Calcolo il totale delle spese
    this.srvSpese.getSpesa().subscribe((spese) => {
      this.totaleUscite = spese.reduce((acc, spesa) => acc + spesa.importo, 0);
    });
  }

  calcolaSpese() {
    this.srvSpese.getSpesa();
  }
  calcolaTotali(): void {
    const cartelle = this.srv.cartelle;

    this.totaleRatePagate = cartelle.reduce((acc, cartella) => {
      return (
        acc + cartella.rate.reduce((rateSum, rata) => rateSum + rata.importo, 0)
      );
    }, 0);

    this.totaleMerceVenduta = cartelle.reduce((acc, cartella) => {
      return (
        acc +
        cartella.merce.reduce((merceSum, merce) => merceSum + merce.importo, 0)
      );
    }, 0);
  }
}
