import express from 'express'
import { KorisniciController } from '../controllers/korisniciController'

const korisniciRouter = express.Router()

// ==== Faza 3: profil korisnika ====
korisniciRouter.route("/azurirajProfil").post(
    (req, res) => new KorisniciController().azurirajProfil(req, res)
)

export default korisniciRouter