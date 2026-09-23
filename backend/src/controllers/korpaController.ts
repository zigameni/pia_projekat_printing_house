import express from 'express'
import Korpa from '../models/korpa'
import Proizvod from '../models/proizvodi'
import Faktura from '../models/fakture'
import Korisnik from '../models/korisnici'
import { generisiPdfFakturu } from '../utils/pdfUtils'
import { posaljiFakturuEmail } from '../utils/emailUtils'

export class KorpaController {

    // ==== Dodaj proizvod u korpu ====
    dodajUKorpu = (req: express.Request, res: express.Response) => {
        const { klijentId, proizvodId, stamparijaId, kolicina, tipStampe, boja, tekst, slika } = req.body

        if (!klijentId || !proizvodId || !kolicina) {
            res.json({ message: 'Nedostaju obavezni podaci' })
            return
        }

        // Provera lagera
        Proizvod.findOne({ sifra: proizvodId }).then((proizvod: any) => {
            if (!proizvod) {
                res.json({ message: 'Proizvod nije pronađen' })
                return
            }
            if (proizvod.kolicinaNaLageru < kolicina) {
                res.json({ message: 'Nema dovoljno proizvoda trenutno na stanju' })
                return
            }

            // Izračunaj cenu (jedinicnaCena + dodatnaCena usluge)
            let cena = proizvod.jedinicnaCena
            if (tipStampe && proizvod.uslugeStampe && proizvod.uslugeStampe.length > 0) {
                let usluga = proizvod.uslugeStampe.find((u: any) => u.tipStampe == tipStampe)
                if (usluga) cena += usluga.dodatnaCenaPoKomadu
            }

            // Pronađi ili kreiraj korpu
            Korpa.findOne({ klijentId: klijentId }).then((korpa: any) => {
                if (!korpa) {
                    korpa = new Korpa({ klijentId: klijentId, stavke: [] })
                }

                // Proveri da li isti proizvod već postoji u korpi (isti proizvod + ista usluga + ista boja)
                let postojeca = korpa.stavke.find((s: any) =>
                    s.proizvodId == proizvodId && s.tipStampe == tipStampe && s.boja == boja
                )

                if (postojeca) {
                    // Ažuriraj količinu
                    let novaKolicina = postojeca.kolicina + kolicina
                    if (novaKolicina > proizvod.kolicinaNaLageru) {
                        res.json({ message: 'Nema dovoljno proizvoda trenutno na stanju' })
                        return
                    }
                    postojeca.kolicina = novaKolicina
                    postojeca.cena = cena
                    if (tekst !== undefined) postojeca.tekst = tekst
                    if (slika !== undefined) postojeca.slika = slika
                } else {
                    // Dodaj novu stavku
                    korpa.stavke.push({
                        proizvodId: proizvodId,
                        nazivProizvoda: proizvod.naziv,
                        stamparijaId: stamparijaId,
                        nazivStamparije: proizvod.nazivStamparije,
                        grad: proizvod.grad,
                        kolicina: kolicina,
                        tipStampe: tipStampe || '',
                        boja: boja || '',
                        tekst: tekst || '',
                        slika: slika || '',
                        cena: cena
                    })
                }

                korpa.save().then(() => {
                    res.json({ message: 'Uspešno dodato u korpu', stavke: korpa.stavke })
                }).catch((err: any) => {
                    console.log(err)
                    res.json({ message: 'Greška pri čuvanju' })
                })
            }).catch((err: any) => {
                console.log(err)
                res.json({ message: 'Greška na serveru' })
            })
        }).catch((err: any) => {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        })
    }

    // ==== Ukloni stavku iz korpe ====
    ukloniIzKorpe = (req: express.Request, res: express.Response) => {
        const { klijentId, proizvodId, tipStampe, boja } = req.body

        if (!klijentId || !proizvodId) {
            res.json({ message: 'Nedostaju obavezni podaci' })
            return
        }

        Korpa.findOne({ klijentId: klijentId }).then((korpa: any) => {
            if (!korpa) {
                res.json({ message: 'Korpa je prazna' })
                return
            }
            korpa.stavke = korpa.stavke.filter((s: any) =>
                !(s.proizvodId == proizvodId && s.tipStampe == (tipStampe || '') && s.boja == (boja || ''))
            )
            korpa.save().then(() => {
                res.json({ message: 'Uspešno uklonjeno', stavke: korpa.stavke })
            }).catch((err: any) => {
                console.log(err)
                res.json({ message: 'Greška pri čuvanju' })
            })
        }).catch((err: any) => {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        })
    }

    // ==== Sadržaj korpe klijenta ====
    korpaKlijenta = (req: express.Request, res: express.Response) => {
        const klijentId = req.query.klijentId as string
        if (!klijentId) {
            res.json({ message: 'Nedostaje klijentId' })
            return
        }
        Korpa.findOne({ klijentId: klijentId }).then((korpa: any) => {
            if (!korpa) {
                res.json([])
                return
            }
            res.json(korpa.stavke || [])
        }).catch((err: any) => {
            console.log(err)
            res.json([])
        })
    }

    // ==== Potvrda korpe — kreiranje faktura po štamparijama ====
    potvrdiKorpu = async (req: express.Request, res: express.Response) => {
        const { klijentId } = req.body
        if (!klijentId) {
            res.json({ message: 'Nedostaje klijentId' })
            return
        }

        try {
            // 1. Uzmi korpu
            let korpa = await Korpa.findOne({ klijentId: klijentId })
            if (!korpa || !korpa.stavke || korpa.stavke.length == 0) {
                res.json({ message: 'Korpa je prazna' })
                return
            }

            // 2. Uzmi klijenta
            let klijent = await Korisnik.findOne({ korisnickoIme: klijentId })
            if (!klijent) {
                res.json({ message: 'Korisnik nije pronađen' })
                return
            }

            // 3. Grupiši stavke po štampariji
            let grupisane: any = {}
            for (let s of korpa.stavke) {
                let key = s.stamparijaId
                if (!grupisane[key]) grupisane[key] = []
                grupisane[key].push(s)
            }

            // 4. Za svaku štampariju proveri lager i kreiraj fakturu
            let faktureKreirane: any[] = []
            // N-3: stvarni ishod slanja i-mejla — porudžbina važi i ako pošta ne ode,
            // ali klijent (i klijentska strana) treba da zna šta se stvarno desilo
            let emailovaUkupno = 0
            let emailovaPoslato = 0
            let emailPrimaoca = ''

            for (let stamparijaId of Object.keys(grupisane)) {
                let stavke = grupisane[stamparijaId]
                let ukupanIznos = 0
                let stavkeFakture: any[] = []
                let greskaLager = ''

                for (let s of stavke) {
                    let proizvod = await Proizvod.findOne({ sifra: s.proizvodId })
                    if (!proizvod) {
                        greskaLager = `Proizvod ${s.proizvodId} nije pronađen`
                        break
                    }
                    if ((proizvod.kolicinaNaLageru || 0) < s.kolicina) {
                        greskaLager = `Nema dovoljno proizvoda ${s.nazivProizvoda} na stanju (dostupno: ${proizvod.kolicinaNaLageru || 0})`
                        break
                    }
                    let iznos = s.cena * s.kolicina
                    ukupanIznos += iznos
                    stavkeFakture.push({
                        sifra: s.proizvodId,
                        naziv: s.nazivProizvoda,
                        kolicina: s.kolicina,
                        tipStampe: s.tipStampe,
                        boja: s.boja,
                        tekst: s.tekst || '',   // N-2: tekst za štampu stiže na fakturu (vidi ga štampar)
                        jedinicnaCena: s.cena,
                        iznos: iznos
                    })
                }

                if (greskaLager) {
                    res.json({ message: greskaLager })
                    return
                }

                // Auto-increment ID fakture
                let maxFaktura = await Faktura.findOne({}).sort({ idFakture: -1 }).lean()
                let noviId = 'F-2026-001'
                if (maxFaktura && maxFaktura.idFakture) {
                    let broj = parseInt(maxFaktura.idFakture.split('-')[2]) + 1
                    noviId = `F-2026-${String(broj).padStart(3, '0')}`
                }

                // Pronađi podatke o štampariji
                let stamparija = await Korisnik.findOne({ korisnickoIme: stamparijaId })
                let nazivStamparije = stamparija ? stamparija.nazivInstitucije : stamparijaId
                let grad = stamparija ? stamparija.grad : ''

                // Kreiraj fakturu
                let faktura = new Faktura({
                    idFakture: noviId,
                    klijentId: klijentId,
                    klijentIme: `${klijent.ime} ${klijent.prezime}`,
                    stamparijaId: stamparijaId,
                    nazivStamparije: nazivStamparije,
                    grad: grad,
                    stavke: stavkeFakture,
                    ukupanIznos: ukupanIznos,
                    datumIzdavanja: new Date(),
                    status: 'naruceno'
                })
                await faktura.save()

                // Smanji lager
                for (let s of stavke) {
                    await Proizvod.findOneAndUpdate(
                        { sifra: s.proizvodId },
                        { $inc: { kolicinaNaLageru: -s.kolicina } }
                    )
                }

                faktureKreirane.push({
                    idFakture: noviId,
                    nazivStamparije: nazivStamparije,
                    ukupanIznos: ukupanIznos
                })

                // 6. Generiši PDF i pošalji email
                try {
                    let pdfBuffer = await generisiPdfFakturu({
                        idFakture: noviId,
                        nazivStamparije: nazivStamparije,
                        grad: grad,
                        klijentIme: `${klijent.ime} ${klijent.prezime}`,
                        datumIzdavanja: new Date(),
                        stavke: stavkeFakture,
                        ukupanIznos: ukupanIznos
                    })
                    if (klijent.email) {
                        // Namerno se čeka odgovor `sendMail`-a, da bi odgovor API-ja
                        // mogao da kaže da li je i-mejl stvarno otišao (do sada se to nije znalo)
                        emailPrimaoca = klijent.email
                        emailovaUkupno++
                        if (await posaljiFakturuEmail(klijent.email, `${klijent.ime} ${klijent.prezime}`, noviId, pdfBuffer)) {
                            emailovaPoslato++
                        }
                    }
                } catch (err) {
                    console.log('Greška pri generisanju PDF-a:', err)
                }
            }

            // 5. Obriši korpu
            korpa.stavke = []
            await korpa.save()

            res.json({
                message: 'Uspešno poručeno',
                fakture: faktureKreirane,
                // true samo ako su svi pokušani i-mejlovi stvarno poslati
                emailPoslat: emailovaUkupno > 0 && emailovaPoslato == emailovaUkupno,
                emailPrimaoca: emailPrimaoca
            })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }
}
