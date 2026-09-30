import { inject, Injectable } from '@angular/core';
import { Cartella } from '../models/cartella.model';
import { Merce } from '../models/merce.model';
import { Rate } from '../models/rate.model';
import { Router } from '@angular/router';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root',
})
export class CartellaService {
  router = inject(Router);
  private storage = inject(StorageService);

  get cartelle(): Cartella[] {
    return this.storage.data.cartelle;
  }
  set cartelle(value: Cartella[]) {
    this.storage.data.cartelle = value;
  }

  // I dati vengono caricati dal file al login, qui non serve più fare nulla
  loadCartelleClienti() {}
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
    this.cartelle = this.cartelle.filter((c) => c !== cartella);
    this.storage
      .save()
      .then(() => alert('Cliente rimosso con successo'))
      .catch((err) => alert('Errore durante la rimozione del cliente: ' + err.message));
  }
  save(cartella: Cartella) {
    // Sostituisce il vincolo "unique" che prima faceva MongoDB
    const duplicato =
      !cartella.isPreventivo &&
      this.cartelle.some(
        (c) =>
          c !== cartella &&
          c._id &&
          c._id !== cartella._id &&
          !c.isPreventivo &&
          Number(c.numeroCliente) === Number(cartella.numeroCliente)
      );
    if (duplicato) {
      alert('Esiste già un cliente con questo numero');
      return;
    }
    const nuova = !cartella._id;
    if (nuova) cartella._id = crypto.randomUUID();
    const i = this.cartelle.findIndex((c) => c === cartella || c._id === cartella._id);
    if (i >= 0) this.cartelle[i] = cartella;
    else this.cartelle.push(cartella);

    this.storage
      .save()
      .then(() => alert(nuova ? 'Cartella salvata con successo' : 'cartella aggiornata'))
      .catch((err) => alert('Errore durante il salvataggio della cartella: ' + err.message));
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

  isPagato(cartella: Cartella){
    return(!cartella.isPreventivo && cartella.rate.length >0 && this.hasImportoGreaterThanZero(cartella) && this.calculateTotal(cartella) === 0)
  }
}