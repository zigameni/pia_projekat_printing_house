import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProizvodiService {
    uri = 'http://localhost:4000'
    private http = inject(HttpClient)

    // ==== Faza 2: javni deo (proizvodi) ====
    brojStamparija() {
        return this.http.get<any>(`${this.uri}/brojStamparija`)
    }

    top5Proizvoda() {
        return this.http.get<any[]>(`${this.uri}/top5Proizvoda`)
    }

    kategorijeZaPretragu() {
        return this.http.get<string[]>(`${this.uri}/kategorijeZaPretragu`)
    }

    gradoviIStamparije() {
        return this.http.get<{ gradovi: string[]; stamparije: { id: string; naziv: string }[] }>(`${this.uri}/gradoviIStamparije`)
    }

    pretragaProizvoda(naziv: string, kategorija: string, grad: string, stamparija: string) {
        const params: any = {}
        if (naziv) params.naziv = naziv
        if (kategorija) params.kategorija = kategorija
        if (grad) params.grad = grad
        if (stamparija) params.stamparija = stamparija
        return this.http.get<any[]>(`${this.uri}/pretragaProizvoda`, { params })
    }

    detaljiProizvoda(sifra: string) {
        return this.http.get<any>(`${this.uri}/detaljiProizvoda/${sifra}`)
    }

    detaljiProizvodaKlijent(sifra: string) {
        return this.http.get<any>(`${this.uri}/detaljiProizvodaKlijent/${sifra}`)
    }
}