import express from 'express'
import Korisnik from '../models/korisnici'
import { upload } from '../middlewares/upload'
import { proveriDimenzijeSlike, obrisiFajl } from '../utils/imageUtils'
import { bezLozinke } from '../utils/korisnikUtils'

export class KorisniciController {

    // ==== Ažuriranje profila (multipart — opciona nova slika) ====
    azurirajProfil = (req: express.Request, res: express.Response) => {
        upload.single('slika')(req, res, (err: any) => {
            if (err) {
                res.json({
                    message: err.code == 'LIMIT_FILE_SIZE' ? 'Slika je prevelika (maks. 5MB)' : err.message
                }); return
            }
            this.obradiAzuriranje(req, res)
        })
    }

    private obradiAzuriranje = async (req: express.Request, res: express.Response) => {
        try {
            const korisnik = await Korisnik.findOne({ korisnickoIme: req.body.korisnickoIme })
            if (!korisnik) { obrisiFajl(req.file?.path); res.json({ message: 'Korisnik ne postoji' }); return }

            const greske = await this.validiraj(req.body, korisnik)
            if (greske.length > 0) {
                obrisiFajl(req.file?.path)
                res.json({ message: greske.join('; ') }); return
            }

            let novaSlika = null
            if (req.file) {
                const ispravna = await proveriDimenzijeSlike(req.file.path)
                if (!ispravna) {
                    obrisiFajl(req.file.path)
                    res.json({ message: 'Slika mora biti između 100x100 i 250x250 px' }); return
                }
                novaSlika = req.file.filename
            }

            // korisnickoIme se NE menja (identifikacija naloga)
            korisnik.ime = req.body.ime
            korisnik.prezime = req.body.prezime
            korisnik.telefon = req.body.telefon
            korisnik.email = req.body.email

            if (korisnik.vrsta == 'pravno' || korisnik.tip == 'stampar') {
                korisnik.nazivInstitucije = req.body.nazivInstitucije
                korisnik.adresa = req.body.adresa
                korisnik.maticniBroj = req.body.maticniBroj
                korisnik.pib = req.body.pib
            }
            if (korisnik.tip == 'stampar') {
                korisnik.grad = req.body.grad
            }

            if (novaSlika) {
                if (korisnik.slika && korisnik.slika != 'default_profile_image.jpg') {
                    obrisiFajl('uploads/' + korisnik.slika)
                }
                korisnik.slika = novaSlika
            }

            await korisnik.save()
            res.json({ message: 'Uspešno', user: bezLozinke(korisnik) })
        } catch (err) {
            console.log(err)
            obrisiFajl(req.file?.path)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Server-side validacije za ažuriranje profila ====
    private validiraj = async (podaci: any, trenutni: any) => {
        let greske: string[] = []
        const emailRegex = /^\S+@\S+\.\S+$/

        if (!podaci.ime || !podaci.ime.trim()) greske.push('Ime je obavezno')
        if (!podaci.prezime || !podaci.prezime.trim()) greske.push('Prezime je obavezno')
        if (!podaci.telefon || !podaci.telefon.trim()) greske.push('Kontakt telefon je obavezan')
        if (!emailRegex.test(podaci.email || '')) greske.push('I-mejl adresa nije ispravna')

        if (trenutni.vrsta == 'pravno' || trenutni.tip == 'stampar') {
            if (!podaci.nazivInstitucije || !podaci.nazivInstitucije.trim())
                greske.push('Naziv institucije je obavezan')
            if (!podaci.adresa || !podaci.adresa.trim()) greske.push('Adresa sedišta je obavezna')
            if (!/^\d{8}$/.test(podaci.maticniBroj || ''))
                greske.push('Matični broj mora imati tačno 8 cifara')
            if (!/^[1-9]\d{8}$/.test(podaci.pib || ''))
                greske.push('PIB mora imati 9 cifara i ne sme počinjati nulom')
        }
        if (trenutni.tip == 'stampar' && (!podaci.grad || !podaci.grad.trim()))
            greske.push('Grad je obavezan')

        if (greske.length == 0) {
            const emailZauzet = await Korisnik.findOne({
                email: podaci.email,
                korisnickoIme: { $ne: trenutni.korisnickoIme }
            })
            if (emailZauzet) greske.push('I-mejl adresa je već zauzeta')

            if (trenutni.vrsta == 'pravno' || trenutni.tip == 'stampar') {
                const instZauzeta = await Korisnik.findOne({
                    $or: [{ maticniBroj: podaci.maticniBroj }, { pib: podaci.pib }],
                    korisnickoIme: { $ne: trenutni.korisnickoIme }
                })
                if (instZauzeta) greske.push('Matični broj ili PIB su već registrovani')
            }
        }
        return greske
    }
}