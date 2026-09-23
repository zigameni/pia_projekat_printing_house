import express from 'express'
import Faktura from '../models/fakture'

export class NarudzbineController {

    // ==== Narudžbine klijenta (profil strana) ====
    narudzbineKlijenta = (req: express.Request, res: express.Response) => {
        const klijentId = req.query.klijentId as string
        if (!klijentId) {
            res.json({ message: 'Nedostaje klijentId' })
            return
        }
        Faktura.find({ klijentId: klijentId })
            .sort({ datumIzdavanja: -1 })
            .then((fakture: any[]) => {
                let result: any[] = []
                for (let f of fakture) {
                    result.push({
                        idFakture: f.idFakture,
                        klijentId: f.klijentId,
                        klijentIme: f.klijentIme,
                        stamparijaId: f.stamparijaId,
                        nazivStamparije: f.nazivStamparije,
                        grad: f.grad,
                        stavke: f.stavke,
                        ukupanIznos: f.ukupanIznos,
                        datumIzdavanja: f.datumIzdavanja,
                        status: f.status
                    })
                }
                res.json(result)
            }).catch((err) => {
                console.log(err)
                res.json([])
            })
    }

    // ==== Arhiva proizvoda (isporučeno + primljeno) ====
    arhivaProizvoda = (req: express.Request, res: express.Response) => {
        const klijentId = req.query.klijentId as string
        if (!klijentId) {
            res.json({ message: 'Nedostaje klijentId' })
            return
        }
        Faktura.find({
            klijentId: klijentId,
            status: { $in: ['isporuceno', 'primljeno'] }
        })
            .sort({ datumIzdavanja: -1 })
            .then((fakture: any[]) => {
                let result: any[] = []
                for (let f of fakture) {
                    for (let s of f.stavke) {
                        result.push({
                            idFakture: f.idFakture,
                            sifra: s.sifra,
                            nazivProizvoda: s.naziv,
                            kolicina: s.kolicina,
                            nazivStamparije: f.nazivStamparije,
                            grad: f.grad,
                            datumIzdavanja: f.datumIzdavanja,
                            status: f.status
                        })
                    }
                }
                res.json(result)
            }).catch((err) => {
                console.log(err)
                res.json([])
            })
    }

    // ==== Promeni status na primljeno ====
    promeniStatusPrimljeno = (req: express.Request, res: express.Response) => {
        const { idFakture } = req.body
        if (!idFakture) {
            res.json({ message: 'Nedostaje idFakture' })
            return
        }
        Faktura.findOne({ idFakture: idFakture }).then((faktura: any) => {
            if (!faktura) {
                res.json({ message: 'Faktura nije pronađena' })
                return
            }
            if (faktura.status !== 'isporuceno') {
                res.json({ message: 'Samo isporučene narudžbine mogu biti označene kao primljene' })
                return
            }
            faktura.status = 'primljeno'
            faktura.save().then(() => {
                res.json({ message: 'Uspešno označeno kao primljeno' })
            }).catch((err: any) => {
                console.log(err)
                res.json({ message: 'Greška pri čuvanju' })
            })
        }).catch((err) => {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        })
    }
}
