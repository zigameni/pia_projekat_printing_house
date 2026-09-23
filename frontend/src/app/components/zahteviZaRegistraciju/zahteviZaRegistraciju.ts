import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Korisnik, OdbijanjeZahtevaOdgovor, PrijavaOdgovor } from '../../models';

@Component({
    selector: 'app-zahtevi-za-registraciju',
    imports: [RouterLink],
    templateUrl: './zahteviZaRegistraciju.html',
    styleUrl: './zahteviZaRegistraciju.css',
})
export class ZahteviZaRegistraciju implements OnInit {
    private adminService = inject(AdminService)

    korisnik: Korisnik | null = null
    zahtevi: Korisnik[] = []

    // Red koji se upravo obrađuje — sprečava dvostruki klik dok odgovor ne stigne
    obrada = ''

    // Odbijanje u dva koraka: brisanje zahteva se ne može poništiti
    odbijanjeKorisnickoIme = ''

    poruka = ''
    greska = ''

    ngOnInit() {
        const str = localStorage.getItem('ulogovan')
        if (str) this.korisnik = JSON.parse(str) as Korisnik
        this.ucitajZahteve()
    }

    // ==== Podaci ====
    ucitajZahteve() {
        if (!this.korisnik) return
        this.adminService.neodobreniKorisnici(this.korisnik.korisnickoIme).subscribe((zahtevi: Korisnik[]) => {
            this.zahtevi = zahtevi
        })
    }

    // ==== Odobravanje ====
    odobri(z: Korisnik) {
        if (!this.korisnik || this.obrada) return

        this.poruka = ''
        this.greska = ''
        this.otkaziOdbijanje()
        this.obrada = z.korisnickoIme

        this.adminService.odobriKorisnika({
            adminId: this.korisnik.korisnickoIme,
            korisnickoIme: z.korisnickoIme
        }).subscribe({
            next: (odg: PrijavaOdgovor) => {
                this.obrada = ''
                if (odg.message == 'Uspešno') {
                    this.zahtevi = this.zahtevi.filter((x) => x.korisnickoIme != z.korisnickoIme)
                    this.poruka = `Zahtev ${z.korisnickoIme} je odobren — nalog je aktivan i može da se prijavi`
                } else {
                    this.greska = odg.message
                }
            },
            error: () => {
                this.obrada = ''
                this.greska = 'Greška u komunikaciji sa serverom'
            }
        })
    }

    // ==== Odbijanje (dva koraka, jer briše zahtev) ====
    zapocniOdbijanje(z: Korisnik) {
        this.poruka = ''
        this.greska = ''
        this.odbijanjeKorisnickoIme = z.korisnickoIme
    }

    otkaziOdbijanje() {
        this.odbijanjeKorisnickoIme = ''
    }

    odbij(z: Korisnik) {
        if (!this.korisnik || this.obrada) return

        this.poruka = ''
        this.greska = ''
        this.obrada = z.korisnickoIme

        this.adminService.odbijKorisnika({
            adminId: this.korisnik.korisnickoIme,
            korisnickoIme: z.korisnickoIme
        }).subscribe({
            next: (odg: OdbijanjeZahtevaOdgovor) => {
                this.obrada = ''
                this.odbijanjeKorisnickoIme = ''
                if (odg.message == 'Zahtev je odbijen') {
                    this.zahtevi = this.zahtevi.filter((x) => x.korisnickoIme != z.korisnickoIme)
                    this.poruka = `Zahtev ${z.korisnickoIme} je odbijen i uklonjen — podaci su ponovo slobodni`
                } else {
                    this.greska = odg.message
                }
            },
            error: () => {
                this.obrada = ''
                this.odbijanjeKorisnickoIme = ''
                this.greska = 'Greška u komunikaciji sa serverom'
            }
        })
    }

    // ==== Prikaz ====
    tipTekst(z: Korisnik): string {
        if (z.tip == 'stampar') return 'štampar'
        return z.vrsta == 'pravno' ? 'klijent (pravno lice)' : 'klijent (fizičko lice)'
    }

    imaPodatkeFirme(z: Korisnik): boolean {
        return z.vrsta == 'pravno' || z.tip == 'stampar'
    }

    // Bez slike se prikazuje inicijal, a ne polomljena slika
    slikaPutanja(z: Korisnik): string {
        if (!z.slika || z.slika == 'default_profile_image.jpg') return ''
        return `${this.adminService.uri}/uploads/${z.slika}`
    }

    inicijal(z: Korisnik): string {
        const osnova = z.nazivInstitucije || z.ime || z.korisnickoIme || '?'
        return osnova.charAt(0).toUpperCase()
    }
}
