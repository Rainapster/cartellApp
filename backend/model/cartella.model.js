import { Schema, model } from "mongoose";

const merceSchema = new Schema({
  descrizione: { type: String, required: true },
  importo: { type: Number, required: true },
});
const rataSchema = new Schema({
  data: { type: Date, required: true },
  importo: { type: Number, required: true },
});
const cartellaSchema = new Schema(
  {
    nome: { type: String },
    cognome: { type: String },
    numeroCliente: {
      type: Number,
      required: function () {
        return !this.isPreventivo;
      },
      unique: true,
    },
    tipoVia: { type: String },
    nomeVia: { type: String },
    numeroVia: { type: Number },
    merce: [merceSchema],
    rate: [rataSchema],
    isPreventivo: Boolean,
  },
  {
    timestamps: true,
  }
);
export default model("CartellaModel", cartellaSchema);
