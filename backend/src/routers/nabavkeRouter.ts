import express from 'express'
import { NabavkeController } from '../controllers/nabavkeController'

const nabavkeRouter = express.Router()

// ==== Faza 6: javne nabavke / licitacije ====
nabavkeRouter.route("/raspisiNabavku").post(
    (req, res) => new NabavkeController().raspisiNabavku(req, res)
)
nabavkeRouter.route("/otvoreneNabavke").get(
    (req, res) => new NabavkeController().otvoreneNabavke(req, res)
)
nabavkeRouter.route("/posaljiPonudu").post(
    (req, res) => new NabavkeController().posaljiPonudu(req, res)
)
nabavkeRouter.route("/mojeNabavke").get(
    (req, res) => new NabavkeController().mojeNabavke(req, res)
)

export default nabavkeRouter
