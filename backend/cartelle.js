import express from "express";
import CartellaModel from "./model/cartella.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const nuovaCartella = new CartellaModel(req.body);
    const cartellaSalvata = await nuovaCartella.save();
    res.status(201).json(cartellaSalvata);
  } catch (error) {
    console.error("Errore durante il salvataggio della cartella:", error);
    res
      .status(500)
      .json({ message: "Errore durante il salvataggio della cartella", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const cartelle = await CartellaModel.find();
    res.status(200).json(cartelle);
  } catch (error) {
    console.error("Errore durante il recupero delle cartelle:", error);
    res
      .status(500)
      .json({ message: "Errore durante il recupero delle cartelle", error });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const update = await CartellaModel.findByIdAndUpdate(
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
    const deleteUser = await CartellaModel.findByIdAndDelete(req.params.id);
    if (!deleteUser) {
      return res.status(404).json({ message: "Cliente non trovato" });
    }
    return res.status(204).end();
  } catch (error) {
    res.status(500).json({ error });
  }
});

export default router;