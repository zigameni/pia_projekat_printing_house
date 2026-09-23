import mongoose from "mongoose"
import bcrypt from "bcrypt"
import Korisnik from "./models/korisnici"
import Kategorija from "./models/kategorije"
import Proizvod from "./models/proizvodi"
import Faktura from "./models/fakture"
import JavnaNabavka from "./models/javneNabavke"
import Ponuda from "./models/ponude"
import Komentar from "./models/komentari"

const URI = "mongodb://127.0.0.1:27017/printing_house"
// Zajednicka test lozinka za sve korisnike (odgovara regex pravilima iz zadatka)
const SIFRA = "Admin123!"

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000)
const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000)

async function seed() {
    await mongoose.connect(URI)
    console.log("Povezan na MongoDB - printing_house")

    // 1. Cistimo sve kolekcije
    await Promise.all([
        Korisnik.deleteMany({}),
        Kategorija.deleteMany({}),
        Proizvod.deleteMany({}),
        Faktura.deleteMany({}),
        JavnaNabavka.deleteMany({}),
        Ponuda.deleteMany({}),
        Komentar.deleteMany({})
    ])
    console.log("Stare kolekcije obrisane")

    const hash = await bcrypt.hash(SIFRA, 10)

    // 2. Korisnici
    const korisnici = [
        { korisnickoIme: "admin", lozinka: hash, ime: "Petar", prezime: "Petrović", telefon: "0601112223", email: "admin@printinghouse.rs", tip: "admin", status: "aktivan" },
        { korisnickoIme: "marko.markovic", lozinka: hash, ime: "Marko", prezime: "Marković", telefon: "0641112223", email: "marko.markovic@gmail.com", tip: "klijent", vrsta: "fizicko", grad: "Beograd", status: "aktivan" },
        { korisnickoIme: "jovana.jovanovic", lozinka: hash, ime: "Jovana", prezime: "Jovanović", telefon: "0652223334", email: "jovana.jovanovic@gmail.com", tip: "klijent", vrsta: "fizicko", grad: "Novi Sad", status: "aktivan" },
        { korisnickoIme: "nenad.nedic", lozinka: hash, ime: "Nenad", prezime: "Nedić", telefon: "0633334445", email: "nenad.nedic@trgoprom.rs", tip: "klijent", vrsta: "pravno", nazivInstitucije: "TRGOPROM doo", adresa: "Bulevar kralja Aleksandra 12", grad: "Beograd", maticniBroj: "12345678", pib: "112233445", status: "aktivan" },
        { korisnickoIme: "kopistudio", lozinka: hash, ime: "Milan", prezime: "Simić", telefon: "0614445556", email: "kopistudio@kumanovska.rs", tip: "stampar", nazivInstitucije: "Copy Studio Kumanovska", adresa: "Kumanovska 18", grad: "Beograd", maticniBroj: "23456789", pib: "223344556", status: "aktivan" },
        { korisnickoIme: "grafika", lozinka: hash, ime: "Ivana", prezime: "Kostić", telefon: "0625556667", email: "grafika@artprint.rs", tip: "stampar", nazivInstitucije: "Grafika Art Print", adresa: "Bulevar oslobođenja 45", grad: "Novi Sad", maticniBroj: "34567890", pib: "334455667", status: "aktivan" },
        { korisnickoIme: "stamparija.centar", lozinka: hash, ime: "Zoran", prezime: "Ilić", telefon: "0696667778", email: "centar@stamparijacentar.rs", tip: "stampar", nazivInstitucije: "Štamparija Centar", adresa: "Obrenovićeva 7", grad: "Niš", maticniBroj: "45678901", pib: "445566778", status: "aktivan" },
        { korisnickoIme: "nova.stamparija", lozinka: hash, ime: "Jelena", prezime: "Stanković", telefon: "0607778889", email: "jelena@novastampa.rs", tip: "stampar", nazivInstitucije: "Nova Štamparija", adresa: "Kneza Miloša 3", grad: "Kragujevac", maticniBroj: "56789012", pib: "556677889", status: "na_cekanju" },
        { korisnickoIme: "nova.firma", lozinka: hash, ime: "Stefan", prezime: "Vasić", telefon: "0608889990", email: "stefan.vasic@novafirma.rs", tip: "klijent", vrsta: "pravno", nazivInstitucije: "Nova Firma doo", adresa: "Uzun Mirkova 5", grad: "Beograd", maticniBroj: "67890123", pib: "667788990", status: "na_cekanju" }
    ]
    await Korisnik.insertMany(korisnici)
    console.log(`Korisnici: ${korisnici.length}`)

    // 3. Kategorije i potkategorije
    const kategorije = [
        { naziv: "Štampa malih formata", potkategorije: ["Olovke", "Vizit karte", "Flajeri", "Zahvalnice", "Pozivnice", "Fascikle"] },
        { naziv: "Štampa velikih formata", potkategorije: ["Posteri", "Rollups", "Fototapete"] },
        { naziv: "Kreativne štampe", potkategorije: ["Šolje", "Štampa na majicama", "Štampa na duksericama", "Štampa na cegerima"] }
    ]
    await Kategorija.insertMany(kategorije)
    console.log(`Kategorije: ${kategorije.length}`)

    // 4. Proizvodi (primer iz Priloga 1 + dodatni za ostale štamparije)
    const proizvodi = [
        {
            stamparijaId: "kopistudio", nazivStamparije: "Copy Studio Kumanovska", grad: "Beograd",
            sifra: "PR-001", naziv: "Pamucna Polo Majica",
            opis: "Kvalitetna pamučna polo majica 180g/m2, pogodna za brendiranje i korporativne uniforme.",
            kategorija: "Kreativne štampe", potkategorija: "Štampa na majicama",
            jedinicnaCena: 1200, kolicinaNaLageru: 150,
            dostupneBoje: ["Bela", "Crna", "Tamno plava", "Siva"],
            slikaUrl: "", dodatneSlike: [],
            uslugeStampe: [
                { idUsluge: "USL-01", tipStampe: "Direktna štampa na tekstil (DTG)", dodatnaCenaPoKomadu: 350, maxSirinaMm: 300, maxVisinaMm: 400 },
                { idUsluge: "USL-02", tipStampe: "Preslikač (Sito preslikač)", dodatnaCenaPoKomadu: 200, maxSirinaMm: 280, maxVisinaMm: 350 }
            ],
            aktivan: true
        },
        {
            stamparijaId: "kopistudio", nazivStamparije: "Copy Studio Kumanovska", grad: "Beograd",
            sifra: "PR-002", naziv: "Keramička šolja 330ml",
            opis: "Bela keramička šolja visokog sjaja, idealna za sublimacionu štampu visoke rezolucije.",
            kategorija: "Kreativne štampe", potkategorija: "Šolje",
            jedinicnaCena: 320, kolicinaNaLageru: 500,
            dostupneBoje: ["Bela"],
            slikaUrl: "", dodatneSlike: [],
            uslugeStampe: [
                { idUsluge: "USL-03", tipStampe: "Sublimaciona štampa", dodatnaCenaPoKomadu: 150, maxSirinaMm: 200, maxVisinaMm: 85 }
            ],
            aktivan: true
        },
        {
            stamparijaId: "kopistudio", nazivStamparije: "Copy Studio Kumanovska", grad: "Beograd",
            sifra: "PR-003", naziv: "Promotivni Roll-up Baner 85x200cm",
            opis: "Lagan aluminijumski mehanizam sa torbom i štampom na kvalitetnom baner platnu.",
            kategorija: "Štampa velikih formata", potkategorija: "Rollups",
            jedinicnaCena: 4500, kolicinaNaLageru: 20,
            dostupneBoje: ["Bela", "Crna"],
            slikaUrl: "", dodatneSlike: [],
            uslugeStampe: [
                { idUsluge: "USL-04", tipStampe: "Eko-solventna štampa visoke rezolucije", dodatnaCenaPoKomadu: 800, maxSirinaMm: 850, maxVisinaMm: 2000 }
            ],
            aktivan: true
        },
        {
            stamparijaId: "grafika", nazivStamparije: "Grafika Art Print", grad: "Novi Sad",
            sifra: "GPR-001", naziv: "Hemijska olovka",
            opis: "Klasična hemijska olovka sa poklopcem, pogodna za graviranje logotipa i promo akcije.",
            kategorija: "Štampa malih formata", potkategorija: "Olovke",
            jedinicnaCena: 45, kolicinaNaLageru: 2000,
            dostupneBoje: ["Crna", "Plava", "Crvena"],
            slikaUrl: "", dodatneSlike: [],
            uslugeStampe: [
                { idUsluge: "USL-G1", tipStampe: "Graviranje", dodatnaCenaPoKomadu: 30, maxSirinaMm: 80, maxVisinaMm: 8 }
            ],
            aktivan: true
        },
        {
            stamparijaId: "grafika", nazivStamparije: "Grafika Art Print", grad: "Novi Sad",
            sifra: "GPR-002", naziv: "Vizit karta",
            opis: "Premijum vizit karta na kartonu 350g/m2 sa mat ili sjajnom laminacijom.",
            kategorija: "Štampa malih formata", potkategorija: "Vizit karte",
            jedinicnaCena: 8, kolicinaNaLageru: 10000,
            dostupneBoje: ["Bela", "Bež", "Crna"],
            slikaUrl: "", dodatneSlike: [],
            uslugeStampe: [
                { idUsluge: "USL-G2", tipStampe: "Digitalna štampa", dodatnaCenaPoKomadu: 5, maxSirinaMm: 90, maxVisinaMm: 55 }
            ],
            aktivan: false   // test: ne prikazuje se u pretrazi
        },
        {
            stamparijaId: "grafika", nazivStamparije: "Grafika Art Print", grad: "Novi Sad",
            sifra: "GPR-003", naziv: "Poster A3",
            opis: "Poster formata A3 na mat foto papiru, idealan za izloge i prezentacije.",
            kategorija: "Štampa velikih formata", potkategorija: "Posteri",
            jedinicnaCena: 250, kolicinaNaLageru: 500,
            dostupneBoje: ["Bela"],
            slikaUrl: "", dodatneSlike: [],
            uslugeStampe: [
                { idUsluge: "USL-G3", tipStampe: "Eko-solventna štampa visoke rezolucije", dodatnaCenaPoKomadu: 150, maxSirinaMm: 297, maxVisinaMm: 420 }
            ],
            aktivan: true
        },
        {
            stamparijaId: "stamparija.centar", nazivStamparije: "Štamparija Centar", grad: "Niš",
            sifra: "CPR-001", naziv: "Flajer A5",
            opis: "Flajer A5 na sjajnom papiru 135g/m2, za promotivne kampanje i događaje.",
            kategorija: "Štampa malih formata", potkategorija: "Flajeri",
            jedinicnaCena: 12, kolicinaNaLageru: 5000,
            dostupneBoje: ["Bela", "Siva"],
            slikaUrl: "", dodatneSlike: [],
            uslugeStampe: [
                { idUsluge: "USL-C1", tipStampe: "Digitalna štampa", dodatnaCenaPoKomadu: 8, maxSirinaMm: 148, maxVisinaMm: 210 }
            ],
            aktivan: true
        },
        {
            stamparijaId: "stamparija.centar", nazivStamparije: "Štamparija Centar", grad: "Niš",
            sifra: "CPR-002", naziv: "Pamučni duks",
            opis: "Kvalitetan pamučni duks 280g/m2, savršen za DTG štampu i radne uniforme.",
            kategorija: "Kreativne štampe", potkategorija: "Štampa na duksericama",
            jedinicnaCena: 1800, kolicinaNaLageru: 80,
            dostupneBoje: ["Crna", "Siva"],
            slikaUrl: "", dodatneSlike: [],
            uslugeStampe: [
                { idUsluge: "USL-C2", tipStampe: "Direktna štampa na tekstil (DTG)", dodatnaCenaPoKomadu: 450, maxSirinaMm: 300, maxVisinaMm: 400 }
            ],
            aktivan: true
        },
        {
            stamparijaId: "stamparija.centar", nazivStamparije: "Štamparija Centar", grad: "Niš",
            sifra: "CPR-003", naziv: "Štamparski ceger",
            opis: "Platneni ceger sa dugim ručkama, idealan za brendiranje i poklone.",
            kategorija: "Kreativne štampe", potkategorija: "Štampa na cegerima",
            jedinicnaCena: 150, kolicinaNaLageru: 300,
            dostupneBoje: ["Bela", "Crna"],
            slikaUrl: "", dodatneSlike: [],
            uslugeStampe: [
                { idUsluge: "USL-C3", tipStampe: "Preslikač (Sito preslikač)", dodatnaCenaPoKomadu: 60, maxSirinaMm: 250, maxVisinaMm: 300 }
            ],
            aktivan: true
        }
    ]
    await Proizvod.insertMany(proizvodi)
    console.log(`Proizvodi: ${proizvodi.length}`)

    // 5. Fakture / narudžbine (različiti statusi + datumi za statistiku)
    const fakture = [
        {
            idFakture: "F-2026-001", klijentId: "marko.markovic", klijentIme: "Marko Marković",
            stamparijaId: "kopistudio", nazivStamparije: "Copy Studio Kumanovska", grad: "Beograd",
            stavke: [
                { sifra: "PR-001", naziv: "Pamucna Polo Majica", kolicina: 2, tipStampe: "Direktna štampa na tekstil (DTG)", boja: "Crna", jedinicnaCena: 1550, iznos: 3100 }
            ],
            ukupanIznos: 3100, datumIzdavanja: daysAgo(3), status: "naruceno"
        },
        {
            idFakture: "F-2026-002", klijentId: "marko.markovic", klijentIme: "Marko Marković",
            stamparijaId: "grafika", nazivStamparije: "Grafika Art Print", grad: "Novi Sad",
            stavke: [
                { sifra: "GPR-001", naziv: "Hemijska olovka", kolicina: 100, tipStampe: "Graviranje", boja: "Crna", jedinicnaCena: 75, iznos: 7500 }
            ],
            ukupanIznos: 7500, datumIzdavanja: daysAgo(12), status: "u stampi"
        },
        {
            idFakture: "F-2026-003", klijentId: "marko.markovic", klijentIme: "Marko Marković",
            stamparijaId: "stamparija.centar", nazivStamparije: "Štamparija Centar", grad: "Niš",
            stavke: [
                { sifra: "CPR-001", naziv: "Flajer A5", kolicina: 500, tipStampe: "Digitalna štampa", boja: "Bela", jedinicnaCena: 20, iznos: 10000 }
            ],
            ukupanIznos: 10000, datumIzdavanja: daysAgo(25), status: "isporuceno"
        },
        {
            idFakture: "F-2026-004", klijentId: "marko.markovic", klijentIme: "Marko Marković",
            stamparijaId: "kopistudio", nazivStamparije: "Copy Studio Kumanovska", grad: "Beograd",
            stavke: [
                { sifra: "PR-002", naziv: "Keramička šolja 330ml", kolicina: 10, tipStampe: "Sublimaciona štampa", boja: "Bela", jedinicnaCena: 470, iznos: 4700 }
            ],
            ukupanIznos: 4700, datumIzdavanja: daysAgo(40), status: "primljeno"
        },
        {
            idFakture: "F-2026-005", klijentId: "marko.markovic", klijentIme: "Marko Marković",
            stamparijaId: "stamparija.centar", nazivStamparije: "Štamparija Centar", grad: "Niš",
            stavke: [
                { sifra: "CPR-002", naziv: "Pamučni duks", kolicina: 5, tipStampe: "Direktna štampa na tekstil (DTG)", boja: "Crna", jedinicnaCena: 2250, iznos: 11250 }
            ],
            ukupanIznos: 11250, datumIzdavanja: daysAgo(70), status: "primljeno"
        },
        {
            idFakture: "F-2026-006", klijentId: "jovana.jovanovic", klijentIme: "Jovana Jovanović",
            stamparijaId: "grafika", nazivStamparije: "Grafika Art Print", grad: "Novi Sad",
            stavke: [
                { sifra: "GPR-001", naziv: "Hemijska olovka", kolicina: 50, tipStampe: "Graviranje", boja: "Plava", jedinicnaCena: 75, iznos: 3750 }
            ],
            ukupanIznos: 3750, datumIzdavanja: daysAgo(15), status: "primljeno"
        },
        {
            idFakture: "F-2026-007", klijentId: "jovana.jovanovic", klijentIme: "Jovana Jovanović",
            stamparijaId: "grafika", nazivStamparije: "Grafika Art Print", grad: "Novi Sad",
            stavke: [
                { sifra: "GPR-003", naziv: "Poster A3", kolicina: 2, tipStampe: "Eko-solventna štampa visoke rezolucije", boja: "Bela", jedinicnaCena: 400, iznos: 800 }
            ],
            ukupanIznos: 800, datumIzdavanja: daysAgo(60), status: "primljeno"
        },
        {
            idFakture: "F-2026-008", klijentId: "nenad.nedic", klijentIme: "Nenad Nedić (TRGOPROM doo)",
            stamparijaId: "kopistudio", nazivStamparije: "Copy Studio Kumanovska", grad: "Beograd",
            stavke: [
                { sifra: "PR-001", naziv: "Pamucna Polo Majica", kolicina: 5, tipStampe: "", boja: "", jedinicnaCena: 1050, iznos: 5250 },
                { sifra: "PR-002", naziv: "Keramička šolja 330ml", kolicina: 20, tipStampe: "", boja: "", jedinicnaCena: 300, iznos: 6000 }
            ],
            ukupanIznos: 11250, datumIzdavanja: minutesAgo(40), status: "u stampi"
        }
    ]
    await Faktura.insertMany(fakture)
    console.log(`Fakture: ${fakture.length}`)

    // 6. Javne nabavke (jedna završena, jedna otvorena)
    const nabavke = [
        {
            idNabavke: "JN-2026-001", klijentId: "nenad.nedic", klijentIme: "Nenad Nedić (TRGOPROM doo)",
            datumVremeRaspisivanja: minutesAgo(45), rokMinuti: 10,
            stavke: [
                { sifra: "PR-001", naziv: "Pamucna Polo Majica", kolicina: 5 },
                { sifra: "PR-002", naziv: "Keramička šolja 330ml", kolicina: 20 }
            ],
            zavrsena: true, pobednikId: "kopistudio"
        },
        {
            idNabavke: "JN-2026-002", klijentId: "nenad.nedic", klijentIme: "Nenad Nedić (TRGOPROM doo)",
            datumVremeRaspisivanja: minutesAgo(2), rokMinuti: 10,
            stavke: [
                { sifra: "CPR-002", naziv: "Pamučni duks", kolicina: 20 }
            ],
            zavrsena: false, pobednikId: ""
        }
    ]
    await JavnaNabavka.insertMany(nabavke)
    console.log(`Javne nabavke: ${nabavke.length}`)

    // 7. Ponude
    const ponude = [
        {
            nabavkaId: "JN-2026-001", stamparijaId: "kopistudio", nazivStamparije: "Copy Studio Kumanovska",
            stavke: [
                { sifra: "PR-001", naziv: "Pamucna Polo Majica", kolicina: 5, jedinicnaCena: 1050 },
                { sifra: "PR-002", naziv: "Keramička šolja 330ml", kolicina: 20, jedinicnaCena: 300 }
            ],
            ukupanIznos: 11250, datum: minutesAgo(30)
        },
        {
            nabavkaId: "JN-2026-001", stamparijaId: "grafika", nazivStamparije: "Grafika Art Print",
            stavke: [
                { sifra: "PR-001", naziv: "Pamucna Polo Majica", kolicina: 5, jedinicnaCena: 1100 },
                { sifra: "PR-002", naziv: "Keramička šolja 330ml", kolicina: 20, jedinicnaCena: 310 }
            ],
            ukupanIznos: 11700, datum: minutesAgo(25)
        },
        {
            nabavkaId: "JN-2026-001", stamparijaId: "stamparija.centar", nazivStamparije: "Štamparija Centar",
            stavke: [
                { sifra: "PR-001", naziv: "Pamucna Polo Majica", kolicina: 5, jedinicnaCena: 1150 },
                { sifra: "PR-002", naziv: "Keramička šolja 330ml", kolicina: 20, jedinicnaCena: 295 }
            ],
            ukupanIznos: 11650, datum: minutesAgo(20)
        },
        {
            nabavkaId: "JN-2026-002", stamparijaId: "stamparija.centar", nazivStamparije: "Štamparija Centar",
            stavke: [
                { sifra: "CPR-002", naziv: "Pamučni duks", kolicina: 20, jedinicnaCena: 1750 }
            ],
            ukupanIznos: 35000, datum: minutesAgo(1)
        }
    ]
    await Ponuda.insertMany(ponude)
    console.log(`Ponude: ${ponude.length}`)

    // 8. Komentari / ocene (raspoređeni po vremenu radi linijskog grafika)
    const komentari = [
        { proizvodId: "PR-001", korisnickoIme: "jovana.jovanovic", datum: daysAgo(70), tekst: "Odličan kvalitet majice, preporuka!", ocena: "svidja" },
        { proizvodId: "PR-001", korisnickoIme: "marko.markovic", datum: daysAgo(45), tekst: "Brza isporuka, majica super.", ocena: "svidja" },
        { proizvodId: "PR-001", korisnickoIme: "nenad.nedic", datum: daysAgo(20), tekst: "Dobra cena za naručenu količinu.", ocena: "svidja" },
        { proizvodId: "PR-001", korisnickoIme: "jovana.jovanovic", datum: daysAgo(5), tekst: "Drugi put naručujem, i dalje odlično.", ocena: "svidja" },
        { proizvodId: "PR-002", korisnickoIme: "marko.markovic", datum: daysAgo(30), tekst: "Šolja se lepo štampa, boja postojana.", ocena: "svidja" },
        { proizvodId: "PR-002", korisnickoIme: "jovana.jovanovic", datum: daysAgo(12), tekst: "Dimenzije štampe manje nego što sam očekivala.", ocena: "ne_svidja" },
        { proizvodId: "GPR-001", korisnickoIme: "nenad.nedic", datum: daysAgo(55), tekst: "Graviranje perfektno, olovke vrhunske.", ocena: "svidja" },
        { proizvodId: "GPR-001", korisnickoIme: "marko.markovic", datum: daysAgo(10), tekst: "Olovke stigle na vreme, tačno kao na slici.", ocena: "svidja" },
        { proizvodId: "GPR-003", korisnickoIme: "jovana.jovanovic", datum: daysAgo(50), tekst: "Poster odličnog kvaliteta.", ocena: "svidja" },
        { proizvodId: "CPR-001", korisnickoIme: "jovana.jovanovic", datum: daysAgo(8), tekst: "Flajeri odlični za promo kampanju.", ocena: "svidja" },
        { proizvodId: "CPR-001", korisnickoIme: "marko.markovic", datum: daysAgo(22), tekst: "Boje blago iskrivljene, ali prihvatljivo.", ocena: "ne_svidja" },
        { proizvodId: "CPR-002", korisnickoIme: "nenad.nedic", datum: daysAgo(3), tekst: "DTG štampa vrhunska, topla preporuka.", ocena: "svidja" }
    ]
    await Komentar.insertMany(komentari)
    console.log(`Komentari: ${komentari.length}`)

    console.log("=== SEED ZAVRŠEN ===")
    await mongoose.disconnect()
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("GREŠKA PRI SEEDOVANJU:", err)
        process.exit(1)
    })