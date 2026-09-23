import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { KorisniciService } from '../../services/korisnici.service';
import { Korisnik, PrijavaOdgovor } from '../../models';

@Component({
    selector: 'app-profil',
    imports: [RouterLink, FormsModule],
    templateUrl: './profil.html',
    styleUrl: './profil.css',
})
export class Profil implements OnInit {
    private korisniciService = inject(KorisniciService)

    korisnik: Korisnik | null = null
    narudzbine: any[] = []
    narudzbineAktivne: any[] = []  // naruceno, placeno, u stampi
    narudzbineArhiva: any[] = []   // isporuceno, primljeno
    poruka = ''

    sortAktivneAsc = true
    sortArhivaAsc = true

    // ==== N-1: izmena podataka profila ====
    izmena = false
    ime = ''
    prezime = ''
    telefon = ''
    email = ''
    nazivInstitucije = ''
    adresa = ''
    maticniBroj = ''
    pib = ''
    grad = ''

    slika: File | null = null
    slikaPregled = ''          // URL.createObjectURL za novu sliku (pregled)
    porukaSlika = ''
    porukaIzmena = ''
    porukaIzmenaUspeh = ''

    private emailRegex = /^\S+@\S+\.\S+$/

    ngOnInit() {
        let korisnikStr = localStorage.getItem('ulogovan')
        if (korisnikStr) {
            this.korisnik = JSON.parse(korisnikStr) as Korisnik
            this.ucitajNarudzbine()
        }
    }

    // ==== Tip naloga (ista pravila kao server-side validacija) ====
    jePravnoIliStampar(): boolean {
        return this.korisnik?.vrsta == 'pravno' || this.korisnik?.tip == 'stampar'
    }

    jeStampar(): boolean {
        return this.korisnik?.tip == 'stampar'
    }

    // ==== N-1: otvaranje / zatvaranje forme ====
    zapocniIzmenu() {
        if (!this.korisnik) return

        this.ime = this.korisnik.ime || ''
        this.prezime = this.korisnik.prezime || ''
        this.telefon = this.korisnik.telefon || ''
        this.email = this.korisnik.email || ''
        this.nazivInstitucije = this.korisnik.nazivInstitucije || ''
        this.adresa = this.korisnik.adresa || ''
        this.maticniBroj = this.korisnik.maticniBroj || ''
        this.pib = this.korisnik.pib || ''
        this.grad = this.korisnik.grad || ''

        this.pocistiSliku()
        this.porukaIzmena = ''
        this.porukaIzmenaUspeh = ''
        this.izmena = true
    }

    otkaziIzmenu() {
        this.izmena = false
        this.pocistiSliku()
        this.porukaIzmena = ''
    }

    private pocistiSliku() {
        this.slika = null
        this.slikaPregled = ''
        this.porukaSlika = ''
    }

    // ==== Nova profilna slika (ista pravila kao pri registraciji) ====
    naIzborSlike(event: Event) {
        const fajl = (event.target as HTMLInputElement).files?.[0];

        this.slikaPregled = '';

        if (!fajl) {
            this.slika = null;
            return;
        }

        const dozvoljeno = ['image/jpeg', 'image/png', 'image/gif'];

        if (dozvoljeno.indexOf(fajl.type) == -1) {
            this.porukaSlika = 'Format slike mora biti JPG, PNG ili GIF';
            this.slika = null;
            return;
        }
        const slika = new Image();
        slika.onload = () => {
            if (slika.width < 100 || slika.width > 250 || slika.height < 100 || slika.height > 250) {
                this.porukaSlika = 'Slika mora biti između 100x100 i 250x250 px';
                this.slika = null;
            } else {
                this.porukaSlika = '';
                this.slika = fajl;
                this.slikaPregled = URL.createObjectURL(fajl);
            }
        };
        slika.src = URL.createObjectURL(fajl);
    }

    // ==== Klijentska validacija (iste poruke kao na serveru) ====
    validiraj(): string[] {
        let greske: string[] = [];

        if (!this.ime.trim()) greske.push('Ime je obavezno');
        if (!this.prezime.trim()) greske.push('Prezime je obavezno');
        if (!this.telefon.trim()) greske.push('Kontakt telefon je obavezan');
        if (!this.emailRegex.test(this.email)) greske.push('I-mejl adresa nije ispravna');

        if (this.jePravnoIliStampar()) {
            if (!this.nazivInstitucije.trim()) greske.push('Naziv institucije je obavezan');
            if (!this.adresa.trim()) greske.push('Adresa sedišta je obavezna');
            if (!/^\d{8}$/.test(this.maticniBroj))
                greske.push('Matični broj mora imati tačno 8 cifara');
            if (!/^[1-9]\d{8}$/.test(this.pib))
                greske.push('PIB mora imati 9 cifara i ne sme počinjati nulom');
        }
        if (this.jeStampar() && !this.grad.trim()) greske.push('Grad je obavezan');

        return greske;
    }

    // ==== Slanje izmena na postojeći endpoint ====
    sacuvaj() {
        if (!this.korisnik) return

        this.porukaIzmena = ''
        this.porukaIzmenaUspeh = ''

        if (this.porukaSlika) {
            this.porukaIzmena = this.porukaSlika
            return
        }

        const greske = this.validiraj()
        if (greske.length > 0) {
            this.porukaIzmena = greske.join('; ')
            return
        }

        const fd = new FormData()
        // Korisničko ime identifikuje nalog i šalje se, ali se NE menja (spec 3.1)
        fd.append('korisnickoIme', this.korisnik.korisnickoIme)
        fd.append('ime', this.ime)
        fd.append('prezime', this.prezime)
        fd.append('telefon', this.telefon)
        fd.append('email', this.email)
        if (this.jePravnoIliStampar()) {
            fd.append('nazivInstitucije', this.nazivInstitucije)
            fd.append('adresa', this.adresa)
            fd.append('maticniBroj', this.maticniBroj)
            fd.append('pib', this.pib)
        }
        if (this.jeStampar()) fd.append('grad', this.grad)
        if (this.slika) fd.append('slika', this.slika)

        this.korisniciService.azurirajProfil(fd).subscribe((odg: PrijavaOdgovor) => {
            if (odg.message == 'Uspešno' && odg.user) {
                const novi = odg.user
                this.korisnik = novi
                localStorage.setItem('ulogovan', JSON.stringify(novi))
                // Zaglavlje (ime/avatar) se osvežava bez reload-a — sluša `app.ts`
                window.dispatchEvent(new Event('profil-azuriran'))
                this.izmena = false
                this.pocistiSliku()
                this.porukaIzmenaUspeh = 'Podaci su uspešno sačuvani'
            } else {
                this.porukaIzmena = odg.message
            }
        })
    }

    ucitajNarudzbine() {
        if (!this.korisnik) return
        this.korisniciService.narudzbineKlijenta(this.korisnik.korisnickoIme).subscribe((data: any[]) => {
            this.narudzbine = data
            this.podeliNarudzbine()
        })
    }

    podeliNarudzbine() {
        this.narudzbineAktivne = this.narudzbine.filter((n: any) =>
            n.status === 'naruceno' || n.status === 'placeno' || n.status === 'u stampi'
        )
        this.narudzbineArhiva = this.narudzbine.filter((n: any) =>
            n.status === 'isporuceno' || n.status === 'primljeno'
        )
    }

    sortirajAktivne() {
        this.sortAktivneAsc = !this.sortAktivneAsc
        this.narudzbineAktivne = [...this.narudzbineAktivne].sort((a: any, b: any) => {
            const r = new Date(a.datumIzdavanja).getTime() - new Date(b.datumIzdavanja).getTime()
            return this.sortAktivneAsc ? r : -r
        })
    }

    sortirajArhivu() {
        this.sortArhivaAsc = !this.sortArhivaAsc
        this.narudzbineArhiva = [...this.narudzbineArhiva].sort((a: any, b: any) => {
            const r = new Date(a.datumIzdavanja).getTime() - new Date(b.datumIzdavanja).getTime()
            return this.sortArhivaAsc ? r : -r
        })
    }

    formatirajDatum(datum: string): string {
        return new Date(datum).toLocaleDateString('sr-Latn-RS')
    }
}
