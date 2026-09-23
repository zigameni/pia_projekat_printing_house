import express from 'express'
import { AuthController } from '../controllers/authController'

const authRouter = express.Router()

// ==== Faza 1: autentifikacija ====
authRouter.route("/login").post(
    (req, res) => new AuthController().login(req, res)
)
authRouter.route("/loginAdmin").post(
    (req, res) => new AuthController().loginAdmin(req, res)
)
authRouter.route("/registracijaFizickoLice").post(
    (req, res) => new AuthController().registracijaFizickoLice(req, res)
)
authRouter.route("/registracijaPravnoLice").post(
    (req, res) => new AuthController().registracijaPravnoLice(req, res)
)
authRouter.route("/registracijaStampara").post(
    (req, res) => new AuthController().registracijaStampara(req, res)
)

export default authRouter