// Helper per lavorare con il denaro in centesimi interi.
// La virgola mobile sbaglia i conti (es. 0.1 + 0.2 === 0.30000000000000004):
// facendo somme e differenze su interi, i totali e i confronti (=== 0) tornano esatti.
// Gli importi restano memorizzati in euro: qui si convertono solo per calcolare.

export function aCentesimi(valore: unknown): number {
  const n = Math.round(Number(valore) * 100);
  return Number.isFinite(n) ? n : 0;
}

export function aEuro(centesimi: number): number {
  return centesimi / 100;
}

// Somma una lista di importi (in euro) restituendo euro, ma sommando in centesimi
export function sommaEuro<T>(items: T[], importo: (x: T) => unknown): number {
  const totale = items.reduce((acc, x) => acc + aCentesimi(importo(x)), 0);
  return aEuro(totale);
}

// Differenza fra due importi in euro, calcolata in centesimi (risultato esatto)
export function differenzaEuro(a: unknown, b: unknown): number {
  return aEuro(aCentesimi(a) - aCentesimi(b));
}
