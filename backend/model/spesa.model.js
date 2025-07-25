import { Schema, model } from "mongoose";

const spesaSchema = new Schema(
  {
    descrizione: { type: String },
    importo: { type: Number },
    data: { type: String },
    categoria: { type: String },
    isEditing :{type : Boolean},
  },
  {
    timestamps: true,
  }
);

export default model ("spesaModel", spesaSchema)