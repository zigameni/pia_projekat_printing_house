import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    AzurirajKolicinuZahtev, AzuriranaKolicinaOdgovor, Kategorija, NarudzbinaStamparije,
    NoviProizvodOdgovor, Proizvod, PromenaStatusaOdgovor, PromenaStatusaZahtev
} from '../models';

@Injectable({ providedIn: 'root' })
export class StamparService {
    uri = 'http://localhost:4000'
    private http = inject(HttpClient)

    // ==== Faza 7: štampar — proizvodi i usluge ====
    kategorije(): Observable<Kategorija[]> {
        return this.http.get<Kategorija[]>(`${this.uri}/kategorije`)
    }

    proizvodiStamparije(stamparijaId: string): Observable<Proizvod[]> {
        return this.http.get<Proizvod[]>(`${this.uri}/proizvodiStamparije`, { params: { stamparijaId } })
    }

    dodajProizvod(forma: FormData): Observable<NoviProizvodOdgovor> {
        return this.http.post<NoviProizvodOdgovor>(`${this.uri}/dodajProizvod`, forma)
    }

    // Bez fajla, pa ide kao JSON (ne multipart kao dodajProizvod)
    azurirajKolicinu(podaci: AzurirajKolicinuZahtev): Observable<AzuriranaKolicinaOdgovor> {
        return this.http.post<AzuriranaKolicinaOdgovor>(`${this.uri}/azurirajKolicinu`, podaci)
    }

    // ==== Faza 7: narudžbine štampara (spec 4.5) ====
    narudzbineStamparije(stamparijaId: string): Observable<NarudzbinaStamparije[]> {
        return this.http.get<NarudzbinaStamparije[]>(`${this.uri}/narudzbineStamparije`, { params: { stamparijaId } })
    }

    promeniStatusNarudzbine(podaci: PromenaStatusaZahtev): Observable<PromenaStatusaOdgovor> {
        return this.http.post<PromenaStatusaOdgovor>(`${this.uri}/promeniStatusNarudzbine`, podaci)
    }
}
