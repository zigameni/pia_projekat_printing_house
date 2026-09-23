import mongoose from "mongoose"
const Schema = mongoose.Schema

let Komentar = new Schema({
    proizvodId: String,    // sifra proizvoda
    korisnickoIme: String,
    datum: Date,
    tekst: String,
    ocena: String   // svidja | ne_svidja
})
export default mongoose.model("Komentar", Komentar, "komentari")