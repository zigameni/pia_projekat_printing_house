import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PrijavaOdgovor } from '../models';

@Injectable({ providedIn: 'root' })
export class KorisniciService {
    uri = 'http://localhost:4000'
    private http = inject(HttpClient)

    // ==== Faza 3: profil klijenta ====
    narudzbineKlijenta(klijentId: string) {
        return this.http.get<any[]>(`${this.uri}/narudzbineKlijenta`, { params: { klijentId } })
    }

    // ==== N-1: ažuriranje profila (multipart — opciona nova slika) ====
    azurirajProfil(forma: FormData): Observable<PrijavaOdgovor> {
        return this.http.post<PrijavaOdgovor>(`${this.uri}/azurirajProfil`, forma)
    }

    // ==== Faza 4: korpa ====
    dodajUKorpu(podaci: any) {
        return this.http.post<any>(`${this.uri}/dodajUKorpu`, podaci)
    }

    ukloniIzKorpe(podaci: any) {
        return this.http.post<any>(`${this.uri}/ukloniIzKorpe`, podaci)
    }

    korpaKlijenta(klijentId: string) {
        return this.http.get<any[]>(`${this.uri}/korpaKlijenta`, { params: { klijentId } })
    }

    potvrdiKorpu(klijentId: string) {
        return this.http.post<any>(`${this.uri}/potvrdiKorpu`, { klijentId })
    }

    // ==== Faza 5: arhiva ====
    arhivaProizvoda(klijentId: string) {
        return this.http.get<any[]>(`${this.uri}/arhivaProizvoda`, { params: { klijentId } })
    }

    promeniStatusPrimljeno(idFakture: string) {
        return this.http.post<any>(`${this.uri}/promeniStatusPrimljeno`, { idFakture })
    }

    // ==== Faza 5: komentari ====
    dodajKomentar(podaci: any) {
        return this.http.post<any>(`${this.uri}/dodajKomentar`, podaci)
    }

    komentariProizvoda(proizvodId: string) {
        return this.http.get<any[]>(`${this.uri}/komentariProizvoda`, { params: { proizvodId } })
    }

    // ==== Faza 6: javne nabavke ====
    raspisiNabavku(podaci: any) {
        return this.http.post<any>(`${this.uri}/raspisiNabavku`, podaci)
    }

    otvoreneNabavke(stamparijaId: string) {
        return this.http.get<any[]>(`${this.uri}/otvoreneNabavke`, { params: { stamparijaId } })
    }

    posaljiPonudu(podaci: any) {
        return this.http.post<any>(`${this.uri}/posaljiPonudu`, podaci)
    }

    mojeNabavke(klijentId: string) {
        return this.http.get<any[]>(`${this.uri}/mojeNabavke`, { params: { klijentId } })
    }
}
