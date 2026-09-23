import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { KorisniciService } from '../../services/korisnici.service';

@Component({
    selector: 'app-ekorpa',
    imports: [RouterLink],
    templateUrl: './ekorpa.html',
    styleUrl: './ekorpa.css',
})
export class Ekorpa implements OnInit {
    private korisniciService = inject(KorisniciService)
    private router = inject(Router)

    korisnik: any = null
    stavke: any[] = []
    grupisano: any = {}  // { stamparijaId: [stavke] }
    ukupnoPoStamparijama: any = {}  // { stamparijaId: ukupanIznos }
    ukupnoUkupno = 0
    poruka = ''
    uspesno = false
    kreiraneFakture: any[] = []
    // N-3: ishod slanja i-mejla koji server sada vraća uz potvrdu porudžbine
    emailPoslat = false
    emailPrimaoca = ''

    ngOnInit() {
        let korisnikStr = localStorage.getItem('ulogovan')
        if (korisnikStr) {
            this.korisnik = JSON.parse(korisnikStr)
            this.ucitajKorpu()
        }
    }

    ucitajKorpu() {
        this.korisniciService.korpaKlijenta(this.korisnik.korisnickoIme).subscribe((data: any[]) => {
            this.stavke = data || []
            this.grupisi()
        })
    }

    grupisi() {
        this.grupisano = {}
        this.ukupnoPoStamparijama = {}
        this.ukupnoUkupno = 0

        for (let s of this.stavke) {
            let key = s.stamparijaId
            if (!this.grupisano[key]) this.grupisano[key] = []
            this.grupisano[key].push(s)

            let iznos = s.cena * s.kolicina
            this.ukupnoPoStamparijama[key] = (this.ukupnoPoStamparijama[key] || 0) + iznos
            this.ukupnoUkupno += iznos
        }
    }

    ukloni(stavka: any) {
        this.korisniciService.ukloniIzKorpe({
            klijentId: this.korisnik.korisnickoIme,
            proizvodId: stavka.proizvodId,
            tipStampe: stavka.tipStampe,
            boja: stavka.boja
        }).subscribe((odg: any) => {
            if (odg.stavke) {
                this.stavke = odg.stavke
                this.grupisi()
            }
        })
    }

    potvrdi() {
        if (!confirm('Da li ste sigurni da želite da potvrdite narudžbinu?')) return

        this.korisniciService.potvrdiKorpu(this.korisnik.korisnickoIme).subscribe((odg: any) => {
            this.poruka = odg.message
            this.uspesno = odg.message === 'Uspešno poručeno'
            if (this.uspesno) {
                this.kreiraneFakture = odg.fakture || []
                this.emailPoslat = odg.emailPoslat === true
                this.emailPrimaoca = odg.emailPrimaoca || ''
                this.stavke = []
                this.grupisano = {}
                this.ukupnoPoStamparijama = {}
                this.ukupnoUkupno = 0
            }
        })
    }

    stamparijeKeys(): string[] {
        return Object.keys(this.grupisano)
    }

    iznosStavke(s: any): number {
        return s.cena * s.kolicina
    }
}
