import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StamparService } from '../../services/stampar.service';
import { Korisnik, NarudzbinaStamparije, PromenaStatusaOdgovor } from '../../models';

@Component({
    selector: 'app-stampar-narudzbine',
    imports: [RouterLink],
    templateUrl: './stamparNarudzbine.html',
    styleUrl: './stamparNarudzbine.css',
})
export class StamparNarudzbine implements OnInit {
    private stamparService = inject(StamparService)

    korisnik: Korisnik | null = null
    narudzbine: NarudzbinaStamparije[] = []

    poruka = ''
    greska = ''

    ngOnInit() {
        const str = localStorage.getItem('ulogovan')
        if (str) this.korisnik = JSON.parse(str) as Korisnik
        this.ucitajNarudzbine()
    }

    ucitajNarudzbine() {
        if (!this.korisnik) return
        this.stamparService.narudzbineStamparije(this.korisnik.korisnickoIme).subscribe((narudzbine: NarudzbinaStamparije[]) => {
            this.narudzbine = narudzbine
        })
    }

    // Dozvoljen je samo sledeći korak: naruceno -> u stampi -> isporuceno.
    // Da li je korak dozvoljen odlučuje server (`mozePromenitiStatus`).
    sledeciKorak(n: NarudzbinaStamparije): { status: string, tekst: string } | null {
        if (!n.mozePromenitiStatus) return null
        if (n.status == 'naruceno') return { status: 'u stampi', tekst: 'Prebaci u štampu' }
        if (n.status == 'u stampi') return { status: 'isporuceno', tekst: 'Označi kao isporučeno' }
        return null
    }

    promeniStatus(n: NarudzbinaStamparije) {
        if (!this.korisnik) return

        const korak = this.sledeciKorak(n)
        if (!korak) return

        this.poruka = ''
        this.greska = ''

        this.stamparService.promeniStatusNarudzbine({
            idFakture: n.idFakture,
            stamparijaId: this.korisnik.korisnickoIme,
            noviStatus: korak.status
        }).subscribe((odg: PromenaStatusaOdgovor) => {
            if (odg.faktura) {
                const sacuvana = odg.faktura
                // Red se osvežava iz odgovora servera — i mozePromenitiStatus se menja
                this.narudzbine = this.narudzbine.map((x) => (x.idFakture == sacuvana.idFakture ? sacuvana : x))
                this.poruka = sacuvana.idFakture + ': ' + odg.message
            } else {
                this.greska = odg.message
            }
        })
    }

    // Status "u stampi" ima razmak, pa ne može direktno u ime CSS klase
    statusKlasa(status: string): string {
        return 'status-badge ' + (status == 'u stampi' ? 'status-u-stampi' : 'status-' + status)
    }

    vrstaKlijentaTekst(vrsta: string): string {
        if (vrsta == 'pravno') return 'pravno lice'
        if (vrsta == 'fizicko') return 'fizičko lice'
        return '—'
    }

    datum(iso: string): string {
        if (!iso) return '—'
        const d = new Date(iso)
        return d.toLocaleDateString('sr-RS') + ' ' + d.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
    }
}
