import express from 'express'
import { KorpaController } from '../controllers/korpaController'

const korpaRouter = express.Router()

// ==== Faza 4: korpa ====
korpaRouter.route("/dodajUKorpu").post(
    (req, res) => new KorpaController().dodajUKorpu(req, res)
)
korpaRouter.route("/ukloniIzKorpe").post(
    (req, res) => new KorpaController().ukloniIzKorpe(req, res)
)
korpaRouter.route("/korpaKlijenta").get(
    (req, res) => new KorpaController().korpaKlijenta(req, res)
)
korpaRouter.route("/potvrdiKorpu").post(
    (req, res) => new KorpaController().potvrdiKorpu(req, res)
)

export default korpaRouter
