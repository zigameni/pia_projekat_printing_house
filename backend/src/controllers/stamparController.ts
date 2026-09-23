import express from 'express'
import Proizvod from '../models/proizvodi'
import Kategorija from '../models/kategorije'
import Korisnik from '../models/korisnici'
import Faktura from '../models/fakture'
import { upload } from '../middlewares/upload'
import { obrisiFajl } from '../utils/imageUtils'

export class StamparController {

    // ==== Faza 7: svi proizvodi štampara (uključujući neaktivne i one bez zaliha) ====
    proizvodiStamparije = (req: express.Request, res: express.Response) => {
        const stamparijaId = (req.query.stamparijaId || '').toString().trim()
        if (!stamparijaId) {
            res.json({ message: 'Nedostaje stamparijaId' })
            return
        }

        Proizvod.find({ stamparijaId: stamparijaId }).then((proizvodi: any[]) => {
            let result = proizvodi.map((p: any) => this.oblikujProizvod(p))
            result.sort((a: any, b: any) => a.sifra.localeCompare(b.sifra))
            res.json(result)
        }).catch((err) => {
            console.log(err)
            res.json([])
        })
    }

    // ==== Sve predefinisane kategorije sa potkategorijama (spec 4.2) ====
    // Namerno novo: `kategorijeZaPretragu` vraća samo kategorije koje imaju aktivne
    // proizvode na stanju, pa ne bi prikazalo npr. "Zahvalnice" ili "Fototapete".
    kategorije = (req: express.Request, res: express.Response) => {
        Kategorija.find({}).then((kategorije: any[]) => {
            let result = kategorije.map((k: any) => ({
                naziv: k.naziv,
                potkategorije: k.potkategorije || []
            }))
            result.sort((a: any, b: any) => a.naziv.localeCompare(b.naziv))
            res.json(result)
        }).catch((err) => {
            console.log(err)
            res.json([])
        })
    }

    // ==== Dodavanje proizvoda (multipart — opciona slika) ====
    dodajProizvod = (req: express.Request, res: express.Response) => {
        upload.single('slika')(req, res, (err: any) => {
            if (err) {
                res.json({
                    message: err.code == 'LIMIT_FILE_SIZE' ? 'Slika je prevelika (maks. 5MB)' : err.message
                }); return
            }
            this.obradiDodavanje(req, res)
        })
    }

    private obradiDodavanje = async (req: express.Request, res: express.Response) => {
        try {
            // Štamparija se čita iz baze — nazivStamparije i grad se NE uzimaju iz zahteva
            const stamparijaId = (req.body.stamparijaId || '').toString().trim()
            const stamparija = await Korisnik.findOne({ korisnickoIme: stamparijaId })
            if (!stamparija || stamparija.tip != 'stampar') {
                obrisiFajl(req.file?.path)
                res.json({ message: 'Štamparija nije pronađena' }); return
            }

            // Obavezna polja
            const obaveznaTekstualna = ['sifra', 'naziv', 'opis', 'kategorija', 'potkategorija']
            let nedostaje = obaveznaTekstualna.some((p) => !req.body[p] || !req.body[p].toString().trim())
            if (req.body.jedinicnaCena === undefined || req.body.jedinicnaCena === '') nedostaje = true
            if (req.body.kolicinaNaLageru === undefined || req.body.kolicinaNaLageru === '') nedostaje = true
            if (nedostaje) {
                obrisiFajl(req.file?.path)
                res.json({ message: 'Sva obavezna polja moraju biti popunjena' }); return
            }

            const sifra = req.body.sifra.toString().trim()

            // Šifra je jedinstvena globalno, ne samo unutar štampara
            const postojiSifra = await Proizvod.findOne({ sifra: sifra })
            if (postojiSifra) {
                obrisiFajl(req.file?.path)
                res.json({ message: 'Proizvod sa tom šifrom već postoji' }); return
            }

            // Kategorija i potkategorija moraju postojati u kolekciji `kategorije`
            const kategorijaDb = await Kategorija.findOne({ naziv: req.body.kategorija })
            const potkategorije: any[] = kategorijaDb ? (kategorijaDb.potkategorije || []) : []
            if (!kategorijaDb || potkategorije.indexOf(req.body.potkategorija) == -1) {
                obrisiFajl(req.file?.path)
                res.json({ message: 'Izabrana kategorija ili potkategorija ne postoji' }); return
            }

            const jedinicnaCena = Number(req.body.jedinicnaCena)
            if (isNaN(jedinicnaCena)) {
                obrisiFajl(req.file?.path)
                res.json({ message: 'Cena mora biti broj' }); return
            }
            if (jedinicnaCena < 0) {
                obrisiFajl(req.file?.path)
                res.json({ message: 'Cena ne može biti negativna' }); return
            }

            const kolicinaNaLageru = Number(req.body.kolicinaNaLageru)
            if (isNaN(kolicinaNaLageru)) {
                obrisiFajl(req.file?.path)
                res.json({ message: 'Količina mora biti broj' }); return
            }
            if (!Number.isInteger(kolicinaNaLageru)) {
                obrisiFajl(req.file?.path)
                res.json({ message: 'Količina mora biti ceo broj' }); return
            }
            if (kolicinaNaLageru < 0) {
                obrisiFajl(req.file?.path)
                res.json({ message: 'Količina ne može biti negativna' }); return
            }

            // Usluge štampe dolaze kao JSON string (FormData ne nosi ugnježdene objekte)
            let usluge: any[] = []
            if (req.body.uslugeStampe) {
                try {
                    usluge = JSON.parse(req.body.uslugeStampe)
                } catch (e) {
                    obrisiFajl(req.file?.path)
                    res.json({ message: 'Neispravni podaci o uslugama štampe' }); return
                }
                if (!Array.isArray(usluge)) {
                    obrisiFajl(req.file?.path)
                    res.json({ message: 'Neispravni podaci o uslugama štampe' }); return
                }
                for (let u of usluge) {
                    if (!u || !u.tipStampe || !u.tipStampe.toString().trim()) {
                        obrisiFajl(req.file?.path)
                        res.json({ message: 'Neispravni podaci o uslugama štampe' }); return
                    }
                    const dodatna = Number(u.dodatnaCenaPoKomadu === undefined ? 0 : u.dodatnaCenaPoKomadu)
                    if (isNaN(dodatna) || dodatna < 0) {
                        obrisiFajl(req.file?.path)
                        res.json({ message: 'Dodatna cena usluge ne može biti negativna' }); return
                    }
                }
            }

            // `idUsluge` se generiše ako nije poslat — koristi se samo kao ključ unutar tog proizvoda
            const uslugeZaCuvanje = usluge.map((u: any, i: number) => ({
                idUsluge: (u.idUsluge && u.idUsluge.toString().trim())
                    ? u.idUsluge.toString().trim()
                    : 'USL-' + String(i + 1).padStart(2, '0'),
                tipStampe: u.tipStampe.toString().trim(),
                dodatnaCenaPoKomadu: Number(u.dodatnaCenaPoKomadu === undefined ? 0 : u.dodatnaCenaPoKomadu),
                maxSirinaMm: Number(u.maxSirinaMm) || 0,
                maxVisinaMm: Number(u.maxVisinaMm) || 0
            }))

            // Boje: JSON niz, ili lista odvojena zapetom
            let dostupneBoje: string[] = []
            if (req.body.dostupneBoje) {
                const tekst = req.body.dostupneBoje.toString()
                try {
                    const parsed = JSON.parse(tekst)
                    if (Array.isArray(parsed)) {
                        dostupneBoje = parsed.map((b: any) => b.toString().trim()).filter((b: string) => b != '')
                    }
                } catch (e) {
                    dostupneBoje = tekst.split(',').map((b: string) => b.trim()).filter((b: string) => b != '')
                }
            }

            const proizvod = new Proizvod({
                stamparijaId: stamparija.korisnickoIme,
                nazivStamparije: stamparija.nazivInstitucije || stamparija.korisnickoIme,
                grad: stamparija.grad || '',
                sifra: sifra,
                naziv: req.body.naziv.toString().trim(),
                opis: req.body.opis.toString(),
                kategorija: req.body.kategorija.toString(),
                potkategorija: req.body.potkategorija.toString(),
                jedinicnaCena: jedinicnaCena,
                kolicinaNaLageru: kolicinaNaLageru,
                dostupneBoje: dostupneBoje,
                slikaUrl: req.file ? req.file.filename : '',
                dodatneSlike: [],
                uslugeStampe: uslugeZaCuvanje,
                aktivan: true
            })

            await proizvod.save()
            res.json({ message: 'Uspešno dodat proizvod', proizvod: this.oblikujProizvod(proizvod) })
        } catch (err) {
            console.log(err)
            obrisiFajl(req.file?.path)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Faza 7: ažuriranje količine na lageru (spec 4.3) ====
    azurirajKolicinu = async (req: express.Request, res: express.Response) => {
        try {
            const stamparijaId = (req.body.stamparijaId || '').toString().trim()
            const sifra = (req.body.sifra || '').toString().trim()
            if (!stamparijaId || !sifra || req.body.kolicinaNaLageru === undefined || req.body.kolicinaNaLageru === '') {
                res.json({ message: 'Sva obavezna polja moraju biti popunjena' }); return
            }

            // Iste poruke kao pri dodavanju proizvoda — nema dva teksta za istu grešku
            const kolicinaNaLageru = Number(req.body.kolicinaNaLageru)
            if (isNaN(kolicinaNaLageru)) {
                res.json({ message: 'Količina mora biti broj' }); return
            }
            if (!Number.isInteger(kolicinaNaLageru)) {
                res.json({ message: 'Količina mora biti ceo broj' }); return
            }
            if (kolicinaNaLageru < 0) {
                res.json({ message: 'Količina ne može biti negativna' }); return
            }

            // Proizvod mora postojati I pripadati tom štamparu.
            // Namerno jedan upit i jedna poruka — ne odaje se čija šifra postoji.
            const proizvod = await Proizvod.findOne({ sifra: sifra, stamparijaId: stamparijaId })
            if (!proizvod) {
                res.json({ message: 'Proizvod nije pronađen' }); return
            }

            // Menja se samo količina — ostatak proizvoda ostaje netaknut
            proizvod.kolicinaNaLageru = kolicinaNaLageru
            await proizvod.save()

            res.json({ message: 'Količina je ažurirana', proizvod: this.oblikujProizvod(proizvod) })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Faza 7: narudžbine (fakture) štampara (spec 4.5) ====
    narudzbineStamparije = async (req: express.Request, res: express.Response) => {
        const stamparijaId = (req.query.stamparijaId || '').toString().trim()
        if (!stamparijaId) {
            res.json({ message: 'Nedostaje stamparijaId' })
            return
        }

        try {
            const fakture = await Faktura.find({ stamparijaId: stamparijaId }).sort({ datumIzdavanja: -1 })
            let result: any[] = []
            for (let f of fakture) {
                result.push(await this.oblikujNarudzbinu(f))
            }
            res.json(result)
        } catch (err) {
            console.log(err)
            res.json([])
        }
    }

    // ==== Promena statusa narudžbine — jedan korak napred, samo fizička lica (spec 4.5) ====
    promeniStatusNarudzbine = async (req: express.Request, res: express.Response) => {
        try {
            const idFakture = (req.body.idFakture || '').toString().trim()
            const stamparijaId = (req.body.stamparijaId || '').toString().trim()
            const noviStatus = (req.body.noviStatus || '').toString().trim()
            if (!idFakture || !stamparijaId || !noviStatus) {
                res.json({ message: 'Sva obavezna polja moraju biti popunjena' }); return
            }

            // Faktura mora postojati I pripadati tom štamparu.
            // Namerno jedan upit i jedna poruka — ne odaje se čija faktura postoji.
            const faktura = await Faktura.findOne({ idFakture: idFakture, stamparijaId: stamparijaId })
            if (!faktura) {
                res.json({ message: 'Faktura nije pronađena' }); return
            }

            // Za pravna lica status se menja kroz javne nabavke (spec 4.5 i 3.6)
            const klijent = await Korisnik.findOne({ korisnickoIme: faktura.klijentId })
            if (klijent && klijent.vrsta == 'pravno') {
                res.json({ message: 'Status narudžbina pravnih lica menja se kroz javne nabavke' }); return
            }

            // Dozvoljen je samo sledeći korak po lancu
            const trenutniStatus = (faktura.status || '').toString()
            if (this.sledeciStatus(trenutniStatus) != noviStatus) {
                res.json({ message: 'Nedozvoljena promena statusa' }); return
            }

            faktura.status = noviStatus
            await faktura.save()

            res.json({
                message: 'Status je promenjen na „' + noviStatus + '“',
                faktura: await this.oblikujNarudzbinu(faktura)
            })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // Dozvoljen je samo korak napred: naruceno -> u stampi -> isporuceno.
    // `primljeno` je isključivo klijentska akcija (Faza 5), a `placeno` se u aplikaciji
    // nigde ne dodeljuje — zato nijedno od njih nema sledeći korak.
    private sledeciStatus = (status: string): string => {
        if (status == 'naruceno') return 'u stampi'
        if (status == 'u stampi') return 'isporuceno'
        return ''
    }

    // Oblik fakture koji vidi štampar — vrstaKlijenta i mozePromenitiStatus računa server
    private oblikujNarudzbinu = async (f: any) => {
        const klijent = await Korisnik.findOne({ korisnickoIme: f.klijentId })
        const vrstaKlijenta = klijent && klijent.vrsta ? klijent.vrsta : 'nepoznato'
        return {
            idFakture: f.idFakture,
            klijentId: f.klijentId,
            klijentIme: f.klijentIme,
            stamparijaId: f.stamparijaId,
            nazivStamparije: f.nazivStamparije,
            grad: f.grad,
            stavke: f.stavke || [],
            ukupanIznos: f.ukupanIznos,
            datumIzdavanja: f.datumIzdavanja,
            status: f.status,
            vrstaKlijenta: vrstaKlijenta,
            mozePromenitiStatus: vrstaKlijenta != 'pravno' && this.sledeciStatus(f.status) != ''
        }
    }

    // Isti oblik odgovora za listu i za novo-dodati proizvod
    private oblikujProizvod = (p: any) => {
        return {
            sifra: p.sifra,
            naziv: p.naziv,
            opis: p.opis,
            kategorija: p.kategorija,
            potkategorija: p.potkategorija,
            jedinicnaCena: p.jedinicnaCena,
            kolicinaNaLageru: p.kolicinaNaLageru,
            dostupneBoje: p.dostupneBoje || [],
            slikaUrl: p.slikaUrl || '',
            dodatneSlike: p.dodatneSlike || [],
            uslugeStampe: p.uslugeStampe || [],
            aktivan: p.aktivan,
            stamparijaId: p.stamparijaId,
            nazivStamparije: p.nazivStamparije,
            grad: p.grad
        }
    }
}
