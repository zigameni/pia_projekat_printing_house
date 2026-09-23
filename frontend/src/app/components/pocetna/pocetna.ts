import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProizvodiService } from '../../services/proizvodi.service';

@Component({
    selector: 'app-pocetna',
    imports: [FormsModule, RouterLink],
    templateUrl: './pocetna.html',
    styleUrl: './pocetna.css',
})
export class Pocetna implements OnInit {
    private proizvodiService = inject(ProizvodiService)

    brojStamparija = 0
    top5: any[] = []
    kategorije: string[] = []
    gradovi: string[] = []
    stamparije: { id: string; naziv: string }[] = []

    naziv = ''
    kategorija = ''
    grad = ''
    stamparija = ''
    rezultati: any[] = []

    // Sortiranje tabele rezultata: 'naziv' ili 'cena'
    sortKolona: 'naziv' | 'cena' = 'naziv'
    sortOpadajuce = false

    ngOnInit() {
        this.proizvodiService.brojStamparija().subscribe((odg: any) => {
            this.brojStamparija = odg.broj
        })
        this.proizvodiService.top5Proizvoda().subscribe((odg: any[]) => {
            this.top5 = odg
        })
        this.proizvodiService.kategorijeZaPretragu().subscribe((odg: string[]) => {
            this.kategorije = odg
        })
        this.proizvodiService.gradoviIStamparije().subscribe((odg) => {
            this.gradovi = odg.gradovi || []
            this.stamparije = odg.stamparije || []
        })
        this.pretrazi()
    }

    pretrazi() {
        this.proizvodiService.pretragaProizvoda(this.naziv, this.kategorija, this.grad, this.stamparija)
            .subscribe((odg: any[]) => {
                this.rezultati = odg
                this.primeniSortiranje()
            })
    }

    ocisti() {
        this.naziv = ''
        this.kategorija = ''
        this.grad = ''
        this.stamparija = ''
        this.pretrazi()
    }

    // Klik na zaglavlje kolone: ista kolona menja smer, nova kreće od rastuće
    sortiraj(kolona: 'naziv' | 'cena') {
        if (this.sortKolona === kolona) {
            this.sortOpadajuce = !this.sortOpadajuce
        } else {
            this.sortKolona = kolona
            this.sortOpadajuce = false
        }
        this.primeniSortiranje()
    }

    primeniSortiranje() {
        const smer = this.sortOpadajuce ? -1 : 1
        this.rezultati = [...this.rezultati].sort((a: any, b: any) => {
            const r = this.sortKolona === 'cena'
                ? Number(a.jedinicnaCena) - Number(b.jedinicnaCena)
                : (a.naziv || '').localeCompare(b.naziv || '')
            return smer * r
        })
    }

    // Aktivna kolona pokazuje strelicu smera, ostale podsećaju da su klikabilne
    strelica(kolona: 'naziv' | 'cena'): string {
        if (this.sortKolona !== kolona) return '⇅'
        return this.sortOpadajuce ? '↓' : '↑'
    }

    jeAktivna(kolona: 'naziv' | 'cena'): boolean {
        return this.sortKolona === kolona
    }
}