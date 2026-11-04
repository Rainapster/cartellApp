export interface Articolo {
  _id?: string;
  descrizione: string;
  quantita: number; // quantità disponibile in magazzino
  costoUnitario: number; // costo d'acquisto per unità
  // Ricarico % specifico dell'articolo. Se assente (null/undefined) vale
  // il ricarico predefinito del magazzino.
  ricarico?: number | null;
}
