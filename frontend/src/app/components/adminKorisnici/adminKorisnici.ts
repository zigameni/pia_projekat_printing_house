import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import {
    AzuriranjeKorisnikaZahtev, BrisanjeKorisnikaOdgovor, Korisnik, PrijavaOdgovor, StatusKorisnika, TipKorisnika, VrstaKlijenta
} from '../../models';

@Component({
    selector: 'app-admin-korisnici',
    imports: [RouterLink, FormsModule],
    templateUrl: './adminKorisnici.html',
    styleUrl: './adminKorisnici.css',
})
export class AdminKorisnici implements OnInit {
    private adminService = inject(AdminService)

    korisnik: Korisnik | null = null
    korisnici: Korisnik[] = []

    // Filteri (lista je mala — filtriranje ide u pregledaču)
    filter = ''
    filterTip = ''

    // Red koji je u režimu izmene (kopija podataka, da „Otkaži" radi bez ponovnog učitavanja)
    forma: AzuriranjeKorisnikaZahtev | null = null

    // Brisanje u dva koraka — bez `window.confirm` dijaloga
    brisanjeKorisnickoIme = ''

    poruka = ''
    greska = ''

    tipovi: TipKorisnika[] = ['klijent', 'stampar', 'admin']
    vrste: VrstaKlijenta[] = ['fizicko', 'pravno']
    statusi: StatusKorisnika[] = ['aktivan', 'neaktivan', 'na_cekanju']

    ngOnInit() {
        const str = localStorage.getItem('ulogovan')
        if (str) this.korisnik = JSON.parse(str) as Korisnik
        this.ucitajKorisnike()
    }

    // ==== Podaci ====
    ucitajKorisnike() {
        if (!this.korisnik) return
        this.adminService.sviKorisnici(this.korisnik.korisnickoIme).subscribe((korisnici: Korisnik[]) => {
            this.korisnici = korisnici
        })
    }

    filtrirani(): Korisnik[] {
        const tekst = this.filter.trim().toLowerCase()
        return this.korisnici.filter((k) => {
            if (this.filterTip && k.tip != this.filterTip) return false
            if (!tekst) return true
            return (k.korisnickoIme + ' ' + k.ime + ' ' + k.prezime + ' ' + k.email).toLowerCase().indexOf(tekst) != -1
        })
    }

    // ==== Izmena naloga ====
    zapocniIzmenu(k: Korisnik) {
        this.poruka = ''
        this.greska = ''
        this.brisanjeKorisnickoIme = ''
        this.forma = {
            adminId: this.korisnik ? this.korisnik.korisnickoIme : '',
            korisnickoIme: k.korisnickoIme,
            ime: k.ime,
            prezime: k.prezime,
            telefon: k.telefon,
            email: k.email,
            tip: k.tip,
            vrsta: k.vrsta || '',
            status: k.status,
            nazivInstitucije: k.nazivInstitucije || '',
            adresa: k.adresa || '',
            grad: k.grad || '',
            maticniBroj: k.maticniBroj || '',
            pib: k.pib || ''
        }
    }

    otkaziIzmenu() {
        this.forma = null
        this.poruka = ''
        this.greska = ''
    }

    // Klijentska provera — iste poruke kao na serveru
    private greskeForme(): string[] {
        if (!this.forma) return []
        let greske: string[] = []
        const f = this.forma

        if (!f.ime.trim()) greske.push('Ime je obavezno')
        if (!f.prezime.trim()) greske.push('Prezime je obavezno')
        if (!f.telefon.trim()) greske.push('Kontakt telefon je obavezan')
        if (!/^\S+@\S+\.\S+$/.test(f.email)) greske.push('I-mejl adresa nije ispravna')
        if (f.tip == 'klijent' && f.vrsta != 'fizicko' && f.vrsta != 'pravno')
            greske.push('Neispravna vrsta klijenta')

        if (f.vrsta == 'pravno' || f.tip == 'stampar') {
            if (!(f.nazivInstitucije || '').trim()) greske.push('Naziv institucije je obavezan')
            if (!(f.adresa || '').trim()) greske.push('Adresa sedišta je obavezna')
            if (!/^\d{8}$/.test(f.maticniBroj || '')) greske.push('Matični broj mora imati tačno 8 cifara')
            if (!/^[1-9]\d{8}$/.test(f.pib || '')) greske.push('PIB mora imati 9 cifara i ne sme počinjati nulom')
        }
        if (f.tip == 'stampar' && !(f.grad || '').trim()) greske.push('Grad je obavezan')

        return greske
    }

    sacuvajIzmenu() {
        if (!this.forma || !this.korisnik) return

        this.poruka = ''
        this.greska = ''

        const greske = this.greskeForme()
        if (greske.length > 0) {
            this.greska = greske.join('; ')
            return
        }

        const podaci: AzuriranjeKorisnikaZahtev = { ...this.forma, adminId: this.korisnik.korisnickoIme }

        this.adminService.azurirajKorisnika(podaci).subscribe((odg: PrijavaOdgovor) => {
            if (odg.message == 'Uspešno' && odg.user) {
                const sacuvan = odg.user
                // Red se osvežava iz odgovora servera, ne iz lokalne kopije
                this.korisnici = this.korisnici.map((k) => (k.korisnickoIme == sacuvan.korisnickoIme ? sacuvan : k))
                this.poruka = `Nalog ${sacuvan.korisnickoIme} je sačuvan`
                this.forma = null
            } else {
                this.greska = odg.message
            }
        })
    }

    // ==== Brisanje naloga (dva koraka) ====
    zapocniBrisanje(k: Korisnik) {
        this.poruka = ''
        this.greska = ''
        this.forma = null
        this.brisanjeKorisnickoIme = k.korisnickoIme
    }

    otkaziBrisanje() {
        this.brisanjeKorisnickoIme = ''
    }

    obrisi(k: Korisnik) {
        if (!this.korisnik) return

        this.poruka = ''
        this.greska = ''

        this.adminService.obrisiKorisnika({
            adminId: this.korisnik.korisnickoIme,
            korisnickoIme: k.korisnickoIme
        }).subscribe((odg: BrisanjeKorisnikaOdgovor) => {
            if (odg.message == 'Korisnik je obrisan') {
                this.korisnici = this.korisnici.filter((x) => x.korisnickoIme != k.korisnickoIme)
                const proizvoda = odg.obrisanihProizvoda || 0
                this.poruka = `Nalog ${k.korisnickoIme} je obrisan` +
                    (proizvoda > 0 ? ` (sa nalogom je obrisano i ${proizvoda} proizvoda)` : '')
                this.brisanjeKorisnickoIme = ''
            } else {
                this.greska = odg.message
                this.brisanjeKorisnickoIme = ''
            }
        })
    }

    // ==== Prikaz ====
    jeSopstveniNalog(k: Korisnik): boolean {
        return !!this.korisnik && k.korisnickoIme == this.korisnik.korisnickoIme
    }

    statusKlasa(status: string): string {
        return 'status-badge status-' + status
    }

    tipTekst(k: Korisnik): string {
        if (k.tip == 'admin') return 'administrator'
        if (k.tip == 'stampar') return 'štampar'
        return k.vrsta == 'pravno' ? 'klijent (pravno lice)' : 'klijent (fizičko lice)'
    }
}
