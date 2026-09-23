import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    AdminKategorija, AzuriranjeKorisnikaZahtev, BrisanjeKorisnikaOdgovor, BrisanjeKorisnikaZahtev,
    DodajKategorijuZahtev, DodajPotkategorijuZahtev, Korisnik, ObradaZahtevaZahtev,
    ObrisiKategorijuZahtev, ObrisiPotkategorijuZahtev, OdbijanjeZahtevaOdgovor, PorukaOdgovor,
    PrijavaOdgovor
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
    uri = 'http://localhost:4000'
    private http = inject(HttpClient)

    // ==== Faza 8: administrator — korisnički nalozi (spec 5.1) ====
    sviKorisnici(adminId: string): Observable<Korisnik[]> {
        return this.http.get<Korisnik[]>(`${this.uri}/sviKorisnici`, { params: { adminId } })
    }

    // Server vraća `{ message, user }` — isti oblik kao ažuriranje profila
    azurirajKorisnika(podaci: AzuriranjeKorisnikaZahtev): Observable<PrijavaOdgovor> {
        return this.http.post<PrijavaOdgovor>(`${this.uri}/azurirajKorisnika`, podaci)
    }

    obrisiKorisnika(podaci: BrisanjeKorisnikaZahtev): Observable<BrisanjeKorisnikaOdgovor> {
        return this.http.post<BrisanjeKorisnikaOdgovor>(`${this.uri}/obrisiKorisnika`, podaci)
    }

    // ==== Faza 8: administrator — zahtevi za registraciju (spec 5.1) ====
    // Vraća samo naloge u statusu `na_cekanju`; neovlašćen poziv vraća praznu listu.
    neodobreniKorisnici(adminId: string): Observable<Korisnik[]> {
        return this.http.get<Korisnik[]>(`${this.uri}/neodobreniKorisnici`, { params: { adminId } })
    }

    odobriKorisnika(podaci: ObradaZahtevaZahtev): Observable<PrijavaOdgovor> {
        return this.http.post<PrijavaOdgovor>(`${this.uri}/odobriKorisnika`, podaci)
    }

    odbijKorisnika(podaci: ObradaZahtevaZahtev): Observable<OdbijanjeZahtevaOdgovor> {
        return this.http.post<OdbijanjeZahtevaOdgovor>(`${this.uri}/odbijKorisnika`, podaci)
    }

    // ==== Faza 8: administrator — kategorije (spec 5.2) ====
    // Neovlašćen poziv vraća praznu listu, kao i `sviKorisnici` / `neodobreniKorisnici`.
    sveKategorije(adminId: string): Observable<AdminKategorija[]> {
        return this.http.get<AdminKategorija[]>(`${this.uri}/sveKategorije`, { params: { adminId } })
    }

    // Poruke o uspehu su stalne (bez naziva) — ime u poruci sastavlja komponenta,
    // isto kao što `azurirajKorisnika` vraća samo „Uspešno".
    dodajKategoriju(podaci: DodajKategorijuZahtev): Observable<PorukaOdgovor> {
        return this.http.post<PorukaOdgovor>(`${this.uri}/dodajKategoriju`, podaci)
    }

    dodajPotkategoriju(podaci: DodajPotkategorijuZahtev): Observable<PorukaOdgovor> {
        return this.http.post<PorukaOdgovor>(`${this.uri}/dodajPotkategoriju`, podaci)
    }

    obrisiKategoriju(podaci: ObrisiKategorijuZahtev): Observable<PorukaOdgovor> {
        return this.http.post<PorukaOdgovor>(`${this.uri}/obrisiKategoriju`, podaci)
    }

    obrisiPotkategoriju(podaci: ObrisiPotkategorijuZahtev): Observable<PorukaOdgovor> {
        return this.http.post<PorukaOdgovor>(`${this.uri}/obrisiPotkategoriju`, podaci)
    }
}
