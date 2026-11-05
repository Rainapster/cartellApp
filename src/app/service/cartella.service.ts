import { inject, Injectable } from '@angular/core';
import { Cartella } from '../models/cartella.model';
import { Merce } from '../models/merce.model';
import { Rate } from '../models/rate.model';
import { Router } from '@angular/router';
import { StorageService } from './storage';
import { differenzaEuro, sommaEuro } from './money';

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
  addNewClient(isPreventivo = false) {
    const newClient: Cartella = {
      nome: '',
      cognome: '',
      numeroCliente: 0,
      tipoVia: '',
      nomeVia: '',
      numeroVia: 0,
      merce: [],
      rate: [],
      isPreventivo,
    };
    this.cartelle.push(newClient);
  }

  // Un numero cliente può appartenere a una sola cartella (i preventivi non contano)
  numeroGiaUsato(numero: number, escludi: Cartella): boolean {
    return this.cartelle.some(
      (c) =>
        c !== escludi &&
        c._id &&
        c._id !== escludi._id &&
        !c.isPreventivo &&
        Number(c.numeroCliente) === Number(numero)
    );
  }

  async convertiInCartella(preventivo: Cartella, numeroCliente: number): Promise<boolean> {
    if (this.numeroGiaUsato(numeroCliente, preventivo)) {
      alert('Esiste già un cliente con questo numero');
      return false;
    }
    preventivo.isPreventivo = false;
    preventivo.numeroCliente = numeroCliente;
    return this.save(preventivo);
  }

  removeClient(cartella: Cartella) {
    this.cartelle = this.cartelle.filter((c) => c !== cartella);
    this.storage
      .save()
      .then(() => alert('Cliente rimosso con successo'))
      .catch((err) => alert('Errore durante la rimozione del cliente: ' + err.message));
  }
  // Ritorna true se la cartella è stata effettivamente scritta nel file
  async save(cartella: Cartella): Promise<boolean> {
    // Sostituisce il vincolo "unique" che prima faceva MongoDB
    if (!cartella.isPreventivo && this.numeroGiaUsato(cartella.numeroCliente, cartella)) {
      alert('Esiste già un cliente con questo numero');
      return false;
    }
    const nuova = !cartella._id;
    if (nuova) cartella._id = crypto.randomUUID();
    const i = this.cartelle.findIndex((c) => c === cartella || c._id === cartella._id);
    if (i >= 0) this.cartelle[i] = cartella;
    else this.cartelle.push(cartella);

    try {
      await this.storage.save();
      alert(nuova ? 'Cartella salvata con successo' : 'cartella aggiornata');
      return true;
    } catch (err: any) {
      alert('Errore durante il salvataggio della cartella: ' + err.message);
      return false;
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
    // Un preventivo non ha pagamenti: le rate si ignorano, senza cancellarle
    const rate = cartella.isPreventivo ? [] : cartella.rate;
    // Calcolo in centesimi interi: così il totale è esatto e "=== 0" funziona
    const totalRata = sommaEuro(rate, (r) => r.importo);
    const totalMerce = sommaEuro(cartella.merce, (m) => m.importo);
    return differenzaEuro(totalMerce, totalRata);
  }
  hasImportoGreaterThanZero(cartella: Cartella): boolean {
    return cartella.rate.some((rata) => rata.importo > 0);
  }
  findByNumero(identificativoCliente: number) {
    // I preventivi non hanno numero cliente: si stampano dal pulsante "Stampa" della scheda
    return this.cartelle.find(
      (cartella) =>
        !cartella.isPreventivo && Number(cartella.numeroCliente) === Number(identificativoCliente)
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