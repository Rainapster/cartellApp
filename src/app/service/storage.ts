import { Injectable } from '@angular/core';
import { get, set } from 'idb-keyval';
import { Cartella } from '../models/cartella.model';
import { Spesa } from '../models/spesa.model';
import { Articolo } from '../models/articolo.model';

export interface AppData {
  cartelle: Cartella[];
  spese: Spesa[];
  inventario: Articolo[];
  ricaricoDefault: number; // ricarico % applicato a tutti gli articoli salvo override
  ivaInclusa: boolean; // se true, il prezzo di vendita include il 22% di IVA
}

const HANDLE_KEY = 'cartellapp-file';
const BACKUP_KEY = 'cartellapp-backup'; // ultima copia di emergenza (localStorage)
const BACKUPS_KEY = 'cartellapp-backups'; // copie rotanti datate (IndexedDB)
const BACKUP_DIR_KEY = 'cartellapp-backup-dir'; // cartella scelta per i backup su disco
const MAX_BACKUPS = 10; // quante copie rotanti conservare in IndexedDB
const FILE_TYPES: FilePickerAcceptType[] = [
  { description: 'Dati CartellApp', accept: { 'application/json': ['.json'] } },
];

export interface BackupEntry {
  date: string; // ISO, per ordinare/mostrare
  name: string; // nome del file datato
  json: string; // contenuto dei dati al momento del backup
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  data: AppData = {
    cartelle: [],
    spese: [],
    inventario: [],
    ricaricoDefault: 0,
    ivaInclusa: false,
  };
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
    this.data = {
      cartelle: [],
      spese: [],
      inventario: [],
      ricaricoDefault: 0,
      ivaInclusa: false,
    };
    await this.save();
    return true;
  }

  async save() {
    if (!this.handle) throw new Error('Nessun file dati aperto');
    const json = this.snapshotJson();
    localStorage.setItem(BACKUP_KEY, json); // copia di emergenza
    const writable = await this.handle.createWritable();
    await writable.write(json);
    await writable.close();
  }

  // Crea una copia di sicurezza dei dati correnti: copie rotanti in IndexedDB
  // + un file datato su disco (best-effort). Non lancia mai: un backup che
  // fallisce non deve impedire il logout o l'apertura di un file.
  async backup(): Promise<void> {
    try {
      if (!this.handle) return; // nessun dato aperto, niente da salvare
      const json = this.snapshotJson();
      const now = new Date();
      const name = `cartellapp-backup-${this.timestamp(now)}.json`;
      await this.backupToIndexedDb(name, json, now);
      await this.backupToDisk(name, json);
    } catch (e) {
      console.warn('Backup non riuscito', e);
    }
  }

  // Le copie rotanti disponibili in IndexedDB, dalla più recente
  async listBackups(): Promise<BackupEntry[]> {
    return (await get<BackupEntry[]>(BACKUPS_KEY)) ?? [];
  }

  // Ripristina i dati di un backup e li scrive sul file. Se non c'è un file
  // aperto (es. l'originale è corrotto), chiede dove salvarli.
  async restoreBackup(entry: BackupEntry): Promise<void> {
    const parsed = JSON.parse(entry.json);
    this.data = {
      cartelle: parsed.cartelle ?? [],
      spese: parsed.spese ?? [],
      inventario: parsed.inventario ?? [],
      ricaricoDefault: parsed.ricaricoDefault ?? 0,
      ivaInclusa: parsed.ivaInclusa ?? false,
    };
    if (!this.handle) {
      const h = await window.showSaveFilePicker({
        suggestedName: 'cartellapp-dati.json',
        types: FILE_TYPES,
      });
      this.handle = h;
      await set(HANDLE_KEY, h);
    }
    await this.save();
  }

  // I dati così come vengono salvati: esclude i clienti mai salvati (senza _id)
  private snapshotJson(): string {
    const daSalvare: AppData = {
      cartelle: this.data.cartelle.filter((c) => c._id),
      spese: this.data.spese,
      inventario: this.data.inventario,
      ricaricoDefault: this.data.ricaricoDefault,
      ivaInclusa: this.data.ivaInclusa,
    };
    return JSON.stringify(daSalvare, null, 2);
  }

  private async backupToIndexedDb(name: string, json: string, date: Date) {
    const list = (await get<BackupEntry[]>(BACKUPS_KEY)) ?? [];
    if (list[0]?.json === json) return; // dati invariati: niente doppione
    list.unshift({ date: date.toISOString(), name, json });
    await set(BACKUPS_KEY, list.slice(0, MAX_BACKUPS)); // tiene solo le più recenti
  }

  private async backupToDisk(name: string, json: string) {
    const dir = await this.backupDir();
    if (!dir) return; // cartella non scelta o permesso negato: salto, senza errori
    const fileHandle = await dir.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(json);
    await writable.close();
  }

  // Se non è mai fallito in questa sessione, chiedo l'eventuale cartella una volta sola
  private backupDirDeclined = false;

  private async backupDir(): Promise<FileSystemDirectoryHandle | null> {
    const saved = await get<FileSystemDirectoryHandle>(BACKUP_DIR_KEY);
    if (saved) {
      if ((await saved.queryPermission({ mode: 'readwrite' })) === 'granted') return saved;
      if ((await saved.requestPermission({ mode: 'readwrite' })) === 'granted') return saved;
      return null; // permesso negato per ora
    }
    if (this.backupDirDeclined) return null; // già annullato: non insisto in questa sessione
    try {
      const dir = await window.showDirectoryPicker({ mode: 'readwrite', id: 'cartellapp-backup' });
      await set(BACKUP_DIR_KEY, dir);
      return dir;
    } catch {
      // AbortError (annullato) o gesto utente scaduto: salto i backup su disco per ora
      this.backupDirDeclined = true;
      return null;
    }
  }

  private timestamp(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(
      d.getMinutes()
    )}-${p(d.getSeconds())}`;
  }

  private async useFile(h: FileSystemFileHandle) {
    const text = await (await h.getFile()).text();
    const parsed = text.trim() ? JSON.parse(text) : {};
    this.data = {
      cartelle: parsed.cartelle ?? [],
      spese: parsed.spese ?? [],
      inventario: parsed.inventario ?? [],
      ricaricoDefault: parsed.ricaricoDefault ?? 0,
      ivaInclusa: parsed.ivaInclusa ?? false,
    };
    this.handle = h;
    await set(HANDLE_KEY, h);
    await this.backup(); // snapshot dello stato appena aperto, prima delle modifiche
  }
}
