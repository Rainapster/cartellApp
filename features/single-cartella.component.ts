import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CartellaService } from '../service/cartella.service';
import { Cartella } from '../models/cartella.model';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// @ts-ignore
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-single-cartella',
  imports: [CommonModule, FormsModule],
  template: `
    <button (click)="goBack()">🔙</button>
    <div class="search-box">
      <label>Numero Cliente:</label>
      <input type="number" [(ngModel)]="numeroRicerca" />
      <button (click)="search()">Cerca</button>
    </div>
    <div *ngIf="cartellaTrovata" class="cartellaTrovata" #pdfContent>
      <div
        *ngIf="cartellaTrovata"
        class="preventivo-card mx-auto p-4"
        #pdfContent
      >
        <!-- Header: logo + titolo -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <img src="logo.png" alt="Logo" class="logo" />
          <h2 *ngIf="cartellaTrovata.isPreventivo" class="text-primary mb-0">
            Preventivo
          </h2>
          <h2 *ngIf="!cartellaTrovata.isPreventivo" class="text-primary mb-0">
            Cartella
          </h2>
        </div>

        <!-- Sezione Cliente -->
        <div class="mb-4">
          <h5 class="fw-semibold">Dati Cliente</h5>
          <p class="mb-1"><strong>Nome:</strong> {{ cartellaTrovata.nome }}</p>
          <p class="mb-0">
            <strong>Cognome:</strong> {{ cartellaTrovata.cognome }}
          </p>
        </div>

        <!-- Sezione Indirizzo -->

        <div class="mb-4">
          <h5 class="fw-semibold">Indirizzo</h5>
          <p class="mb-1">
            <strong>Tipo:</strong> {{ cartellaTrovata.tipoVia }}
          </p>
          <p class="mb-1">
            <strong>Nome Via:</strong> {{ cartellaTrovata.nomeVia }}
          </p>
          <p class="mb-1">
            <strong>N°Civico:</strong> {{ cartellaTrovata.numeroVia }}
          </p>
        </div>

        <!-- Sezione Merce -->
        <div class="mb-4">
          <h5 class="fw-semibold">Dettaglio Merce</h5>
          <table class="table table-sm table-striped">
            <thead class="table-light">
              <tr>
                <th>Descrizione</th>
                <th class="text-end">Importo</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of cartellaTrovata.merce">
                <td>{{ m.descrizione }}</td>
                <td class="text-end">{{ m.importo | currency }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sezione Rate -->
        <div class="mb-4">
          <h5 class="fw-semibold">Piani di Pagamento</h5>
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Data</th>
                <th class="text-end">Importo</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of cartellaTrovata.rate">
                <td>{{ r.data }}</td>
                <td class="text-end">{{ r.importo | currency }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totale -->
        <div class="text-end">
          <h4 class="fw-bold">
            Totale: {{ calculateTotal(cartellaTrovata) | currency }}
          </h4>
        </div>
      </div>

      <!-- Bottone per scaricare -->
    </div>
    <div class="text-center mt-4" *ngIf="cartellaTrovata">
      <button class="btn btn-primary" (click)="generatePreventivo()">
        📄 Scarica PDF
      </button>
    </div>
  `,
  styles: `
  .search-box{
    justify-content: flex-start;
    display: flex;
    margin: 80px;
  }
  .search-box label{
    padding-right: 16px;
  }
/* all’interno di styles.css o single-cartella.component.scss */
.preventivo-card {
  max-width: 800px;         /* larghezza massima */
  background: #ffffff;      /* sfondo bianco */
  border-radius: 0.5rem;    /* angoli arrotondati */
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
  color: #333;
  /* questo padding verrà catturato anche in html2canvas */
}

/* Logo dimensioni */
.logo {
  width: 100px;
  height: auto;
}

/* Titoli di sezione */
.preventivo-card h5 {
  font-size: 1.1rem;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.25rem;
  margin-bottom: 1rem;
}

/* Table tweaks */
.preventivo-card table {
  margin-bottom: 0;
}

/* Totale in evidenza */
.preventivo-card h4 {
  color: #0d6efd;  /* primary di Bootstrap */
}
input{
  border:1px solid
}
  `,
})
export class SingleCartellaComponent {
  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;
  numeroRicerca!: number;
  surname!: string;
  cartellaTrovata?: Cartella;
  prv = inject(CartellaService);
  rooter = inject(Router);

  search() {
    const result = this.prv.findByNumero(this.numeroRicerca);
    if (result) {
      this.cartellaTrovata = result;
      return result;
    } else {
      alert('Cliente non trovato');
      return undefined;
    }
  }
  goBack() {
    this.rooter.navigate(['/home']);
  }
  calculateTotal(cartella: Cartella): number {
    return this.prv.calculateTotal(cartella);
  }
  generatePreventivo() {
    const element = this.pdfContent.nativeElement;
    const options = {
      margin: 10,
      filename: 'cartella.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    html2pdf().from(element).set(options).save();
  }
}
