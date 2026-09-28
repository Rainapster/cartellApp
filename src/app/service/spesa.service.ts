import { inject, Injectable } from '@angular/core';
import { from, map, Observable, of, throwError } from 'rxjs';
import { Spesa } from '../models/spesa.model';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class SpesaService {
  spese: Spesa[] = [];
  private storage = inject(StorageService);

  aggiungiSpesa(spesa: Spesa): Observable<Spesa> {
    const nuova = { ...spesa, _id: crypto.randomUUID() };
    this.storage.data.spese.push(nuova);
    return this.persist(nuova);
  }

  getSpesa(): Observable<Spesa[]> {
    return of([...this.storage.data.spese]);
  }

  modificaSpesa(id: string, spesa: Spesa): Observable<Spesa> {
    const spese = this.storage.data.spese;
    const i = spese.findIndex((s) => s._id === id);
    if (i < 0) return throwError(() => new Error('Spesa non trovata'));
    spese[i] = { ...spesa, _id: id, isEditing: false };
    return this.persist(spese[i]);
  }

  eliminaSpesa(id: string): Observable<void> {
    this.storage.data.spese = this.storage.data.spese.filter((s) => s._id !== id);
    return this.persist(undefined);
  }

  private persist<T>(value: T): Observable<T> {
    return from(this.storage.save()).pipe(map(() => value));
  }
}
