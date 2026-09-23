import express from 'express'
import { ProizvodiController } from '../controllers/proizvodiController'

const proizvodiRouter = express.Router()

// ==== Faza 2: javno vidljive strane (proizvodi) ====
proizvodiRouter.route("/brojStamparija").get(
    (req, res) => new ProizvodiController().brojStamparija(req, res)
)
proizvodiRouter.route("/top5Proizvoda").get(
    (req, res) => new ProizvodiController().top5Proizvoda(req, res)
)
proizvodiRouter.route("/kategorijeZaPretragu").get(
    (req, res) => new ProizvodiController().kategorijeZaPretragu(req, res)
)
proizvodiRouter.route("/gradoviIStamparije").get(
    (req, res) => new ProizvodiController().gradoviIStamparije(req, res)
)
proizvodiRouter.route("/pretragaProizvoda").get(
    (req, res) => new ProizvodiController().pretragaProizvoda(req, res)
)
proizvodiRouter.route("/detaljiProizvoda/:sifra").get(
    (req, res) => new ProizvodiController().detaljiProizvoda(req, res)
)

// ==== Faza 3: detalji proizvoda za klijenta (dodatne info o štampariji) ====
proizvodiRouter.route("/detaljiProizvodaKlijent/:sifra").get(
    (req, res) => new ProizvodiController().detaljiProizvodaKlijent(req, res)
)

export default proizvodiRouter