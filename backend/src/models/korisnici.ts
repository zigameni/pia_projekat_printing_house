import mongoose from "mongoose"
const Schema = mongoose.Schema

let Korisnik = new Schema({
    korisnickoIme: String,
    lozinka: String,
    ime: String,
    prezime: String,
    telefon: String,
    email: String,
    tip: String,        // admin | klijent | stampar
    vrsta: String,      // fizicko | pravno (samo za klijente)
    slika: String,      // putanja do profilne slike
    status: String,     // aktivan | neaktivan | na_cekanju
    nazivInstitucije: String,
    adresa: String,
    grad: String,
    maticniBroj: String,
    pib: String
})
export default mongoose.model("Korisnik", Korisnik, "korisnici")