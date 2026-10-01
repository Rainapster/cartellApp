import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartellaService } from '../service/cartella.service';
import { Cartella } from '../models/cartella.model';

@Component({
  selector: 'app-cartella',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-box">
      <label>Cerca:</label>
      <input type="text" [(ngModel)]="ricerca" (keydown.enter)="searchCartella()" />
      <button (click)="searchCartella()">Cerca</button>
    </div>
    <div class="search-box justify-content-center">
      <button (click)="resetSearch()">Mostra tutto</button>
      <ng-container *ngIf="!isPreventivi">
        <button (click)="mostraClientiAttivi()">Mostra clienti attivi</button>
        <button (click)="mostraSoloSaldati()">Mostra solo saldati</button>
      </ng-container>
    </div>
    <ng-container *ngIf="!isPreventivi">
      <p>Clienti Attivi: {{ getClientiAttivi() }}</p>
      <p>Clienti saldati: {{ getClientiSaldati() }}</p>
    </ng-container>
    <p *ngIf="isPreventivi">Numero di preventivi: {{ elenco.length }}</p>
    <button id="addClientButton" (click)="aggiungiCliente()">
      {{ isPreventivi ? 'Aggiungi Preventivo' : 'Aggiungi Cliente' }}
    </button>

    <div *ngFor="let cartella of cartellePagina" class="container-cartelle">
      <div class="container-form">
        <label for="nome">Nome</label>
        <input type="text" name="nome" id="nome" [(ngModel)]="cartella.nome" />

        <label for="cognome">Cognome</label>
        <input type="text" name="cognome" id="cognome" [(ngModel)]="cartella.cognome" />

        <ng-container *ngIf="!isPreventivi">
          <label for="numero-cliente">Numero Cliente</label>
          <input
            type="number"
            name="numero-cliente"
            id="numero-cliente"
            [(ngModel)]="cartella.numeroCliente"
          />
        </ng-container>
        <div class="d-flex">
          <input
            type="text"
            name="tipoVia"
            id="tipoVia"
            [(ngModel)]="cartella.tipoVia"
            placeholder="Via/Piazza/Contrada/Viale"
          />
          <input
            type="text"
            name="nomevia"
            id="nomevia"
            [(ngModel)]="cartella.nomeVia"
            placeholder="inserisci il nome della via"
          />
          <input
            type="number"
            id="numero-via"
            [(ngModel)]="cartella.numeroVia"
            placeholder="Inserisci il numero civico"
          />
        </div>

        <button (click)="srv.aggiungiMerce(cartella)">Aggiungi Merce</button>
        <div *ngFor="let merce of cartella.merce; let i = index" class="field-merce">
          <label>Descrizione Merce</label>
          <input type="text" [(ngModel)]="merce.descrizione" />
          <label>Importo</label>
          <input type="number" [(ngModel)]="merce.importo" />
          <button class="remove" (click)="srv.rimuoviMerce(cartella, i)">
            Rimuovi Merce
          </button>
        </div>

        <ng-container *ngIf="!isPreventivi">
          <button (click)="srv.aggiungiRata(cartella)">Aggiungi Rata</button>
          <div *ngFor="let rata of cartella.rate; let i = index" class="field-rata">
            <label>Data Rata</label>
            <input type="date" [(ngModel)]="rata.data" />
            <label>Importo Rata</label>
            <input type="number" [(ngModel)]="rata.importo" />
            <button class="remove" (click)="srv.rimuoviRata(cartella, i)">
              Rimuovi Rata
            </button>
          </div>
          <p *ngIf="srv.isPagato(cartella)" style="color:red">Pagato</p>
        </ng-container>

        <p *ngIf="srv.calculateTotal(cartella) !== 0">
          Totale: {{ srv.calculateTotal(cartella) | currency }}
        </p>
        <div class="d-flex justify-content-between">
          <button id="save" (click)="srv.save(cartella)">
            {{ isPreventivi ? 'Salva Preventivo' : 'Salva Cartella' }}
          </button>
          <button *ngIf="cartella._id" (click)="stampa(cartella)">Stampa</button>
          <button *ngIf="isPreventivi" (click)="converti(cartella)">
            Converti in cartella
          </button>
          <button (click)="srv.removeClient(cartella)" class="remove">
            {{ isPreventivi ? 'Cancella Preventivo' : 'Cancella Cartella' }}
          </button>
        </div>
      </div>
    </div>

    <div class="paginazione" *ngIf="totalePagine > 1">
      <button (click)="vaiAPagina(pagina - 1)" [disabled]="pagina === 1">‹ Precedente</button>
      <span>Pagina {{ pagina }} di {{ totalePagine }}</span>
      <button (click)="vaiAPagina(pagina + 1)" [disabled]="pagina === totalePagine">Successiva ›</button>
    </div>
  `,
  styles: `
/* Container principale di ogni cartella */
.container-cartelle {
  margin: 2rem auto;
  max-width: 800px;
  display: flex;
  justify-content: center;
}

/* Card bianca con ombra e bordi arrotondati */
.container-form {
  background-color: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Effetto hover leggero sulla card */
.container-form:hover {
  transform: translateY(-4px);
  box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.15);
}

/* Stile uniforme per tutti gli input */
.container-form input,
.container-form select {
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Focus sugli input */
.container-form input:focus,
.container-form select:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Stile uniforme per i pulsanti all’interno delle card */
.container-form button {
  margin-bottom: 1rem;
  background-color: #0d6efd;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* Hover sui pulsanti */
.container-form button:hover {
  background-color: #0b5ed7;
}

/* Allinea le label in verticale e dà un po’ di spazio */
.container-form label {
  font-weight: 500;
  margin-bottom: 0.25rem;
  display: block;
  color: #495057;
}

/* Spaziatura tra i gruppi di campi merce/rata */
.field-merce,
.field-rata {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-left: 4px solid #0d6efd;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Messaggio “Pagato” in evidenza */
.container-form p[style] {
  font-weight: bold;
  color: #198754; /* verde “success” */
  text-align: center;
}

/* Bottone di ricerca */
.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 2rem auto;
  max-width: 800px;
}

.search-box input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
}

.search-box button {
  background-color: #0d6efd;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-box button:hover {
  background-color: #0b5ed7;
}






#save{
  background-color:  #198754;
  transition: background-color 0.2s ease
}
#save:hover{
  background-color:rgb(23, 122, 76);
}
.container-form button.remove{
  background-color:  rgb(196, 46, 41)
;
  transition: background-color 0.2s ease
}
.container-form button.remove:hover{
  background-color:#842029;
}
#addClientButton {
  background-color: #198754;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

#addClientButton:hover {
  background-color: rgb(23, 122, 76);
}

.paginazione {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 2rem auto;
}
.paginazione button {
  background-color: #0d6efd;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
}
.paginazione button:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
}

  `,
})
export class CartellaComponent {
  // 'cartelle' in home, 'preventivi' nella pagina Preventivi
  @Input() modalita: 'cartelle' | 'preventivi' = 'cartelle';

  cartelleTrovate: Cartella[] = [];
  srv = inject(CartellaService);
  private router = inject(Router);
  ricerca: string | undefined;
  readonly perPagina = 10;
  paginaCorrente = 1;

  get isPreventivi(): boolean {
    return this.modalita === 'preventivi';
  }

  // Solo le cartelle o solo i preventivi, a seconda della pagina
  get elenco(): Cartella[] {
    return this.srv.cartelle.filter((cartella) => !!cartella.isPreventivo === this.isPreventivi);
  }

  // La lista da mostrare: i risultati della ricerca/filtro, oppure tutto l'elenco
  get listaAttiva(): Cartella[] {
    return this.cartelleTrovate.length > 0 ? this.cartelleTrovate : this.elenco;
  }

  get totalePagine(): number {
    return Math.max(1, Math.ceil(this.listaAttiva.length / this.perPagina));
  }

  // Evita di restare su una pagina vuota, ad esempio dopo aver cancellato l'ultima cartella
  get pagina(): number {
    return Math.min(this.paginaCorrente, this.totalePagine);
  }

  get cartellePagina(): Cartella[] {
    const inizio = (this.pagina - 1) * this.perPagina;
    return this.listaAttiva.slice(inizio, inizio + this.perPagina);
  }

  vaiAPagina(n: number) {
    this.paginaCorrente = Math.min(Math.max(1, n), this.totalePagine);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  aggiungiCliente() {
    this.srv.addNewClient(this.isPreventivi);
    this.cartelleTrovate = []; // torna alla lista completa, dove c'è il nuovo cliente
    this.vaiAPagina(this.totalePagine); // il nuovo cliente è in fondo, quindi sull'ultima pagina
  }

  stampa(cartella: Cartella) {
    this.router.navigate(['/search'], { queryParams: { id: cartella._id } });
  }

  converti(preventivo: Cartella) {
    const risposta = prompt('Numero cliente da assegnare alla nuova cartella:');
    if (risposta === null) return; // annullato
    const numero = Number(risposta);
    if (!risposta.trim() || !Number.isInteger(numero) || numero <= 0) {
      alert('Inserisci un numero cliente valido');
      return;
    }
    if (this.srv.convertiInCartella(preventivo, numero)) {
      // il preventivo è diventato una cartella: lo tolgo anche dai risultati mostrati qui
      this.cartelleTrovate = this.cartelleTrovate.filter((c) => c !== preventivo);
    }
  }

  searchCartella() {
    this.paginaCorrente = 1;
    const raw = this.ricerca ?? '';
    const term = raw.trim().toLowerCase(); // es. "giovanna sacco"
    const termNoSpace = term.replace(/\s+/g, ''); // es. "giovannasacco"

    const results = this.elenco.filter((cartella) => {
      const nome = (cartella.nome ?? '').trim().toLowerCase();
      const cognome = (cartella.cognome ?? '').trim().toLowerCase();

      return (
        // cognome esatto: "sacco"
        cognome === term ||
        // nome esatto: "giovanna"
        nome === term ||
        // nome + spazio + cognome: "giovanna sacco"
        `${nome} ${cognome}` === term ||
        // cognome + spazio + nome: "sacco giovanna"
        `${cognome} ${nome}` === term ||
        // nome+congnome senza spazi: "giovannasacco"
        `${nome}${cognome}` === termNoSpace ||
        // cognome+nome senza spazi: "saccogiovanna"
        `${cognome}${nome}` === termNoSpace ||
        //ricerca per numero cliente
        (!this.isPreventivi && raw.trim() === String(cartella.numeroCliente))
      );
    });

    if (results.length > 0) {
      this.cartelleTrovate = results;
    } else {
      alert('Nessun risultato trovato con i criteri inseriti.');
      this.cartelleTrovate = [];
    }
  }

  resetSearch() {
    this.paginaCorrente = 1;
    this.cartelleTrovate = [];
  }

  getClientiAttivi(): number {
    return this.elenco.filter((cartella) => !this.srv.isPagato(cartella)).length;
  }

  getClientiSaldati(): number {
    return this.elenco.filter((cartella) => this.srv.isPagato(cartella)).length;
  }

  mostraClientiAttivi(): void {
    this.mostraFiltrati(
      this.elenco.filter((cartella) => !this.srv.isPagato(cartella)),
      'Nessun cliente attivo.'
    );
  }

  mostraSoloSaldati(): void {
    this.mostraFiltrati(
      this.elenco.filter((cartella) => this.srv.isPagato(cartella)),
      'Nessun cliente saldato.'
    );
  }

  private mostraFiltrati(risultati: Cartella[], messaggioVuoto: string) {
    this.paginaCorrente = 1;
    this.cartelleTrovate = risultati;
    if (risultati.length === 0) alert(messaggioVuoto);
  }
}
