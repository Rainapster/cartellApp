import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Spesa } from '../models/spesa.model';

@Injectable({
  providedIn: 'root'
})
export class SpesaService {
    spese: Spesa[] = [];
  
  private apiUrl = 'http://localhost:3000/api/spese'
  constructor(private http: HttpClient) { }

  aggiungiSpesa(spesa : Spesa) : Observable<Spesa>{
    return this.http.post<Spesa>(this.apiUrl, spesa)
  }

  getSpesa(): Observable <Spesa[]>{
    return this.http.get<Spesa[]>(this.apiUrl)
  }

  modificaSpesa(id: string, spesa: Spesa): Observable<Spesa> {
    return this.http.put<Spesa>(`${this.apiUrl}/${id}`, spesa);
  }
  eliminaSpesa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
