import mongoose from "mongoose"
const Schema = mongoose.Schema

let PasswordReset = new Schema({
    korisnickoIme: String,
    email: String,
    token: String,
    datumIsticanja: Date
})
export default mongoose.model("PasswordReset", PasswordReset, "password_reset")