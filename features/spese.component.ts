import { Component, inject } from '@angular/core';
import { Spesa } from '../models/spesa.model';
import { SpesaService } from '../service/spesa.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spese',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="spese-container">
      <h1>Gestione Spese</h1>

      <!-- Form per aggiungere una spesa -->
      <form (ngSubmit)="aggiungiSpesa()">
        <div>
          <label for="descrizione">Descrizione</label>
          <input
            id="descrizione"
            [(ngModel)]="nuovaSpesa.descrizione"
            name="descrizione"
            required
          />
        </div>
        <div>
          <label for="importo">Importo</label>
          <input
            id="importo"
            type="number"
            [(ngModel)]="nuovaSpesa.importo"
            name="importo"
            required
          />
        </div>
        <div>
          <label for="data">Data</label>
          <input
            id="data"
            type="date"
            [(ngModel)]="nuovaSpesa.data"
            name="data"
            required
          />
        </div>
        <div>
          <label for="categoria">Categoria</label>
          <select
            id="categoria"
            [(ngModel)]="nuovaSpesa.categoria"
            name="categoria"
            required
          >
            <option *ngFor="let categoria of categorie" [value]="categoria">
              {{ categoria }}
            </option>
          </select>
        </div>
        <button type="submit">Aggiungi Spesa</button>
      </form>

      <!-- Lista delle spese -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Descrizione</th>
              <th>Importo</th>
              <th>Data</th>
              <th>Categoria</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let spesa of spese">
              <td>
                <input
                  type="text"
                  [(ngModel)]="spesa.descrizione"
                  [readonly]="!spesa.isEditing"
                />
              </td>
              <td>
                <input
                  type="number"
                  [(ngModel)]="spesa.importo"
                  [readonly]="!spesa.isEditing"
                />
              </td>
              <td>
                <input
                  type="date"
                  [(ngModel)]="spesa.data"
                  [readonly]="!spesa.isEditing"
                />
              </td>
              <td>
                <select
                  [(ngModel)]="spesa.categoria"
                  [disabled]="!spesa.isEditing"
                >
                  <option
                    *ngFor="let categoria of categorie"
                    [value]="categoria"
                  >
                    {{ categoria }}
                  </option>
                </select>
              </td>
              <td>
                <button
                  *ngIf="!spesa.isEditing"
                  (click)="spesa.isEditing = true"
                >
                  Modifica
                </button>
                <button
                  *ngIf="spesa.isEditing"
                  (click)="modificaSpesa(spesa._id!, spesa)"
                >
                  Salva
                </button>
                <button (click)="rimuoviSpesa(spesa._id!)">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="riepilogo-container">
      <h2>Riepilogo Spese per Categoria</h2>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Totale</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of getRiepilogoPerCategoria()">
            <td>{{ item.categoria }}</td>
            <td>{{ item.totale | currency }}</td>
          </tr>
          <tr>
            <td><strong>Totale Complessivo</strong></td>
            <td>
              <strong>{{ getTotaleSpese() | currency }}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .spese-container {
      margin: 2rem auto;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .spese-container h1 {
      text-align: center;
      color: #0d6efd;
      margin-bottom: 2rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    form label {
      font-weight: bold;
      color: #495057;
    }

    form input,
    form select {
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
      width: 100%;
    }

    form input:focus,
    form select:focus {
      outline: none;
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }

    form button {
      background-color: #198754;
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    form button:hover {
      background-color: #157347;
    }

    .table-container {
      margin-top: 2rem;
    }

    .table-container table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      font-family: Arial, sans-serif;
      font-size: 0.95rem;
    }

    .table-container thead th {
      position: sticky;
      top: 0;
      background: #0d6efd;
      color: #fff;
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #084298;
    }

    .table-container tbody td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e9ecef;
      vertical-align: middle;
    }

    .table-container tbody tr:nth-child(even) {
      background-color: #f8f9fa;
    }

    .table-container tbody tr:hover {
      background-color: #e2e6ea;
    }

    /* Stile uniforme per i pulsanti */
    .table-container tbody td button {
      width: 100px; /* Imposta una larghezza fissa per uniformare i pulsanti */
      margin-right: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s ease;
      text-align: center;
    }

    /* Stile per il pulsante "Modifica" */
    .table-container tbody td button:first-child {
      background-color: #198754;
      color: #ffffff;
    }

    .table-container tbody td button:first-child:hover {
      background-color: #157347; 
    }

    /* Stile per il pulsante "Elimina" */
    .table-container tbody td button:last-child {
      background-color: #dc3545; 
      color: #ffffff;
    }

    .table-container tbody td button:last-child:hover {
      background-color: #bb2d3b; 
    }
    .riepilogo-container {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.riepilogo-container h2 {
  text-align: center;
  color: #0d6efd;
  margin-bottom: 1rem;
}

.riepilogo-container table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.riepilogo-container th,
.riepilogo-container td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.riepilogo-container th {
  background-color: #0d6efd;
  color: #fff;
  font-weight: bold;
}

.riepilogo-container tr:nth-child(even) {
  background-color: #f8f9fa;
}

.riepilogo-container tr:hover {
  background-color: #e2e6ea;
}
  `,
})
export class SpeseComponent {
  spese: Spesa[] = [];
  nuovaSpesa: Spesa = {
    descrizione: '',
    importo: 0,
    data: '',
    categoria: '',
    _id: '',
    isEditing: false,
  };
  categorie: string[] = [
    'Merce da vendere',
    'Pubblicità',
    'Assicurazione',
    'Costo manutenzione veicolo',
    'Attrezzature per ufficio',
    'Servizi Professionali',
    'Commissioni di vendita',
    'Software',
    'Montaggio e trasporto',
    'Internet e telefono',
    'Elettricità, acqua, gas',
    'Affitti',
    'Alimentari',
    'Altro',
  ];
  srvSpesa = inject(SpesaService);
  ngOnInit(): void {
    this.caricaSpese();
  }

  caricaSpese(): void {
    this.srvSpesa.getSpesa().subscribe((spese) => {
      this.spese = spese;
    });
  }

  aggiungiSpesa(): void {
    console.log('StampoPayload form (prima):', this.nuovaSpesa);
    // 1) tolgo _id e isEditing dal payload
    const { _id, isEditing, ...payload } = this.nuovaSpesa;
    console.log('StampoPayload form (senza _id):', payload);
    // 2) mando al server solo i campi utili
    this.srvSpesa
      .aggiungiSpesa(payload as any /* oppure crea un tipo CreateSpesa */)
      .subscribe((spesa) => {
        // al ritorno, spesa ha _id dal server
        this.spese.push({ ...spesa, isEditing: false });
        // reset
        this.nuovaSpesa = {
          /* senza _id */ descrizione: '',
          importo: 0,
          data: '',
          categoria: '',
          isEditing: false,
        };
      });
  }

  rimuoviSpesa(id: string) {
    this.srvSpesa.eliminaSpesa(id).subscribe(() => {
      this.spese = this.spese.filter((spesa) => spesa._id !== id);
    });
  }

  modificaSpesa(id: string, spesa: Spesa) {
    this.srvSpesa.modificaSpesa(id, spesa).subscribe((updatedSpesa) => {
      this.spese = this.spese.map((s) => (s._id === id ? updatedSpesa : s));
    });
  }

  getRiepilogoPerCategoria(): { categoria: string; totale: number }[] {
    const riepilogo: { [key: string]: number } = {};

    this.spese.forEach((spesa) => {
      if (riepilogo[spesa.categoria]) {
        riepilogo[spesa.categoria] += spesa.importo;
      } else {
        riepilogo[spesa.categoria] = spesa.importo;
      }
    });

    return Object.keys(riepilogo).map((categoria) => ({
      categoria,
      totale: riepilogo[categoria],
    }));
  }

  getTotaleSpese(): number {
    return this.spese.reduce((totale, spesa) => totale + spesa.importo, 0);
  }
}
