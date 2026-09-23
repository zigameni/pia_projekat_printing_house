import mongoose from "mongoose"
const Schema = mongoose.Schema

let Faktura = new Schema({
    idFakture: String,
    klijentId: String,
    klijentIme: String,
    stamparijaId: String,
    nazivStamparije: String,
    grad: String,
    stavke: { type: Array },   // [{ sifra, naziv, kolicina, tipStampe, boja, tekst, jedinicnaCena, iznos }]
    ukupanIznos: Number,
    datumIzdavanja: Date,
    status: String   // naruceno | placeno | u stampi | isporuceno | primljeno
})
export default mongoose.model("Faktura", Faktura, "fakture")