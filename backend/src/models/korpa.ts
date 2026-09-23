import mongoose from "mongoose"
const Schema = mongoose.Schema

let Korpa = new Schema({
    klijentId: String,
    stavke: { type: Array }   // [{ proizvodId, stamparijaId, kolicina, tipStampe, boja, tekst, slika, cena }]
})
export default mongoose.model("Korpa", Korpa, "korpa")