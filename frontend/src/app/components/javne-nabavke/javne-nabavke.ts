import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KorisniciService } from '../../services/korisnici.service';

@Component({
    selector: 'app-javne-nabavke',
    imports: [FormsModule],
    templateUrl: './javne-nabavke.html',
    styleUrl: './javne-nabavke.css',
})
export class JavneNabavke implements OnInit {
    private korisniciService = inject(KorisniciService)

    korisnik: any = null
    nabavke: any[] = []

    // Forma za raspisivanje
    novaStavkaSifra = ''
    novaStavkaNaziv = ''
    novaStavkaKolicina = 1
    stavkeForme: any[] = []
    poruka = ''
    uspesno = false

    ngOnInit() {
        let korisnikStr = localStorage.getItem('ulogovan')
        if (korisnikStr) {
            this.korisnik = JSON.parse(korisnikStr)
            this.ucitajNabavke()
        }
    }

    ucitajNabavke() {
        this.korisniciService.mojeNabavke(this.korisnik.korisnickoIme).subscribe((data: any[]) => {
            this.nabavke = data || []
        })
    }

    dodajStavku() {
        if (!this.novaStavkaSifra || !this.novaStavkaNaziv || this.novaStavkaKolicina < 1) return
        this.stavkeForme.push({
            sifra: this.novaStavkaSifra,
            naziv: this.novaStavkaNaziv,
            kolicina: this.novaStavkaKolicina
        })
        this.novaStavkaSifra = ''
        this.novaStavkaNaziv = ''
        this.novaStavkaKolicina = 1
    }

    ukloniStavku(index: number) {
        this.stavkeForme.splice(index, 1)
    }

    raspisi() {
        if (this.stavkeForme.length == 0) {
            this.poruka = 'Dodajte bar jednu stavku'
            this.uspesno = false
            return
        }
        this.poruka = ''
        this.korisniciService.raspisiNabavku({
            klijentId: this.korisnik.korisnickoIme,
            stavke: this.stavkeForme
        }).subscribe((odg: any) => {
            this.poruka = odg.message
            this.uspesno = odg.message.includes('uspešno')
            if (this.uspesno) {
                this.stavkeForme = []
                this.ucitajNabavke()
            }
        })
    }

    formatirajDatum(datum: string): string {
        return new Date(datum).toLocaleString('sr-Latn-RS')
    }
}
