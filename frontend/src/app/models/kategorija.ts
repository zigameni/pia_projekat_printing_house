// ==== Faza 8: administratorsko upravljanje kategorijama (spec 5.2) ====
//
// Namerno odvojeno od `Kategorija` iz `models/proizvod.ts`, koju koristi štampar:
// tamo su potkategorije samo niz imena, a ovde nose i broj proizvoda koji ih koristi.

/** Potkategorija sa brojem proizvoda koji je koriste (uključujući neaktivne). */
export interface AdminPotkategorija {
    naziv: string
    brojProizvoda: number
}

/** Kategorija onako kako je vraća `GET /sveKategorije` (samo administrator). */
export interface AdminKategorija {
    naziv: string
    brojProizvoda: number
    potkategorije: AdminPotkategorija[]
}

// ==== Zahtevi za izmene ====
// Svi nose `adminId`, jer svaka administrativna ruta proverava ko je poziva.

export interface DodajKategorijuZahtev {
    adminId: string
    naziv: string
}

export interface DodajPotkategorijuZahtev {
    adminId: string
    kategorija: string
    potkategorija: string
}

export interface ObrisiKategorijuZahtev {
    adminId: string
    naziv: string
}

export interface ObrisiPotkategorijuZahtev {
    adminId: string
    kategorija: string
    potkategorija: string
}
