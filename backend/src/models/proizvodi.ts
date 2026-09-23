import mongoose from "mongoose"
const Schema = mongoose.Schema

let Proizvod = new Schema({
    stamparijaId: String,
    nazivStamparije: String,
    grad: String,
    sifra: String,
    naziv: String,
    opis: String,
    kategorija: String,
    potkategorija: String,
    jedinicnaCena: Number,
    kolicinaNaLageru: Number,
    dostupneBoje: { type: Array },
    slikaUrl: String,
    dodatneSlike: { type: Array },
    uslugeStampe: { type: Array },
    aktivan: Boolean
})
export default mongoose.model("Proizvod", Proizvod, "proizvodi")