import mongoose from "mongoose"
const Schema = mongoose.Schema

let JavnaNabavka = new Schema({
    idNabavke: String,
    klijentId: String,
    klijentIme: String,
    datumVremeRaspisivanja: Date,
    rokMinuti: Number,   // 10
    stavke: { type: Array },   // [{ sifra, naziv, kolicina }]
    zavrsena: Boolean,
    pobednikId: String
})
export default mongoose.model("JavnaNabavka", JavnaNabavka, "javne_nabavke")