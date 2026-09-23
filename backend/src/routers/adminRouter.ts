import express from 'express'
import { AdminController } from '../controllers/adminController'

const adminRouter = express.Router()

// ==== Faza 8: administrator — upravljanje korisničkim nalozima (spec 5.1) ====
adminRouter.route("/sviKorisnici").get(
    (req, res) => new AdminController().sviKorisnici(req, res)
)
adminRouter.route("/azurirajKorisnika").post(
    (req, res) => new AdminController().azurirajKorisnika(req, res)
)
adminRouter.route("/obrisiKorisnika").post(
    (req, res) => new AdminController().obrisiKorisnika(req, res)
)

// ==== Faza 8: administrator — zahtevi za registraciju (spec 5.1) ====
adminRouter.route("/neodobreniKorisnici").get(
    (req, res) => new AdminController().neodobreniKorisnici(req, res)
)
adminRouter.route("/odobriKorisnika").post(
    (req, res) => new AdminController().odobriKorisnika(req, res)
)
adminRouter.route("/odbijKorisnika").post(
    (req, res) => new AdminController().odbijKorisnika(req, res)
)

// ==== Faza 8: administrator — upravljanje kategorijama (spec 5.2) ====
adminRouter.route("/sveKategorije").get(
    (req, res) => new AdminController().sveKategorije(req, res)
)
adminRouter.route("/dodajKategoriju").post(
    (req, res) => new AdminController().dodajKategoriju(req, res)
)
adminRouter.route("/dodajPotkategoriju").post(
    (req, res) => new AdminController().dodajPotkategoriju(req, res)
)
adminRouter.route("/obrisiKategoriju").post(
    (req, res) => new AdminController().obrisiKategoriju(req, res)
)
adminRouter.route("/obrisiPotkategoriju").post(
    (req, res) => new AdminController().obrisiPotkategoriju(req, res)
)

export default adminRouter
