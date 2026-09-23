import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AdminKategorija, AdminPotkategorija, Korisnik, PorukaOdgovor } from '../../models';

@Component({
    selector: 'app-admin-kategorije',
    imports: [RouterLink, FormsModule],
    templateUrl: './adminKategorije.html',
    styleUrl: './adminKategorije.css',
})
export class AdminKategorije implements OnInit {
    private adminService = inject(AdminService)

    korisnik: Korisnik | null = null
    kategorije: AdminKategorija[] = []

    // Forma za novu kategoriju
    novaKategorija = ''

    // Unos nove potkategorije po kategoriji (ključ = naziv kategorije)
    noviUnosi: { [naziv: string]: string } = {}

    // Brisanje u dva koraka — bez `window.confirm` dijaloga (kao i na ostalim admin stranama)
    brisanjeKategorije = ''
    brisanjePotkategorije = ''   // „kategorija|potkategorija"

    poruka = ''
    greska = ''

    ngOnInit() {
        const str = localStorage.getItem('ulogovan')
        if (str) this.korisnik = JSON.parse(str) as Korisnik
        this.ucitajKategorije()
    }

    ucitajKategorije() {
        if (!this.korisnik) return
        this.adminService.sveKategorije(this.korisnik.korisnickoIme)
            .subscribe((kategorije: AdminKategorija[]) => {
                this.kategorije = kategorije
            })
    }

    // ==== Dodavanje kategorije ====
    dodajKategoriju() {
        if (!this.korisnik) return

        this.poruka = ''
        this.greska = ''

        // Ista provera kao na serveru — greška obično stigne bez odlaska na server
        const naziv = this.novaKategorija.trim()
        if (!naziv) {
            this.greska = 'Naziv kategorije je obavezan'
            return
        }

        this.adminService.dodajKategoriju({ adminId: this.korisnik.korisnickoIme, naziv: naziv })
            .subscribe((odg: PorukaOdgovor) => {
                if (odg.message == 'Kategorija je dodata') {
                    // Ime u poruci sastavlja frontend — server vraća stalnu poruku
                    this.poruka = `Kategorija „${naziv}“ je dodata`
                    this.novaKategorija = ''
                    this.ucitajKategorije()
                } else {
                    this.greska = odg.message
                }
            })
    }

    // ==== Dodavanje potkategorije u određenu kategoriju ====
    dodajPotkategoriju(k: AdminKategorija) {
        if (!this.korisnik) return

        this.poruka = ''
        this.greska = ''
        this.otkaziBrisanje()

        const naziv = (this.noviUnosi[k.naziv] || '').trim()
        if (!naziv) {
            this.greska = 'Naziv potkategorije je obavezan'
            return
        }

        this.adminService.dodajPotkategoriju({
            adminId: this.korisnik.korisnickoIme,
            kategorija: k.naziv,
            potkategorija: naziv
        }).subscribe((odg: PorukaOdgovor) => {
            if (odg.message == 'Potkategorija je dodata') {
                this.poruka = `Potkategorija „${naziv}“ je dodata u kategoriju „${k.naziv}“`
                this.noviUnosi[k.naziv] = ''
                this.ucitajKategorije()
            } else {
                this.greska = odg.message
            }
        })
    }

    // ==== Brisanje (dva koraka) ====
    zapocniBrisanjeKategorije(k: AdminKategorija) {
        this.poruka = ''
        this.greska = ''
        this.brisanjePotkategorije = ''
        this.brisanjeKategorije = k.naziv
    }

    zapocniBrisanjePotkategorije(k: AdminKategorija, p: AdminPotkategorija) {
        this.poruka = ''
        this.greska = ''
        this.brisanjeKategorije = ''
        this.brisanjePotkategorije = this.kljuc(k, p)
    }

    otkaziBrisanje() {
        this.brisanjeKategorije = ''
        this.brisanjePotkategorije = ''
    }

    obrisiKategoriju(k: AdminKategorija) {
        if (!this.korisnik) return

        this.poruka = ''
        this.greska = ''

        this.adminService.obrisiKategoriju({ adminId: this.korisnik.korisnickoIme, naziv: k.naziv })
            .subscribe((odg: PorukaOdgovor) => {
                if (odg.message == 'Kategorija je obrisana') {
                    this.poruka = `Kategorija „${k.naziv}“ je obrisana`
                    this.brisanjeKategorije = ''
                    this.ucitajKategorije()
                } else {
                    // Npr. kategoriju koriste proizvodi — poruka servera se prikazuje takva kakva jeste
                    this.greska = odg.message
                    this.brisanjeKategorije = ''
                }
            })
    }

    obrisiPotkategoriju(k: AdminKategorija, p: AdminPotkategorija) {
        if (!this.korisnik) return

        this.poruka = ''
        this.greska = ''

        this.adminService.obrisiPotkategoriju({
            adminId: this.korisnik.korisnickoIme,
            kategorija: k.naziv,
            potkategorija: p.naziv
        }).subscribe((odg: PorukaOdgovor) => {
            if (odg.message == 'Potkategorija je obrisana') {
                this.poruka = `Potkategorija „${p.naziv}“ je obrisana`
                this.brisanjePotkategorije = ''
                this.ucitajKategorije()
            } else {
                this.greska = odg.message
                this.brisanjePotkategorije = ''
            }
        })
    }

    // ==== Prikaz ====
    // Ključ za poređenje reda koji je u režimu potvrde brisanja
    kljuc(k: AdminKategorija, p: AdminPotkategorija): string {
        return k.naziv + '|' + p.naziv
    }

    // Srpsko slaganje broja: 1 proizvod / 2-4 proizvoda / 5+ proizvoda
    tekstProizvoda(broj: number): string {
        const zadnjeDve = broj % 100
        const imenica = (broj % 10 == 1 && zadnjeDve != 11) ? 'proizvod' : 'proizvoda'
        return broj + ' ' + imenica
    }
}
