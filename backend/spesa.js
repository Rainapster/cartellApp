import express from "express";
import spesaModel from "./model/spesa.model.js";
const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const spesa = await spesaModel.find();
    return res.status(200).json(spesa);
  } catch (error) {
    console.error("Errore durante il recupero delle spese:", error);
    res
      .status(500)
      .json({ message: "Errore durante il recupero delle spese", error });
  }
});

router.post("/", async (req, res) => {
  try {
    const nuovaSpesa = new spesaModel(req.body);
    const spesaSalvata = await nuovaSpesa.save();
    res.status(201).json(spesaSalvata);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Errore durante il salvataggio della spesa", error });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const update = await spesaModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }// <- se vuoi tornarti l’oggetto aggiornato
    );
    return res.status(200).json(update);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Errore interno al server" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleteSpesa = await spesaModel.findByIdAndDelete(req.params.id);
    if (!deleteSpesa) {
      return res.status(404).json({ message: "Spesa non trovata" });
    }
    return res.status(204).end();
  } catch (error) {
    res.status(500).json({ error });
  }
});

export default router