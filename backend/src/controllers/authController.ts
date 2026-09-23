import express from 'express'
import bcrypt from 'bcrypt'
import Korisnik from '../models/korisnici'
import { upload } from '../middlewares/upload'
import { proveriDimenzijeSlike, obrisiFajl } from '../utils/imageUtils'
import { bezLozinke } from '../utils/korisnikUtils'

export class AuthController {

    // ==== Prijava (klijenti i štampari) ====
    login = (req: express.Request, res: express.Response) => {
        const korisnickoIme = req.body.korisnickoIme
        const lozinka = req.body.lozinka
        Korisnik.findOne({ korisnickoIme: korisnickoIme }).then((k: any) => {
            if (!k) { res.json({ message: 'Pogrešno korisničko ime ili lozinka' }); return }
            // Administrator ima posebnu formu na posebnoj ruti (nije javno vidljiva)
            if (k.tip == 'admin') {
                res.json({ message: 'Administratori se prijavljuju na posebnoj administratorskoj strani' }); return
            }
            if (k.status != 'aktivan') {
                res.json({ message: 'Nalog nije odobren od strane administratora' }); return
            }
            bcrypt.compare(lozinka, k.lozinka).then((ispravna: boolean) => {
                if (!ispravna) { res.json({ message: 'Pogrešno korisničko ime ili lozinka' }); return }
                res.json({ message: 'Uspešno', user: bezLozinke(k) })
            }).catch((err) => {
                console.log(err)
                res.json({ message: 'Greška pri proveri lozinke' })
            })
        }).catch((err) => {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        })
    }

    // ==== Prijava administratora (posebna ruta) ====
    loginAdmin = (req: express.Request, res: express.Response) => {
        const korisnickoIme = req.body.korisnickoIme
        const lozinka = req.body.lozinka
        Korisnik.findOne({ korisnickoIme: korisnickoIme }).then((k: any) => {
            if (!k) { res.json({ message: 'Pogrešno korisničko ime ili lozinka' }); return }
            if (k.tip != 'admin') { res.json({ message: 'Nemate pristup administrativnom panelu' }); return }
            if (k.status != 'aktivan') {
                res.json({ message: 'Nalog nije odobren od strane administratora' }); return
            }
            bcrypt.compare(lozinka, k.lozinka).then((ispravna: boolean) => {
                if (!ispravna) { res.json({ message: 'Pogrešno korisničko ime ili lozinka' }); return }
                res.json({ message: 'Uspešno', user: bezLozinke(k) })
            }).catch((err) => {
                console.log(err)
                res.json({ message: 'Greška pri proveri lozinke' })
            })
        }).catch((err) => {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        })
    }

    // ==== Registracije (multer obrađuje opcionu profilnu sliku) ====
    registracijaFizickoLice = (req: express.Request, res: express.Response) => {
        this.uploadSlika(req, res, () => {
            this.obradiRegistraciju(req, res, 'klijent', 'fizicko', 'aktivan', false)
        })
    }

    registracijaPravnoLice = (req: express.Request, res: express.Response) => {
        this.uploadSlika(req, res, () => {
            this.obradiRegistraciju(req, res, 'klijent', 'pravno', 'na_cekanju', true)
        })
    }

    registracijaStampara = (req: express.Request, res: express.Response) => {
        this.uploadSlika(req, res, () => {
            this.obradiRegistraciju(req, res, 'stampar', '', 'na_cekanju', true)
        })
    }

    // ==== Zajednički upload profilne slike ====
    private uploadSlika = (req: express.Request, res: express.Response, sledece: () => void) => {
        upload.single('slika')(req, res, (err: any) => {
            if (err) {
                res.json({
                    message: err.code == 'LIMIT_FILE_SIZE' ? 'Slika je prevelika (maks. 5MB)' : err.message
                }); return
            }
            sledece()
        })
    }

    // ==== Zajednička obrada registracije ====
    private obradiRegistraciju = async (
        req: express.Request, res: express.Response,
        tip: string, vrsta: string, pocetniStatus: string, zahtevaInstituciju: boolean
    ) => {
        try {
            const greske = await this.validiraj(req.body, tip, zahtevaInstituciju)
            if (greske.length > 0) { obrisiFajl(req.file?.path); res.json({ message: greske.join('; ') }); return }

            let slika = 'default_profile_image.jpg'
            if (req.file) {
                const ispravna = await proveriDimenzijeSlike(req.file.path)
                if (!ispravna) {
                    obrisiFajl(req.file.path)
                    res.json({ message: 'Slika mora biti između 100x100 i 250x250 px' }); return
                }
                slika = req.file.filename
            }

            const hash = await bcrypt.hash(req.body.lozinka, 10)
            const korisnik = new Korisnik({
                korisnickoIme: req.body.korisnickoIme,
                lozinka: hash,
                ime: req.body.ime,
                prezime: req.body.prezime,
                telefon: req.body.telefon,
                email: req.body.email,
                tip: tip,
                vrsta: vrsta,
                slika: slika,
                status: pocetniStatus,
                nazivInstitucije: req.body.nazivInstitucije || '',
                adresa: req.body.adresa || '',
                grad: req.body.grad || '',
                maticniBroj: req.body.maticniBroj || '',
                pib: req.body.pib || ''
            })
            await korisnik.save()
            const poruka = pocetniStatus == 'aktivan'
                ? 'Uspešno ste se registrovali'
                : 'Zahtev za registraciju je poslat na odobrenje administratora'
            res.json({ message: poruka })
        } catch (err) {
            console.log(err)
            obrisiFajl(req.file?.path)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Server-side validacije ====
    private validiraj = async (podaci: any, tip: string, zahtevaInstituciju: boolean) => {
        let greske: string[] = []
        // 8-12 karaktera, bar jedno veliko slovo, jedan broj, jedan specijalni karakter, počinje slovom
        const lozinkaRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[A-Za-z][A-Za-z0-9@#$%^&+=!._\-]{7,11}$/
        const emailRegex = /^\S+@\S+\.\S+$/

        if (!podaci.korisnickoIme || podaci.korisnickoIme.trim().length < 3)
            greske.push('Korisničko ime mora imati bar 3 karaktera')
        if (!lozinkaRegex.test(podaci.lozinka || ''))
            greske.push('Lozinka: 8-12 karaktera, bar jedno veliko slovo, jedan broj i jedan specijalni karakter, mora počinjati slovom')
        if (!podaci.ime || !podaci.ime.trim()) greske.push('Ime je obavezno')
        if (!podaci.prezime || !podaci.prezime.trim()) greske.push('Prezime je obavezno')
        if (!podaci.telefon || !podaci.telefon.trim()) greske.push('Kontakt telefon je obavezan')
        if (!emailRegex.test(podaci.email || '')) greske.push('I-mejl adresa nije ispravna')
        if (zahtevaInstituciju) {
            if (!podaci.nazivInstitucije || !podaci.nazivInstitucije.trim())
                greske.push('Naziv institucije je obavezan')
            if (!podaci.adresa || !podaci.adresa.trim()) greske.push('Adresa sedišta je obavezna')
            if (!/^\d{8}$/.test(podaci.maticniBroj || ''))
                greske.push('Matični broj mora imati tačno 8 cifara')
            if (!/^[1-9]\d{8}$/.test(podaci.pib || ''))
                greske.push('PIB mora imati 9 cifara i ne sme počinjati nulom')
        }
        if (tip == 'stampar' && (!podaci.grad || !podaci.grad.trim()))
            greske.push('Grad je obavezan')

        if (greske.length == 0) {
            const postojeci = await Korisnik.findOne({
                $or: [{ korisnickoIme: podaci.korisnickoIme }, { email: podaci.email }]
            })
            if (postojeci) greske.push('Korisničko ime ili i-mejl adresa su već zauzeti')
            if (zahtevaInstituciju) {
                const inst = await Korisnik.findOne({
                    $or: [{ maticniBroj: podaci.maticniBroj }, { pib: podaci.pib }]
                })
                if (inst) greske.push('Matični broj ili PIB su već registrovani')
            }
        }
        return greske
    }
}