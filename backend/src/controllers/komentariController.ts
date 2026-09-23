import express from 'express'
import Komentar from '../models/komentari'

export class KomentariController {

    // ==== Dodaj komentar (lajk/dislajk + tekst) ====
    dodajKomentar = (req: express.Request, res: express.Response) => {
        const { proizvodId, korisnickoIme, tekst, ocena } = req.body

        if (!proizvodId || !korisnickoIme || !ocena) {
            res.json({ message: 'Nedostaju obavezni podaci' })
            return
        }
        if (ocena !== 'svidja' && ocena !== 'ne_svidja') {
            res.json({ message: 'Ocena mora biti svidja ili ne_svidja' })
            return
        }

        let komentar = new Komentar({
            proizvodId: proizvodId,
            korisnickoIme: korisnickoIme,
            datum: new Date(),
            tekst: tekst || '',
            ocena: ocena
        })

        komentar.save().then(() => {
            res.json({ message: 'Uspešno dodat komentar' })
        }).catch((err: any) => {
            console.log(err)
            res.json({ message: 'Greška pri čuvanju' })
        })
    }

    // ==== Komentari za proizvod (poslednjih 5) ====
    komentariProizvoda = (req: express.Request, res: express.Response) => {
        const proizvodId = req.query.proizvodId as string
        if (!proizvodId) {
            res.json({ message: 'Nedostaje proizvodId' })
            return
        }
        Komentar.find({ proizvodId: proizvodId })
            .sort({ datum: -1 })
            .limit(5)
            .then((komentari: any[]) => {
                res.json(komentari.map((k: any) => ({
                    korisnickoIme: k.korisnickoIme,
                    datum: k.datum,
                    tekst: k.tekst,
                    ocena: k.ocena
                })))
            }).catch((err) => {
                console.log(err)
                res.json([])
            })
    }
}
