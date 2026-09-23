import express from 'express'
import Proizvod from '../models/proizvodi'
import Komentar from '../models/komentari'
import Korisnik from '../models/korisnici'
import Faktura from '../models/fakture'

export class ProizvodiController {

    // ==== Broj aktivnih štamparija (početna strana) ====
    brojStamparija = (req: express.Request, res: express.Response) => {
        Korisnik.countDocuments({ tip: 'stampar', status: 'aktivan' }).then((broj: number) => {
            res.json({ broj: broj })
        }).catch((err) => {
            console.log(err)
            res.json({ broj: 0 })
        })
    }

    // ==== TOP 5 proizvoda po broju sviđanja (početna strana) ====
    top5Proizvoda = (req: express.Request, res: express.Response) => {
        Komentar.aggregate([
            { $match: { ocena: 'svidja' } },
            { $group: { _id: '$proizvodId', brojSvidjanja: { $sum: 1 } } },
            { $sort: { brojSvidjanja: -1 } },
            { $limit: 5 }
        ]).then((rezultat: any[]) => {
            Proizvod.find({}).then((proizvodi: any[]) => {
                let result: any[] = []
                for (let r of rezultat) {
                    let p = proizvodi.find((p: any) => p.sifra == r._id)
                    if (p && p.aktivan && p.kolicinaNaLageru > 0) {
                        result.push({
                            sifra: p.sifra,
                            naziv: p.naziv,
                            nazivStamparije: p.nazivStamparije,
                            grad: p.grad,
                            jedinicnaCena: p.jedinicnaCena,
                            slikaUrl: p.slikaUrl,
                            brojSvidjanja: r.brojSvidjanja
                        })
                    }
                }
                res.json(result)
            }).catch((err) => {
                console.log(err)
                res.json([])
            })
        }).catch((err) => {
            console.log(err)
            res.json([])
        })
    }

    // ==== Kategorije koje imaju aktivne proizvode na stanju (dropdown) ====
    kategorijeZaPretragu = (req: express.Request, res: express.Response) => {
        Proizvod.find({ aktivan: true, kolicinaNaLageru: { $gt: 0 } }).then((proizvodi: any[]) => {
            let kategorije: string[] = []
            for (let p of proizvodi) {
                if (kategorije.indexOf(p.kategorija) == -1) kategorije.push(p.kategorija)
            }
            res.json(kategorije)
        }).catch((err) => {
            console.log(err)
            res.json([])
        })
    }

    // ==== Gradovi i štamparije koji imaju aktivne proizvode na stanju (filteri) ====
    gradoviIStamparije = (req: express.Request, res: express.Response) => {
        Proizvod.find({ aktivan: true, kolicinaNaLageru: { $gt: 0 } }).then((proizvodi: any[]) => {
            let gradovi: string[] = []
            let stamparije: any[] = []
            for (let p of proizvodi) {
                if (p.grad && gradovi.indexOf(p.grad) == -1) gradovi.push(p.grad)
                if (p.stamparijaId && !stamparije.some((s: any) => s.id == p.stamparijaId)) {
                    stamparije.push({ id: p.stamparijaId, naziv: p.nazivStamparije })
                }
            }
            gradovi.sort((a, b) => a.localeCompare(b))
            stamparije.sort((a, b) => a.naziv.localeCompare(b.naziv))
            res.json({ gradovi: gradovi, stamparije: stamparije })
        }).catch((err) => {
            console.log(err)
            res.json({ gradovi: [], stamparije: [] })
        })
    }

    // ==== Pretraga: naziv (podstring) i/ili kategorija/grad/štamparija ====
    pretragaProizvoda = (req: express.Request, res: express.Response) => {
        const naziv = (req.query.naziv || '').toString().trim().toLowerCase()
        const kategorija = (req.query.kategorija || '').toString().trim()
        const grad = (req.query.grad || '').toString().trim()
        const stamparija = (req.query.stamparija || '').toString().trim()
        Proizvod.find({ aktivan: true, kolicinaNaLageru: { $gt: 0 } }).then((proizvodi: any[]) => {
            let result: any[] = []
            for (let p of proizvodi) {
                if (kategorija && p.kategorija != kategorija) continue
                if (grad && p.grad != grad) continue
                if (stamparija && p.stamparijaId != stamparija) continue
                if (naziv && p.naziv.toLowerCase().indexOf(naziv) == -1) continue
                result.push({
                    sifra: p.sifra,
                    naziv: p.naziv,
                    nazivStamparije: p.nazivStamparije,
                    grad: p.grad,
                    jedinicnaCena: p.jedinicnaCena,
                    kolicinaNaLageru: p.kolicinaNaLageru,
                    slikaUrl: p.slikaUrl
                })
            }
            res.json(result)
        }).catch((err) => {
            console.log(err)
            res.json([])
        })
    }

    // ==== Detalji proizvoda + brojevi sviđanja/nesviđanja (javno) ====
    detaljiProizvoda = (req: express.Request, res: express.Response) => {
        const sifra = req.params.sifra
        Proizvod.findOne({ sifra: sifra }).then((p: any) => {
            if (!p) { res.json({ message: 'Proizvod nije pronađen' }); return }
            Komentar.aggregate([
                { $match: { proizvodId: sifra } },
                { $group: { _id: '$ocena', broj: { $sum: 1 } } }
            ]).then((ocene: any[]) => {
                let svidjanja = 0, nesvidjanja = 0
                for (let o of ocene) {
                    if (o._id == 'svidja') svidjanja = o.broj
                    else if (o._id == 'ne_svidja') nesvidjanja = o.broj
                }
                res.json({
                    sifra: p.sifra,
                    naziv: p.naziv,
                    opis: p.opis,
                    kategorija: p.kategorija,
                    potkategorija: p.potkategorija,
                    jedinicnaCena: p.jedinicnaCena,
                    kolicinaNaLageru: p.kolicinaNaLageru,
                    dostupneBoje: p.dostupneBoje || [],
                    slikaUrl: p.slikaUrl,
                    dodatneSlike: p.dodatneSlike || [],
                    uslugeStampe: p.uslugeStampe || [],
                    nazivStamparije: p.nazivStamparije,
                    grad: p.grad,
                    brojSvidjanja: svidjanja,
                    brojNesvidjanja: nesvidjanja
                })
            }).catch((err) => {
                console.log(err)
                res.json({ message: 'Greška na serveru' })
            })
        }).catch((err) => {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        })
    }

    // ==== Detalji proizvoda za klijenta (dodatne info o štampariji + narudžbine) ====
    detaljiProizvodaKlijent = (req: express.Request, res: express.Response) => {
        const sifra = req.params.sifra
        Proizvod.findOne({ sifra: sifra }).then((p: any) => {
            if (!p) { res.json({ message: 'Proizvod nije pronađen' }); return }

            // Broj sviđanja/nesviđanja
            Komentar.aggregate([
                { $match: { proizvodId: sifra } },
                { $group: { _id: '$ocena', broj: { $sum: 1 } } }
            ]).then((ocene: any[]) => {
                let svidjanja = 0, nesvidjanja = 0
                for (let o of ocene) {
                    if (o._id == 'svidja') svidjanja = o.broj
                    else if (o._id == 'ne_svidja') nesvidjanja = o.broj
                }

                // Podaci o štampariji za mapu
                Korisnik.findOne({ korisnickoIme: p.stamparijaId }).then((stamparija: any) => {
                    let stamparijaInfo: any = null
                    if (stamparija) {
                        stamparijaInfo = {
                            nazivInstitucije: stamparija.nazivInstitucije,
                            adresa: stamparija.adresa || '',
                            grad: stamparija.grad,
                            telefon: stamparija.telefon,
                            email: stamparija.email,
                            maticniBroj: stamparija.maticniBroj,
                            pib: stamparija.pib,
                            slika: stamparija.slika
                        }
                    }

                    // Poslednjih 5 komentara za ovaj proizvod
                    Komentar.find({ proizvodId: sifra })
                        .sort({ datum: -1 })
                        .limit(5)
                        .then((komentari: any[]) => {
                            res.json({
                                sifra: p.sifra,
                                naziv: p.naziv,
                                opis: p.opis,
                                kategorija: p.kategorija,
                                potkategorija: p.potkategorija,
                                jedinicnaCena: p.jedinicnaCena,
                                kolicinaNaLageru: p.kolicinaNaLageru,
                                dostupneBoje: p.dostupneBoje || [],
                                slikaUrl: p.slikaUrl,
                                dodatneSlike: p.dodatneSlike || [],
                                uslugeStampe: p.uslugeStampe || [],
                                nazivStamparije: p.nazivStamparije,
                                grad: p.grad,
                                brojSvidjanja: svidjanja,
                                brojNesvidjanja: nesvidjanja,
                                stamparijaInfo: stamparijaInfo,
                                komentari: komentari.map((k: any) => ({
                                    korisnickoIme: k.korisnickoIme,
                                    datum: k.datum,
                                    tekst: k.tekst,
                                    ocena: k.ocena
                                }))
                            })
                        }).catch((err) => {
                            console.log(err)
                            res.json({ message: 'Greška na serveru' })
                        })
                }).catch((err) => {
                    console.log(err)
                    res.json({ message: 'Greška na serveru' })
                })
            }).catch((err) => {
                console.log(err)
                res.json({ message: 'Greška na serveru' })
            })
        }).catch((err) => {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        })
    }
}