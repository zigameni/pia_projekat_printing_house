// Usluga štampe koju štamparija nudi za konkretan proizvod
export interface UslugaStampe {
    idUsluge: string
    tipStampe: string
    dodatnaCenaPoKomadu: number
    maxSirinaMm: number
    maxVisinaMm: number
}

/**
 * Proizvod onako kako ga backend vraća (`/proizvodiStamparije`, `/dodajProizvod`).
 *
 * `stamparijaId`, `nazivStamparije` i `grad` nisu deo forme koju štampar popunjava — njih
 * server upisuje iz `Korisnik` zapisa štampara, pa su označeni kao opcioni.
 */
export interface Proizvod {
    sifra: string
    naziv: string
    opis: string
    kategorija: string
    potkategorija: string
    jedinicnaCena: number
    kolicinaNaLageru: number
    dostupneBoje: string[]
    slikaUrl: string
    dodatneSlike: string[]
    uslugeStampe: UslugaStampe[]
    aktivan: boolean
    stamparijaId?: string
    nazivStamparije?: string
    grad?: string
}

// Kategorija sa potkategorijama (`/kategorije`)
export interface Kategorija {
    naziv: string
    potkategorije: string[]
}

// Odgovor na dodavanje proizvoda
export interface NoviProizvodOdgovor {
    message: string
    proizvod?: Proizvod
}

// Zahtev za ažuriranje količine (spec 4.3)
export interface AzurirajKolicinuZahtev {
    stamparijaId: string
    sifra: string
    kolicinaNaLageru: number
}

// Odgovor na ažuriranje količine — vraća se ceo proizvod da red ne veruje lokalnoj vrednosti
export interface AzuriranaKolicinaOdgovor {
    message: string
    proizvod?: Proizvod
}
