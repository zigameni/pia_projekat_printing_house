import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProizvodiService } from '../../services/proizvodi.service';
import { KorisniciService } from '../../services/korisnici.service';

@Component({
    selector: 'app-proizvod-detelji',
    imports: [RouterLink, FormsModule],
    templateUrl: './proizvodDetalji.html',
    styleUrl: './proizvodDetalji.css',
})
export class ProizvodDetalji implements OnInit {
    private proizvodiService = inject(ProizvodiService)
    private korisniciService = inject(KorisniciService)
    private route = inject(ActivatedRoute)

    proizvod: any = null
    poruka = ''
    jeKlijent = false
    izabranaBoja = ''
    izabranaUsluga: any = null
    kolicina = 1
    tekstZaStampu = ''
    porukaDodavanja = ''
    uspesnoDodavanje = false
    korisnik: any = null
    noviKomentarTekst = ''
    novaOcena = 'svidja'
    porukaKomentar = ''

    ngOnInit() {
        let korisnikStr = localStorage.getItem('ulogovan')
        if (korisnikStr) {
            this.korisnik = JSON.parse(korisnikStr)
            this.jeKlijent = this.korisnik.tip === 'klijent'
        }

        const sifra = this.route.snapshot.paramMap.get('sifra')
        if (sifra) {
            if (this.jeKlijent) {
                this.proizvodiService.detaljiProizvodaKlijent(sifra).subscribe((odg: any) => {
                    if (odg.message) {
                        this.poruka = odg.message
                    } else {
                        this.proizvod = odg
                        this.izabranaBoja = (odg.dostupneBoje && odg.dostupneBoje.length > 0) ? odg.dostupneBoje[0] : ''
                    }
                })
            } else {
                this.proizvodiService.detaljiProizvoda(sifra).subscribe((odg: any) => {
                    if (odg.message) {
                        this.poruka = odg.message
                    } else {
                        this.proizvod = odg
                    }
                })
            }
        }
    }

    slikaPutanja(slikaUrl: string): string {
        if (slikaUrl) return `${this.proizvodiService.uri}/${slikaUrl}`
        return ''
    }

    izaberiUslugu(usluga: any) {
        this.izabranaUsluga = usluga
    }

    ukupnaCena(): number {
        if (!this.proizvod) return 0
        let cena = this.proizvod.jedinicnaCena
        if (this.izabranaUsluga) {
            cena += this.izabranaUsluga.dodatnaCenaPoKomadu
        }
        return cena
    }

    formatirajDatum(datum: string): string {
        return new Date(datum).toLocaleDateString('sr-Latn-RS')
    }

    dodajUKorpu() {
        if (!this.proizvod || !this.jeKlijent || !this.korisnik) return

        this.porukaDodavanja = ''
        this.uspesnoDodavanje = false

        this.korisniciService.dodajUKorpu({
            klijentId: this.korisnik.korisnickoIme,
            proizvodId: this.proizvod.sifra,
            stamparijaId: this.proizvod.stamparijaId || this.proizvod.nazivStamparije,
            kolicina: this.kolicina,
            tipStampe: this.izabranaUsluga ? this.izabranaUsluga.tipStampe : '',
            boja: this.izabranaBoja,
            tekst: this.tekstZaStampu.trim(),
            slika: ''
        }).subscribe((odg: any) => {
            this.porukaDodavanja = odg.message
            this.uspesnoDodavanje = odg.message === 'Uspešno dodato u korpu'
        })
    }

    posaljiKomentar() {
        if (!this.proizvod || !this.korisnik) return
        this.porukaKomentar = ''

        this.korisniciService.dodajKomentar({
            proizvodId: this.proizvod.sifra,
            korisnickoIme: this.korisnik.korisnickoIme,
            tekst: this.noviKomentarTekst,
            ocena: this.novaOcena
        }).subscribe((odg: any) => {
            this.porukaKomentar = odg.message
            if (odg.message === 'Uspešno dodat komentar') {
                this.noviKomentarTekst = ''
                this.novaOcena = 'svidja'
                // Osveži komentare
                this.korisniciService.komentariProizvoda(this.proizvod.sifra).subscribe((komentari: any[]) => {
                    if (this.proizvod) this.proizvod.komentari = komentari
                })
            }
        })
    }

    jeMojKomentar(korisnickoIme: string): boolean {
        return this.korisnik && this.korisnik.korisnickoIme === korisnickoIme
    }
}