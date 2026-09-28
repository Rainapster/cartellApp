import { Injectable } from '@angular/core';
import { get, set } from 'idb-keyval';
import { Cartella } from '../models/cartella.model';
import { Spesa } from '../models/spesa.model';

export interface AppData {
  cartelle: Cartella[];
  spese: Spesa[];
}

const HANDLE_KEY = 'cartellapp-file';
const BACKUP_KEY = 'cartellapp-backup';
const FILE_TYPES: FilePickerAcceptType[] = [
  { description: 'Dati CartellApp', accept: { 'application/json': ['.json'] } },
];

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  data: AppData = { cartelle: [], spese: [] };
  private handle: FileSystemFileHandle | null = null;

  get hasFile() {
    return this.handle !== null;
  }

  async savedFileName(): Promise<string | null> {
    const h = await get<FileSystemFileHandle>(HANDLE_KEY);
    return h?.name ?? null;
  }

  // Riapre l'ultimo file usato (il browser chiede il permesso)
  async reconnect(): Promise<boolean> {
    const h = await get<FileSystemFileHandle>(HANDLE_KEY);
    if (!h) return false;
    if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') return false;
    await this.useFile(h);
    return true;
  }

  async openFile(): Promise<boolean> {
    const [h] = await window.showOpenFilePicker({ types: FILE_TYPES });
    if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') return false;
    await this.useFile(h);
    return true;
  }

  async createFile(): Promise<boolean> {
    const h = await window.showSaveFilePicker({
      suggestedName: 'cartellapp-dati.json',
      types: FILE_TYPES,
    });
    this.handle = h;
    await set(HANDLE_KEY, h);
    this.data = { cartelle: [], spese: [] };
    await this.save();
    return true;
  }

  async save() {
    if (!this.handle) throw new Error('Nessun file dati aperto');
    const daSalvare: AppData = {
      cartelle: this.data.cartelle.filter((c) => c._id), // esclude i clienti mai salvati
      spese: this.data.spese,
    };
    const json = JSON.stringify(daSalvare, null, 2);
    localStorage.setItem(BACKUP_KEY, json); // copia di emergenza
    const writable = await this.handle.createWritable();
    await writable.write(json);
    await writable.close();
  }

  private async useFile(h: FileSystemFileHandle) {
    const text = await (await h.getFile()).text();
    const parsed = text.trim() ? JSON.parse(text) : {};
    this.data = { cartelle: parsed.cartelle ?? [], spese: parsed.spese ?? [] };
    this.handle = h;
    await set(HANDLE_KEY, h);
  }
}
