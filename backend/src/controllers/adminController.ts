import express from 'express'
import Korisnik from '../models/korisnici'
import Proizvod from '../models/proizvodi'
import Kategorija from '../models/kategorije'
import Korpa from '../models/korpa'
import PasswordReset from '../models/passwordReset'
import { bezLozinke } from '../utils/korisnikUtils'
import { obrisiFajl } from '../utils/imageUtils'

const TIPOVI = ['admin', 'klijent', 'stampar']
const STATUSI = ['aktivan', 'neaktivan', 'na_cekanju']
const VRSTE = ['fizicko', 'pravno']

export class AdminController {

    // ==== Pregled svih korisničkih naloga (spec 5.1) ====
    sviKorisnici = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.query.adminId)
            if (!admin) {
                res.json({ message: 'Nemate pristup administrativnom panelu' }); return
            }

            const korisnici = await Korisnik.find({})
            let result = korisnici.map((k: any) => bezLozinke(k))
            // Grupisano po tipu naloga, unutar grupe po korisničkom imenu
            result.sort((a: any, b: any) =>
                a.tip.localeCompare(b.tip) || a.korisnickoIme.localeCompare(b.korisnickoIme))
            res.json(result)
        } catch (err) {
            console.log(err)
            res.json([])
        }
    }

    // ==== Ažuriranje tuđeg naloga — podaci + status + tip (spec 5.1) ====
    azurirajKorisnika = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.body.adminId)
            if (!admin) {
                res.json({ message: 'Nemate pristup administrativnom panelu' }); return
            }

            const korisnickoIme = (req.body.korisnickoIme || '').toString().trim()
            if (!korisnickoIme) {
                res.json({ message: 'Nedostaje korisničko ime' }); return
            }

            const korisnik = await Korisnik.findOne({ korisnickoIme: korisnickoIme })
            if (!korisnik) {
                res.json({ message: 'Korisnik ne postoji' }); return
            }

            const greske = await this.validiraj(req.body, korisnik)
            if (greske.length > 0) {
                res.json({ message: greske.join('; ') }); return
            }

            const tip = req.body.tip.toString()
            const status = req.body.status.toString()
            const vrsta = tip == 'klijent' ? req.body.vrsta.toString() : ''

            // Administrator ne sme sam sebi da ukine pristup panelu
            if (korisnickoIme == admin.korisnickoIme && (tip != 'admin' || status != 'aktivan')) {
                res.json({ message: 'Ne možete ukinuti sopstveni administratorski pristup' }); return
            }

            // korisnickoIme se NE menja — identifikacija naloga (spec 3.1)
            korisnik.ime = req.body.ime.toString().trim()
            korisnik.prezime = req.body.prezime.toString().trim()
            korisnik.telefon = req.body.telefon.toString().trim()
            korisnik.email = req.body.email.toString().trim()
            korisnik.tip = tip
            korisnik.vrsta = vrsta
            korisnik.status = status

            // Podaci firme važe za pravna lica i štampare — kod ostalih se prazne,
            // da posle promene tipa ne ostanu podaci koji tom nalogu više ne pripadaju
            if (vrsta == 'pravno' || tip == 'stampar') {
                korisnik.nazivInstitucije = req.body.nazivInstitucije.toString().trim()
                korisnik.adresa = req.body.adresa.toString().trim()
                korisnik.maticniBroj = req.body.maticniBroj.toString().trim()
                korisnik.pib = req.body.pib.toString().trim()
                korisnik.grad = (req.body.grad || '').toString().trim()
            } else {
                korisnik.nazivInstitucije = ''
                korisnik.adresa = ''
                korisnik.maticniBroj = ''
                korisnik.pib = ''
                korisnik.grad = ''
            }

            await korisnik.save()
            res.json({ message: 'Uspešno', user: bezLozinke(korisnik) })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Brisanje naloga zajedno sa onim što je samo njegovo (spec 5.1) ====
    // Fakture, javne nabavke, ponude i komentari se NE brišu — oni već nose imena
    // i predstavljaju istoriju poslovanja.
    obrisiKorisnika = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.body.adminId)
            if (!admin) {
                res.json({ message: 'Nemate pristup administrativnom panelu' }); return
            }

            const korisnickoIme = (req.body.korisnickoIme || '').toString().trim()
            if (!korisnickoIme) {
                res.json({ message: 'Nedostaje korisničko ime' }); return
            }
            if (korisnickoIme == admin.korisnickoIme) {
                res.json({ message: 'Ne možete obrisati sopstveni nalog' }); return
            }

            const korisnik = await Korisnik.findOne({ korisnickoIme: korisnickoIme })
            if (!korisnik) {
                res.json({ message: 'Korisnik ne postoji' }); return
            }

            const obrisanihProizvoda = await this.obrisiNalog(korisnik)

            res.json({ message: 'Korisnik je obrisan', obrisanihProizvoda: obrisanihProizvoda })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Zahtevi za registraciju (spec 5.1 — poseban pregled neodobrenih) ====
    // Prikazuje samo naloge u statusu `na_cekanju`, jer samo oni čekaju odluku.
    neodobreniKorisnici = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.query.adminId)
            if (!admin) {
                res.json([]); return
            }

            const korisnici = await Korisnik.find({ status: 'na_cekanju' })
            let result = korisnici.map((k: any) => bezLozinke(k))
            // Grupisano po tipu naloga, unutar grupe po korisničkom imenu (kao i pregled svih naloga)
            result.sort((a: any, b: any) =>
                a.tip.localeCompare(b.tip) || a.korisnickoIme.localeCompare(b.korisnickoIme))
            res.json(result)
        } catch (err) {
            console.log(err)
            res.json([])
        }
    }

    // ==== Odobravanje zahteva — nalog prelazi u `aktivan` ====
    odobriKorisnika = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.body.adminId)
            if (!admin) {
                res.json({ message: 'Nemate pristup administrativnom panelu' }); return
            }

            const korisnickoIme = (req.body.korisnickoIme || '').toString().trim()
            if (!korisnickoIme) {
                res.json({ message: 'Nedostaje korisničko ime' }); return
            }

            const korisnik = await Korisnik.findOne({ korisnickoIme: korisnickoIme })
            if (!korisnik) {
                res.json({ message: 'Korisnik ne postoji' }); return
            }
            // Samo zahtev se odobrava; aktivan nalog se menja kroz `azurirajKorisnika`
            if (korisnik.status != 'na_cekanju') {
                res.json({ message: 'Nalog nije u statusu na čekanju' }); return
            }

            korisnik.status = 'aktivan'
            await korisnik.save()

            // Isti oblik odgovora kao `azurirajKorisnika` — red se osvežava iz podataka servera
            res.json({ message: 'Uspešno', user: bezLozinke(korisnik) })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Odbijanje zahteva — zahtev se briše (nalog nikada nije bio aktivan) ====
    // Time se korisničko ime, i-mejl i matični broj/PIB oslobađaju za novu registraciju.
    odbijKorisnika = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.body.adminId)
            if (!admin) {
                res.json({ message: 'Nemate pristup administrativnom panelu' }); return
            }

            const korisnickoIme = (req.body.korisnickoIme || '').toString().trim()
            if (!korisnickoIme) {
                res.json({ message: 'Nedostaje korisničko ime' }); return
            }
            if (korisnickoIme == admin.korisnickoIme) {
                res.json({ message: 'Ne možete obrisati sopstveni nalog' }); return
            }

            const korisnik = await Korisnik.findOne({ korisnickoIme: korisnickoIme })
            if (!korisnik) {
                res.json({ message: 'Korisnik ne postoji' }); return
            }
            // Zaštita: ovuda se sme obrisati SAMO zahtev koji čeka odluku,
            // nikako aktivan nalog (za to postoji `obrisiKorisnika`)
            if (korisnik.status != 'na_cekanju') {
                res.json({ message: 'Odbijaju se samo zahtevi u statusu na čekanju' }); return
            }

            const obrisanihProizvoda = await this.obrisiNalog(korisnik)

            res.json({ message: 'Zahtev je odbijen', obrisanihProizvoda: obrisanihProizvoda })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Upravljanje kategorijama (spec 5.2) ====
    // Sve kategorije sa potkategorijama i brojem proizvoda. Brojevi uključuju i neaktivne
    // proizvode i one bez zaliha — baš oni bi ostali bez kategorije ako bi se obrisala.
    sveKategorije = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.query.adminId)
            if (!admin) {
                res.json([]); return
            }

            const kategorije = await Kategorija.find({})
            // Jedan upit za sve proizvode, pa se broji u memoriji (kolekcija je mala)
            const proizvodi = await Proizvod.find({}, { kategorija: 1, potkategorija: 1 })

            let result = kategorije.map((k: any) => ({
                naziv: k.naziv,
                brojProizvoda: proizvodi.filter((p: any) => p.kategorija == k.naziv).length,
                potkategorije: (k.potkategorije || []).map((p: any) => ({
                    naziv: p,
                    brojProizvoda: proizvodi.filter((x: any) =>
                        x.kategorija == k.naziv && x.potkategorija == p).length
                }))
            }))
            result.sort((a: any, b: any) => a.naziv.localeCompare(b.naziv))
            res.json(result)
        } catch (err) {
            console.log(err)
            res.json([])
        }
    }

    // ==== Dodavanje nove kategorije (spec 5.2) ====
    dodajKategoriju = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.body.adminId)
            if (!admin) {
                res.json({ message: 'Nemate pristup administrativnom panelu' }); return
            }

            const naziv = (req.body.naziv || '').toString().trim()
            if (!naziv) {
                res.json({ message: 'Naziv kategorije je obavezan' }); return
            }

            // Poređenje bez razlike u veličini slova i bez dijakritika — da ne nastanu
            // dve kategorije koje se razlikuju samo po tome (npr. „Kreativne štampe"/„kreativne stampe")
            const sve = await Kategorija.find({})
            const postoji = sve.some((k: any) => this.normalizuj(k.naziv) == this.normalizuj(naziv))
            if (postoji) {
                res.json({ message: 'Kategorija sa tim nazivom već postoji' }); return
            }

            const kategorija = new Kategorija({ naziv: naziv, potkategorije: [] })
            await kategorija.save()

            // Poruka je namerno bez naziva — ime u poruci sastavlja frontend
            // (isto kao „Uspešno" kod ažuriranja naloga)
            res.json({ message: 'Kategorija je dodata' })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Dodavanje potkategorije u postojeću kategoriju (spec 5.2) ====
    dodajPotkategoriju = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.body.adminId)
            if (!admin) {
                res.json({ message: 'Nemate pristup administrativnom panelu' }); return
            }

            const nazivKategorije = (req.body.kategorija || '').toString().trim()
            const nazivPotkategorije = (req.body.potkategorija || '').toString().trim()
            if (!nazivKategorije) {
                res.json({ message: 'Kategorija ne postoji' }); return
            }
            if (!nazivPotkategorije) {
                res.json({ message: 'Naziv potkategorije je obavezan' }); return
            }

            const kategorija = await Kategorija.findOne({ naziv: nazivKategorije })
            if (!kategorija) {
                res.json({ message: 'Kategorija ne postoji' }); return
            }

            const potkategorije: string[] = Array.from(kategorija.potkategorije || [])
            const postoji = potkategorije.some((p) =>
                this.normalizuj(p) == this.normalizuj(nazivPotkategorije))
            if (postoji) {
                res.json({ message: 'Potkategorija već postoji u toj kategoriji' }); return
            }

            kategorija.potkategorije = [...potkategorije, nazivPotkategorije]
            await kategorija.save()

            res.json({ message: 'Potkategorija je dodata' })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Brisanje kategorije — samo ako je ne koristi nijedan proizvod ====
    // Proizvod čuva naziv kategorije kao tekst, pa bi brisanje ostavilo proizvode bez kategorije.
    obrisiKategoriju = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.body.adminId)
            if (!admin) {
                res.json({ message: 'Nemate pristup administrativnom panelu' }); return
            }

            const naziv = (req.body.naziv || '').toString().trim()
            if (!naziv) {
                res.json({ message: 'Kategorija ne postoji' }); return
            }

            const kategorija = await Kategorija.findOne({ naziv: naziv })
            if (!kategorija) {
                res.json({ message: 'Kategorija ne postoji' }); return
            }

            const brojProizvoda = await Proizvod.countDocuments({ kategorija: kategorija.naziv })
            if (brojProizvoda > 0) {
                res.json({ message: this.porukaZauzeto('Kategorija', brojProizvoda) }); return
            }

            // Kategorija odlazi zajedno sa svojim potkategorijama
            await Kategorija.deleteOne({ naziv: kategorija.naziv })

            res.json({ message: 'Kategorija je obrisana' })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Brisanje potkategorije — samo ako je ne koristi nijedan proizvod ====
    obrisiPotkategoriju = async (req: express.Request, res: express.Response) => {
        try {
            const admin = await this.nadjiAdmina(req.body.adminId)
            if (!admin) {
                res.json({ message: 'Nemate pristup administrativnom panelu' }); return
            }

            const nazivKategorije = (req.body.kategorija || '').toString().trim()
            const nazivPotkategorije = (req.body.potkategorija || '').toString().trim()
            if (!nazivKategorije) {
                res.json({ message: 'Kategorija ne postoji' }); return
            }
            if (!nazivPotkategorije) {
                res.json({ message: 'Potkategorija ne postoji' }); return
            }

            const kategorija = await Kategorija.findOne({ naziv: nazivKategorije })
            if (!kategorija) {
                res.json({ message: 'Kategorija ne postoji' }); return
            }

            const potkategorije: string[] = Array.from(kategorija.potkategorije || [])
            // Traži se po normalizovanom nazivu, a briše se ono što stvarno piše u bazi
            const indeks = potkategorije.findIndex((p) =>
                this.normalizuj(p) == this.normalizuj(nazivPotkategorije))
            if (indeks == -1) {
                res.json({ message: 'Potkategorija ne postoji' }); return
            }

            const stvarniNaziv = potkategorije[indeks]
            const brojProizvoda = await Proizvod.countDocuments({
                kategorija: kategorija.naziv,
                potkategorija: stvarniNaziv
            })
            if (brojProizvoda > 0) {
                res.json({ message: this.porukaZauzeto('Potkategorija', brojProizvoda) }); return
            }

            potkategorije.splice(indeks, 1)
            kategorija.potkategorije = potkategorije
            await kategorija.save()

            res.json({ message: 'Potkategorija je obrisana' })
        } catch (err) {
            console.log(err)
            res.json({ message: 'Greška na serveru' })
        }
    }

    // ==== Pomoćno ====

    // Naziv za poređenje: bez veličine slova i bez dijakritika.
    // Srpski nazivi se lako otkucaju i bez kvačica, pa bi inače nastale dve skoro iste kategorije.
    private normalizuj = (tekst: any): string => {
        return (tekst || '').toString().trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }

    // Poruka o zauzetosti sa srpskim slaganjem broja:
    // 1 proizvod, 2-4 proizvoda, 5+ proizvoda (+ glagol: koristi je / koriste je)
    private porukaZauzeto = (sta: string, broj: number): string => {
        const zadnjeDve = broj % 100
        const glagol = (zadnjeDve >= 2 && zadnjeDve <= 4) ? 'koriste' : 'koristi'
        const imenica = (broj % 10 == 1 && zadnjeDve != 11) ? 'proizvod' : 'proizvoda'
        return sta + ' se ne može obrisati — ' + glagol + ' je ' + broj + ' ' + imenica
    }

    // Nalog + sve što je samo njegovo. Vraća broj obrisanih proizvoda (štampar).
    // Fakture, javne nabavke, ponude i komentari se NE brišu — oni već nose imena
    // i predstavljaju istoriju poslovanja.
    private obrisiNalog = async (korisnik: any) => {
        // Proizvodi štampara idu sa nalogom, zajedno sa svojim slikama na disku
        let obrisanihProizvoda = 0
        if (korisnik.tip == 'stampar') {
            const proizvodi = await Proizvod.find({ stamparijaId: korisnik.korisnickoIme })
            for (let p of proizvodi) {
                if (p.slikaUrl) obrisiFajl('uploads/' + p.slikaUrl)
                for (let dodatna of (p.dodatneSlike || [])) obrisiFajl('uploads/' + dodatna)
            }
            const rezultat = await Proizvod.deleteMany({ stamparijaId: korisnik.korisnickoIme })
            obrisanihProizvoda = rezultat.deletedCount || 0
        }

        // Korpa i zahtevi za promenu lozinke su privatni podaci naloga
        await Korpa.deleteMany({ klijentId: korisnik.korisnickoIme })
        await PasswordReset.deleteMany({ korisnickoIme: korisnik.korisnickoIme })

        if (korisnik.slika && korisnik.slika != 'default_profile_image.jpg') {
            obrisiFajl('uploads/' + korisnik.slika)
        }

        await Korisnik.deleteOne({ korisnickoIme: korisnik.korisnickoIme })

        return obrisanihProizvoda
    }

    // Samo ulogovan i aktivan administrator sme u panel.
    // (Projekat nema tokene — vidi poznato ograničenje u planu Faze 7, §10.)
    private nadjiAdmina = async (adminId: any) => {
        const id = (adminId || '').toString().trim()
        if (!id) return null
        const admin = await Korisnik.findOne({ korisnickoIme: id })
        if (!admin || admin.tip != 'admin' || admin.status != 'aktivan') return null
        return admin
    }

    // Ista pravila kao pri registraciji i ažuriranju profila, plus tip i status
    private validiraj = async (podaci: any, trenutni: any) => {
        let greske: string[] = []
        const emailRegex = /^\S+@\S+\.\S+$/

        if (!podaci.ime || !podaci.ime.toString().trim()) greske.push('Ime je obavezno')
        if (!podaci.prezime || !podaci.prezime.toString().trim()) greske.push('Prezime je obavezno')
        if (!podaci.telefon || !podaci.telefon.toString().trim()) greske.push('Kontakt telefon je obavezan')
        if (!emailRegex.test(podaci.email || '')) greske.push('I-mejl adresa nije ispravna')

        if (!podaci.tip || TIPOVI.indexOf(podaci.tip.toString()) == -1)
            greske.push('Neispravan tip naloga')
        if (!podaci.status || STATUSI.indexOf(podaci.status.toString()) == -1)
            greske.push('Neispravan status naloga')

        const tip = podaci.tip ? podaci.tip.toString() : ''
        const vrsta = podaci.vrsta ? podaci.vrsta.toString() : ''

        if (tip == 'klijent' && VRSTE.indexOf(vrsta) == -1) {
            greske.push('Neispravna vrsta klijenta')
        }
        if (vrsta == 'pravno' || tip == 'stampar') {
            if (!podaci.nazivInstitucije || !podaci.nazivInstitucije.toString().trim())
                greske.push('Naziv institucije je obavezan')
            if (!podaci.adresa || !podaci.adresa.toString().trim()) greske.push('Adresa sedišta je obavezna')
            if (!/^\d{8}$/.test(podaci.maticniBroj || ''))
                greske.push('Matični broj mora imati tačno 8 cifara')
            if (!/^[1-9]\d{8}$/.test(podaci.pib || ''))
                greske.push('PIB mora imati 9 cifara i ne sme počinjati nulom')
        }
        if (tip == 'stampar' && (!podaci.grad || !podaci.grad.toString().trim()))
            greske.push('Grad je obavezan')

        if (greske.length == 0) {
            const emailZauzet = await Korisnik.findOne({
                email: podaci.email,
                korisnickoIme: { $ne: trenutni.korisnickoIme }
            })
            if (emailZauzet) greske.push('I-mejl adresa je već zauzeta')

            if (vrsta == 'pravno' || tip == 'stampar') {
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
