# MANUAL_TESTING.md — Ručno testiranje (Faze 1–6)

> Vodič za ručno testiranje projekta **„Printing House"** (PIA 2025/26).
> Pokriva **sve do sada implementirane faze (1–6)**.
> Za svaku fazu: **šta zadatak zahteva** → **šta je implementirano** → **kako se testira** (čeklista).
>
> Povezani dokumenti: `implementation_log.md` (šta je rađeno), `IMPLEMENTACIJA_PLAN.md` (plan faza),
> `SPECIFIKACIJA.md` (zahtevi), `minimalni zahtevi.txt` (prioriteti).
>
> **Ako test padne ili nešto ne postoji — upiši nalaz u sekciju
> [„Poznati nalazi i nedostaci"](#poznati-nalazi-i-nedostaci) na kraju.**

---

## 1. Priprema okruženja (obavezno pre testiranja)

### 1.1 Pokretanje

```bash
# 1) MongoDB mora da radi lokalno na portu 27017

# 2) Napuni bazu svežim test podacima (briše stare kolekcije!)
cd PIA_PROJEKAT/backend
npm run build
node dist/seed.js

# 3) Backend (port 4000)
npm start

# 4) Frontend (port 4200) — u drugom terminalu
cd PIA_PROJEKAT/frontend
npm start
```

Otvori **http://localhost:4200**

> ⚠️ **Bitno:** testovi menjaju bazu (naručivanje smanjuje lager, potvrda korpe pravi fakture,
> nabavke ističu posle 10 minuta). **Pre svake nove runde testiranja ponovo pokreni seed.**
> Ako želiš da sačuvaš stanje, zaustavi server i pokreni `node dist/seed.js` ponovo.

### 1.2 Test nalozi

Lozinka za **sve** naloge je: **`Admin123!`**

| Korisničko ime | Tip | Vrsta | Status | Grad | Namena |
|---|---|---|---|---|---|
| `admin` | admin | — | aktivan | — | Administratorska prijava (`/admin`) |
| `marko.markovic` | klijent | fizičko | aktivan | Beograd | **Glavni klijent za testiranje** (ima 5 faktura) |
| `jovana.jovanovic` | klijent | fizičko | aktivan | Novi Sad | Drugi klijent (2 fakture, ima komentare) |
| `nenad.nedic` | klijent | **pravno** | aktivan | Beograd | TRGOPROM doo — **za javne nabavke** |
| `kopistudio` | štampar | — | aktivan | Beograd | Copy Studio Kumanovska — za licitacije |
| `grafika` | štampar | — | aktivan | Novi Sad | Grafika Art Print — za licitacije |
| `stamparija.centar` | štampar | — | aktivan | Niš | Štamparija Centar — za licitacije |
| `nova.stamparija` | štampar | — | **na_cekanju** | Kragujevac | Test: nalog nije odobren |
| `nova.firma` | klijent | pravno | **na_cekanju** | Beograd | Test: nalog nije odobren |

### 1.3 Podaci u bazi nakon seed-a

| Kolekcija | Broj | Napomena |
|---|---|---|
| `korisnici` | 9 | 3 aktivne štamparije, 2 na čekanju |
| `kategorije` | 3 | Štampa malih formata, Štampa velikih formata, Kreativne štampe |
| `proizvodi` | 9 | **8 aktivnih + `GPR-002` (Vizit karta) `aktivan: false`** — kontrolni proizvod |
| `fakture` | 8 | Statusi: `naruceno`, `u stampi`, `isporuceno`, `primljeno` |
| `javne_nabavke` | 2 | `JN-2026-001` završena, `JN-2026-002` otvorena (ističe 10 min od seed-a) |
| `ponude` | 4 | 3 za `JN-2026-001`, 1 za `JN-2026-002` |
| `komentari` | 12 | `PR-001` ima 4 komentara (svi 👍) |

**Očekivani brojevi (koriste se u testovima):**
- Broj štamparija na početnoj: **3**
- Proizvoda u tabeli na početnoj (bez pretrage): **8**
- TOP 5: `PR-001` (4 👍), `GPR-001` (2 👍), pa tri proizvoda sa po 1 👍
- Kategorije u dropdown-u: **3**

**Fakture po klijentu (za testiranje profila):**

| Klijent | Aktivne (`naruceno`/`placeno`/`u stampi`) | Arhiva (`isporuceno`/`primljeno`) |
|---|---|---|
| `marko.markovic` | `F-2026-001` (naruceno), `F-2026-002` (u stampi) | `F-2026-003` (isporuceno), `F-2026-004`, `F-2026-005` (primljeno) |
| `jovana.jovanovic` | — | `F-2026-006`, `F-2026-007` (primljeno) |
| `nenad.nedic` | `F-2026-008` (u stampi) | — |

---

## FAZA 1 — Autentifikacija i registracija

### Šta zadatak zahteva
- Пријава корисника (klijent/štampar + admin na posebnoj ruti)
- Регистрација свих типова корисника
- Server-side validacije, jedinstvenost podataka, profilna slika

### Šta je implementirano
**Backend** (`controllers/authController.ts`, `routers/authRouter.ts`):

| Ruta | Metod | Opis |
|---|---|---|
| `/login` | POST | Prijava klijenata i štampara (bcrypt, status mora biti `aktivan`) |
| `/loginAdmin` | POST | Prijava administratora (zahteva `tip == admin`) |
| `/registracijaFizickoLice` | POST | Odmah `aktivan` |
| `/registracijaPravnoLice` | POST | Status `na_cekanju` |
| `/registracijaStampara` | POST | Status `na_cekanju` |

- Lozinke se heširaju (`bcrypt`, 10 rundi); korisnik se vraća **bez lozinke**
- Validacije: korisničko ime ≥ 3 znaka, e-mejl regex, lozinka 8–12 znakova (veliko slovo + broj + specijalni znak, počinje slovom), matični broj 8 cifara, PIB 9 cifara bez vodeće nule, grad obavezan za štampare
- Jedinstvenost: korisničko ime + e-mejl; za institucije i matični broj + PIB
- Slika: `multer`, JPG/PNG/GIF, maks 5MB, **100×100 – 250×250 px**, default `default_profile_image.jpg`

**Frontend:** `components/login/` (`/login`), `components/loginAdmin/` (`/admin`), `components/registracija/` (`/registracija`), `guards/auth.guard.ts`, sesija u `localStorage['ulogovan']`

**Zaglavlje i navigacija** (`app.html`, `app.ts`, `styles.css`): logo vodi na početnu, meni zavisi od tipa korisnika, padajući meni korisnika (profil + odjava), burger ispod 900px, označena aktivna strana

**Poznate poruke (očekivane):**
`Uspešno` · `Pogrešno korisničko ime ili lozinka` · `Nalog nije odobren od strane administratora` ·
`Nemate pristup administrativnom panelu` · `Uspešno ste se registrovali` ·
`Zahtev za registraciju je poslat na odobrenje administratora` ·
`Administratori se prijavljuju na posebnoj administratorskoj strani`

### ✅ Čeklista za testiranje — Faza 1

**A. Prijava**

- [ ] **1.1** Odjavi se (ako si prijavljen). Na `/login` unesi `marko.markovic` / `Admin123!` → **uspešna prijava**, prebacuje na `/` (početna)
- [ ] **1.2** U zaglavlju se vidi korisničko ime `marko.markovic` u **padajućem meniju**, a glavni meni sadrži: **🛒 Korpa** i **📦 Arhiva** („Moj profil" i „Izloguj se" su u padajućem meniju; **nema** stavke „Početna" — logo je početna)
- [ ] **1.3** Odjavi se, pa probaj `marko.markovic` / `pogresna` → poruka **`Pogrešno korisničko ime ili lozinka`**
- [ ] **1.4** Probaj `nepostoji` / `Admin123!` → ista poruka (ne otkriva da li korisnik postoji)
- [ ] **1.5** Prijavi se kao `nova.stamparija` / `Admin123!` → poruka **`Nalog nije odobren od strane administratora`**
- [ ] **1.6** Ponovi sa `nova.firma` → ista poruka

**B. Administratorska prijava (posebna ruta)**

- [ ] **1.7** Idi na `/admin` → prikaže se **posebna** admin forma (u meniju **ne postoji** dugme „Administrator")
- [ ] **1.8** Prijavi se kao `admin` / `Admin123!` → **uspešno**, prebacuje na `/`
- [ ] **1.9** Odjavi se, pa na `/admin` probaj `marko.markovic` / `Admin123!` → **`Nemate pristup administrativnom panelu`**
- [ ] **1.10** Probaj `admin` / `pogresna` → `Pogrešno korisničko ime ili lozinka`
- [ ] **1.10a** Odjavi se, pa na **`/login`** (obična javna prijava) probaj `admin` / `Admin123!` → **`Administratori se prijavljuju na posebnoj administratorskoj strani`** (admin **ne može** preko javne forme)
- [ ] **1.10b** Dok si **prijavljen** (bilo koji tip), otvori direktno `/login` → **preusmerava na `/`**
- [ ] **1.10c** Isto probaj za `/admin` dok si prijavljen → preusmerava na `/`

**C. Zaštita ruta (guard)**

- [ ] **1.11** Odjavljen, otvori direktno `/profil` → **preusmerava na `/login`**
- [ ] **1.12** Isto probaj za `/korpa`, `/arhiva`, `/nabavke`, `/licitacije` → svi preusmeravaju na `/login`
- [ ] **1.13** Javne strane rade bez prijave: `/`, `/proizvod/PR-001`, `/registracija`, `/login`, `/admin`
- [ ] **1.14** Odjava: padajući meni → „Izloguj se" → sesija obrisana, prebacuje na `/login`, meni se vraća na Prijava/Registracija
- [ ] **1.15** Posle odjave pritisni „nazad" u pregledaču → **ne sme** da vrati zaštićenu stranu sa podacima

**D. Registracija — fizičko lice**

- [ ] **1.16** Na `/registracija` izaberi „Fizičko lice" → **polja za instituciju i grad se ne prikazuju**
- [ ] **1.17** Pošalji praznu formu → poruke: `Korisničko ime mora imati bar 3 karaktera`, `Lozinka: 8-12 karaktera...`, `Ime je obavezno`, `Prezime je obavezno`, `Kontakt telefon je obavezan`, `I-mejl adresa nije ispravna`
- [ ] **1.18** Probaj lozinku `test` → poruka o pravilu za lozinku
- [ ] **1.19** Probaj lozinku `Test123!` (8 znakova, veliko slovo, broj, specijalan znak) → **prolazi** validaciju
- [ ] **1.20** Probaj e-mejl `marko.markovic@gmail.com` (već postoji) sa novim korisničkim imenom → **`Korisničko ime ili i-mejl adresa su već zauzeti`**
- [ ] **1.21** Probaj korisničko ime `marko.markovic` → ista poruka o zauzetosti
- [ ] **1.22** Ispravna registracija (npr. `test.fizicko` / `Test123!`) → **`Uspešno ste se registrovali Preusmeravanje na prijavu...`** → posle ~2 sekunde **automatski** ide na `/login`
- [ ] **1.23** Prijavi se tim novim nalogom → **radi odmah** (fizičko lice je odmah `aktivan`)

**E. Registracija — pravno lice**

- [ ] **1.24** Izaberi „Pravno lice" → prikazuju se polja: Naziv institucije, Adresa sedišta, Matični broj, PIB (**bez polja Grad**)
- [ ] **1.25** Probaj matični broj `123` → `Matični broj mora imati tačno 8 cifara`
- [ ] **1.26** Probaj PIB `012345678` (počinje nulom) → `PIB mora imati 9 cifara i ne sme počinjati nulom`
- [ ] **1.27** Probaj tuđi matični broj `23456789` (kopistudio) → `Matični broj ili PIB su već registrovani`
- [ ] **1.28** Uspešna registracija (npr. `test.pravno`) → **`Zahtev za registraciju je poslat na odobrenje administratora`** → preusmeravanje na `/login`
- [ ] **1.29** Pokušaj prijavu tim nalogom → `Nalog nije odobren od strane administratora` ✔ (ispravno ponašanje)

**F. Registracija — štamparija**

- [ ] **1.30** Izaberi „Štamparija" → prikazuju se polja institucije **+ polje Grad**
- [ ] **1.31** Ostavi Grad prazno → `Grad je obavezan`
- [ ] **1.32** Uspešna registracija (npr. `test.stampar`) → poruka o odobrenju, nalog je `na_cekanju`

**G. Profilna slika**

- [ ] **1.33** Izaberi fajl koji **nije** slika (npr. `.txt` preimenovan u `.jpg` ili `.pdf`) → `Format slike mora biti JPG, PNG ili GIF`
- [ ] **1.34** Izaberi sliku **300×300 px** → `Slika mora biti između 100x100 i 250x250 px`
- [ ] **1.35** Izaberi sliku **150×150 px** → prihvata se, nema greške
- [ ] **1.36** Registracija **bez** slike → prolazi; na profilu se vidi default slika (`👤` ili `default_profile_image.jpg`)
- [ ] **1.37** Posle registracije sa slikom, proveri da fajl postoji u `backend/uploads/`

**H. Sesija**

- [ ] **1.38** Posle prijave osveži stranicu (F5) → **ostaješ prijavljen** (sesija u `localStorage`)
- [ ] **1.39** U DevTools → Application → Local Storage → `ulogovan` sadrži korisnika **bez polja `lozinka`**

**I. Zaglavlje i navigacija (redizajn)**

*Odjavljen korisnik:*

- [ ] **1.40** Klik na logo **„🖨️ Printing House"** → vraća na početnu (`/`) sa bilo koje strane
- [ ] **1.41** U meniju su **samo** „Prijava" i „Registracija" — dugme „Administrator" **ne postoji** (admin forma je dostupna samo preko `/admin`)
- [ ] **1.41a** „Registracija" je **obična veza** u meniju, ne akcentno (crveno/narandžasto) dugme
- [ ] **1.42** Trenutna strana je vizuelno označena — na `/login` je označena „Prijava", na `/registracija" „Registracija"

*Prijavljen klijent:*

- [ ] **1.43** Aktivna strana je označena: na `/korpa` je označena „🛒 Korpa", na `/arhiva` „📦 Arhiva"; na početnoj (`/`) **nema** označene stavke (logo predstavlja početnu)
- [ ] **1.44** Klik na korisničko ime (avatar + ime + „▾") otvara **padajući meni** sa: imenom i e-mejlom, „👤 Moj profil" i „🚪 Izloguj se"
- [ ] **1.45** „Moj profil" vodi na `/profil`; **klik van** menija zatvara padajući meni
- [ ] **1.46** Kao **štampar** (`kopistudio`) meni sadrži **samo 🏷️ Licitacije** (bez Korpe i Arhive — štampar ne kupuje)
- [ ] **1.47** Kao **pravno lice** (`nenad.nedic`) meni sadrži **🛒 Korpa + 📦 Arhiva + 📋 Nabavke**
- [ ] **1.48** Kao **admin** meni nema nijednu vezu — samo logo i padajući meni korisnika (panel dolazi u Fazi 8)

*Mali ekran (responsive):*

- [ ] **1.49** Suzi prozor ispod **900px** → meni se **ne sabija**, nego se pojavljuje dugme **„☰"** (burger)
- [ ] **1.50** Klik na burger otvara meni **ispod** zaglavlja, vertikalno; ikona se menja u **„✕"**; klik ponovo zatvara
- [ ] **1.51** Klik na bilo koju vezu u burger meniju zatvara meni

*Skrol i razmak:*

- [ ] **1.52** Skroluj do dna početne, pa klikni vezu u meniju (npr. „📦 Arhiva") ili logo → **nova strana počinje od vrha**, zaglavlje ne prekriva vrh strane
- [ ] **1.53** Razmak između zaglavlja i hero banera („Dobrodošli u Printing House") je **~48px** — vidi se svetla traka između tamnog zaglavlja i plavog banera

> **Poznati detalj (ispravljeno 2026-09-21):** `<main>` nosi i klasu `.container`, a `.container { padding: 0 20px }`
> je kao klasa bio specifičniji od pravila `main { padding: ... }`, pa se **vertikalni padding nikada nije primenjivao**
> (računao se kao `0px`). Zato je baner ranije bio zalepljen za zaglavlje bez obzira na vrednost. Sada je pravilo
> `main.container { padding-top: 48px; padding-bottom: 56px; }`, pa se vertikalni razmak zaista vidi.

---

## FAZA 2 — Javni deo (neregistrovani korisnik)

### Šta zadatak zahteva
- Укупан број штампарија + ТОП 5 најбољих производа
- Претрага по више параметара и резултати са сортирањем
- Детаљи производа (са једном сликом)

### Šta je implementirano
**Backend** (`controllers/proizvodiController.ts`, `routers/proizvodiRouter.ts`):

| Ruta | Metod | Opis |
|---|---|---|
| `/brojStamparija` | GET | Broj aktivnih štamparija (`tip: stampar`, `status: aktivan`) |
| `/top5Proizvoda` | GET | TOP 5 po broju 👍 (aggregate nad komentarima + join proizvoda) |
| `/kategorijeZaPretragu` | GET | Samo kategorije sa aktivnim proizvodima na stanju |
| `/gradoviIStamparije` | GET | Gradovi i štamparije koji imaju aktivne proizvode na stanju — za padajuće liste u formi pretrage |
| `/pretragaProizvoda?naziv=&kategorija=&grad=&stamparija=` | GET | Samo `aktivan: true` i `kolicinaNaLageru > 0`; naziv = podstring, ostali filteri = tačno poklapanje; svi uslovi važe istovremeno (AND) |
| `/detaljiProizvoda/:sifra` | GET | Detalji + broj 👍/👎 |

**Frontend:** `components/pocetna/` (ruta `/`, javna) i `components/proizvodDetalji/` (ruta `/proizvod/:sifra`)

> **Napomena:** TOP 5 se računa **samo iz ocena `svidja`**, i prikazuje samo proizvode koji su
> `aktivan` i imaju lager > 0. Proizvodi sa istim brojem 👍 su u nedefinisanom redosledu.

### ✅ Čeklista za testiranje — Faza 2

**A. Početna strana (bez prijave)**

- [ ] **2.1** Odjavljen, otvori `/` → vidi se naslov „Dobrodošli u Printing House"
- [ ] **2.2** Prikazuje se **`Broj registrovanih štamparija: 3`**
- [ ] **2.3** Naslov „🏆 TOP 5 najbolje ocenjenih proizvoda" prikazuje **5 stavki**
- [ ] **2.4** Prvi u TOP 5 je **`Pamucna Polo Majica` (PR-001)** sa **4 👍**
- [ ] **2.5** Drugi je **`Hemijska olovka` (GPR-001)** sa **2 👍**
- [ ] **2.6** Svaka stavka prikazuje i naziv štamparije i grad
- [ ] **2.7** Klik na proizvod u TOP 5 → otvara `/proizvod/<sifra>` (strana detalja)

**B. Pretraga**

- [ ] **2.8** Tabela na početnoj (bez pretrage) prikazuje **8 proizvoda**
- [ ] **2.9** U padajućem meniju Kategorija su **tačno 3 kategorije**: Štampa malih formata, Štampa velikih formata, Kreativne štampe
- [ ] **2.9a** Postoje **4 polja** u formi pretrage: Naziv proizvoda, Kategorija, **Grad**, **Štamparija** (+ dugmad „Pretraži" i „Očisti")
- [ ] **2.9b** Meni **Grad** sadrži tačno **3 grada**: Beograd, Niš, Novi Sad (abecedno)
- [ ] **2.9c** Meni **Štamparija** sadrži tačno **3 štamparije**: Copy Studio Kumanovska, Grafika Art Print, Štamparija Centar (abecedno po nazivu)
- [ ] **2.10** Pretraga po nazivu `majica` → **1 rezultat** (Pamucna Polo Majica). 👉 **Probaj i malim slovima** — pretraga je case-insensitive
- [ ] **2.11** Pretraga po nazivu `olovka` → 1 rezultat (Hemijska olovka)
- [ ] **2.12** Pretraga `Pamucna` (bez dijakritika) → nalazi `Pamucna Polo Majica`
- [ ] **2.13** Pretraga `majca` → **0 rezultata** (podstring se poklapa po slovima, ne po smislu)
- [ ] **2.14** Izbor kategorije `Kreativne štampe` (bez naziva) → **4 rezultata** (PR-001, PR-002, CPR-002, CPR-003)
- [ ] **2.15** Izbor kategorije `Štampa malih formata` → **3 rezultata** (GPR-001, CPR-001 — i proveri da **Vizit karta nije tu**)
- [ ] **2.16** Kombinacija: naziv `duks` + kategorija `Kreativne štampe` → 1 rezultat (Pamučni duks)
- [ ] **2.17** Kombinacija koja ne postoji (npr. naziv `olovka` + kategorija `Kreativne štampe`) → **`Nema rezultata za zadate kriterijume.`**

**B2. Pretraga po gradu i štampariji**

- [ ] **2.17a** Grad `Niš` (bez ostalih filtera) → **3 rezultata**: Flajer A5, Pamučni duks, Štamparski ceger
- [ ] **2.17b** Grad `Beograd` → **4 rezultata** (PR-001, PR-002, PR-003, i nijedan iz Novog Sada)
- [ ] **2.17c** Štamparija `Grafika Art Print` → **2 rezultata**: Hemijska olovka, Poster A3
- [ ] **2.17d** Štamparija `Grafika Art Print` → **Vizit karta (GPR-002) se NE pojavljuje**, jer je `aktivan: false`
- [ ] **2.17e** Grad + štamparija zajedno: grad `Niš` + štamparija `Štamparija Centar` → **3 rezultata** (isti kao 2.17a)
- [ ] **2.17f** Kombinacija koja ne postoji: grad `Niš` + štamparija `Copy Studio Kumanovska` → **`Nema rezultata za zadate kriterijume.`**
- [ ] **2.17g** Naziv + grad: naziv `duks` + grad `Niš` → **1 rezultat** (Pamučni duks)
- [ ] **2.17h** Naziv + grad koji se ne poklapaju: naziv `duks` + grad `Beograd` → **`Nema rezultata za zadate kriterijume.`**
- [ ] **2.17i** Kategorija + štamparija: kategorija `Kreativne štampe` + štamparija `Copy Studio Kumanovska` → **2 rezultata** (PR-001, PR-002)
- [ ] **2.17j** Sva 4 filtera istovremeno (naziv, kategorija, grad, štamparija) → primenjuju se **svi zajedno**
- [ ] **2.17k** Klik na **„Očisti"** → sva 4 polja se vraćaju na početne vrednosti i tabela ponovo prikazuje **8 proizvoda**
- [ ] **2.17l** Sortiranje po ceni i dalje radi na filtriranim rezultatima (npr. grad `Niš` + klik na „Cena")

**C. Sortiranje**

Podrazumevano je sortiranje po **nazivu rastuće**. Kolone **Naziv** i **Cena (RSD)** su klikabilne (kursor se
menja u `pointer`, a neaktivna kolona prikazuje bledu oznaku `⇅`).

- [ ] **2.18** Klik na zaglavlje kolone **Naziv** → sortira rastuće, oznaka postaje **`↑`**
- [ ] **2.19** Ponovni klik → sortira opadajuće, oznaka postaje **`↓`**
- [ ] **2.19a** Klik na zaglavlje **Cena (RSD)** → sortira **rastuće po ceni**, oznaka postaje `↑`
      (očekivani redosled cena: 12, 45, 150, 250, 320, 1200, 1800, 4500)
- [ ] **2.19b** Ponovni klik na **Cena (RSD)** → sortira **opadajuće**, oznaka `↓`, a kolona **Naziv**
      prelazi u neaktivnu oznaku `⇅` (samo jedna kolona je aktivna)
- [ ] **2.19c** Klik sa **Cena** na **Naziv** → naziv kreće **rastuće** (nova kolona uvek počinje od `↑`),
      a na „Cena" ostaje bleda `⇅`
- [ ] **2.19d** Zaglavlje **Cena (RSD)** je i dalje **poravnato desno** i klikabilno (klasa `sortable desno`)
- [ ] **2.20** Sortiranje radi i na rezultatima pretrage (ne samo na punoj listi)
- [ ] **2.21** Posle nove pretrage **aktivno sortiranje se zadržava** (npr. ako je izabrana „Cena ↓",
      rezultati nove pretrage su i dalje sortirani po ceni opadajuće)

**D. Detalji proizvoda (javno — odjavljen)**

- [ ] **2.22** Otvori `/proizvod/PR-001` → naziv, štamparija (`Copy Studio Kumanovska`), grad (Beograd)
- [ ] **2.23** Prikazuje se **`👍 4`** i **`👎 0`**
- [ ] **2.24** Kategorija/potkategorija: `Kreativne štampe / Štampa na majicama`
- [ ] **2.25** Cena po komadu: **1200 RSD**; Na stanju: **150 kom.**
- [ ] **2.26** Prikazuje se opis proizvoda
- [ ] **2.27** Tabela „Usluge štampe" ima **2 reda** (DTG +350 RSD, Sito preslikač +200 RSD) sa maks. dimenzijama
- [ ] **2.28** Kao odjavljen korisnik **NE** vidiš: izbor boje, `DODAJ U KORPU`, formu za komentar, info o štampariji (to je samo za klijente)
- [ ] **2.29** Pošto proizvodi još nemaju slike, prikazuje se placeholder `🖨️` + naziv (nije greška)
- [ ] **2.30** Otvori `/proizvod/NE-POSTOJI` → poruka **`Proizvod nije pronađen`** + link „← Nazad na pretragu"
- [ ] **2.31** ⚠️ Otvori `/proizvod/GPR-002` (Vizit karta, `aktivan: false`) → **strana se OTVARA**. Nalaz: neaktivan proizvod nije u pretrazi, ali je dostupan preko direktnog linka
- [ ] **2.32** Pritisni `F5` na strani detalja → detalji se ponovo učitavaju (radi direktan link)

---

## FAZA 3 — Klijent: profil, narudžbine, pretraga i detalji

### Šta zadatak zahteva
- Приказ и ажурирање профила
- Табела са претходним и актуелним наруџбинама
- Претраживање производа и детаљи (prošireno za klijente)
- ~~Отказивање наруџбине која је „наручена"~~ → **odloženo za kraj** (crvena stavka)
- ~~Мапа где је штампарија~~ → **odloženo za kraj** (crvena stavka)

### Šta je implementirano
**Backend:**

| Ruta | Metod | Opis |
|---|---|---|
| `/azurirajProfil` | POST | Ažuriranje profila (multipart, opciona nova slika) — `korisniciController.ts` |
| `/narudzbineKlijenta?klijentId=` | GET | Sve fakture klijenta, sortirane po datumu opadajuće — `narudzbineController.ts` |
| `/detaljiProizvodaKlijent/:sifra` | GET | Detalji + `stamparijaInfo` + poslednjih 5 komentara — `proizvodiController.ts` |

**Frontend:** `components/profil/` (`/profil`, zaštićena) — prikaz profila, dve tabele narudžbina i **forma za izmenu podataka (N-1, ✅ 2026-09-22)** + prošireni `components/proizvodDetalji/`

**Poznate poruke:** `Uspešno` · `Podaci su uspešno sačuvani` · `Korisnik ne postoji` · `I-mejl adresa je već zauzeta` · `Matični broj ili PIB su već registrovani` · `Slika mora biti između 100x100 i 250x250 px`

### ✅ Čeklista za testiranje — Faza 3

**A. Profil — prikaz**

- [ ] **3.1** Prijavi se kao `marko.markovic` → u meniju klik na **Profil** → `/profil`
- [ ] **3.2** Prikazuju se podaci: korisničko ime, ime i prezime, e-mail, telefon, tip (`klijent (fizicko)`)
- [ ] **3.3** Za `marko.markovic` (fizičko lice) **ne** prikazuju se polja Institucija/Adresa/Mat.br
- [ ] **3.4** Prijavi se kao `nenad.nedic` → na profilu se vidi **Institucija: TRGOPROM doo**, **Adresa**, **Grad**

**B. Profil — tabele narudžbina**

- [ ] **3.5** Tabela **„Aktivne narudžbine"** za `marko.markovic` ima **2 reda**: `F-2026-001` (`naruceno`), `F-2026-002` (`u stampi`)
- [ ] **3.6** Tabela **„Arhiva narudžbina"** ima **3 reda**: `F-2026-003` (`isporuceno`), `F-2026-004`, `F-2026-005` (`primljeno`)
- [ ] **3.7** Svaki red prikazuje: ID fakture, datum, štampariju + grad, iznos (RSD), status
- [ ] **3.8** Statusi imaju vizuelno različite oznake (badge), boja odgovara statusu
- [ ] **3.9** Klik na zaglavlje **Datum** u „Aktivne" → sortira `↑`, pa `↓` pri ponovnom kliku
- [ ] **3.10** Isto za „Arhiva narudžbina" — sortiranje je **nezavisno** od prve tabele
- [ ] **3.11** Prijavi se kao `jovana.jovanovic` → „Arhiva" ima 2 reda (`F-2026-006`, `F-2026-007`), „Aktivne" je prazna uz poruku `Nema aktivnih narudžbina.`
- [ ] **3.12** Prijavi se kao `nenad.nedic` → „Aktivne" ima 1 red (`F-2026-008`, status `u stampi`)
- [ ] **3.13** ⚠️ Za klijenta koji nema ni jednu fakturu (npr. novoregistrovan) → obe tabele prikazuju poruku o praznom stanju, bez greške u konzoli

**C. Ažuriranje profila — ✅ UI implementiran (nalaz N-1 rešen 2026-09-22)**

- [ ] **3.14** Na `/profil` postoji dugme **„✏️ Izmeni podatke"** (gore desno u kartici „Moj profil")
- [ ] **3.15** Klik na dugme → prikaz ličnih podataka se zamenjuje **formom za izmenu**, a **obe tabele narudžbina ostaju nepromenjene**
- [ ] **3.16** Polje **Korisničko ime** je prikazano ali **onemogućeno** (`disabled`), uz napomenu „Korisničko ime se ne može menjati."
- [ ] **3.17** Polja su popunjena trenutnim podacima (e-mejl, ime, prezime, telefon)
- [ ] **3.18** Za `marko.markovic` (fizičko lice) u formi **nema** polja Naziv institucije / Adresa / Matični broj / PIB / Grad
- [ ] **3.19** Za `nenad.nedic` (pravno lice) vide se **Naziv institucije, Adresa sedišta, Matični broj (8 cifara), PIB** — ali **nema** polja Grad
- [ ] **3.20** Za `kopistudio` (štampar) vidi se i polje **Grad**, popunjeno sa `Beograd`
- [ ] **3.21** Izmeni **ime** (`Marko` → `MarkoT`) → **Sačuvaj izmene** → poruka `Podaci su uspešno sačuvani`, forma se zatvara, prikaz pokazuje novo ime
- [ ] **3.22** **Bez reload-a**: otvori korisnički meni (čip gore desno) → zaglavlje menija prikazuje **novo ime** (sesija u zaglavlju se osvežila)
- [ ] **3.23** Vrati ime na `Marko` i sačuvaj → baza, prikaz i meni se ponovo poklapaju
- [ ] **3.24** Izmeni e-mejl pa klikni **Otkaži** → forma se zatvara **bez** čuvanja, stari e-mejl ostaje
- [ ] **3.25** Klijentska validacija: PIB `12345678` (8 cifara) → `PIB mora imati 9 cifara i ne sme počinjati nulom`
- [ ] **3.26** Klijentska validacija: obriši ime → `Ime je obavezno`
- [ ] **3.27** Serverska validacija: e-mejl `admin@printinghouse.rs` (zauzet) → `I-mejl adresa je već zauzeta`, forma ostaje otvorena
- [ ] **3.28** Slika **300×300** px → `Slika mora biti između 100x100 i 250x250 px` i **nema** pregleda
- [ ] **3.29** Slika **150×150** px → greška nestaje i prikazuje se **pregled nove slike**
- [ ] **3.30** Sačuvaj sa novom slikom → `Uspešno`; slika na profilu i avatar u meniju se menjaju
- [ ] **3.31** Posle izmene se prijavi ponovo **starim korisničkim imenom** → prijava radi (korisničko ime se nije promenilo)

**C2. Curl provere (iste serverske poruke, i bez UI-a)**

- [ ] **3.32** Provera da backend **postoji i radi** (curl, dok je backend pokrenut):
  ```bash
  curl -X POST http://localhost:4000/azurirajProfil \
    -F korisnickoIme=marko.markovic \
    -F ime=Marko -F prezime=Markovic \
    -F telefon=0641112223 \
    -F email=marko.markovic@gmail.com
  ```
  → očekivano: `{"message":"Uspešno","user":{...}}` (bez polja `lozinka`)
- [ ] **3.33** Preko curl-a probaj **zauzet e-mejl** (npr. `jovana.jovanovic@gmail.com`) → `I-mejl adresa je već zauzeta`
- [ ] **3.34** Preko curl-a probaj **nepostojećeg korisnika** → `Korisnik ne postoji`
- [ ] **3.35** Preko curl-a probaj **neispravan e-mejl** (npr. `abc`) → `I-mejl adresa nije ispravna`
- [ ] **3.36** Preko curl-a, za štampare/institucije, probaj tuđi PIB (`445566778`) → `Matični broj ili PIB su već registrovani`
- [ ] **3.37** Preko curl-a, štampar bez grada (`kopistudio`) → `Grad je obavezan`

**D. Detalji proizvoda kao klijent (prošireno)**

- [ ] **3.38** Prijavljen kao `marko.markovic`, otvori `/proizvod/PR-001` → sada se vidi **dropdown za boju** sa 4 boje (Bela, Crna, Tamno plava, Siva), prva je izabrana
- [ ] **3.39** Vidi se i polje **Količina** (podrazumevano 1) i dugme **🛒 DODAJ U KORPU**
- [ ] **3.40** U tabeli usluga, za svaki red postoji **radio dugme**
- [ ] **3.41** Izaberi uslugu **DTG (+350)** → prikazuje se **`Ukupna cena po komadu: 1550 RSD`** (1200 + 350)
- [ ] **3.42** Izaberi uslugu **Sito preslikač (+200)** → **`1400 RSD`**
- [ ] **3.43** Izabrani red usluge je vizuelno označen (klasa `izabrana`)
- [ ] **3.44** Prikazuje se blok **„Informacije o štampariji"**: naziv institucije, adresa + grad, telefon, e-mail
- [ ] **3.45** Prikazuje se blok **„Komentari"** sa **4 komentara** (`PR-001`), najnoviji prvi
- [ ] **3.46** Svaki komentar ima: korisničko ime, datum, ocenu (👍/👎) i tekst
- [ ] **3.47** Komentari koje je ostavio prijavljeni korisnik (`marko.markovic`) imaju **narandžasti okvir** (leva ivica + svetla pozadina)
- [ ] **3.48** Prikazuje se i forma **„Dodaj komentar"** sa radio ocenama i textarea poljem
- [ ] **3.49** Prijavi se kao `kopistudio` (štampar) i otvori isti proizvod → **NE vidi** ni boju, ni količinu, ni korpu, ni komentare (samo javni prikaz)
- [ ] **3.50** ⚠️ Kao odjavljen korisnik, otvori `/proizvod/PR-001` → javni prikaz (bez klijentskih opcija) — ovo je očekivano

---

## FAZA 4 — Klijent: priprema proizvoda, e-korpa, fakture i plaćanje

### Šta zadatak zahteva
- Додавање услуге и текста за штампу
- Е-корпа тренутни приказ и затварање наруџбине
- ~~Достављање ПДФ фактуре на и-мејл~~ (crvena — ali implementirano)
- ~~Сервис за плаћање~~ → **odloženo za kraj** (crvena stavka)

### Šta je implementirano
**Backend** (`controllers/korpaController.ts`, `routers/korpaRouter.ts`, `utils/pdfUtils.ts`, `utils/emailUtils.ts`):

| Ruta | Metod | Opis |
|---|---|---|
| `/dodajUKorpu` | POST | Dodavanje u korpu + provera lagera; spaja isti proizvod+uslugu+boju |
| `/ukloniIzKorpe` | POST | Uklanjanje stavke |
| `/korpaKlijenta?klijentId=` | GET | Sadržaj korpe |
| `/potvrdiKorpu` | POST | Fakture po štamparijama, smanjenje lagera, PDF + e-mejl |

- Cena = `jedinicnaCena` + `dodatnaCenaPoKomadu` izabrane usluge
- Auto-increment ID fakture: `F-2026-XXX`
- PDF faktura: `pdfkit` (zaglavlje, štamparija, klijent, tabela stavki, ukupno)
- **N-2 (2026-09-22):** tekst za štampu se čuva u stavci korpe, **prenosi u `stavke` fakture** pri `potvrdiKorpu` i ispisuje u PDF-u ispod reda stavke (samo ako tekst postoji)
- **N-15/N-16 (2026-09-23):** tabela stavki u PDF-u je prerađena — **Šifra je prva kolona**, širine kolona `[52, 150, 62, 42, 122, 52, 52]` pt uz unutrašnji razmak od 6 pt, **visina reda se računa iz najviše ćelije** (`heightOfString`) pa prelomljeni nazivi ne ulaze u red ispod, „Tekst za štampu" stoji **ispod ćelija svog reda**, redovi su razdvojeni tankom linijom, a na novoj strani se ponavlja zaglavlje kolona. Ugrađeni su **Roboto** fontovi (`backend/assets/fonts/`, SIL OFL 1.1) da bi **č, ć, ž i đ** bili ispravno ispisani

**Frontend:** `components/ekorpa/` (`/korpa`, zaštićena) + prošireni `proizvodDetalji` (polje **„Tekst za štampu"**, N-2)

**Poznate poruke:** `Uspešno dodato u korpu` · `Nema dovoljno proizvoda trenutno na stanju` · `Uspešno poručeno` · `Korpa je prazna` · `Nema dovoljno proizvoda <naziv> na stanju (dostupno: X)`

### ✅ Čeklista za testiranje — Faza 4

**A. Dodavanje u korpu**

- [ ] **4.1** Prijavljen kao `marko.markovic`, otvori `/proizvod/PR-001`, izaberi boju **Crna**, uslugu **DTG**, količinu **2** → klik `DODAJ U KORPU` → poruka **`Uspešno dodato u korpu`**
- [ ] **4.2** Ponovo dodaj isti proizvod (+1) → količina u korpi postaje **3**, a **ne** dva odvojena reda
- [ ] **4.3** Dodaj isti proizvod sa **drugom bojom** → to je **nova stavka** (različit red)
- [ ] **4.4** Pokušaj dodavanje **velike količine** (npr. `99999`) → **`Nema dovoljno proizvoda trenutno na stanju`** i stavka **se ne dodaje**
- [ ] **4.5** Otvori `/proizvod/CPR-001` (Štamparija Centar, Niš), izaberi **Digitalna štampa**, količinu **10** → dodaj u korpu
- [ ] **4.6** Dodaj i jedan proizvod od **grafika** (npr. `GPR-001`) → u korpi sada imaš stavke iz **3 štamparije**

**B. E-korpa — prikaz i trenutno stanje**

- [ ] **4.7** Klik na **🛒 Korpa** u meniju → `/korpa`

  *Za prvi test je najlakše prvo isprazniti korpu i dodati 2 stavke iz 2 štamparije:*
  *`PR-001` boja Crna + DTG, količina 2 (Copy Studio) i `CPR-001` + Digitalna štampa, količina 10 (Centar).*

- [ ] **4.8** Stavke su **grupisane po štamparijama**, sa naslovom „Štamparija: <naziv> (<grad>)"
- [ ] **4.9** Svaka stavka prikazuje: proizvod, boju, uslugu, količinu, cenu/kom i iznos
- [ ] **4.10** **Provera cene:** `PR-001` + DTG, količina 2 → cena/kom **1550 RSD**, iznos **3100 RSD**
- [ ] **4.11** **Provera cene:** `CPR-001` + Digitalna štampa, količina 10 → cena/kom **20 RSD**, iznos **200 RSD**
- [ ] **4.12** Za svaku štampariju prikazuje se „Za štampariju: <iznos>"
- [ ] **4.13** Prikazuje se **Ukupno** (zbir svih štamparija)
- [ ] **4.14** Klik na **Ukloni** kod jedne stavke → stavka nestaje, iznosi i ukupno se **preračunavaju**
- [ ] **4.15** Ukloni sve stavke → prikazuje se **`Korpa je prazna.`** + dugme „← Nastavi kupovinu"
- [ ] **4.16** Osveži stranicu (F5) → korpa je **sačuvana** (u bazi, ne u `localStorage`)
- [ ] **4.17** Odjavi se i prijavi kao `jovana.jovanovic` → `/korpa` je **prazna** (korpa je vezana za klijenta)

> ⚠️ **Pre nego što nastaviš dalje:** vrati stavke u korpu (vidi 4.7) — potrebne su za testove potvrde.

**C. Potvrda narudžbine**

> **Pre testa zapiši trenutni lager `PR-001`** (na strani detalja treba da piše **150 kom.**) i
> **zapiši najveći broj fakture** (npr. `F-2026-008`).

- [ ] **4.18** Klik na **✅ POTVRDI NARUDŽBINU** → pojavljuje se `confirm()` dijalog **„Da li ste sigurni da želite da potvrdite narudžbinu?"**
- [ ] **4.19** Klik na **Cancel** → ništa se ne dešava, korpa ostaje ista
- [ ] **4.20** Ponovo klik na POTVRDI → **OK** → prikazuje se **`✅ Narudžba uspešno poslata!`** sa listom kreiranih faktura
- [ ] **4.21** Broj kreiranih faktura = **broj štamparija** u korpi (2 štamparije → **2 fakture**)
- [ ] **4.22** ID novih faktura su nastavak niza (npr. `F-2026-009`, `F-2026-010`)
- [ ] **4.23** Klik na „Pogledaj narudžbine" → `/profil` → nove fakture su u tabeli **Aktivne narudžbine** sa statusom **`naruceno`**
- [ ] **4.24** Korpa je **ispražnjena** (odlazak na `/korpa` → `Korpa je prazna.`)
- [ ] **4.25** **Lager je smanjen:** otvori `/proizvod/PR-001` → „Na stanju" je **148** (bilo 150, naručeno 2)
- [ ] **4.26** Lager `CPR-001` je smanjen za 10 (5000 → 4990)
- [ ] **4.27** Novokreirana faktura ima tačan iznos i stavke (proveri u `/profil`, odnosno u bazi)

**D. PDF faktura i e-mejl**

- [ ] **4.28** U **terminalu backend-a** posle potvrde korpe traži log linije: `I-mejl: napravljen Ethereal test nalog …`, `Email poslat na <adresa> za fakturu F-2026-XXX` i `Pregled poslatog i-mejla: https://ethereal.email/message/…`
- [ ] **4.29** ✅ **E-mejl sada zaista odlazi (nalaz N-3 rešen 2026-09-23).** Na `/korpa` posle potvrde stoji **„📧 Faktura je poslata na i-mejl: <adresa>"**. Ako slanje ne uspe, prikazuje se **„⚠️ Fakture su kreirane, ali i-mejl na <adresa> nije poslat."** — porudžbina i tada važi (faktura i lager su već promenjeni)
- [ ] **4.30** ⚠️ **Ethereal ne dostavlja poštu na pravu adresu** — otvori `Pregled poslatog i-mejla:` link iz loga; tamo je prava poruka (naslov `Faktura F-2026-XXX - Printing House`) sa PDF prilogom. PDF se i dalje generiše u memoriji i **ne snima se na disk**, pa ga klijent ne može preuzeti sa sajta
- [ ] **4.30a** U prilogu proveri tabelu stavki (nalaz **N-15** rešen 2026-09-23): kolone idu redom **Šifra · Proizvod · Boja · Kol. · Usluga · Cena/kom · Iznos**, stoje jedna pored druge **bez preklapanja** i **„Šifra" je prva**
- [ ] **4.30b** Duži naziv (`Keramička šolja 330ml`, `Promotivni Roll-up Baner 85x200cm`) i duža usluga (`Direktna štampa na tekstil (DTG)`, `Eko-solventna štampa visoke rezolucije`) lome se **unutar svoje kolone** i ne prelaze preko reda ispod; između kolona postoji razmak
- [ ] **4.30c** Red sa unetim tekstom prikazuje **„Tekst za štampu: …" kurzivom ispod ćelija tog reda**, i to **tačno jednom** (ne preko kolona i ne ponavlja se u drugim redovima)
- [ ] **4.30d** Podaci sa dijakriticima su ispravni (nalaz **N-16** rešen 2026-09-23): `Keramička šolja 330ml`, `Pamučni duks`, `Štamparija Centar`, `Niš`, `Marko Marković` — **nema** znakova tipa `KeramiÖ¶ ¦öÆ¦`
- [ ] **4.30e** Dokument ima jednu stranu (za male porudžbine); kod duže porudžbine tabela se nastavlja na novoj strani **sa ponovljenim zaglavljem kolona**, a `UKUPNO: … RSD` je poravnato desno i podnožje centrirano u jednom redu

**E. Dodavanje teksta za štampu — ✅ implementirano (nalaz N-2 rešen 2026-09-22)**

- [ ] **4.31** Prijavljen kao klijent (`marko.markovic`), otvori `/proizvod/PR-001` → blok **„Tekst za štampu"** je **ispod polja Količina**, a **iznad** dugmeta „🛒 DODAJ U KORPU"
- [ ] **4.32** Textarea ima `rows="3"`, placeholder („Tekst koji treba odštampati...") i ograničenje **500 karaktera**
- [ ] **4.33** Ispod polja je brojač karaktera koji se menja pri kucanju (npr. `13/500 karaktera`)
- [ ] **4.34** Unesi tekst → **🛒 DODAJ U KORPU** → poruka `Uspešno dodato u korpu`
- [ ] **4.35** Tekst **ostaje u polju** posle uspešnog dodavanja (namerno — da se isti tekst može dodati i u drugoj boji)
- [ ] **4.36** Otvori `/korpa` → ispod naziva proizvoda se prikazuje **🖨️ uneti tekst** (klijent vidi šta naručuje pre potvrde)
- [ ] **4.37** Provera da je tekst sačuvan (curl):
  ```bash
  curl "http://localhost:4000/korpaKlijenta?klijentId=marko.markovic"
  ```
  → stavka sadrži `"tekst":"<uneti tekst>"`
- [ ] **4.38** **✅ POTVRDI NARUDŽBINU** → `Uspešno poručeno`; zatim provera da je tekst stigao **na fakturu**:
  ```bash
  curl "http://localhost:4000/narudzbineKlijenta?klijentId=marko.markovic"
  ```
  → `stavke[].tekst` sadrži uneti tekst (ovo kasnije vidi štampar u Fazi 7)
- [ ] **4.39** PDF faktura se generiše bez greške i ispisuje **„Tekst za štampu: …"** manjim kurzivom **ispod ćelija reda stavke** (ne preko njih — nalaz N-15); ako tekst nije unet, red ostaje nepromenjen
- [ ] **4.39a** Za istu fakturu proveri i da je **tekst za štampu prisutan tačno onoliko puta koliko stavki ima unet tekst** (npr. 2 stavke sa tekstom → 2 pojave u dokumentu)
- [ ] **4.40** Polje **„Tekst za štampu" se NE prikazuje** štamparu (`kopistudio`), adminu i odjavljenom korisniku — samo klijentu

**F. Servis za plaćanje (crvena stavka — nije rađeno)**

- [ ] **4.41** Potvrđeno: **nema** forme za plaćanje karticom i **nema** statusa `placeno` u toku. Ovo je odložena (crvena) stavka i **nije** deo Faze 4

---

## FAZA 5 — Klijent: arhiva, lajkovi, komentari

### Šta zadatak zahteva
- Лајковање и коментарисање
- Arhiva narudžbina (isporučeno → primljeno)

### Šta je implementirano
**Backend** (`controllers/narudzbineController.ts`, `controllers/komentariController.ts`):

| Ruta | Metod | Opis |
|---|---|---|
| `/arhivaProizvoda?klijentId=` | GET | Samo `isporuceno` + `primljeno`, **razloženo po stavkama** fakture |
| `/promeniStatusPrimljeno` | POST | Samo `isporuceno` → `primljeno` |
| `/dodajKomentar` | POST | Ocena `svidja`/`ne_svidja` + tekst |
| `/komentariProizvoda?proizvodId=` | GET | Poslednjih **5** komentara |

**Frontend:** `components/arhiva/` (`/arhiva`) + forma za komentar i prikaz komentara u `components/proizvodDetalji/`

> **Napomena:** plan je predviđao formu za komentar na strani arhive, ali je implementirana na
> **stranici detalja proizvoda** (uz lajkove/dislajkove) — funkcionalnost je ista.

**Poznate poruke:** `Uspešno označeno kao primljeno` · `Samo isporučene narudžbine mogu biti označene kao primljene` · `Uspešno dodat komentar` · `Ocena mora biti svidja ili ne_svidja`

### ✅ Čeklista za testiranje — Faza 5

**A. Arhiva**

- [ ] **5.1** Prijavljen kao `marko.markovic`, klik na **📦 Arhiva** → `/arhiva`
- [ ] **5.2** Tabela ima **3 reda** (iz faktura `F-2026-003`, `F-2026-004`, `F-2026-005`)
- [ ] **5.3** Kolone: Faktura, Proizvod, Količina, Štamparija, Datum, Status
- [ ] **5.4** Samo red `F-2026-003` (status **`isporuceno`**) ima dugme **„Označi kao primljeno"**
- [ ] **5.5** Redovi sa statusom **`primljeno`** **nemaju** to dugme
- [ ] **5.6** Fakture sa statusom `naruceno` / `u stampi` **ne prikazuju se** u arhivi (proveri da `F-2026-001` i `F-2026-002` nisu tu)
- [ ] **5.7** Klik na **„Označi kao primljeno"** → poruka **`Uspešno označeno kao primljeno`**, status se menja u `primljeno`, dugme nestaje
- [ ] **5.8** Istu fakturu sada vidi i u tabeli „Arhiva narudžbina" na `/profil`, sa statusom `primljeno`
- [ ] **5.9** Ponovni klik nije moguć iz UI-ja; preko curl-a probaj ponovo → `Samo isporučene narudžbine mogu biti označene kao primljene`
  ```bash
  curl -X POST http://localhost:4000/promeniStatusPrimljeno \
    -H "Content-Type: application/json" \
    -d '{"idFakture":"F-2026-003"}'
  ```
- [ ] **5.10** Prijavi se kao `jovana.jovanovic` → `/arhiva` ima **2 reda**, oba `primljeno`, **bez** dugmadi
- [ ] **5.11** Za klijenta bez arhiviranih narudžbina → `Nema arhiviranih narudžbina.`

**B. Komentari — prikaz**

- [ ] **5.12** Otvori `/proizvod/PR-001` kao `marko.markovic` → prikazuje se **4 komentara**
- [ ] **5.13** Najnoviji komentar je prvi (sortirano po datumu opadajuće)
- [ ] **5.14** Svaki komentar ima korisničko ime, datum, ocenu i tekst
- [ ] **5.15** Komentari korisnika `marko.markovic` imaju **narandžasti okvir**; tuđi nemaju
- [ ] **5.16** Prijavi se kao `jovana.jovanovic` → sada **njeni** komentari imaju narandžasti okvir
- [ ] **5.17** Proveri ograničenje na 5: `PR-001` ima 4 komentara → dodaj **2 nova** (vidi deo C) → prikazuje se **tačno 5**, a najstariji su ispali

**C. Lajkovanje i komentarisanje**

- [ ] **5.18** Kao `marko.markovic`, na `/proizvod/PR-002` (Keramička šolja): trenutno stanje je **👍 1 / 👎 1**
- [ ] **5.19** Izaberi **👍 Sviđa mi se**, upiši tekst `Test komentar`, klik **Pošalji** → poruka **`Uspešno dodat komentar`**
- [ ] **5.20** Lista komentara se **automatski osvežava** i novi komentar je na vrhu (sa narandžastim okvirom)
- [ ] **5.21** Broj 👍 na vrhu strane se **povećao** (1 → 2)
- [ ] **5.22** Polje za tekst i izbor ocene su **resetovani** posle slanja (ponovo je izabrano 👍)
- [ ] **5.23** Pošalji komentar sa **👎** → broj 👎 se povećava
- [ ] **5.24** Pošalji komentar **bez teksta** (samo ocena) → prolazi, komentar se prikazuje bez teksta
- [ ] **5.25** Osveži stranicu (F5) → komentar i brojevi su **sačuvani**
- [ ] **5.26** Novi komentar se vidi i u **TOP 5** na početnoj ako proizvod uđe u prvih 5 (proveri da se lista nije pokvarila)
- [ ] **5.27** Preko curl-a pošalji **neispravnu ocenu** → `Ocena mora biti svidja ili ne_svidja`
- [ ] **5.28** Provera da komentar ulazi u statistiku: `proizvodId` se čuva kao **šifra** (`PR-002`), ne kao `_id`

---

## FAZA 6 — Javne nabavke (pravna lica + štamparije)

### Šta zadatak zahteva
- За јавне набавке (pravno lice raspisuje nabavku)
- Лицитације (štampari daju ponude; najpovoljnija pobeđuje)
- ~~Извештавање~~ (PDF izveštaj o ponudama) → **odloženo za kraj** (crvena stavka)

### Šta je implementirano
**Backend** (`controllers/nabavkeController.ts`, `routers/nabavkeRouter.ts`):

| Ruta | Metod | Opis |
|---|---|---|
| `/raspisiNabavku` | POST | Kreira nabavku, rok **10 minuta**, auto-increment `JN-2026-XXX` |
| `/otvoreneNabavke?stamparijaId=` | GET | Otvorene nabavke za štampare + `poslaoPonudu`; **automatski završava istekle** |
| `/posaljiPonudu` | POST | Jedna ponuda po štampariji po nabavci; proverava rok |
| `/mojeNabavke?klijentId=` | GET | Nabavke pravnog lica + broj ponuda + status; **automatski završava istekle** |

- **Automatsko završavanje:** poziv `otvoreneNabavke` ili `mojeNabavke` posle isteka roka završava nabavku
- **Izbor pobednika:** **najniža ukupna ponuda**; kreira se faktura sa statusom **`u stampi`**
- Ako nema ponuda → `zavrsena: true`, `pobednikId: ''` → prikaz „Završena (bez ponuda)"

**Frontend:** `components/javne-nabavke/` (`/nabavke`, za pravna lica) i `components/licitacije/` (`/licitacije`, za štampare)

**Poznate poruke:** `Javna nabavka uspešno raspisana` · `Ponuda uspešno poslata` · `Već ste poslali ponudu za ovu nabavku` · `Rok za ponude je istekao` · `Nabavka je već završena` · `Nabavka nije pronađena`

> ⚠️ **Bitno za testiranje:** rok je **10 minuta**. Seed-ovana `JN-2026-002` je kreirana
> **2 minuta pre seed-a**, pa je otvorena samo ~8 minuta. **Ako testiraš kasnije, ona će već biti
> završena** — zato: ili ponovo pokreni seed neposredno pre testa, ili **sam raspis novu nabavku** (test B).

### ✅ Čeklista za testiranje — Faza 6

**A. Pravno lice — prikaz i meni**

- [ ] **6.1** Prijavi se kao `nenad.nedic` (pravno lice) → u meniju se pojavljuje link **📋 Nabavke**
- [ ] **6.2** Prijavi se kao `marko.markovic` (fizičko lice) → **nema** linka 📋 Nabavke
- [ ] **6.3** Prijavi se kao `kopistudio` (štampar) → u meniju je **🏷️ Licitacije**, nema 📋 Nabavke
- [ ] **6.4** Otvori `/nabavke` kao `nenad.nedic` → tabela **„Moje nabavke"** prikazuje njegove nabavke
- [ ] **6.5** Ako je seed svež: `JN-2026-002` ima status **`Otvorena`** i **1 ponudu**
- [ ] **6.6** `JN-2026-001` ima status **`Pobednik: kopistudio`** (završena) i **3 ponude**
- [ ] **6.7** Kolone tabele: ID, Datum, Stavki, Ponuda, Status
- [ ] **6.8** Datum je prikazan u formatu sa vremenom (npr. `21. 9. 2026. 22:45`)

**B. Raspisivanje nove nabavke (pravno lice)**

- [ ] **6.9** U formi „Rasp novu nabavku" bez ijedne stavke klik na **📢 RASPŠI NABAVKU** (ili sa praznim poljem) → poruka **`Dodajte bar jednu stavku`** *(napomena: dugme ima slovnu grešku, vidi nalaz N-5)*
- [ ] **6.10** Popuni: Šifra `PR-001`, Naziv `Polo majica`, Količina `10` → klik **+ Dodaj stavku** → stavka se pojavljuje u tabeli ispod
- [ ] **6.11** Provera: polja za unos su **ispražnjena** posle dodavanja stavke (spremna za sledeću)
- [ ] **6.12** Dodaj i drugu stavku (`CPR-001` / `Flajer A5` / `100`)
- [ ] **6.13** Ukloni drugu stavku klikom na **Ukloni** → ostaje samo prva
- [ ] **6.14** Klik na **📢 RASPŠI NABAVKU** → poruka **`Javna nabavka uspešno raspisana`**
- [ ] **6.15** Nova nabavka se pojavljuje u tabeli sa **novim ID** (`JN-2026-003`) i statusom **`Otvorena`**, broj ponuda = `0`
- [ ] **6.16** Forma je resetovana (nema više stavki u tabeli forme)
- [ ] **6.17** Selektorska provera: otvori bazu → `javne_nabavke` ima novi dokument sa `rokMinuti: 10`, `zavrsena: false`
- [ ] **6.18** Provera „negativnog" unosa: probaj količinu `0` ili `-5` → stavka **ne** može da se doda (dugme ne reaguje)

**C. Štampar — licitacije**

- [ ] **6.19** Odjavi se, prijavi kao `kopistudio` → klik na **🏷️ Licitacije** → `/licitacije`
- [ ] **6.20** U tabeli otvorenih nabavki vidi se nabavka koju si upravo raspisao (`JN-2026-003`)
- [ ] **6.21** Ako je seed svež, vidi se i `JN-2026-002`; red za `JN-2026-002` kod **`stamparija.centar`** ima oznaku **`Poslato ✓`** (jer je ponuda već u seed-u)
- [ ] **6.22** Klik na **Pošalji ponudu** kod `JN-2026-003` → prikazuje se forma „Ponuda za JN-2026-003" sa stavkama nabavke
- [ ] **6.23** Forma prikazuje: Šifra, Naziv, Količina (iz nabavke) i **input za jediničnu cenu** (početna vrednost 0)
- [ ] **6.24** Upiši jediničnu cenu (npr. `1100`) → kolona **Iznos** se računa **odmah** (1100 × 10 = 11000 RSD)
- [ ] **6.25** Dno forme pokazuje **Ukupno: 11000 RSD**
- [ ] **6.26** Klik na **Otkaži** → forma se zatvara, ponuda nije poslata
- [ ] **6.27** Ponovo otvori ponudu, upiši cenu, klik na **📤 POŠALJI PONUDU** → poruka **`Ponuda uspešno poslata`**
- [ ] **6.28** Forma se zatvara, a u tabeli red tog štampara sada ima **`Poslato ✓`** umesto dugmeta
- [ ] **6.29** Osveži stranicu → oznaka `Poslato ✓` ostaje (ponuda je u bazi)
- [ ] **6.30** Prijava kao `grafika` → vidi **istu** nabavku i **može** da pošalje ponudu (različita štamparija)
- [ ] **6.31** Pošalji ponudu od `grafika` sa **nižom** cenom (npr. `1000` po komadu)
- [ ] **6.32** Prijava kao `stamparija.centar` → pošalji ponudu sa **najvišom** cenom (npr. `1300`)
- [ ] **6.33** Preko curl-a probaj **duplu ponudu** za istog štampara → **`Već ste poslali ponudu za ovu nabavku`**
  ```bash
  curl -X POST http://localhost:4000/posaljiPonudu -H "Content-Type: application/json" \
    -d '{"nabavkaId":"JN-2026-003","stamparijaId":"grafika","stavke":[{"sifra":"PR-001","naziv":"Polo majica","kolicina":10,"jedinicnaCena":900}]}'
  ```
- [ ] **6.34** Proveri u bazi: kolekcija `ponude` ima po jednu ponudu za svaku štampariju koja je poslala

**D. Završavanje nabavke i izbor pobednika**

> Rok je 10 minuta. Da ne bi čekao, **simuliraj istek** tako što ćeš u bazi pomeriti datum:
> ```js
> // u mongosh / Compass
> db.javne_nabavke.updateOne(
>   { idNabavke: "JN-2026-003" },
>   { $set: { datumVremeRaspisivanja: new Date(Date.now() - 11*60*1000) } }
> )
> ```

- [ ] **6.35** Posle 10 min (ili posle simulacije isteka), kao `nenad.nedic` otvori `/nabavke` i osveži
- [ ] **6.36** Status nabavke se menja u **`Pobednik: grafika`** — dakle **najniža** ponuda (1000) je pobedila, ne prva poslata
- [ ] **6.37** Proveri da `kopistudio` (1100) i `stamparija.centar` (1300) **nisu** pobedili
- [ ] **6.38** Broj ponuda u tabeli je **3**
- [ ] **6.39** Otvori `/profil` kao `nenad.nedic` → pojavila se **nova faktura** za pobednika
- [ ] **6.40** Ta faktura ima status **`u stampi`** (kao što zadatak zahteva za nabavke)
- [ ] **6.41** Iznos fakture odgovara ponudi pobednika (1000 × kolicina)
- [ ] **6.42** Kao štampar koji je **izgubio** (npr. `kopistudio`), otvori `/licitacije` → nabavka **više nije** u listi otvorenih (jer je završena)
- [ ] **6.43** **Nabavka bez ponuda:** raspis novu nabavku i **sačekaj/simuliraj istek bez ijedne ponude** → status **`Završena (bez ponuda)`**, **ne** kreira se faktura
- [ ] **6.44** Preko curl-a probaj ponudu na **završenu** nabavku → **`Nabavka je već završena`**
- [ ] **6.45** Preko curl-a probaj ponudu posle isteka roka, ali pre nego što je nabavka završena → **`Rok za ponude je istekao`** i nabavka se automatski završava
- [ ] **6.46** Provera automatskog završavanja: nabavka se **sama** završava pri pozivu `otvoreneNabavke` **ili** `mojeNabavke` (nema pozadinskog tajmera na serveru)

**E. Izveštavanje (crvena stavka — nije rađeno)**

- [ ] **6.47** Potvrđeno: **nema** PDF izveštaja o ponudama (nema dugmeta za preuzimanje izveštaja). Odložena (crvena) stavka — **nije** deo Faze 6

---

## FAZA 7 — Štampar (proizvodi, usluge, količine i narudžbine)

> ✅ **Sve obavezne stavke Faze 7 su gotove** (spec 4.2, 4.3 i 4.5).
> Backend i frontend su pokrenuti na 4000 i 4200 sa ovim kodom — restart nije potreban.

### Šta zadatak zahteva
- Производи и услуге — додавање (spec 4.2) — ✅ **implementirano 2026-09-22**
- Ажурирање количина (spec 4.3) — ✅ **implementirano 2026-09-22**
- Наручени производи — промена статуса (spec 4.5) — ✅ **implementirano 2026-09-22**
- ~~Додавање из JSON фајла~~ (spec 4.4) — neobavezna (crvena) stavka, **nije** urađena

### Šta je implementirano
**Backend** (`controllers/stamparController.ts`, `routers/stamparRouter.ts` — novi domen; `proizvodiController` netaknut):

| Ruta | Metod | Opis |
|---|---|---|
| `/proizvodiStamparije?stamparijaId=` | GET | Svi proizvodi štampara, **uključujući `aktivan: false` i količinu 0**, sortirano po šifri |
| `/kategorije` | GET | **Sve** predefinisane kategorije + potkategorije (3 kategorije / 9 potkategorija) |
| `/dodajProizvod` | POST | multipart (`slika` opciona) — proizvod + usluge štampe |
| `/azurirajKolicinu` | POST | JSON `{ stamparijaId, sifra, kolicinaNaLageru }` — menja **samo količinu** |
| `/narudzbineStamparije?stamparijaId=` | GET | Fakture tog štampara (najnovije prve), svaka sa `vrstaKlijenta` i `mozePromenitiStatus` (računa server) |
| `/promeniStatusNarudzbine` | POST | JSON `{ idFakture, stamparijaId, noviStatus }` — **samo korak napred**, samo fizička lica |

- `nazivStamparije` i `grad` upisuje **server** iz `Korisnik` zapisa štampara (ne veruje se zahtevu).
- `sifra` je jedinstvena **globalno**, ne samo unutar štampara.
- Slika proizvoda: postojeći `upload` multer (JPG/PNG/GIF ≤ 5 MB) — **bez** provere 100–250 px, jer je to pravilo za **profilnu** sliku.
- `uslugeStampe` i `dostupneBoje` se šalju kao **JSON string** (FormData ne nosi ugnježdene objekte); `idUsluge` se generiše ako nije poslat.

**Frontend:** `components/mojiProizvodi/` (`/moji-proizvodi`) i `components/stamparNarudzbine/`
(`/narudzbine-stamparija`), `services/stampar.service.ts`, `guards/stampar.guard.ts`, meni
**„🧾 Moji proizvodi"** i **„📦 Narudžbine"** za štampara.

**Kolona Količina (spec 4.3):** polje sa trenutnom vrednošću iz baze + dugme **„Sačuvaj količinu"**, aktivno
samo kad se vrednost razlikuje od sačuvane. Red se posle čuvanja osvežava **iz odgovora servera**, a poruke
(uspeh/greška) stoje **iznad tabele** — ne u formi, jer je forma obično zatvorena.

**Narudžbine (spec 4.5):** tabela faktura štampara (broj, klijent + vrsta, datum, stavke sa bojom, tipom štampe i
**tekstom za štampu**, iznos, status). Dugme **„Prebaci u štampu"** / **„Označi kao isporučeno"** postoji
**samo** kad server kaže da je promena dozvoljena. Za **pravna lica** dugmeta nema, stoji napomena da se status
menja kroz javne nabavke; kod završenih narudžbina stoji „nema daljih koraka".

**Poznate poruke:** `Uspešno dodat proizvod` · `Količina je ažurirana` · `Količina za <šifra> je sačuvana` ·
`Status je promenjen na „<status>"` · `Faktura nije pronađena` · `Nedozvoljena promena statusa` ·
`Status narudžbina pravnih lica menja se kroz javne nabavke` ·
`Štamparija nije pronađena` · `Sva obavezna polja moraju biti popunjena` ·
`Proizvod sa tom šifrom već postoji` · `Proizvod nije pronađen` · `Izabrana kategorija ili potkategorija ne postoji` · `Cena mora biti broj` ·
`Cena ne može biti negativna` · `Količina mora biti broj` · `Količina mora biti ceo broj` · `Količina ne može biti negativna` ·
`Neispravni podaci o uslugama štampe` · `Dodatna cena usluge ne može biti negativna`

### ✅ Čeklista za testiranje — Faza 7 (deo 1)

**A. Pristup i meni**

- [ ] **7.1** Prijavi se kao `kopistudio` (`Admin123!`) → u meniju se vide **🧾 Moji proizvodi** i **🏷️ Licitacije**
- [ ] **7.2** Klik na „🧾 Moji proizvodi" → `/moji-proizvodi`
- [ ] **7.3** Kao klijent (`marko.markovic`) link se **ne prikazuje**; ručni unos `/moji-proizvodi` preusmerava na `/`
- [ ] **7.4** Kao odjavljen korisnik, `/moji-proizvodi` preusmerava na `/` (ne prikazuje se sadržaj)

**B. Lista proizvoda**

- [ ] **7.5** Kao `kopistudio` lista ima **3 proizvoda**: `PR-001`, `PR-002`, `PR-003`, sortirano po šifri
- [ ] **7.6** Kolone: slika, šifra, naziv, kategorija/potkategorija, cena, količina, usluge štampe, status
- [ ] **7.7** `PR-001` ima **2 usluge** (DTG +350, Sito preslikač +200); `PR-002` i `PR-003` po jednu
- [ ] **7.8** Slika je rezervni 🖨️ prikaz (seed nema slike) — očekivano do dodavanja slika
- [ ] **7.9** Prijavi se kao `grafika` → lista ima **3** proizvoda i **`GPR-002` ima status „neaktivan"** — dokaz da lista prikazuje i neaktivne (javna pretraga ih ne prikazuje)

**C. Dodavanje proizvoda**

- [ ] **7.10** Dugme **„➕ Dodaj proizvod"** otvara formu
- [ ] **7.11** Dropdown **Kategorija** ima 3 stavke (+ „-- izaberite --"); **Potkategorija je onemogućena** dok se kategorija ne izabere
- [ ] **7.12** Izbor „Kreativne štampe" → Potkategorija nudi **Šolje, Štampa na majicama, Štampa na duksericama, Štampa na cegerima**
- [ ] **7.13** Promena kategorije **resetuje** izabranu potkategoriju
- [ ] **7.14** „➕ Dodaj uslugu" dodaje red; dva reda se popunjavaju nezavisno; „Ukloni uslugu" briše samo taj red
- [ ] **7.15** Izbor slike prikazuje **pregled**; fajl koji nije JPG/PNG/GIF → `Format slike mora biti JPG, PNG ili GIF`
- [ ] **7.16** Klik na „Dodaj proizvod" sa praznom formom → `Sva obavezna polja moraju biti popunjena`
- [ ] **7.17** Popunjena forma (2 usluge + slika) → `Proizvod <šifra> je dodat`, forma se zatvara i resetuje, proizvod se pojavljuje u listi
- [ ] **7.18** Ista šifra ponovo (npr. `PR-001`) → `Proizvod sa tom šifrom već postoji`, forma **ostaje otvorena**
- [ ] **7.19** Negativna cena → `Cena ne može biti negativna`; negativna količina → `Količina ne može biti negativna`
- [ ] **7.20** Novi proizvod sa količinom **> 0** pojavljuje se i u **javnoj pretrazi** na `/` — dokaz da je ceo lanac povezan
- [ ] **7.21** ⚠️ **Poznati nalaz N-14:** nova slika se **ne prikazuje** — server čuva `slikaUrl` **bez** prefiksa `uploads/`, pa `slikaPutanja()` gradi putanju `http://localhost:4000/<fajl>` (404), iako fajl postoji u `backend/uploads/`. Potvrdi nalaz umesto da očekuješ sliku
- [ ] **7.22** Novi proizvod sa količinom **0** ostaje u listi štampara, ali **nije** u javnoj pretrazi (pretraga traži `kolicinaNaLageru > 0`)

**D. Negativni slučajevi (curl)**

> 💡 **Savet:** ne šalji kategorije/boje sa slovima č, ć, š, ž preko `curl`-a iz Git Bash-a — shell menja
> kodni raspored i server dobije nepostojeću kategoriju. Neprazne (ne-ASCII) vrednosti testiraj kroz **UI**;
> preko `curl`-a koristi ASCII vrednosti ili `--form-string`.

- [ ] **7.23** `stamparijaId` klijenta (npr. `marko.markovic`) → `Štamparija nije pronađena`
- [ ] **7.24** Nepostojeća kategorija **i** nepostojeća potkategorija → `Izabrana kategorija ili potkategorija ne postoji`
- [ ] **7.25** `uslugeStampe` koje nisu JSON → `Neispravni podaci o uslugama štampe`
- [ ] **7.26** Usluga bez `tipStampe` → `Neispravni podaci o uslugama štampe`
- [ ] **7.27** `dodatnaCenaPoKomadu: -1` → `Dodatna cena usluge ne može biti negativna`
- [ ] **7.28** `jedinicnaCena=abc` → `Cena mora biti broj`; `kolicinaNaLageru=1.5` → `Količina mora biti ceo broj`
- [ ] **7.29** Neispravan tip fajla (npr. `.json`) → `Format slike mora biti JPG, PNG ili GIF`
- [ ] **7.30** Posle svake neuspele validacije otpremljena slika se **briše** — broj fajlova u `backend/uploads/` se ne povećava

**E. Ažuriranje količina (spec 4.3)**

- [ ] **7.31** U koloni **Količina** je polje sa vrednošću iz baze (posle svežeg seed-a npr. `PR-002` = 500) i dugme **„Sačuvaj količinu"**
- [ ] **7.32** Dugme je **neaktivno** dok se vrednost ne promeni; čim se promeni, postaje aktivno (aktivno je samo u tom redu)
- [ ] **7.33** Čuvanje ispravne vrednosti → `Količina za <šifra> je sačuvana` iznad tabele, a dugme se vraća u neaktivno stanje
- [ ] **7.34** Posle **osvežavanja stranice (F5)** polje pokazuje novu vrednost — dokaz da je upisana u bazu
- [ ] **7.35** Ista vrednost se vidi na javnoj strani `/proizvod/<šifra>` („Na stanju") i u tabeli pretrage na `/`
- [ ] **7.36** Količina **0** → proizvod **nestaje iz javne pretrage** i sa „TOP 5", ali **ostaje** u listi štampara (sa 0)
- [ ] **7.37** Negativna vrednost (npr. `-1`) → `Količina ne može biti negativna` i broj u bazi se **ne menja**
- [ ] **7.38** Decimalna vrednost (npr. `1.5`) → `Količina mora biti ceo broj`
- [ ] **7.39** Prazno polje → `Sva obavezna polja moraju biti popunjena`
- [ ] **7.40** Poruka o grešci stoji **iznad tabele** (vidi se i kad je forma za dodavanje zatvorena) i nestaje pri sledećem čuvanju
- [ ] **7.41** (curl) Tuđa šifra — `stamparijaId=grafika` + `sifra=PR-001` → `Proizvod nije pronađen`; isti tekst i za šifru koja ne postoji (ne odaje se čija šifra postoji)
- [ ] **7.42** (curl) `kolicinaNaLageru=abc` → `Količina mora biti broj`; bez polja `kolicinaNaLageru` → `Sva obavezna polja moraju biti popunjena`

**F. Narudžbine štampara (spec 4.5)**

> 💡 Posle **svežeg seed-a** `kopistudio` ima **3** fakture (`F-2026-001`, `004`, `008`). Ako si već
> poručivao kroz e-korpu, biće i dodatnih (`F-2026-010` iz testa teksta za štampu) — to je očekivano.

- [ ] **7.43** Kao `kopistudio` u meniju postoji **📦 Narudžbine** → `/narudzbine-stamparija`
- [ ] **7.44** Tabela ima kolone: Faktura, Klijent (+ „fizičko lice"/„pravno lice"), Datum, Stavke, Iznos, Status, Akcija
- [ ] **7.45** Prikazane su **samo fakture te štamparije** (npr. nema `F-2026-002`, `F-2026-003`, `F-2026-005`), najnovije prve
- [ ] **7.46** U stavkama se vidi boja, tip štampe i **tekst za štampu** (🖨️) kad ga stavka ima (npr. `F-2026-010`)
- [ ] **7.47** `F-2026-001` (naruceno, fizičko lice) ima dugme **„Prebaci u štampu"**
- [ ] **7.48** Klik na to dugme → iznad tabele `F-2026-001: Status je promenjen na „u stampi“`, a u redu status postaje **u stampi** i dugme se menja u **„Označi kao isporučeno"**
- [ ] **7.49** Klik na „Označi kao isporučeno" → status **isporuceno**, dugmeta više nema (stoji „nema daljih koraka") — dalje ide klijentsko „primljeno"
- [ ] **7.50** Posle **osvežavanja stranice (F5)** status ostaje promenjen — dokaz da je upisan u bazu
- [ ] **7.51** Kao `marko.markovic` na `/profil` njegova narudžbina `F-2026-001` pokazuje **isti** status (promena se vidi i sa klijentske strane)
- [ ] **7.52** `F-2026-008` (klijent **pravno lice**) **nema dugme**, nego napomenu *„pravno lice — status se menja kroz javne nabavke"*
- [ ] **7.53** `F-2026-004` (status **primljeno**) nema dugme — narudžbina je završena
- [ ] **7.54** Posle testa vrati `F-2026-001` na **naruceno** (nijedan endpoint ne dozvoljava korak unazad — vidi Dodatak C za reset baze)
- [ ] **7.55** (curl) `idFakture` tuđe fakture (npr. `F-2026-002` uz `stamparijaId=kopistudio`) → `Faktura nije pronađena`
- [ ] **7.56** (curl) nepostojeći `idFakture` → `Faktura nije pronađena` (isti tekst — ne odaje se čija faktura postoji)
- [ ] **7.57** (curl) preskakanje koraka (`naruceno` → `isporuceno`) → `Nedozvoljena promena statusa`
- [ ] **7.58** (curl) vraćanje unazad (`primljeno` → `isporuceno`) → `Nedozvoljena promena statusa`
- [ ] **7.59** (curl) `noviStatus: primljeno` → `Nedozvoljena promena statusa` (to je isključivo klijentska akcija)
- [ ] **7.60** (curl) `noviStatus: isporuceno` za fakturu pravnog lica (`F-2026-008`) → `Status narudžbina pravnih lica menja se kroz javne nabavke`
- [ ] **7.61** (curl) prazno `idFakture` / `stamparijaId` / `noviStatus` → `Sva obavezna polja moraju biti popunjena`
- [ ] **7.62** Posle svih odbijenih poziva statusi svih faktura su **nepromenjeni** (odbijen poziv ne upisuje ništa)
- [ ] **7.63** Kao klijent (`marko.markovic`) `/narudzbine-stamparija` preusmerava na `/`, a meni **📦 Narudžbine** se ne prikazuje

**G. Van obima ovog dela Faze 7**

- [ ] **7.64** Potvrđeno: **nema** JSON importa ni koraka za slike posle importa (neobavezna stavka)
- [ ] **7.65** Potvrđeno: **nema** prekidača za `aktivan`/`neaktivan` (nije u specifikaciji)
- [ ] **7.66** Potvrđeno: **nema** dugmeta za korak unazad ni za otkazivanje narudžbine (nije u specifikaciji)

---

## FAZA 8 — Administrator (deo 1: korisnički nalozi)

> ✅ Administratorski panel je na **`/korisnici`**; prijava na `/admin` vodi direktno tamo.
> Nalozi za prijavu: **`admin` / `Admin123!`**.

### Šta zadatak zahteva
- Управљање корисничким налозима — преглед, ажурирање и **брисање** (spec 5.1) — ✅ **implementirano 2026-09-23 (deo 1)**
- Обрада захтева за регистрацију (spec 5.1 — посебан преглед неодобрених) — ✅ **implementirano 2026-09-23
  (deo 2, sekcija niže u ovom dokumentu)**
- Управљање категоријама (spec 5.2) и статистике (spec 5.3) — **следеће ставке**

### Šta je implementirano
**Backend** (`controllers/adminController.ts`, `routers/adminRouter.ts` — novi domen `admin`):

| Ruta | Metod | Opis |
|---|---|---|
| `/sviKorisnici?adminId=` | GET | Svi nalozi (bez lozinke), sortirano po tipu pa korisničkom imenu |
| `/azurirajKorisnika` | POST | JSON — podaci + **status** + **tip** (uz validaciju koja zavisi od tipa) |
| `/obrisiKorisnika` | POST | JSON — briše nalog **i ono što je samo njegovo** (vidi dole) |

- Svaka ruta prvo proverava **`adminId`**: nalog mora postojati, biti `tip: admin` i `status: aktivan`,
  inače → `Nemate pristup administrativnom panelu`.
- `korisnickoIme` se **ne menja** (identifikacija naloga — spec 3.1); lozinka se ovde ne vidi niti menja.
- Administrator **ne može sam sebi** da ukine pristup niti da obriše svoj nalog.
- **Brisanje:** odlaze nalog + `korpa` + `password_reset` + (za štampara) **njegovi proizvodi** i njihove slike
  sa diska i profilna slika. **Fakture, javne nabavke, ponude i komentari ostaju** — oni nose imena i
  predstavljaju istoriju poslovanja.

**Frontend:** `components/adminKorisnici/` (`/korisnici`), `services/admin.service.ts`, `guards/admin.guard.ts`,
meni **„👥 Korisnici"** (samo za administratora). Tabela ima pretragu (ime / korisničko ime / i-mejl) i filter po
tipu naloga; „Izmeni" otvara formu **u samom redu**, a „Obriši" traži **potvrdu u dva koraka** (bez browser dijaloga).

**Poznate poruke:** `Nemate pristup administrativnom panelu` · `Korisnik ne postoji` · `Korisnik je obrisan` ·
`Uspešno` · `Nalog <ime> je sačuvan` · `Ime je obavezno` · `Prezime je obavezno` · `Kontakt telefon je obavezan` ·
`I-mejl adresa nije ispravna` · `I-mejl adresa je već zauzeta` · `Neispravan tip naloga` · `Neispravan status naloga` ·
`Neispravna vrsta klijenta` · `Naziv institucije je obavezan` · `Adresa sedišta je obavezna` ·
`Matični broj mora imati tačno 8 cifara` · `PIB mora imati 9 cifara i ne sme počinjati nulom` · `Grad je obavezan` ·
`Matični broj ili PIB su već registrovani` · `Ne možete ukinuti sopstveni administratorski pristup` ·
`Ne možete obrisati sopstveni nalog`

### ✅ Čeklista za testiranje — Faza 8 (deo 1)

**A. Pristup i meni**

- [ ] **8.1** Prijava na `/admin` kao `admin` (`Admin123!`) → preusmerava na **`/korisnici`** (ne na javnu početnu)
- [ ] **8.2** U meniju se vidi samo **👥 Korisnici** (nema Korpa/Arhiva/Nabavke/štamparskih stavki)
- [ ] **8.3** Kao klijent (`marko.markovic`) `/korisnici` preusmerava na `/`, a stavka menija se ne prikazuje
- [ ] **8.4** Kao štampar (`kopistudio`) isto preusmerenje

**B. Pregled naloga**

- [ ] **8.5** Tabela prikazuje sve naloge; kolone: korisničko ime, ime i prezime, tip naloga, kontakt, grad, status, akcije
- [ ] **8.6** Sortirano po tipu (administrator → klijenti → štamparije), unutar tipa po korisničkom imenu
- [ ] **8.7** Tip je opisan čitljivo (`klijent (fizičko lice)` / `klijent (pravno lice)` / `štampar` / `administrator`), a pod njim naziv institucije kad postoji
- [ ] **8.8** Pretraga po tekstu sužava listu (npr. `test` → ostaju samo nalozi sa tim u imenu/i-mejlu)
- [ ] **8.9** Filter **Tip naloga** = `štamparije` prikazuje samo štampare; `administratori` samo admina
- [ ] **8.10** „Očisti filtere" vraća punu listu
- [ ] **8.11** Status je obojen po statusu: `aktivan` zeleno, `na_cekanju` žuto, `neaktivan` sivo

**C. Izmena naloga**

- [ ] **8.12** „Izmeni" pretvara **taj red** u formu (ostali redovi ostaju netaknuti)
- [ ] **8.13** Polja se otvaraju sa podacima tog naloga, a **korisničko ime je prikazano ali se ne menja** (stoji „nepromenljivo")
- [ ] **8.14** Za **fizičko lice** nema polja firme; za **pravno lice** ih ima; za **štampara** postoji i **Grad**
- [ ] **8.15** Promena telefona + „Sačuvaj" → iznad tabele `Nalog <ime> je sačuvan`, red pokazuje novu vrednost (i posle F5)
- [ ] **8.16** „Otkaži" vraća red bez ikakve izmene
- [ ] **8.17** Prazno ime → `Ime je obavezno`; i-mejl bez `@` → `I-mejl adresa nije ispravna`
- [ ] **8.18** I-mejl drugog naloga → `I-mejl adresa je već zauzeta`; tuđi matični broj/PIB → `Matični broj ili PIB su već registrovani`
- [ ] **8.19** Promena **statusa** na `aktivan` kod naloga koji je bio `na_cekanju` (npr. `nova.firma`) → taj nalog **sada može da se prijavi** (dokaz da odobrenje radi)
- [ ] **8.20** Promena **tipa** (klijent → štampar) traži podatke firme i grad; posle čuvanja nalog ima štamparske stavke u meniju; vraćanje na klijenta **briše** podatke firme
- [ ] **8.21** Sopstveni nalog (`admin`) se ne može degradirati: promena tipa/statusa → `Ne možete ukinuti sopstveni administratorski pristup`

**D. Brisanje naloga**

- [ ] **8.22** Kod sopstvenog naloga nema dugmeta „Obriši", stoji oznaka **sopstveni nalog**
- [ ] **8.23** „Obriši" prvo traži potvrdu („Potvrdi brisanje" + „Otkaži"); „Otkaži" poništava
- [ ] **8.24** Potvrda → `Nalog <ime> je obrisan`, red nestaje, broj naloga u zaglavlju se smanjuje
- [ ] **8.25** Obrisan nalog **ne može više da se prijavi** (`Pogrešno korisničko ime ili lozinka`)
- [ ] **8.26** Brisanje **štampara** briše i njegove proizvode — poruka to i kaže (`... i N proizvoda`), a u javnoj pretrazi ih više nema
- [ ] **8.27** Posle brisanja klijenta ne ostaje njegova korpa (proveriti u e-korpi posle ponovne prijave — nema stavki)
- [ ] **8.28** **Fakture i komentari prežive** brisanje naloga (npr. narudžbine u `/profil` drugog naloga i komentari na proizvodima se ne menjaju)

**E. Negativni slučajevi (curl)**

- [ ] **8.29** `GET /sviKorisnici` bez `adminId` → `Nemate pristup administrativnom panelu`
- [ ] **8.30** `adminId` klijenta ili štampara → ista poruka
- [ ] **8.31** `tip: "kupac"` → `Neispravan tip naloga`; `status: "blokiran"` → `Neispravan status naloga`
- [ ] **8.32** `vrsta` koja nije `fizicko`/`pravno` kod klijenta → `Neispravna vrsta klijenta`
- [ ] **8.33** `POST /obrisiKorisnika` sa `korisnickoIme: "admin"` → `Ne možete obrisati sopstveni nalog`
- [ ] **8.34** Nepostojeći nalog → `Korisnik ne postoji` (i za izmenu i za brisanje)
- [ ] **8.35** Nijedan odgovor ne sadrži `lozinka` (hash se nikad ne šalje)

---

## FAZA 8 — Administrator (deo 2: zahtevi za registraciju)

> ✅ Ekran je na **`/zahtevi-za-registraciju`**, u meniju kao **📝 Zahtevi** (vidi ga samo administrator).
> Nalog za prijavu: **`admin` / `Admin123!`**. Za test su u seed-u već dva zahteva na čekanju:
> **`nova.stamparija`** (štampar) i **`nova.firma`** (pravno lice).

### Šta zadatak zahteva
- Обрада захтева за регистрацију — „исход може да буде прихватање или одбацивање захтева за регистрацијом",
  кроз „посебан табеларни преглед свих неодобрених корисника" (spec: Администратор система) —
  ✅ **implementirano 2026-09-23**
- Напомена: одобравање је могуће и из панела **👥 Korisnici** (променом статуса) — овај екран је
  **наменски преглед** за ту сврху, са једним кликом и са одбијањем као посебном одлуком.

### Šta je implementirano
**Backend** (`controllers/adminController.ts`, `routers/adminRouter.ts` — isti domen `admin`):

| Ruta | Metod | Opis |
|---|---|---|
| `/neodobreniKorisnici?adminId=` | GET | Samo nalozi u statusu `na_cekanju`, bez lozinke; grupisano po tipu pa korisničkom imenu |
| `/odobriKorisnika` | POST | JSON `{adminId, korisnickoIme}` — status → **`aktivan`** |
| `/odbijKorisnika` | POST | JSON `{adminId, korisnickoIme}` — **briše zahtev** i sve što je samo njegovo |

- Svaka ruta proverava **`adminId`** isto kao deo 1: nalog mora postojati, biti `tip: admin` i `status: aktivan`.
- **Odobravanje** radi samo nad nalogom u statusu `na_cekanju`. Aktivan nalog se menja kroz `/korisnici`
  (inače `Nalog nije u statusu na čekanju`) — tako se ne može „odobriti" nešto što je već aktivno.
- **Odbijanje** briše nalog, njegovu **profilnu sliku sa diska**, njegovu korpu i zahteve za lozinku
  (i proizvode, ako je štampar) — čime se **korisničko ime, i-mejl, matični broj i PIB oslobađaju za novu
  registraciju**. Kao i kod brisanja naloga, **fakture, javne nabavke, ponude i komentari ostaju**
  (oni nose imena i predstavljaju istoriju poslovanja).
- **Zaštita:** ovuda **ne može** da se obriše aktivan nalog (`Odbijaju se samo zahtevi u statusu na čekanju`)
  niti sopstveni administratorski nalog (`Ne možete obrisati sopstveni nalog`).
- **Ista logika brisanja se deli sa `obrisiKorisnika`** (privatna metoda `obrisiNalog`), pa se ponašanje dva
  ekrana ne može raziti.

**Frontend:** `components/zahteviZaRegistraciju/` (`/zahtevi-za-registraciju`, `adminGuard`),
`services/admin.service.ts` (`neodobreniKorisnici`, `odobriKorisnika`, `odbijKorisnika`), modeli
`ObradaZahtevaZahtev` i `OdbijanjeZahtevaOdgovor`, meni **„📝 Zahtevi"**. Tabela prikazuje: korisničko ime +
tip naloga (sa profilnom slikom ili inicijalom umesto nje), odgovorno lice, kontakt i podatke institucije
(naziv, adresa, grad, MB, PIB). Brojač u zaglavlju pokazuje koliko zahteva čeka, a **„Odbij" traži potvrdu
u dva koraka** jer briše zahtev.

**Poznate poruke:** `Nemate pristup administrativnom panelu` · `Korisnik ne postoji` · `Nedostaje korisničko ime` ·
`Nalog nije u statusu na čekanju` · `Odbijaju se samo zahtevi u statusu na čekanju` · `Ne možete obrisati sopstveni nalog` ·
`Uspešno` · `Zahtev je odbijen` · `Zahtev <ime> je odobren — nalog je aktivan i može da se prijavi` ·
`Zahtev <ime> je odbijen i uklonjen — podaci su ponovo slobodni` · `Nema zahteva koji čekaju odluku.`

**Van obima ovog dela:** nema e-mejl obaveštenja korisniku o ishodu zahteva, niti unosa razloga odbijanja
(oba nisu u specifikaciji); obrada je moguća i iz panela **👥 Korisnici**.

### ✅ Čeklista za testiranje — Faza 8 (deo 2)

**A. Pristup i meni**

- [ ] **8.36** Prijava kao `admin` → u meniju pored **👥 Korisnici** stoji i **📝 Zahtevi**
- [ ] **8.37** Klik na **📝 Zahtevi** vodi na `/zahtevi-za-registraciju`
- [ ] **8.38** Kao klijent (`marko.markovic`) `/zahtevi-za-registraciju` preusmerava na `/`, a stavka menija se ne prikazuje
- [ ] **8.39** Kao štampar (`kopistudio`) isto preusmerenje i ista odsutna stavka menija
- [ ] **8.40** Odjavljen posetilac na `/zahtevi-za-registraciju` dobija javnu početnu stranu

**B. Prikaz zahteva**

- [ ] **8.41** Zaglavlje pokazuje broj zahteva koji čekaju (npr. „6 zahteva čeka odluku")
- [ ] **8.42** U tabeli su **samo** nalozi u statusu `na_cekanju` (npr. `nova.stamparija`, `nova.firma`)
- [ ] **8.43** Sortirano po tipu (prvo klijenti, pa štamparije), unutar tipa po korisničkom imenu
- [ ] **8.44** Kolone: zahtev (korisničko ime + tip), odgovorno lice, kontakt, institucija, akcije
- [ ] **8.45** Podaci institucije se vide: naziv, adresa i grad, MB i PIB
- [ ] **8.46** Profilna slika podnosioca se prikazuje; kada je slika podrazumevana, vidi se **inicijal**, a ne polomljena slika
- [ ] **8.47** **Nijedan aktivan nalog** nije u ovoj tabeli (`admin`, `marko.markovic`, `kopistudio` se ne pojavljuju)

**C. Odobravanje**

- [ ] **8.48** „Odobri" → `Zahtev <ime> je odobren — nalog je aktivan i može da se prijavi`, red nestaje, brojač se smanjuje
- [ ] **8.49** Posle F5 zahtev se više ne prikazuje (promena je u bazi, ne samo na ekranu)
- [ ] **8.50** Odobreni nalog **sada može da se prijavi** (odjava → prijava tim korisničkim imenom i lozinkom iz registracije)
- [ ] **8.51** U panelu **👥 Korisnici** taj nalog ima status `aktivan`
- [ ] **8.52** U panelu **👥 Korisnici** **pre** odobrenja taj nalog ne može da se prijavi (`Nalog nije odobren od strane administratora`)

**D. Odbijanje (dva koraka)**

- [ ] **8.53** „Odbij" ne briše odmah — u redu se pojavi „Obrisati zahtev?", „Potvrdi odbijanje" i „Otkaži"
- [ ] **8.54** „Otkaži" vraća red u stanje sa „Odobri"/„Odbij", bez poruke i bez promene brojača
- [ ] **8.55** „Potvrdi odbijanje" → `Zahtev <ime> je odbijen i uklonjen — podaci su ponovo slobodni`, red nestaje, brojač se smanjuje
- [ ] **8.56** Odbijeni nalog **ne postoji** više: u **👥 Korisnici** ga nema, a prijava vraća `Pogrešno korisničko ime ili lozinka`
- [ ] **8.57** Njegova **profilna slika je obrisana** iz `backend/uploads/`
- [ ] **8.58** Istim korisničkim imenom, i-mejlom, matičnim brojem i PIB-om **može ponovo da se registruje** (podaci su oslobođeni)
- [ ] **8.59** **Nema** mogućnosti da se ovim ekranom obriše aktivan nalog — kod njega nema dugmadi (nije u listi)

**E. Negativni slučajevi (curl)**

- [ ] **8.60** `GET /neodobreniKorisnici` bez `adminId`, ili sa `adminId` klijenta/štampara → **prazna lista** (`[]`)
- [ ] **8.61** `POST /odobriKorisnika` / `POST /odbijKorisnika` bez `adminId` ili sa tuđim `adminId` → `Nemate pristup administrativnom panelu`
- [ ] **8.62** `POST /odobriKorisnika` za **aktivan** nalog → `Nalog nije u statusu na čekanju`
- [ ] **8.63** `POST /odbijKorisnika` za **aktivan** nalog → `Odbijaju se samo zahtevi u statusu na čekanju`
- [ ] **8.64** Nepostojeće korisničko ime → `Korisnik ne postoji`; prazno → `Nedostaje korisničko ime`
- [ ] **8.65** `POST /odbijKorisnika` sa `korisnickoIme: "admin"` → `Ne možete obrisati sopstveni nalog`
- [ ] **8.66** Nijedan odgovor ne sadrži `lozinka` (hash se nikad ne šalje)
- [ ] **8.67** Posle svih odbijenih poziva baza je **nepromenjena** (`/sviKorisnici` daje isti spisak pre i posle)

---

## FAZA 8 — Administrator (deo 3: kategorije proizvoda)

### Šta zadatak zahteva

**Spec 5.2 — Upravljanje kategorijama:** „Dodavanje **nove kategorije** i unutar nje **potkategorija**."
(Minimalne stavke **#20** — **poslednja obavezna stavka projekta**.)

### Šta je implementirano

**Backend** (`adminController` / `adminRouter`, svaka ruta proverava `adminId`):

| Ruta | Šta radi |
|---|---|
| `GET /sveKategorije` | Sve kategorije sa potkategorijama **i brojem proizvoda**; neovlašćen poziv → `[]` |
| `POST /dodajKategoriju` | Nova kategorija (za sada bez potkategorija) |
| `POST /dodajPotkategoriju` | Dodaje potkategoriju u postojeću kategoriju |
| `POST /obrisiKategoriju` | Briše kategoriju **samo ako je nijedan proizvod ne koristi** |
| `POST /obrisiPotkategoriju` | Briše potkategoriju **samo ako je nijedan proizvod ne koristi** |

**Frontend:** `components/adminKategorije/` na `/kategorije` (`adminGuard`), meni **„🗂️ Kategorije"**.
Nova kategorija se dodaje u formi na vrhu, potkategorija **u redu same kategorije**, a brisanje je
**u dva koraka** („Obriši" → „Potvrdi"/„Otkaži"). Stavke koje koristi bar jedan proizvod **nemaju dugme
za brisanje** — piše „u upotrebi". Uz svaku stavku stoji broj proizvoda.

**Poznate poruke:** `Nemate pristup administrativnom panelu` · `Naziv kategorije je obavezan` ·
`Kategorija sa tim nazivom već postoji` · `Naziv potkategorije je obavezan` · `Kategorija ne postoji` ·
`Potkategorija već postoji u toj kategoriji` · `Potkategorija ne postoji` ·
`Kategorija se ne može obrisati — koristi je 1 proizvod` (za 2–4: `koriste je 4 proizvoda`; za 5+: `koristi je 5 proizvoda`) ·
`Kategorija je dodata` · `Potkategorija je dodata` · `Kategorija je obrisana` · `Potkategorija je obrisana`

**Van obima:** preimenovanje kategorija i potkategorija — proizvodi čuvaju naziv kategorije kao tekst,
pa bi preimenovanje moralo da prepiše sve proizvode.

### ✅ Čeklista za testiranje — Faza 8 (deo 3)

**A. Pristup i meni**

- [ ] **8.68** Prijava kao `admin` → u meniju pored **👥 Korisnici** i **📝 Zahtevi** stoji i **🗂️ Kategorije**
- [ ] **8.69** Klik na **🗂️ Kategorije** vodi na `/kategorije`
- [ ] **8.70** Kao klijent (`marko.markovic`) `/kategorije` preusmerava na `/`, a stavka menija se ne prikazuje
- [ ] **8.71** Kao štampar (`kopistudio`) isto preusmerenje i ista odsutna stavka menija
- [ ] **8.72** Odjavljen posetilac na `/kategorije` dobija javnu početnu stranu

**B. Prikaz i brojevi**

- [ ] **8.73** Prikazuju se **3 kategorije** iz seed-a, sortirane po nazivu
- [ ] **8.74** Brojevi proizvoda: `Kreativne štampe` **4**, `Štampa malih formata` **3**, `Štampa velikih formata` **2**
- [ ] **8.75** Uz `Šolje` piše **1 proizvod** (jednina), a uz `Zahvalnice` **0 proizvoda**
- [ ] **8.76** Uz `Vizit karte` takođe piše **1** — iako je `GPR-002` **neaktivan** (neaktivni se računaju)
- [ ] **8.77** Uz svaku stavku koja ima proizvode stoji **„u upotrebi"** i **nema** dugmeta za brisanje
- [ ] **8.78** Kod praznih potkategorija (`Zahvalnice`, `Pozivnice`, `Fascikle`, `Fototapete`) postoji dugme **„Obriši"**

**C. Dodavanje**

- [ ] **8.79** Naziv + „Dodaj kategoriju" → `Kategorija „<naziv>" je dodata`, brojač se povećava, polje se prazni
- [ ] **8.80** Kvačice se čuvaju tačno kako su otkucane (npr. `Probna Štampa`)
- [ ] **8.81** Prazno polje → `Naziv kategorije je obavezan` (bez odlaska na server)
- [ ] **8.82** Isti naziv ponovo → `Kategorija sa tim nazivom već postoji`
- [ ] **8.83** Naziv **bez kvačice** (`kreativne stampe`) i **malim slovima** se takođe odbija kao duplikat
- [ ] **8.84** Nova kategorija u redu ima **0 proizvoda** i poruku „Ova kategorija još nema potkategorija."
- [ ] **8.85** Unos potkategorije u tom redu → `Potkategorija „<n>" je dodata u kategoriju „<k>"`, polje se prazni
- [ ] **8.86** Ista potkategorija ponovo → `Potkategorija već postoji u toj kategoriji`
- [ ] **8.87** Dodavanje potkategorije u **seedovanu** kategoriju (`Kreativne štampe`) takođe prolazi
- [ ] **8.88** **Nova kategorija se odmah vidi štamparu:** prijava kao `kopistudio` → `/moji-proizvodi` → „➕ Dodaj proizvod" → padajuća lista **Kategorija** sadrži novu kategoriju
- [ ] **8.89** U **javnoj** pretrazi (`/`, filter **Kategorija**) nova kategorija se **ne pojavljuje** dok u njoj nema aktivnog proizvoda na stanju

**D. Brisanje (dva koraka)**

- [ ] **8.90** „Obriši" kod prazne potkategorije ne briše odmah — pojave se **„Potvrdi"** i **„Otkaži"**
- [ ] **8.91** „Otkaži" vraća dugme „Obriši", bez poruke i bez promene liste
- [ ] **8.92** „Potvrdi" → `Potkategorija „<n>" je obrisana`, stavka nestaje iz liste
- [ ] **8.93** Kod prazne kategorije isto: „Obriši" → upozorenje „Brisanjem kategorije odlaze i sve njene potkategorije (N)." → „Potvrdi brisanje" → `Kategorija „<n>" je obrisana`
- [ ] **8.94** Posle F5 obrisano se više ne prikazuje (promena je u bazi, ne samo na ekranu)
- [ ] **8.95** Kategorije koje koriste proizvodi (`Kreativne štampe`) **ne mogu se obrisati iz UI** — dugme ne postoji; serverski je potvrđeno u **8.100**

**E. Negativni slučajevi (curl)**

- [ ] **8.96** `GET /sveKategorije` bez `adminId`, ili sa `adminId` klijenta/štampara → **prazna lista** (`[]`)
- [ ] **8.97** `POST /dodajKategoriju` / `/dodajPotkategoriju` / `/obrisiKategoriju` / `/obrisiPotkategoriju` bez `adminId` ili sa tuđim `adminId` → `Nemate pristup administrativnom panelu`
- [ ] **8.98** `POST /dodajPotkategoriju` sa nepostojećom kategorijom → `Kategorija ne postoji`
- [ ] **8.99** `POST /obrisiKategoriju` sa nepostojećim nazivom → `Kategorija ne postoji`; za potkategoriju → `Potkategorija ne postoji`
- [ ] **8.100** `POST /obrisiKategoriju` za `Kreativne štampe` → `Kategorija se ne može obrisati — koriste je 4 proizvoda`
- [ ] **8.101** `POST /obrisiPotkategoriju` za `Kreativne štampe` / `Šolje` → `Potkategorija se ne može obrisati — koristi je 1 proizvod`
- [ ] **8.102** `POST /obrisiPotkategoriju` za `Štampa malih formata` / `Vizit karte` → odbija se iako je jedini proizvod **neaktivan**
- [ ] **8.103** Nijedan odbijeni poziv ništa ne upisuje (`/sveKategorije` daje isti spisak pre i posle)

---

## Poznati nalazi i nedostaci

> Popunjeno na osnovu čitanja koda pre testiranja. **Potvrdi svaki nalaz tokom testiranja** i dopiši nove.

| # | Nalaz | Faza | Težina | Status |
|---|---|---|---|---|
| **N-1** | ~~**Nema UI za ažuriranje profila.**~~ **REŠENO 2026-09-22** — dodata forma za izmenu u `components/profil/`: preklopnik „Izmeni podatke", polja po tipu naloga (fizičko / pravno / štampar), korisničko ime `disabled`, nova profilna slika sa pregledom i klijentskom proverom (100–250 px). Sesija u zaglavlju se osvežava bez reload-a | 3 | 🔴 Visoka | ✅ **Rešeno** |
| **N-2** | ~~**Nema unosa teksta za štampu.**~~ **REŠENO 2026-09-22** — polje „Tekst za štampu" (textarea, 500 karaktera, brojač) na detaljima proizvoda za klijenta; tekst se čuva u korpi, prikazuje u e-korpi, prenosi u `stavke` fakture i ispisuje u PDF-u | 4 | 🔴 Visoka | ✅ **Rešeno** |
| **N-3** | ~~**E-mejl sa PDF fakturom ne funkcioniše.**~~ **REŠENO 2026-09-23** — `emailUtils.ts` više ne koristi placeholder kredencijale: pravi **Ethereal** test nalog u letu (`nodemailer.createTestAccount()`), transporter se **kešira** (nalog se otvara samo pri prvom slanju), a pravi SMTP se koristi ako su postavljene promenljive `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS`. `posaljiFakturuEmail` sada **vraća `true`/`false`**, `korpaController.potvrdiKorpu` **čeka ishod** i vraća `emailPoslat` + `emailPrimaoca`, a `ekorpa` prikazuje „📧 Faktura je poslata na i-mejl: …" ili „⚠️ Fakture su kreirane, ali i-mejl na … nije poslat.". U logu servera se ispisuje i `Pregled poslatog i-mejla: https://ethereal.email/message/…` link. **Ethereal ne dostavlja poštu na pravu adresu primaoca** — poruka se vidi samo preko tog linka; za stvarnu dostavu pokrenuti server sa SMTP promenljivama | 4 | 🟡 Srednja | ✅ **Rešeno** (zapis rekonstruisan 2026-09-23 — sesija nije bila upisana u dnevnik) |
| **N-4** | **Neaktivan proizvod dostupan preko direktnog linka.** `/detaljiProizvoda/:sifra` ne proverava `aktivan`, pa `/proizvod/GPR-002` radi iako je proizvod isključen iz pretrage | 2 | 🟡 Srednja | Provera nedostaje |
| **N-5** | **Slovna greška na dugmetu:** „📢 RASPŠI NABAVKU" → treba „RASP**I**ŠI NABAVKU" | 6 | 🟢 Niska | Kozmetika |
| **N-6** | **Sve slike proizvoda su prazne** (`slikaUrl: ""`) → placeholder. Očekivano do Faze 7 | 2 | 🟢 Niska | Planirano za Fazu 7 |
| **N-7** | ~~**Admin prijava postoji, ali admin panel ne.**~~ **REŠENO 2026-09-23** — dodat panel „👥 Korisnički nalozi" na `/korisnici` (`adminGuard`), a administratorska prijava sada vodi direktno na njega | 1 | 🟢 Niska | ✅ **Rešeno** (Faza 8, deo 1) |
| **N-8** | **Nema server-side provere tipa/uloge** na pojedinim rutama: `/nabavke` je u meniju samo za pravna lica, ali API `raspisiNabavku` ne proverava vrstu klijenta; `/licitacije` je dostupno svakom prijavljenom korisniku | 6 | 🟡 Srednja | Za Fazu 9 |
| **N-9** | **TOP 5 ima nedefinisan redosled kod istog broja 👍** (aggregate `$sort` bez sekundarnog ključa). Prikaz može da „skače" između osvežavanja | 2 | 🟢 Niska | Za Fazu 9 |
| **N-11** | **Tekst za štampu nije deo identiteta stavke korpe.** Korpa spaja stavke po `proizvodId + tipStampe + boja`, pa dodavanje **istog** proizvoda/usluge/boje sa **drugim tekstom** prepisuje tekst i uvećava količinu umesto da napravi novu stavku. Posledica: ne mogu se poručiti dve različite štampe istog proizvoda u istoj boji | 4 | 🟡 Srednja | Postojeće ponašanje Faze 4; promena zahteva i izmenu `ukloniIzKorpe` |
| **N-12** | **Polomljena slika umesto rezervnog prikaza.** Ako `slikaUrl` ne vodi do fajla, prikazuje se polomljena ikonica umesto rezervnog 🖨️ prikaza (`onerror` fallback ne postoji). Uočeno na test proizvodu `TEST-001`. **Dopuna 2026-09-23:** prvobitna dijagnoza („fajl ne postoji") **nije tačna** — fajl `TEST-001` postoji u `backend/uploads/`, ali `slikaUrl` nema prefiks `uploads/`, pa putanja 404-uje. Uzrok je **N-14**, a `onerror` fallback je i dalje korisno poboljšanje | 7 | 🟢 Niska | Postojeće ponašanje; rezervni prikaz postoji samo za **prazan** `slikaUrl` |
| **N-14** | **Slika proizvoda dodatog kroz formu se ne prikazuje.** `stamparController.dodajProizvod` čuva `slikaUrl: req.file.filename` (npr. `1790113094219-861118940.jpg`) — **bez** prefiksa `uploads/`, dok `proizvodDetalji` i `mojiProizvodi` grade putanju kao `${uri}/${slikaUrl}` → `http://localhost:4000/<fajl>` (404). Dokaz: fajl postoji u `backend/uploads/`, `GET /uploads/<fajl>` vraća **200**, a `GET /<fajl>` vraća **404** (provereno 2026-09-23 na proizvodu `TEST-001`). Uzrok je i nalaza **N-12**. Ispravka zahteva da se promeni i mesto gde se slika briše (`obrisiNalog` dodaje `uploads/`), da se prefiks ne udvoji | 7 | 🟡 Srednja | **Nije ispravljano** u slice-u #19 — dokumentovano
| **N-13** | **Bedž „u stampi" nema boju u prikazu narudžbina klijenta.** `profil.html` gradi klasu kao `status-badge status-{{ n.status }}`, pa status sa razmakom daje klase `status-u` + `stampi`, a u CSS-u postoji samo `.status-u_stampi` (donja crta) — nikad se ne poklopi. Nova štamparska tabela zato mapira status u `status-u-stampi` i boja radi | 3/5 | 🟢 Niska | Postojeće ponašanje `profil`-a; kozmetika, ne dira se u ovom slice-u |
| **N-15** | **PDF faktura: tekst se preklapa u tabeli stavki.** Kolone „Proizvod" i „Boja" (i „Usluga") bile su preuske za stvarne podatke (`Pamucna Polo Majica` = 86 pt u koloni od 80 pt; `Direktna štampa na tekstil (DTG)` = 131 pt), a redovi su bili **fiksno 16 pt** jedan od drugog, pa su prelomljeni delovi padali preko sledećeg reda. Uz to se **„Tekst za štampu" ispisivao na `y + 1`** — preko samih ćelija reda, duž cele širine tabele (zato je izgledalo da se ponavlja „svuda"). Dokaz iz generisanog PDF-a: ćelije reda na `y=554.6`, kurzivni tekst na `y=555`; „Majica" na `y=544.2` preko reda ispod. **REŠENO 2026-09-23** — visina reda se meri iz najviše ćelije, tekst za štampu ide ispod reda, redovi su razdvojeni tankom linijom | 4 | 🔴 Visoka | ✅ **Rešeno** |
| **N-16** | **Dijakritici č/ć/ž/đ se ne ispisuju u PDF-u.** Standardni `pdfkit` fontovi (Helvetica) koriste WinAnsi kodiranje, koje ne sadrži ta slova — umesto njih su izlazili besmisleni znakovi i deo stringa je nestajao: `Keramička šolja 330ml` → `KeramiÖ¶ ¦öÆ¦33ÖÀ`, `Dugačak…` → `Duga…`, a isto je pogađalo i **ime klijenta** (`Marko Marković` → `Marko Markovi`). `š` i `Š` su radili. **REŠENO 2026-09-23** — ugrađeni su **Roboto** fontovi (`backend/assets/fonts/`, SIL Open Font License 1.1) preko `doc.registerFont`; ako font fajlovi nedostaju, kod prelazi na Helvetiku i transliteruje ta četiri slova, da nikad ne izađu besmisleni znakovi | 4 | 🟡 Srednja | ✅ **Rešeno** |
| **N-17** | **Predlog: izrada PDF-a preko HTML-a.** Umesto `pdfkit`-a generisati fakturu kao HTML pa je konvertovati u PDF (npr. `puppeteer`). Zahteva download Chromium-a (~300 MB) i teži je za odbranu/offline okruženje; sadašnji generator je prerađen da meri tekst kao layout motor, pa je glavni uzrok preklapanja (N-15) otklonjen bez nove zavisnosti | 4 | 🟢 Niska | **Odloženo** — odluka prepuštena korisniku |
| **N-10** | **Odložene (crvene) stavke** iz `minimalni zahtevi.txt`: zaboravljena lozinka, galerija sa dodatnim slikama, otkazivanje narudžbine, mapa štamparije, priprema proizvoda (sličica), servis za plaćanje, JSON import, PDF izveštaj o ponudama, statistike sa grafikonima | 1–6 | ⚪ — | **Planirano za kraj** |

### Kako prijaviti novi nalaz

Dopiši red u tabelu iznad u formatu:

```markdown
| **N-18** | Kratak opis (šta očekuješ vs. šta se dešava) | <faza> | 🔴/🟡/🟢 | Kratak status |
```

---

## Dodatak A — Sve implementirane rute (Faze 1–8)

| Faza | Ruta | Metod |
|---|---|---|
| 1 | `/login` | POST |
| 1 | `/loginAdmin` | POST |
| 1 | `/registracijaFizickoLice` | POST |
| 1 | `/registracijaPravnoLice` | POST |
| 1 | `/registracijaStampara` | POST |
| 2 | `/brojStamparija` | GET |
| 2 | `/top5Proizvoda` | GET |
| 2 | `/kategorijeZaPretragu` | GET |
| 2 | `/gradoviIStamparije` | GET |
| 2 | `/pretragaProizvoda?naziv=&kategorija=&grad=&stamparija=` | GET |
| 2 | `/detaljiProizvoda/:sifra` | GET |
| 3 | `/azurirajProfil` | POST |
| 3 | `/narudzbineKlijenta?klijentId=` | GET |
| 3 | `/detaljiProizvodaKlijent/:sifra` | GET |
| 4 | `/dodajUKorpu` | POST |
| 4 | `/ukloniIzKorpe` | POST |
| 4 | `/korpaKlijenta?klijentId=` | GET |
| 4 | `/potvrdiKorpu` | POST |
| 5 | `/arhivaProizvoda?klijentId=` | GET |
| 5 | `/promeniStatusPrimljeno` | POST |
| 5 | `/dodajKomentar` | POST |
| 5 | `/komentariProizvoda?proizvodId=` | GET |
| 6 | `/raspisiNabavku` | POST |
| 6 | `/otvoreneNabavke?stamparijaId=` | GET |
| 6 | `/posaljiPonudu` | POST |
| 6 | `/mojeNabavke?klijentId=` | GET |
| 7 | `/kategorije` | GET |
| 7 | `/proizvodiStamparije?stamparijaId=` | GET |
| 7 | `/dodajProizvod` | POST (multipart) |
| 7 | `/azurirajKolicinu` | POST (JSON) |
| 7 | `/narudzbineStamparije?stamparijaId=` | GET |
| 7 | `/promeniStatusNarudzbine` | POST (JSON) |
| 8 | `/sviKorisnici?adminId=` | GET |
| 8 | `/azurirajKorisnika` | POST (JSON) |
| 8 | `/obrisiKorisnika` | POST (JSON) |
| 8 | `/neodobreniKorisnici?adminId=` | GET |
| 8 | `/odobriKorisnika` | POST (JSON) |
| 8 | `/odbijKorisnika` | POST (JSON) |
| 8 | `/sveKategorije?adminId=` | GET |
| 8 | `/dodajKategoriju` | POST (JSON) |
| 8 | `/dodajPotkategoriju` | POST (JSON) |
| 8 | `/obrisiKategoriju` | POST (JSON) |
| 8 | `/obrisiPotkategoriju` | POST (JSON) |

## Dodatak B — Frontend rute

| Ruta | Komponenta | Pristup |
|---|---|---|
| `/` | `pocetna` | javna |
| `/login` | `login` | javna |
| `/admin` | `loginAdmin` | javna (samo forma) |
| `/registracija` | `registracija` | javna |
| `/proizvod/:sifra` | `proizvodDetalji` | javna (proširena za klijente) |
| `/profil` | `profil` | zaštićena |
| `/korpa` | `ekorpa` | zaštićena |
| `/arhiva` | `arhiva` | zaštićena |
| `/nabavke` | `javne-nabavke` | zaštićena (meni: samo pravna lica) |
| `/licitacije` | `licitacije` | zaštićena (meni: samo štampari) |
| `/moji-proizvodi` | `mojiProizvodi` | zaštićena (`stamparGuard` — samo štampari) |
| `/narudzbine-stamparija` | `stamparNarudzbine` | zaštićena (`stamparGuard` — samo štampari) |
| `/korisnici` | `adminKorisnici` | zaštićena (`adminGuard` — samo administrator) |
| `/zahtevi-za-registraciju` | `zahteviZaRegistraciju` | zaštićena (`adminGuard` — samo administrator) |
| `/kategorije` | `adminKategorije` | zaštićena (`adminGuard` — samo administrator) |
| `**` | → `/` | — |

## Dodatak C — Brzi reset baze između testova

```bash
cd PIA_PROJEKAT/backend
npm run build
node dist/seed.js
```

Ovim se brišu sve kolekcije i ponovo upisuju test podaci (uključujući i korisnike koje si
registrovao tokom testiranja i fakture koje su nastale naručivanjem).

---

*Dokument kreiran: 21.09.2026 — pokriva Faze 1–6 (poslednja implementirana faza).*
