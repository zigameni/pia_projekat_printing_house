// Korisnik bez lozinke (za odgovore na frontend)
export const bezLozinke = (k: any) => {
    return {
        korisnickoIme: k.korisnickoIme,
        ime: k.ime,
        prezime: k.prezime,
        telefon: k.telefon,
        email: k.email,
        tip: k.tip,
        vrsta: k.vrsta,
        slika: k.slika,
        status: k.status,
        nazivInstitucije: k.nazivInstitucije,
        adresa: k.adresa,
        grad: k.grad,
        maticniBroj: k.maticniBroj,
        pib: k.pib
    }
}