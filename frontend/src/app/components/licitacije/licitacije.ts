import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KorisniciService } from '../../services/korisnici.service';

@Component({
    selector: 'app-licitacije',
    imports: [FormsModule],
    templateUrl: './licitacije.html',
    styleUrl: './licitacije.css',
})
export class Licitacije implements OnInit {
    private korisniciService = inject(KorisniciService)

    korisnik: any = null
    nabavke: any[] = []
    poruka = ''
    uspesno = false

    // Forma za ponudu
    aktivnaNabavka: any = null
    ponudaStavke: any[] = []

    ngOnInit() {
        let korisnikStr = localStorage.getItem('ulogovan')
        if (korisnikStr) {
            this.korisnik = JSON.parse(korisnikStr)
            this.ucitajNabavke()
        }
    }

    ucitajNabavke() {
        this.korisniciService.otvoreneNabavke(this.korisnik.korisnickoIme).subscribe((data: any[]) => {
            this.nabavke = data || []
        })
    }

    otvoriPonudu(nabavka: any) {
        this.aktivnaNabavka = nabavka
        this.ponudaStavke = nabavka.stavke.map((s: any) => ({
            sifra: s.sifra,
            naziv: s.naziv,
            kolicina: s.kolicina,
            jedinicnaCena: 0
        }))
        this.poruka = ''
    }

    zatvoriPonudu() {
        this.aktivnaNabavka = null
        this.ponudaStavke = []
    }

    ukupno(): number {
        return this.ponudaStavke.reduce((sum, s) => sum + (s.jedinicnaCena || 0) * s.kolicina, 0)
    }

    posaljiPonudu() {
        if (!this.aktivnaNabavka) return
        this.poruka = ''

        this.korisniciService.posaljiPonudu({
            nabavkaId: this.aktivnaNabavka.idNabavke,
            stamparijaId: this.korisnik.korisnickoIme,
            stavke: this.ponudaStavke
        }).subscribe((odg: any) => {
            this.poruka = odg.message
            this.uspesno = odg.message.includes('uspešno')
            if (this.uspesno) {
                this.zatvoriPonudu()
                this.ucitajNabavke()
            }
        })
    }

    formatirajDatum(datum: string): string {
        return new Date(datum).toLocaleString('sr-Latn-RS')
    }
}
