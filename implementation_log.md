# Implementation Log — Printing House (PIA 2025/26)

> Korak-po-korak dnevnik implementacije projekta „Printing House".
> Plan: `IMPLEMENTACIJA_PLAN.md` • Zahtevi: `SPECIFIKACIJA.md`

**Radno pravilo:** **commit nakon svake faze** — čim je faza završena i proverena,
radi se git commit pre prelaska na sledeću fazu.

**Trenutno stanje:** Faza 6 — ✅ kompletna (javne nabavke + licitacije)

**Git:** `fa40c5b` — Faza 0; `06f68e7` — Faze 1–2; `b0c5801` — Faza 3;
Faza 4 — u toku (commit nakon završetka).

**Prioriteti:** `minimalni zahtevi.txt` (koren projekta) — crne stavke su obavezne
(min. 15 poena) i rade se prvo; stavke sa **„-"** (crvene) ostavljamo **za kraj**
(do 30 poena). Lista „za kraj": zaboravljena lozinka, galerija sa dodatnim
slikama, otkazivanje narudžbine, mapa štamparije, priprema proizvoda sa sličicom,
PDF faktura na i-mejl, servis za plaćanje, JSON import (štampar), izveštavanje
(PDF), statistike sa grafikonima (admin).

---

## Faza 4 — Klijent: priprema proizvoda, e-korpa, fakture i plaćanje ✅

**Novi fajlovi:**
- Backend: `controllers/korpaController.ts` + `routers/korpaRouter.ts`, `utils/pdfUtils.ts` + `utils/emailUtils.ts`
- Frontend: `components/ekorpa/` (ekorpa.ts, ekorpa.html, ekorpa.css)

**Izmenjeni fajlovi:**
- `server.ts` — montiran korpaRouter
- `korisnici.service.ts` — dodati endpointi za korpu
- `proizvodDetalji.ts/html` — dodata količina + DODAJ U KORPU za klijente
- `app.routes.ts` — dodata ruta `/korpa`
- `app.html` — dodat link 🛒 Korpa u meniju

| Ruta | Metod | Opis |
|------|-------|------|
| `/dodajUKorpu` | POST | Dodavanje u korpu (provera lagera) |
| `/ukloniIzKorpe` | POST | Uklanjanje stavke iz korpe |
| `/korpaKlijenta?klijentId=` | GET | Sadržaj korpe |
| `/potvrdiKorpu` | POST | Kreiranje faktura po štamparijama, smanjenje lagera, PDF + email |

**Implementacija:**
- **Korpa**: grupisanje po štamparijama, provera lagera pri dodavanju i potvrdi
- **Potvrda**: automatski increment ID fakture, kreiranje Faktura za svaku štampariju, smanjenje lagera
- **PDF**: `pdfkit` generiše fakturu sa zaglavljem, podacima o štampariji/klijentu, tabelom stavki i ukupno
- **Email**: `nodemailer` (Ethereal test) šalje PDF kao attachment klijentu
- Frontend: e-korpa strana sa grupisanim stavkama, uklanjanje, potvrda sa confirm()
- Kompajliranje: ✅ backend + frontend

## Faza 6 — Javne nabavke (pravna lica + štamparije) ✅

**Novi fajlovi:**
- Backend: `controllers/nabavkeController.ts` + `routers/nabavkeRouter.ts`
- Frontend: `components/javne-nabavke/` + `components/licitacije/`

**Izmenjeni fajlovi:**
- `server.ts` — montiran nabavkeRouter
- `korisnici.service.ts` — dodati endpointi za nabavke
- `app.routes.ts` — dodate rute `/nabavke` i `/licitacije`
- `app.html` — uslovni linkovi (Nabavke za pravna lica, Licitacije za šampare)

| Ruta | Metod | Opis |
|------|-------|------|
| `/raspisiNabavku` | POST | Kreiranje nabavke (10 min rok) |
| `/otvoreneNabavke?stamparijaId=` | GET | Otvorene nabavke za štampare |
| `/posaljiPonudu` | POST | Slanje ponude (jedna po štampariji) |
| `/mojeNabavke?klijentId=` | GET | Nabavke pravnog lica + ponude |

**Implementacija:**
- **Automatsko završavanje**: pri pozivu `otvoreneNabavke` ili `mojeNabavke`, proverava se rok — ako je istekao, nabavka se automatski završava
- **Izbor pobednika**: najniža ponuda; faktura se kreira sa statusom „u stampi"
- **Frontend**: dve odvojene strane (Nabavke za pravna lica, Licitacije za šampare)
- **Forma za ponudu**: tabela sa šiframa, nazivima, količinama + input za jediničnu cenu
- Kompajliranje: ✅ backend + frontend

## Faza 5 — Klijent: arhiva, lajkovi, komentari ✅

**Novi fajlovi:**
- Backend: `controllers/komentariController.ts` + `routers/komentariRouter.ts`
- Frontend: `components/arhiva/` (arhiva.ts, arhiva.html, arhiva.css)

**Izmenjeni fajlovi:**
- `narudzbineController.ts` — dodati `arhivaProizvoda` + `promeniStatusPrimljeno`
- `narudzbineRouter.ts` — dodate rute
- `server.ts` — montiran komentariRouter
- `proizvodDetalji.ts/html/css` — komentar forma + narandžasti okvir za svoje komentare
- `korisnici.service.ts` — dodati endpointi za arhivu i komentare
- `app.routes.ts` — dodata ruta `/arhiva`
- `app.html` — dodat link 📦 Arhiva u meniju

| Ruta | Metod | Opis |
|------|-------|------|
| `/arhivaProizvoda?klijentId=` | GET | Arhiva (isporuceno + primljeno) |
| `/promeniStatusPrimljeno` | POST | Status: isporuceno → primljeno |
| `/dodajKomentar` | POST | Dodavanje komentara (lajk/dislajk + tekst) |
| `/komentariProizvoda?proizvodId=` | GET | Poslednjih 5 komentara |

**Implementacija:**
- **Arhiva**: tabela sa fakturama (isporuceno + primljeno), dugme „Označi kao primljeno" samo za isporučene
- **Komentari**: forma sa radio (👍/👎) + textarea + pošalji; prikaz 5 komentara; svoje komentare ima narandžasti okvir (leva ivica + svetla pozadina)
- Kompajliranje: ✅ backend + frontend

## Faza 3 — Klijent: profil, narudžbine, pretraga i detalji ✅

### Korak 3.2 — Backend: narudzbineKlijenta, otkaziNarudzbinu ⏭️ PRESKOČENO

> Stavka sa „-" iz `minimalni zahtevi.txt` (otkazivanje narudžbine). Odloženo za kraj;
> biće implementirano u Fazi 9 ili ranije ako bude vremena. Sve ostale Faze 3–8
> ne zavise od ove funkcionalnosti.

### Korak 3.3 — Backend: detaljiProizvodaKlijent ✅

**Izmenjeni fajlovi:** `controllers/proizvodiController.ts` + `routers/proizvodiRouter.ts` + `services/proizvodi.service.ts`

| Ruta | Metod | Opis |
|------|-------|------|
| `/detaljiProizvodaKlijent/:sifra` | GET | Detalji proizvoda + podaci o štampariji za mapu + poslednjih 5 komentara |

**Implementacija:**
- Extended verzija postojećeg `detaljiProizvoda` — vraća iste podatke PLUS:
- **`stamparijaInfo`**: nazivInstitucije, adresa, grad, telefon, email, matičniBroj, PIB, slika
  (traži se po `stamparijaId` == `korisnickoIme` štampara)
- **`komentari`**: poslednjih 5 komentara (sortirani po datumu opadajuće) —
  polja: korisnickoIme, datum, tekst, ocena
- Kompajliranje: ✅ backend + frontend

### Korak 3.4 — Frontend: profil + prošireni detalji za klijente ✅

**Novi fajlovi:**
- Backend: `controllers/narudzbineController.ts` + `routers/narudzbineRouter.ts` (montiran u `server.ts`)
- Frontend: `components/profil/` (profil.ts, profil.html, profil.css), `services/korisnici.service.ts`

**Izmenjeni fajlovi:**
- `app.routes.ts` — dodata ruta `/profil` (zaštićena `authGuard`-om)
- `app.html` — dodat link „Profil" u meniju za prijavljene korisnike
- `components/proizvodDetalji/` — prošireno za klijente (boja dropdown, izbor usluge, info o štampariji, komentari)

| Ruta | Metod | Opis |
|------|-------|------|
| `/narudzbineKlijenta?klijentId=` | GET | Sve narudžbine klijenta (sortirane po datumu opadajuće) |

**Frontend komponente:**

| Komponenta | Ruta | Opis |
|------------|------|------|
| `profil/` | `/profil` (guard) | Podaci korisnika + 2 tabele narudžbina (aktivne: naruceno/placeno/u stampi; arhiva: isporuceno/primljeno) + sortiranje po datumu ↑/↓ |

**Prošireni `proizvodDetalji` za klijente:**
- Dropdown za izbor boje (default prva boja iz `dostupneBoje[]`)
- Radio dugmad za izbor usluge štampe (+ prikaz ukupne cene po komadu)
- Info o štampariji (naziv institucije, adresa, grad, telefon, email)
- Poslednjih 5 komentara (korisničko ime, datum, ocena 👍/👎, tekst)

**Kompajliranje:** ✅ backend + frontend

### Korak 3.1 — Backend: ažuriranje profila ✅

**Novi fajlovi:** `controllers/korisniciController.ts` + `routers/korisniciRouter.ts`
(montiran u `server.ts`); zajednički `utils/korisnikUtils.ts` (`bezLozinke`
izdvojen iz authController-a i deljen).

| Ruta | Metod | Opis |
|------|-------|------|
| `/azurirajProfil` | POST | Ažuriranje ličnih podataka (multipart, opciona nova slika) |

**Implementacija:**
- **Korisničko ime se ne menja** — koristi se samo za identifikaciju naloga
- Validacije: ime/prezime/telefon obavezni, email regex; za pravna lica i
  štamparije i dalje nazivInstitucije/adresa/matičniBroj (8 cifara)/PIB
  (9 cifara, bez vodeće nule), za štampare grad
- Jedinstvenost pri ažuriranju **isključuje samog korisnika** (`$ne`) — email,
  matični broj i PIB
- **Promena slike**: iste provere kao pri registraciji (multer, 100–250 px,
  JPG/PNG/GIF, maks 5MB); stara slika se briše iz `uploads/` ako nije default
- Odgovor vraća ažuriranog korisnika bez lozinke (frontend osvežava sesiju)

**Test rezultati (curl, 13 scenarija — sve ✅):**
- Ažuriranje bez slike, korisničko ime ostaje nepromenjeno
- Loš email → greška; zauzet email (jovana) → `I-mejl adresa je već zauzeta`
- Nepostojeći korisnik → `Korisnik ne postoji`
- Upload slike → `slika` postavljena; drugi upload → stara slika obrisana
- PIB sa vodećom nulom → greška; tuđi PIB (kopistudio) → `već registrovani`
- Štampar bez grada → `Grad je obavezan`; ispravan update štampara radi
- Slika 300×300 → `Slika mora biti između 100x100 i 250x250 px` (fajl se ne čuva)
- Login i dalje radi posle izmena profila

---

## Faza 2 — Javni deo (neregistrovani korisnik) ✅

### Backend (`controllers/proizvodiController.ts` + `routers/proizvodiRouter.ts`)

| Ruta | Metod | Opis |
|------|-------|------|
| `/brojStamparija` | GET | Broj aktivnih štamparija (countDocuments) |
| `/top5Proizvoda` | GET | TOP 5 po broju sviđanja (aggregate nad komentarima + join proizvoda) |
| `/kategorijeZaPretragu` | GET | Samo kategorije sa aktivnim proizvodima na stanju |
| `/pretragaProizvoda?naziv=&kategorija=` | GET | Aktivni + na stanju, filtriranje po nazivu (podstring) i/ili kategoriji |
| `/detaljiProizvoda/:sifra` | GET | Detalji + brojevi sviđanja/nesviđanja (aggregate po oceni) |

Testirano curl-om: broj 3, TOP 5 (PR-001=4👍, GPR-001=2👍...), kategorije 3,
pretraga po nazivu/kategoriji, neaktivan proizvod (Vizit karta) se ne prikazuje ✅

### Frontend

- **Servisi podeljeni po domenima** (nastavak refaktorisanja): `auth.service.ts`
  (login, registracije) i `proizvodi.service.ts` (pretraga, detalji, statistike) —
  stari `api.service.ts` obrisan, komponente ažurirane
- **Početna strana `/` (javna):** broj štamparija, TOP 5 lista (link na detalje),
  forma za pretragu (naziv + dropdown „Sve kategorije"), tabela rezultata sa
  **sortiranjem po nazivu ↑/↓** (klik na zaglavlje) i dugmetom „DETALJI"
- **Strana detalja `/proizvod/:sifra`:** naziv, štamparija, grad, 👍/👎,
  kategorija, cena, stanje, opis, tabela usluga štampe, placeholder slike
  (proizvodi još nemaju slike — biće dodate u Fazi 7)
- Rute: `/` = javna početna, login preusmerava na `/`; stari `/pocetna` (placeholder) uklonjen
- `auth.guard.ts` ostaje za zaštićene strane klijenata (Faza 3+)

**Galerija sa dodatnim slikama + čuvanje izabrane slike u cookie** → odloženo
(stavka sa „-" iz `minimalni zahtevi.txt`).

**Testirano u pregledaču:** broj štamparija 3, TOP 5 sa lajkovima, sortiranje
(↑→↓), pretraga „majica" → 1 rezultat, kategorije u dropdown-u, DETALJI →
detalji PR-001 sa uslugama štampe ✅

---

## Faza 1 — Autentifikacija i registracija ✅

### Korak 0.1 — Instalacija paketa ✅
- **Backend** (`backend/`): `bcrypt`, `multer`, `nodemailer`, `pdfkit`
  + devDependencies `@types/bcrypt`, `@types/multer`, `@types/nodemailer`, `@types/pdfkit`
- **Frontend** (`frontend/`): `chart.js` (ugrađeni TS tipovi)
- Provera: `npx tsc --noEmit` u backendu prolazi.

### Korak 0.2 — Folder struktura ✅
- Backend: `src/models/`, `src/controllers/`, `src/routers/` kreirani
- Frontend: `src/app/models/`, `src/app/services/` — dolazi u Fazi 1

### Korak 0.3 — MongoDB konekcija (server.ts) ✅
- `backend/src/server.ts`: CORS + `express.json()` + `mongoose.connect("mongodb://127.0.0.1:27017/printing_house")`
- Ruter: `router.use("/", apiRouter)` → `app.use("/", router)`, server na portu **4000**
- MongoDB je lokalno pokrenut na portu **27017**
- Smoke test: `GET /provera` → `{"message":"Backend radi!"}` ✅

### Korak 0.4 — Mongoose modeli ✅
Kreirano **9 modela** u `backend/src/models/`:

| Model | Kolekcija | Ključna polja |
|-------|-----------|---------------|
| `Korisnik` | `korisnici` | korisnickoIme, lozinka, ime, prezime, telefon, email, tip (admin/klijent/stampar), vrsta (fizicko/pravno), slika, status (aktivan/neaktivan/na_cekanju), nazivInstitucije, adresa, grad, maticniBroj, pib |
| `Kategorija` | `kategorije` | naziv, potkategorije[] |
| `Proizvod` | `proizvodi` | stamparijaId, nazivStamparije, grad, sifra, naziv, opis, kategorija, potkategorija, jedinicnaCena, kolicinaNaLageru, dostupneBoje[], slikaUrl, dodatneSlike[], uslugeStampe[], aktivan |
| `Faktura` | `fakture` | idFakture, klijentId/Ime, stamparijaId, nazivStamparije, grad, stavke[], ukupanIznos, datumIzdavanja, status (naruceno/placeno/u stampi/isporuceno/primljeno) |
| `JavnaNabavka` | `javne_nabavke` | idNabavke, klijentId/Ime, datumVremeRaspisivanja, rokMinuti (10), stavke[], zavrsena, pobednikId |
| `Ponuda` | `ponude` | nabavkaId, stamparijaId, nazivStamparije, stavke[], ukupanIznos, datum |
| `Komentar` | `komentari` | proizvodId (sifra), korisnickoIme, datum, tekst, ocena (svidja/ne_svidja) |
| `PasswordReset` | `password_reset` | korisnickoIme, email, token, datumIsticanja |
| `Korpa` | `korpa` | klijentId, stavke[] |

### Korak 0.5 — Seed skripta + popunjavanje baze ✅
- `backend/src/seed.ts` — briše kolekcije pa puni test podacima; pokreće se sa:
  ```bash
  cd backend && npm run build && node dist/seed.js
  ```
- **Test lozinka za SVE korisnike: `Admin123!`** (zadovoljava regex pravila iz zadatka)

**Uneti podaci:**

| Kolekcija | Broj | Sadržaj |
|-----------|------|---------|
| `korisnici` | 9 | 1 admin, 2 klijenta fizička lica (marko.markovic, jovana.jovanovic), 1 klijent pravno lice (nenad.nedic / TRGOPROM doo), 3 aktivne štamparije (kopistudio, grafika, stamparija.centar), 2 na čekanju (nova.stamparija, nova.firma) |
| `kategorije` | 3 | Štampa malih formata, Štampa velikih formata, Kreativne štampe (sa potkategorijama) |
| `proizvodi` | 9 | 3 iz `primer-proizvodi.json` (PR-001..003, Copy Studio) + 6 dodatnih za Grafika (GPR) i Štampariju Centar (CPR); GPR-002 ima `aktivan: false` (test filtriranja) |
| `fakture` | 8 | Statusi: naruceno (F-2026-001, otkaziva), u stampi (F-2026-002, F-2026-008), isporuceno (F-2026-003), primljeno (4); datumi od 40 min do 70 dana unazad |
| `javne_nabavke` | 2 | JN-2026-001 završena (pre 45 min, pobednik kopistudio), JN-2026-002 otvorena (pre 2 min) |
| `ponude` | 4 | 3 za JN-2026-001 (kopistudio 11250 najniža, grafika 11700, centar 11650), 1 za JN-2026-002 (centar 35000) |
| `komentari` | 12 | Raspoređeni od 3 do 70 dana unazad (podaci za TOP 5, linijski grafikon) |

**Podaci za statistiku (Faza 8):**
- Promet po štamparijama (kvartal): Centar 21250 > Copy Studio 20850 > Grafika 12050
- Najčešći proizvodi (mesec dana): CPR-001 (500), GPR-001 (150), PR-002 (20), PR-001 (7)

### Korak 0.6 — Angular podešavanje ✅
- `frontend/src/app/app.config.ts`: dodat `provideHttpClient()`
- `frontend/src/styles.css`: globalni uniformni stil (header, footer, tabele, forme, dugmad, poruke, galerija, responsive)
- `frontend/src/app/app.html`: uniformni shell — header (logo) + `router-outlet` + footer

### Korak 0.7 — Kontrola kompajliranja ✅
- Backend: `npx tsc --noEmit` — ✅ prolazi
- Frontend: `npx tsc -p tsconfig.app.json --noEmit` — ✅ prolazi
- Smoke test servera: `GET /provera` → `{"message":"Backend radi!"}` + konekcija na bazu ✅

---

## Faza 1 — Autentifikacija i registracija

### Backend deo ✅

**Nove rute (`apiRouter.ts` → `apiController.ts`):**

| Ruta | Metod | Opis |
|------|-------|------|
| `/login` | POST | Prijava klijenata/štampara (bcrypt provera, status mora biti `aktivan`) |
| `/loginAdmin` | POST | Prijava administratora (zahteva `tip == admin`) |
| `/registracijaFizickoLice` | POST | Odmah `aktivan` (multipart: polja + opciona `slika`) |
| `/registracijaPravnoLice` | POST | Status `na_cekanju` + institucija |
| `/registracijaStampara` | POST | Status `na_cekanju` + institucija + grad |

**Ključne implementacije:**
- **bcrypt hash** lozinke pri registraciji (`bcrypt.hash(..., 10)`), provera pri prijavi (`bcrypt.compare`)
- **Server-side validacije** (`validiraj`): korisničko ime ≥ 3 karaktera, email regex,
  lozinka regex `^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[A-Za-z][A-Za-z0-9@#$%^&+=!._\-]{7,11}$`
  (8–12 karaktera, veliko slovo, broj, specijalni karakter, počinje slovom),
  matični broj tačno 8 cifara, PIB 9 cifara bez vodeće nule, grad za štampare
- **Jedinstvenost**: korisničko ime i email; za institucije i matični broj + PIB
- **Profilna slika (multer)**: `uploads/` folder, dozvoljeni formati JPG/PNG/GIF,
  maks 5MB, **dimenzije 100–250 px** (provera preko `jimp`), default
  `default_profile_image.jpg` ako slika nije poslata; neispravan upload se briše
- **Default slika**: `backend/public/default_profile_image.jpg` (100×100, generisana jimp-om),
  server služi `public/` i `/uploads` statički
- Greške se vraćaju kao `{ message: '...' }`; korisnik se vraća **bez lozinke**

**Bug koji je otkriven testiranjem:** regex lozinke je prvo proveravao lookahead-e
nakon prvog karaktera (pa „Test123!" nije prolazio) — prepravljen da proverava ceo string.

**Test rezultati (curl):**
- ✅ Login ispravan (marko.markovic) → `Uspešno` + user bez lozinke
- ✅ Login pogrešna lozinka → `Pogrešno korisničko ime ili lozinka`
- ✅ loginAdmin (admin) → `Uspešno`; običan korisnik → `Nemate pristup administrativnom panelu`
- ✅ Login korisnika na čekanju → `Nalog nije odobren od strane administratora`
- ✅ Registracija fizičkog lica (sa slikom) → `Uspešno ste se registrovali`, slika sačuvana u `uploads/`
- ✅ Duplikat korisničkog imena → greška
- ✅ Loš matični broj → `Matični broj mora imati tačno 8 cifara`
- ✅ Registracija pravnog lica i štampara → `Zahtev za registraciju je poslat na odobrenje administratora`
- ✅ Novi `na_cekanju` korisnik ne može da se prijavi

**Test korisnici kreirani curl-om** (test.user / firma.test / test.stampar, lozinka `Test123!`) —
biće obrisani pri sledećem pokretanju seed-a.

### Frontend deo ✅

**Nove komponente (`frontend/src/app/`):**

| Komponenta | Ruta | Opis |
|------------|------|------|
| `login/` | `/login` | Javna prijava (klijenti/štampari), greška pri neuspehu, čuva `ulogovan` u localStorage, redirekcija na `/pocetna` |
| `loginAdmin/` | `/admin` | Administratorska prijava na **posebnoj ruti** (isti obrazac, `loginAdmin` servis) |
| `registracija/` | `/registracija` | Preklopnik 3 tipa (fizičko/pravno/štamparija), polja se menjaju po tipu, klijentska validacija, FileUpload sa proverom formata i dimenzija slike |
| `pocetna/` | `/pocetna` | Placeholder početna sa prikazom ulogovanog korisnika (zaštićena guard-om) |

**Ostalo:**
- `services/api.service.ts` — login, loginAdmin, registracije (FormData sa slikom)
- `guards/auth.guard.ts` — `CanActivateFn` proverava `localStorage['ulogovan']`
- `app.routes.ts` — rute + `**` → login; `app.ts/app.html` — meni zavisi od sesije
  (prijavljen: korisničko ime + „Izloguj se"; odjavljen: Prijava / Administrator / Registracija)
- `odjaviSe()` = `localStorage.clear()` + povratak na `/login`

**Testiranje u pregledaču (preview) — sve prošlo ✅:**
- Pogrešna lozinka → poruka `Pogrešno korisničko ime ili lozinka`
- Ispravan login (marko.markovic) → `/pocetna`, meni sa korisnikom
- Odjava → povratak na `/login`
- Registracija štamparije: klijentska validacija (PIB koji počinje 0 → greška),
  serverska jedinstvenost (zauzet matični broj/PIB → greška), uspeh → auto-redirekcija na `/login`
- Admin login (`/admin`) → `/pocetna` kao admin
- Guard: bez sesije `/pocetna` → preusmerava na `/login`
- Console bez grešaka

**Zaboravljena lozinka** → odložena za kraj (stavka sa „-" iz `minimalni zahtevi.txt`).

**Popravka — sticky footer:** `app-root` je postao flex kolona (`flex: 1`) +
`min-height: 100vh` na `html, body`; footer ostaje pri dnu ekrana i na kratkim
stranama, a na dugim se normalno pomera sa sadržajem.

### Refaktorisanje backend strukture ✅

> Pošto ovo nije ispit, napušten je šablon „jedan apiController + jedan apiRouter"
> i pređeno na strukturu po domenima — svaki domen ima svoj kontroler i ruter.

**Nova struktura (`backend/src/`):**

```
src/
├── server.ts                 # montira ruter-e po domenima
├── seed.ts
├── models/                   # 9 modela (korisnici, proizvodi, fakture...)
├── controllers/
│   └── authController.ts     # login, loginAdmin, registracije (Faza 1)
├── routers/
│   └── authRouter.ts         # rute za autentifikaciju
├── middlewares/
│   └── upload.ts             # zajednički multer (upload slika)
└── utils/
    └── imageUtils.ts         # provera dimenzija slike + brisanje fajla
```

**Plan za naredne faze** (novi fajlovi po domenu):

| Domen | Kontroler | Ruter | Faza |
|-------|-----------|-------|------|
| Korisnici / profil | `korisniciController.ts` | `korisniciRouter.ts` | 3, 8 |
| Proizvodi (pretraga, detalji, upravljanje) | `proizvodiController.ts` | `proizvodiRouter.ts` | 2, 7 |
| Kategorije | `kategorijeController.ts` | `kategorijeRouter.ts` | 8 |
| Narudžbine / fakture | `narudzbineController.ts` | `narudzbineRouter.ts` | 3, 4, 5, 7 |
| Korpa | `korpaController.ts` | `korpaRouter.ts` | 4 |
| Javne nabavke / ponude | `nabavkeController.ts` | `nabavkeRouter.ts` | 6 |
| Komentari / ocene | `komentariController.ts` | `komentariRouter.ts` | 5 |
| Statistika | `statistikaController.ts` | `statistikaRouter.ts` | 8 |

Stari `apiController.ts` i `apiRouter.ts` obrisani. Funkcionalnost identična
(login, registracije, validacije) — potvrđeno curl testovima nakon refaktorisanja ✅.

---