import { Korisnik } from './korisnik'

// Svaki endpoint u authController vraća bar `message` (uspeh ili greška)
export interface PorukaOdgovor {
    message: string
}

// Prijava vraća i korisnika, ali samo kada je prijava uspešna
export interface PrijavaOdgovor extends PorukaOdgovor {
    user?: Korisnik
}
