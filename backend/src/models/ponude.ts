import mongoose from "mongoose"
const Schema = mongoose.Schema

let Ponuda = new Schema({
    nabavkaId: String,
    stamparijaId: String,
    nazivStamparije: String,
    stavke: { type: Array },   // [{ sifra, naziv, kolicina, jedinicnaCena }]
    ukupanIznos: Number,
    datum: Date
})
export default mongoose.model("Ponuda", Ponuda, "ponude")