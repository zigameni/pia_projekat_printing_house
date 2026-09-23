import express from 'express'
import { StamparController } from '../controllers/stamparController'

const stamparRouter = express.Router()

// ==== Faza 7: štampar (zaštićeni, pišući deo — proizvodi i usluge) ====
stamparRouter.route("/proizvodiStamparije").get(
    (req, res) => new StamparController().proizvodiStamparije(req, res)
)
stamparRouter.route("/kategorije").get(
    (req, res) => new StamparController().kategorije(req, res)
)
stamparRouter.route("/dodajProizvod").post(
    (req, res) => new StamparController().dodajProizvod(req, res)
)
stamparRouter.route("/azurirajKolicinu").post(
    (req, res) => new StamparController().azurirajKolicinu(req, res)
)

// ==== Faza 7: narudžbine štampara (spec 4.5) ====
stamparRouter.route("/narudzbineStamparije").get(
    (req, res) => new StamparController().narudzbineStamparije(req, res)
)
stamparRouter.route("/promeniStatusNarudzbine").post(
    (req, res) => new StamparController().promeniStatusNarudzbine(req, res)
)

export default stamparRouter
