// Tipovi korisnika u sistemu (odgovaraju poljima iz backend modela `korisnici`)
export type TipKorisnika = 'admin' | 'klijent' | 'stampar'

// Vrsta klijenta — štampar i admin je nemaju (prazan string / undefined)
export type VrstaKlijenta = 'fizicko' | 'pravno' | ''

// Status naloga — pravna lica i štamparije počinju kao `na_cekanju`
export type StatusKorisnika = 'aktivan' | 'neaktivan' | 'na_cekanju'

/**
 * Korisnik onako kako ga backend vraća na frontend.
 *
 * Namerno prati `bezLozinke()` iz `backend/src/utils/korisnikUtils.ts`, a ne Mongoose šemu:
 * - `lozinka` (hash) se NIKAD ne šalje klijentu,
 * - `_id` se ne šalje, pa ga ovde nema.
 */
export interface Korisnik {
    korisnickoIme: string
    ime: string
    prezime: string
    telefon: string
    email: string
    tip: TipKorisnika
    vrsta?: VrstaKlijenta
    slika?: string
    status: StatusKorisnika
    nazivInstitucije?: string
    adresa?: string
    grad?: string
    maticniBroj?: string
    pib?: string
}

// ==== Faza 8: administratorska izmena tuđeg naloga (spec 5.1) ====
// Ista polja kao `Korisnik` + `adminId` (identifikacija administratora koji menja).
// `korisnickoIme` se šalje, ali se na serveru NE menja — identifikacija naloga (spec 3.1).
export interface AzuriranjeKorisnikaZahtev extends Korisnik {
    adminId: string
}

export interface BrisanjeKorisnikaZahtev {
    adminId: string
    korisnickoIme: string
}

// Odgovor na brisanje — broj proizvoda koji su otišli sa nalogom štampara
export interface BrisanjeKorisnikaOdgovor {
    message: string
    obrisanihProizvoda?: number
}

// ==== Faza 8: obrada zahteva za registraciju (spec 5.1) ====
// Prihvatanje i odbijanje traže isti identifikator zahteva.
export interface ObradaZahtevaZahtev {
    adminId: string
    korisnickoIme: string
}

// Odbijanje briše zahtev, pa odgovor vraća i broj proizvoda koji su otišli sa njim
// (zahtev štampara u praksi nema proizvoda, ali polje postoji isto kao kod brisanja naloga)
export interface OdbijanjeZahtevaOdgovor {
    message: string
    obrisanihProizvoda?: number
}
