import express from 'express'
import JavnaNabavka from '../models/javneNabavke'
import Ponuda from '../models/ponude'
import Korisnik from '../models/korisnici'
import Faktura from '../models/fakture'
import Proizvod from '../models/proizvodi'

export class NabavkeController {

    // ==== Raspisivanje javne nabavke (pravno lice) ====
    raspisiNabavku = async (req: express.Request, res: express.Response) => {
        const { klijentId, stavke } = req.body
        if (!klijentId || !stavke || stavke.length == 0) {
            res.json({ message: 'Nedostaju obavezni podaci' })
            return
        }

        try {
            let klijent = await Korisnik.findOne({ korisnickoIme: klijentId })
            if (!klijent) {
                res.json({ message: 'Korisnik nije pronađen' })
                return
            }

            // Auto-increment ID
            let maxNabavka = await JavnaNabavka.findOne({}).sort({ idNabavke: -1 }).lean()
            let noviId = 'JN-2026-001'
            if (maxNabavka && maxNabavka.idNabavke) {
                let broj = parseInt(maxNabavka.idNabavke.split('-')[2]) + 1
                noviId = `JN-2026-${String(broj).padStart(3, '0')}`
            }

            let nabavka = new JavnaNabavka({
                idNabavke: noviId,
                klijentId: klijentId,
                klijentIme: `${klijent.ime} ${klijent.prezime}`,
                datumVremeRaspisivanja: new Date(),
                rokMinuti: 10,
                stavke: stavke,
                zavrsena: false,
                pobednikId: ''
            })
            await nabavka.save()

            res.json({ message: 'Javna nabavka uspešno raspisana', idNabavke: noviId })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Otvorene nabavke (za štampare) ====
    otvoreneNabavke = async (req: express.Request, res: express.Response) => {
        try {
            let sad = new Date()
            let nabavke = await JavnaNabavka.find({ zavrsena: false })
            let result: any[] = []

            for (let n of nabavke) {
                // Proveri da li je istekao rok
                let vremeIsteka = new Date((n.datumVremeRaspisivanja || new Date()).getTime() + (n.rokMinuti || 10) * 60000)
                if (sad > vremeIsteka) {
                    // Rok istekao — završi automatski
                    await this.zavrsiNabavku(n)
                    continue
                }

                // Proveri da li štampar već nije poslao ponudu
                let postojiPonuda = await Ponuda.findOne({
                    nabavkaId: n.idNabavke,
                    stamparijaId: req.query.stamparijaId || ''
                })

                result.push({
                    idNabavke: n.idNabavke,
                    klijentIme: n.klijentIme,
                    datumVremeRaspisivanja: n.datumVremeRaspisivanja,
                    rokMinuti: n.rokMinuti,
                    stavke: n.stavke,
                    poslaoPonudu: !!postojiPonuda
                })
            }
            res.json(result)
        } catch (err) {
            console.log(err)
            res.json([])
        }
    }

    // ==== Slanje ponude (štampar) ====
    posaljiPonudu = async (req: express.Request, res: express.Response) => {
        const { nabavkaId, stamparijaId, stavke } = req.body
        if (!nabavkaId || !stamparijaId || !stavke) {
            res.json({ message: 'Nedostaju obavezni podaci' })
            return
        }

        try {
            let nabavka = await JavnaNabavka.findOne({ idNabavke: nabavkaId })
            if (!nabavka) {
                res.json({ message: 'Nabavka nije pronađena' })
                return
            }
            if (nabavka.zavrsena) {
                res.json({ message: 'Nabavka je već završena' })
                return
            }

            // Proveri rok
            let sad = new Date()
            let vremeIsteka = new Date((nabavka.datumVremeRaspisivanja || new Date()).getTime() + (nabavka.rokMinuti || 10) * 60000)
            if (sad > vremeIsteka) {
                await this.zavrsiNabavku(nabavka)
                res.json({ message: 'Rok za ponude je istekao' })
                return
            }

            // Proveri da li štampar već ima ponudu
            let postojeca = await Ponuda.findOne({ nabavkaId: nabavkaId, stamparijaId: stamparijaId })
            if (postojeca) {
                res.json({ message: 'Već ste poslali ponudu za ovu nabavku' })
                return
            }

            // Pronađi štampara
            let stamparija = await Korisnik.findOne({ korisnickoIme: stamparijaId })
            let naziv = stamparija ? stamparija.nazivInstitucije : stamparijaId

            // Izračunaj ukupan iznos
            let ukupanIznos = 0
            for (let s of stavke) {
                ukupanIznos += (s.jedinicnaCena || 0) * (s.kolicina || 0)
            }

            let ponuda = new Ponuda({
                nabavkaId: nabavkaId,
                stamparijaId: stamparijaId,
                nazivStamparije: naziv,
                stavke: stavke,
                ukupanIznos: ukupanIznos,
                datum: new Date()
            })
            await ponuda.save()

            res.json({ message: 'Ponuda uspešno poslata' })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Moje nabavke (pravno lice) ====
    mojeNabavke = async (req: express.Request, res: express.Response) => {
        const klijentId = req.query.klijentId as string
        if (!klijentId) {
            res.json({ message: 'Nedostaje klijentId' })
            return
        }

        try {
            let nabavke = await JavnaNabavka.find({ klijentId: klijentId }).sort({ datumVremeRaspisivanja: -1 })
            let result: any[] = []

            for (let n of nabavke) {
                // Uzmi sve ponude za ovu nabavku
                let ponude = await Ponuda.find({ nabavkaId: n.idNabavke })

                // Proveri da li je rok istekao i završi ako jeste
                if (!n.zavrsena) {
                    let sad = new Date()
                    let vremeIsteka = new Date((n.datumVremeRaspisivanja || new Date()).getTime() + (n.rokMinuti || 10) * 60000)
                    if (sad > vremeIsteka) {
                        await this.zavrsiNabavku(n)
                        n.zavrsena = true
                    }
                }

                result.push({
                    idNabavke: n.idNabavke,
                    klijentIme: n.klijentIme,
                    datumVremeRaspisivanja: n.datumVremeRaspisivanja,
                    rokMinuti: n.rokMinuti,
                    stavke: n.stavke,
                    zavrsena: n.zavrsena,
                    pobednikId: n.pobednikId,
                    brojPonuda: ponude.length,
                    ponude: ponude.map((p: any) => ({
                        stamparijaId: p.stamparijaId,
                        nazivStamparije: p.nazivStamparije,
                        ukupanIznos: p.ukupanIznos,
                        datum: p.datum
                    }))
                })
            }
            res.json(result)
        } catch (err) {
            console.log(err)
            res.json([])
        }
    }

    // ==== Završavanje nabavke (interni helper) ====
    private zavrsiNabavku = async (nabavka: any) => {
        try {
            let ponude = await Ponuda.find({ nabavkaId: nabavka.idNabavke })
            if (ponude.length == 0) {
                nabavka.zavrsena = true
                nabavka.pobednikId = ''
                await nabavka.save()
                return
            }

            // Pronađi najpovoljniju ponudu
            let najbolja = ponude[0]
            for (let p of ponude) {
                if ((p.ukupanIznos || 0) < (najbolja.ukupanIznos || 0)) {
                    najbolja = p
                }
            }

            nabavka.zavrsena = true
            nabavka.pobednikId = najbolja.stamparijaId
            await nabavka.save()

            // Kreiraj fakturu za pobednika
            let klijent = await Korisnik.findOne({ korisnickoIme: nabavka.klijentId })

            let maxFaktura = await Faktura.findOne({}).sort({ idFakture: -1 }).lean()
            let noviId = 'F-2026-001'
            if (maxFaktura && maxFaktura.idFakture) {
                let broj = parseInt(maxFaktura.idFakture.split('-')[2]) + 1
                noviId = `F-2026-${String(broj).padStart(3, '0')}`
            }

            let stamparija = await Korisnik.findOne({ korisnickoIme: najbolja.stamparijaId })

            let faktura = new Faktura({
                idFakture: noviId,
                klijentId: nabavka.klijentId,
                klijentIme: klijent ? `${klijent.ime} ${klijent.prezime}` : '',
                stamparijaId: najbolja.stamparijaId,
                nazivStamparije: stamparija ? stamparija.nazivInstitucije : najbolja.stamparijaId,
                grad: stamparija ? stamparija.grad : '',
                stavke: najbolja.stavke.map((s: any) => ({
                    sifra: s.sifra || '',
                    naziv: s.naziv || '',
                    kolicina: s.kolicina,
                    tipStampe: '',
                    boja: '',
                    jedinicnaCena: s.jedinicnaCena,
                    iznos: s.jedinicnaCena * s.kolicina
                })),
                ukupanIznos: najbolja.ukupanIznos,
                datumIzdavanja: new Date(),
                status: 'u stampi'
            })
            await faktura.save()
        } catch (err) {
            console.log('Greška pri završavanju nabavke:', err)
        }
    }
}
