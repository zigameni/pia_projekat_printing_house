// Stavka fakture onako kako je backend čuva i vraća
export interface StavkaFakture {
    sifra: string
    naziv: string
    kolicina: number
    tipStampe: string
    boja: string
    tekst?: string
    jedinicnaCena: number
    iznos: number
}

// Statusi koje aplikacija koristi ('placeno' se pominje u modelu, ali se nigde ne dodeljuje)
export type StatusNarudzbine = 'naruceno' | 'u stampi' | 'isporuceno' | 'primljeno'

/**
 * Faktura onako kako je vidi štampar (`/narudzbineStamparije`).
 *
 * `vrstaKlijenta` i `mozePromenitiStatus` računa **server** — frontend ne pogađa pravila
 * (status pravnih lica se menja kroz javne nabavke, a fizičkim licima samo korak napred).
 */
export interface NarudzbinaStamparije {
    idFakture: string
    klijentId: string
    klijentIme: string
    stamparijaId: string
    nazivStamparije: string
    grad: string
    stavke: StavkaFakture[]
    ukupanIznos: number
    datumIzdavanja: string
    status: string
    vrstaKlijenta: string
    mozePromenitiStatus: boolean
}

// Zahtev za promenu statusa (spec 4.5)
export interface PromenaStatusaZahtev {
    idFakture: string
    stamparijaId: string
    noviStatus: string
}

// Odgovor vraća i osveženu fakturu, da red ne mora ponovo da se učitava
export interface PromenaStatusaOdgovor {
    message: string
    faktura?: NarudzbinaStamparije
}
