import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import fs from 'fs'
import authRouter from './routers/authRouter'
import proizvodiRouter from './routers/proizvodiRouter'
import korisniciRouter from './routers/korisniciRouter'
import narudzbineRouter from './routers/narudzbineRouter'
import korpaRouter from './routers/korpaRouter'
import komentariRouter from './routers/komentariRouter'
import nabavkeRouter from './routers/nabavkeRouter'
import stamparRouter from './routers/stamparRouter'
import adminRouter from './routers/adminRouter'

const app = express()
app.use(cors())
app.use(express.json())

// statički fajlovi: default slika + uploadovane slike
app.use(express.static('public'))
app.use('/uploads', express.static('uploads'))
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads', { recursive: true })

mongoose.connect("mongodb://127.0.0.1:27017/printing_house")
const connection = mongoose.connection
connection.once("open", () => {
    console.log("Connected to MongoDB - printing_house")
})

// ==== Ruteri po domenima ====
app.use("/", authRouter)       // Faza 1: autentifikacija
app.use("/", proizvodiRouter)  // Faza 2: proizvodi (javni deo)
app.use("/", korisniciRouter)  // Faza 3: profil korisnika
app.use("/", narudzbineRouter) // Faza 3: narudžbine klijenta
app.use("/", korpaRouter)       // Faza 4: korpa
app.use("/", komentariRouter)   // Faza 5: komentari
app.use("/", nabavkeRouter)     // Faza 6: javne nabavke
app.use("/", stamparRouter)     // Faza 7: štampar (proizvodi i usluge)
app.use("/", adminRouter)        // Faza 8: administrator (korisnički nalozi)

app.get("/", (req, res) => { res.json({ message: 'Printing House API radi!' }) })

app.listen(4000, () => console.log("Express running on port 4000!"))