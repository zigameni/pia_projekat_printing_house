import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StamparService } from '../../services/stampar.service';
import { AzuriranaKolicinaOdgovor, Kategorija, Korisnik, NoviProizvodOdgovor, Proizvod, UslugaStampe } from '../../models';

@Component({
    selector: 'app-moji-proizvodi',
    imports: [RouterLink, FormsModule],
    templateUrl: './mojiProizvodi.html',
    styleUrl: './mojiProizvodi.css',
})
export class MojiProizvodi implements OnInit {
    private stamparService = inject(StamparService)

    korisnik: Korisnik | null = null
    proizvodi: Proizvod[] = []
    kategorije: Kategorija[] = []
    potkategorije: string[] = []

    // ==== Forma za dodavanje proizvoda ====
    prikaziFormu = false
    sifra = ''
    naziv = ''
    opis = ''
    kategorija = ''
    potkategorija = ''
    jedinicnaCena: number | null = null
    kolicinaNaLageru: number | null = null
    boje = ''
    usluge: UslugaStampe[] = []
    slika: File | null = null
    slikaPregled = ''

    poruka = ''
    porukaUspeh = ''
    porukaSlika = ''

    // ==== Ažuriranje količina (spec 4.3) ====
    // Vrednosti iz polja za količinu, po šifri; pune se iz baze pri svakom učitavanju liste
    izmene: Record<string, number> = {}
    porukaKolicina = ''
    greskaKolicina = ''

    ngOnInit() {
        const str = localStorage.getItem('ulogovan')
        if (str) this.korisnik = JSON.parse(str) as Korisnik
        this.ucitajKategorije()
        this.ucitajProizvode()
    }

    // ==== Podaci ====
    ucitajKategorije() {
        this.stamparService.kategorije().subscribe((kategorije: Kategorija[]) => {
            this.kategorije = kategorije
        })
    }

    ucitajProizvode() {
        if (!this.korisnik) return
        this.stamparService.proizvodiStamparije(this.korisnik.korisnickoIme).subscribe((proizvodi: Proizvod[]) => {
            this.proizvodi = proizvodi
            this.resetIzmene(proizvodi)
        })
    }

    private resetIzmene(proizvodi: Proizvod[]) {
        this.izmene = {}
        for (let p of proizvodi) this.izmene[p.sifra] = p.kolicinaNaLageru
    }

    // ==== Ažuriranje količina (spec 4.3) ====
    // Dugme je aktivno samo kad se vrednost razlikuje od sačuvane
    jeIzmenjeno(p: Proizvod): boolean {
        const vrednost = this.izmene[p.sifra]
        return vrednost !== undefined && vrednost !== null && vrednost !== p.kolicinaNaLageru
    }

    // Klijentska provera — iste poruke kao na serveru
    private greskaKolicine(p: Proizvod): string {
        const vrednost: any = this.izmene[p.sifra]
        if (vrednost === undefined || vrednost === null || vrednost === '') {
            return 'Sva obavezna polja moraju biti popunjena'
        }
        const broj = Number(vrednost)
        if (isNaN(broj)) return 'Količina mora biti broj'
        if (!Number.isInteger(broj)) return 'Količina mora biti ceo broj'
        if (broj < 0) return 'Količina ne može biti negativna'
        return ''
    }

    sacuvajKolicinu(p: Proizvod) {
        if (!this.korisnik) return

        this.porukaKolicina = ''
        this.greskaKolicina = ''

        const greska = this.greskaKolicine(p)
        if (greska) {
            this.greskaKolicina = greska
            return
        }

        this.stamparService.azurirajKolicinu({
            stamparijaId: this.korisnik.korisnickoIme,
            sifra: p.sifra,
            kolicinaNaLageru: Number(this.izmene[p.sifra])
        }).subscribe((odg: AzuriranaKolicinaOdgovor) => {
            if (odg.message == 'Količina je ažurirana' && odg.proizvod) {
                const sacuvan = odg.proizvod
                // Red se osvežava iz odgovora servera, a ne iz lokalne vrednosti
                this.proizvodi = this.proizvodi.map((x) => (x.sifra == sacuvan.sifra ? sacuvan : x))
                this.izmene[sacuvan.sifra] = sacuvan.kolicinaNaLageru
                this.porukaKolicina = `Količina za ${sacuvan.sifra} je sačuvana`
            } else {
                this.greskaKolicina = odg.message
            }
        })
    }

    // ==== Kaskadni dropdown kategorija -> potkategorija ====
    promeniKategoriju() {
        const izabrana = this.kategorije.find((k) => k.naziv == this.kategorija)
        this.potkategorije = izabrana ? izabrana.potkategorije : []
        this.potkategorija = ''
    }

    // ==== Dinamički redovi usluga štampe ====
    dodajUslugu() {
        this.usluge.push({ idUsluge: '', tipStampe: '', dodatnaCenaPoKomadu: 0, maxSirinaMm: 0, maxVisinaMm: 0 })
    }

    ukloniUslugu(indeks: number) {
        this.usluge.splice(indeks, 1)
    }

    // ==== Slika proizvoda ====
    // Samo format i veličina fajla — provera 100–250 px je pravilo za PROFILNU sliku
    // i odbila bi normalne slike proizvoda, pa se ovde namerno ne primenjuje.
    naIzborSlike(event: Event) {
        const fajl = (event.target as HTMLInputElement).files?.[0]
        this.slikaPregled = ''

        if (!fajl) {
            this.slika = null
            return
        }

        const dozvoljeno = ['image/jpeg', 'image/png', 'image/gif']
        if (dozvoljeno.indexOf(fajl.type) == -1) {
            this.porukaSlika = 'Format slike mora biti JPG, PNG ili GIF'
            this.slika = null
            return
        }

        this.porukaSlika = ''
        this.slika = fajl
        this.slikaPregled = URL.createObjectURL(fajl)
    }

    // ==== Klijentska validacija (iste poruke kao na serveru) ====
    validiraj(): string[] {
        let greske: string[] = []

        if (
            !this.sifra.trim() ||
            !this.naziv.trim() ||
            !this.opis.trim() ||
            !this.kategorija ||
            !this.potkategorija ||
            this.jedinicnaCena === null ||
            this.kolicinaNaLageru === null
        ) {
            greske.push('Sva obavezna polja moraju biti popunjena')
        }
        if (this.jedinicnaCena !== null && this.jedinicnaCena < 0) greske.push('Cena ne može biti negativna')
        if (this.kolicinaNaLageru !== null && this.kolicinaNaLageru < 0)
            greske.push('Količina ne može biti negativna')

        for (let u of this.usluge) {
            if (!u.tipStampe || !u.tipStampe.trim()) {
                greske.push('Neispravni podaci o uslugama štampe')
                break
            }
            if (u.dodatnaCenaPoKomadu < 0) {
                greske.push('Dodatna cena usluge ne može biti negativna')
                break
            }
        }

        return greske
    }

    // ==== Slanje forme (multipart) ====
    dodajProizvod() {
        if (!this.korisnik) return

        this.poruka = ''
        this.porukaUspeh = ''

        if (this.porukaSlika) {
            this.poruka = this.porukaSlika
            return
        }

        const greske = this.validiraj()
        if (greske.length > 0) {
            this.poruka = greske.join('; ')
            return
        }

        const fd = new FormData()
        // stamparijaId identifikuje štampara; nazivStamparije i grad server čita iz baze
        fd.append('stamparijaId', this.korisnik.korisnickoIme)
        fd.append('sifra', this.sifra.trim())
        fd.append('naziv', this.naziv.trim())
        fd.append('opis', this.opis)
        fd.append('kategorija', this.kategorija)
        fd.append('potkategorija', this.potkategorija)
        fd.append('jedinicnaCena', String(this.jedinicnaCena === null ? 0 : this.jedinicnaCena))
        fd.append('kolicinaNaLageru', String(this.kolicinaNaLageru === null ? 0 : this.kolicinaNaLageru))
        fd.append('dostupneBoje', JSON.stringify(this.boje.split(',').map((b) => b.trim()).filter((b) => b != '')))
        fd.append('uslugeStampe', JSON.stringify(this.usluge.map((u) => ({
            tipStampe: u.tipStampe.trim(),
            dodatnaCenaPoKomadu: Number(u.dodatnaCenaPoKomadu) || 0,
            maxSirinaMm: Number(u.maxSirinaMm) || 0,
            maxVisinaMm: Number(u.maxVisinaMm) || 0
        }))))
        if (this.slika) fd.append('slika', this.slika)

        this.stamparService.dodajProizvod(fd).subscribe((odg: NoviProizvodOdgovor) => {
            if (odg.message == 'Uspešno dodat proizvod' && odg.proizvod) {
                const novi = odg.proizvod
                this.proizvodi = [...this.proizvodi, novi].sort((a, b) => a.sifra.localeCompare(b.sifra))
                // I polje za količinu novog reda mora da dobije vrednost iz baze
                this.izmene[novi.sifra] = novi.kolicinaNaLageru
                this.porukaUspeh = `Proizvod ${novi.sifra} je dodat`
                this.resetForme()
                this.prikaziFormu = false
            } else {
                this.poruka = odg.message
            }
        })
    }

    resetForme() {
        this.sifra = ''
        this.naziv = ''
        this.opis = ''
        this.kategorija = ''
        this.potkategorija = ''
        this.potkategorije = []
        this.jedinicnaCena = null
        this.kolicinaNaLageru = null
        this.boje = ''
        this.usluge = []
        this.slika = null
        this.slikaPregled = ''
        this.porukaSlika = ''
        this.poruka = ''
    }

    slikaPutanja(url: string): string {
        if (!url) return ''
        return `${this.stamparService.uri}/${url}`
    }
}
