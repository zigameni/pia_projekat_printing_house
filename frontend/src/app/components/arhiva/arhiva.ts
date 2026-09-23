import { Component, inject, OnInit } from '@angular/core';
import { KorisniciService } from '../../services/korisnici.service';

@Component({
    selector: 'app-arhiva',
    templateUrl: './arhiva.html',
    styleUrl: './arhiva.css',
})
export class Arhiva implements OnInit {
    private korisniciService = inject(KorisniciService)

    korisnik: any = null
    stavke: any[] = []
    poruka = ''

    ngOnInit() {
        let korisnikStr = localStorage.getItem('ulogovan')
        if (korisnikStr) {
            this.korisnik = JSON.parse(korisnikStr)
            this.ucitajArhivu()
        }
    }

    ucitajArhivu() {
        this.korisniciService.arhivaProizvoda(this.korisnik.korisnickoIme).subscribe((data: any[]) => {
            this.stavke = data || []
        })
    }

    promeniStatus(idFakture: string) {
        this.korisniciService.promeniStatusPrimljeno(idFakture).subscribe((odg: any) => {
            this.poruka = odg.message
            if (odg.message === 'Uspešno označeno kao primljeno') {
                this.ucitajArhivu()
            }
        })
    }

    formatirajDatum(datum: string): string {
        return new Date(datum).toLocaleDateString('sr-Latn-RS')
    }
}
