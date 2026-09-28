export interface Spesa {
  _id?: string;          // ← Mongo te lo dà di default
  descrizione: string;
  importo: number;
  data: string;
  categoria: string;
  isEditing?: boolean;
}