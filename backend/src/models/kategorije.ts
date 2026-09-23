import mongoose from "mongoose"
const Schema = mongoose.Schema

let Kategorija = new Schema({
    naziv: String,
    potkategorije: { type: Array }
})
export default mongoose.model("Kategorija", Kategorija, "kategorije")