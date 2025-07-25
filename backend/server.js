import express from "express";
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import loginRoutes from "./login.js"
import cartella from "./cartelle.js"
import spesa from "./spesa.js"

dotenv.config()
console.log("Variabili di ambiente:", process.env);

const app = express ()
app.use(cors());
app.use(express.json())
app.use("/api/auth", loginRoutes)
app.use("/api/cartella",cartella)
app.use("/api/spese", spesa)

const PORT = 3000

app.listen(PORT, async()=>{
    console.log(`server running on port: ${PORT}`)
    await mongoose.connect("mongodb://127.0.0.1:27017/serverCartelle")
})