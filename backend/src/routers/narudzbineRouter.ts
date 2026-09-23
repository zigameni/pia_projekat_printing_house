import express from 'express'
import { NarudzbineController } from '../controllers/narudzbineController'

const narudzbineRouter = express.Router()

// ==== Faza 3: narudžbine klijenta ====
narudzbineRouter.route("/narudzbineKlijenta").get(
    (req, res) => new NarudzbineController().narudzbineKlijenta(req, res)
)

// ==== Faza 5: arhiva ====
narudzbineRouter.route("/arhivaProizvoda").get(
    (req, res) => new NarudzbineController().arhivaProizvoda(req, res)
)
narudzbineRouter.route("/promeniStatusPrimljeno").post(
    (req, res) => new NarudzbineController().promeniStatusPrimljeno(req, res)
)

export default narudzbineRouter
