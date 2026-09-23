import express from 'express'
import { KomentariController } from '../controllers/komentariController'

const komentariRouter = express.Router()

// ==== Faza 5: komentari i ocene ====
komentariRouter.route("/dodajKomentar").post(
    (req, res) => new KomentariController().dodajKomentar(req, res)
)
komentariRouter.route("/komentariProizvoda").get(
    (req, res) => new KomentariController().komentariProizvoda(req, res)
)

export default komentariRouter
