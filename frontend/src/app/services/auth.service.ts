import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PorukaOdgovor, PrijavaOdgovor } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
    uri = 'http://localhost:4000'
    private http = inject(HttpClient)

    // ==== Faza 1: autentifikacija ====
    login(korisnickoIme: string, lozinka: string): Observable<PrijavaOdgovor> {
        return this.http.post<PrijavaOdgovor>(`${this.uri}/login`, { korisnickoIme, lozinka })
    }

    loginAdmin(korisnickoIme: string, lozinka: string): Observable<PrijavaOdgovor> {
        return this.http.post<PrijavaOdgovor>(`${this.uri}/loginAdmin`, { korisnickoIme, lozinka })
    }

    registracijaFizickoLice(fd: FormData): Observable<PorukaOdgovor> {
        return this.http.post<PorukaOdgovor>(`${this.uri}/registracijaFizickoLice`, fd)
    }

    registracijaPravnoLice(fd: FormData): Observable<PorukaOdgovor> {
        return this.http.post<PorukaOdgovor>(`${this.uri}/registracijaPravnoLice`, fd)
    }

    registracijaStampara(fd: FormData): Observable<PorukaOdgovor> {
        return this.http.post<PorukaOdgovor>(`${this.uri}/registracijaStampara`, fd)
    }
}
