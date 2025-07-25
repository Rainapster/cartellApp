import { inject, Injectable } from '@angular/core';
import { Cartella } from '../models/cartella.model';
import { Merce } from '../models/merce.model';
import { Rate } from '../models/rate.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class CartellaService {
  private apiUrl = 'http://localhost:3000/api/cartella';
  router = inject(Router);
  http = inject(HttpClient);
  cartelle: Cartella[] = [];

  loadCartelleClienti() {
    return this.http.get<Cartella[]>(this.apiUrl).subscribe({
      next: (cartelle) => (this.cartelle = cartelle),
      error: (err) => console.error(err),
    });
  }
  addNewClient() {
    const newClient: Cartella = {
      nome: '',
      cognome: '',
      numeroCliente: 0,
      tipoVia: '', 
      nomeVia: '', 
      numeroVia: 0,
      merce: [],
      rate: [],
    };
    this.cartelle.push(newClient);
  }

removeClient(cartella: Cartella) {
  if (cartella._id) {
    this.http.delete(`${this.apiUrl}/${cartella._id}`).subscribe({
      next: () => {
        // Rimuovi il cliente dall'array locale
        this.cartelle = this.cartelle.filter(c => c._id !== cartella._id);
        alert('Cliente rimosso con successo');
      },
      error: (err) => {
        console.error('Errore durante la rimozione del cliente:', err);
        alert('Errore durante la rimozione del cliente: ' + err.message);
      },
    });
  } else {
    alert('Impossibile rimuovere il cliente: ID non trovato');
  }
}
  save(cartella: Cartella) {
    if (cartella._id) {
      this.http.put(`${this.apiUrl}/${cartella._id}`, cartella).subscribe({
        next: () => alert('cartella aggiornata'),
        error: (err) =>
          alert(
            "Errore durante l'aggiornamento della cartella: " + err.message
          ),
      });
    } else {
      this.http.post(this.apiUrl, cartella).subscribe({
        next: (newCartella) => alert('Cartella salvata con successo'),
        error: (err) =>
          alert('Errore durante il salvataggio della cartella: ' + err.message),
      });
    }
  }
  aggiungiMerce(cartella: Cartella) {
    const nuovaMerce: Merce = {
      descrizione: '',
      importo: 0,
    };
    cartella.merce.push(nuovaMerce);
  }
  rimuoviMerce(cartella: Cartella, index: number) {
    cartella.merce.splice(index, 1);
  }
  aggiungiRata(cartella: Cartella) {
    const nuovaRata: Rate = {
      importo: 0,
      data: '',
    };
    cartella.rate.push(nuovaRata);
  }
  rimuoviRata(cartella: Cartella, index: number) {
    cartella.rate.splice(index, 1);
  }
  calculateTotal(cartella: Cartella): number {
    if(cartella.isPreventivo){
      cartella.rate.splice(0, cartella.rate.length)
    }
    const totalRata = cartella.rate.reduce(
      (total, rata) => (total += Number(rata.importo)),
      0
    );
    const totalMerce = cartella.merce.reduce(
      (acc, importo) => (acc += Number(importo.importo)),
      0
    );
    return totalMerce - totalRata;
  }
  hasImportoGreaterThanZero(cartella: Cartella): boolean {
    return cartella.rate.some((rata) => rata.importo > 0);
  }
  findByNumero(identificativoCliente: number) {
    return this.cartelle.find(
      (cartella) => cartella.numeroCliente === identificativoCliente
    );
  }
  goToSearch() {
    this.router.navigate(['/search']);
  }
  findBySurname(surname: string): Cartella[] {
    const normalizedSurname = surname.trim().toLowerCase();
    return this.cartelle.filter(
      (cartella) => cartella.cognome.trim().toLowerCase() === normalizedSurname
    );
  }
}