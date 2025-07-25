import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"

const router = express.Router();
dotenv.config()
const { ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET } = process.env;

// Controllo per verificare che le variabili di ambiente siano caricate
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !JWT_SECRET) {
    console.error("Le variabili di ambiente non sono configurate correttamente");
    process.exit(1); // Termina il processo se le variabili di ambiente non sono caricate
}

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Log dei valori ricevuti e delle variabili di ambiente
        console.log("Email ricevuta:", email);
        console.log("Password ricevuta:", password);
        console.log("Email attesa:", ADMIN_EMAIL);
        console.log("Password attesa:", ADMIN_PASSWORD);

        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Credenziali non valide" });
        }

        const token = jwt.sign({ email }, JWT_SECRET);
        return res.json({ token });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;