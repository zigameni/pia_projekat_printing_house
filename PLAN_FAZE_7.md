# Faza 7 — Štampar: proizvodi, JSON import, statusi — plan implementacije

> **Status plana:** plan pripremljen i odobren, **implementacija NIJE započeta.**
> Nijedan fajl iz `backend/` ili `frontend/` nije izmenjen povodom ovog plana.
> Datum: 2026-09-21.
> Veza: `IMPLEMENTACIJA_PLAN.md` → sekcija „Faza 7 — Štampar: proizvodi, JSON import, statusi".
> Ručno testiranje nakon implementacije: dopuniti `MANUAL_TESTING.md` novom sekcijom za Fazu 7.

---

## 1. Obuhvat

Cilj Faze 7 je kompletan štamparski deo sistema (specifikacija, sekcija **4. Štampar**):

| Tačka specifikacije | Zahtev |
|---|---|
| 4.1 | Profil — pregled i ažuriranje podataka (bez promene korisničkog imena) + profilna slika |
| 4.2 | Proizvodi i usluge — dodavanje proizvoda u **predefinisane** kategorije i potkategorije, uz cenu, podatke i sliku/e; definisanje usluga štampe |
| 4.3 | Ažuriranje količina za sve postojeće proizvode |
| 4.4 | Dodavanje iz JSON fajla (Prilog 1 format) + **dodatni korak za slike** |
| 4.5 | Naručeni proizvodi — promena statusa „naruceno" → „u stampi" → „isporuceno", **samo za fizička lica** |
| 4.6 | Licitacije — već implementirano u Fazi 6 ✅ |

Plan obuhvata i **zatvaranje dva nalaza** iz `MANUAL_TESTING.md`, po odluci korisnika:

- **N-1** — ne postoji UI za ažuriranje profila (obavezna stavka „Приказ **и ажурирање** профила",
  tačke 3.1 i 4.1). Backend `POST /azurirajProfil` postoji i radi.
- **N-2** — ne postoji unos teksta za štampu (obavezna stavka „Додавање услуге **и текста** за штампу",
  tačka 3.3). Model i backend podržavaju polje `tekst`.

Iz obuhvata su **isključeni** (ostaju za kasnije faze, kako je dogovoreno):

- **N-3** — e-mail fakture (placeholder Ethereal kredencijali u `emailUtils.ts`) i PDF koji se ne snima.
  **Ispravka (2026-09-23): N-3 je rešen** — `emailUtils.ts` pravi Ethereal nalog u letu i kešira transporter
  (ili koristi pravi SMTP iz okruženja), a PDF je prerađen (nalozi **N-15**/**N-16**). Ostaje samo to što se
  **PDF ne snima za preuzimanje**.
- **N-4** — neaktivni proizvod dostupan preko direktnog URL-a.
- **N-5**, **N-8**, **N-9** — typo, serverske provere rola za nabavke, nedeterministički TOP 5.
- PDF izveštaj o ponudama (Faza 6, crvena „-" stavka) i Faza 8 (administrator, statistike).

---

## 2. Konvencije koje se ne menjaju

- **Angular 20** — standalone komponente, `inject()`, `@if`/`@for`, `provideHttpClient()`.
- **Backend** — Express kontroleri kao klase sa arrow metodama, **jedan kontroler + jedan ruter po
  domenu**, mongoose modeli, bez novih biblioteka (Chart.js ostaje za Fazu 8).
- **Srpski** UI tekst, nazivi polja i poruke.
- Komponente i servisi u postojećim folderima/kebab-case imenima.
- Faza je završena tek kada prođe `npx ng build` sa **0 warninga** (NG8113 disciplina — nijedan
  importovan modul ne sme ostati nekorišćen u template-u).

---

## 3. Backend — novi domen `stampar`

### 3.1 Novi fajlovi

- `backend/src/controllers/stamparController.ts`
- `backend/src/routers/stamparRouter.ts`
- registracija rutera u `backend/src/server.ts` (komentar `// Faza 7: štampar`)

`proizvodiController` i `proizvodiRouter` ostaju **netaknuti** — to je javni, read-only deo.
Domen `stampar` je zaštićeni, pišući deo (dodavanje, izmene, import).

### 3.2 Endpointi

| Ruta | Metod | Opis |
|---|---|---|
| `/proizvodiStamparije?stamparijaId=` | GET | Svi proizvodi štampara, **uključujući `aktivan: false`**, sortirano po šifri; vraća i `uslugeStampe`, `slikaUrl`, `dodatneSlike` |
| `/kategorije` | GET | Sve kategorije sa potkategorijama iz baze |
| `/dodajProizvod` | POST | multipart (`upload.single('slika')`) — novi proizvod + usluge štampe |
| `/azurirajKolicinu` | POST | `{ stamparijaId, sifra, kolicinaNaLageru }` |
| `/importJSON` | POST | multipart (`upload.single('fajl')`) — Prilog 1 format |
| `/dodajSlike` | POST | multipart (`upload.array('slike', 4)`) — dodatni korak posle importa |
| `/narudzbineStamparije?stamparijaId=` | GET | Fakture tog štampara + `vrstaKlijenta` + `mozePromenitiStatus` |
| `/promeniStatusNarudzbine` | POST | `{ idFakture, stamparijaId, noviStatus }` |

**Zašto novi `/kategorije`:** postojeći `kategorijeZaPretragu` (u `proizvodiController`) vraća samo
kategorije koje imaju **aktivne proizvode na stanju**, pa ne prikazuje npr. „Zahvalnice" ili
„Fototapete" dok nijedan proizvod u njima ne postoji. Štamparu su potrebne **sve** predefinisane
kategorije iz baze (spec 4.2). Isti endpoint će kasnije koristiti i Faza 8 (upravljanje kategorijama).

### 3.3 Validacije i pravila

Poruke su u tonu postojećih (bez tačke na kraju, srpski, latinično pismo).

**`/dodajProizvod`**
- `sifra` mora biti jedinstvena **globalno** (ne samo unutar štampara) → `Proizvod sa tom šifrom već postoji`
- obavezna polja: `sifra`, `naziv`, `opis`, `kategorija`, `potkategorija`, `jedinicnaCena`, `kolicinaNaLageru`
- `kategorija` i `potkategorija` moraju postojati u kolekciji `kategorije` → `Izabrana kategorija ili potkategorija ne postoji`
- `jedinicnaCena` i `kolicinaNaLageru` moraju biti brojevi ≥ 0 → `Cena ne može biti negativna` / `Količina ne može biti negativna`
- `nazivStamparije`, `grad` i `stamparijaId` se **pune sa servera** iz `Korisnik` zapisa ulogovanog
  štampara — ne veruje se vrednostima iz zahteva (provera da korisnik postoji i da je `tip: 'stampar'`)
- `uslugeStampe` — niz objekata `{ idUsluge, tipStampe, dodatnaCenaPoKomadu, maxSirinaMm, maxVisinaMm }`;
  `idUsluge` se generiše ako nije poslat; `dodatnaCenaPoKomadu` ≥ 0
- `dostupneBoje` — niz stringova (prazna lista je dozvoljena; spec 3.2: ako nema boja → podrazumevano bela,
  što rešava klijentska strana)
- novi proizvod: `aktivan: true`

**`/azurirajKolicinu`**
- proizvod mora postojati **i pripadati tom štamparu** → `Proizvod nije pronađen`
- `kolicinaNaLageru` ceo broj ≥ 0

**`/importJSON`** (Prilog 1)
- čita `proizvodi[]` iz fajla; polje `stampaorijaId` iz fajla se **ignoriše** — uvezeni proizvodi uvek
  pripadaju **ulogovanom** štamparu (njegova lager lista)
- po zapisu:
  - šifra ne postoji → **insert** (`aktivan: true`, `slikaUrl: ''`, `dodatneSlike: []`)
  - šifra postoji **i pripada njemu** → **update** (naziv, opis, kategorija, potkategorija, cena,
    količina, boje, usluge); `slikaUrl` i `dodatneSlike` se **zadržavaju**
  - šifra postoji **i pripada drugom štamparu** → **preskoči i prijavi** (tuđi podaci se ne menjaju)
- neispravan JSON → `Fajl nije ispravan JSON`; prazna lista proizvoda → `Fajl ne sadrži nijedan proizvod`
- odgovor:
  ```json
  { "message": "...", "uvezeni": ["PR-004"], "azurirani": ["PR-001"], "preskoceni": [{ "sifra": "GPR-001", "razlog": "..." }] }
  ```

**`/dodajSlike`**
- samo svoj proizvod → `Proizvod nije pronađen`
- prva slika → `slikaUrl`; do 3 sledeće → `dodatneSlike` (ukupno 1 + 3, po specifikaciji za javnu
  stranu detalja); slika/e se mogu dodavati i u više navrata (dopuna do maksimuma)
- JPG/PNG/GIF, ≤ 5 MB (preuzima se iz `middlewares/upload.ts`)

**`/narudzbineStamparije`**
- `Faktura.find({ stamparijaId })`, sortirano po `datumIzdavanja` opadajuće
- za svaku fakturu se dodaje `vrstaKlijenta` (iz `Korisnik` po `klijentId`) i `mozePromenitiStatus`
  (računato serverski, da frontend ne pogađa pravilo)

**`/promeniStatusNarudzbine`**
- faktura mora pripadati tom štamparu → `Faktura nije pronađena`
- klijent **pravno lice** → odbij → `Status narudžbina pravnih lica menja se kroz javne nabavke`
  (spec 4.5 i 3.6: za pravna lica nabavka ide kroz licitaciju, a faktura se kreira sa statusom „u stampi")
- dozvoljen je **samo korak napred** po lancu `naruceno → u stampi → isporuceno` →
  `Nedozvoljena promena statusa`
- `primljeno` je **isključivo klijentska akcija** (`/promeniStatusPrimljeno`, Faza 5) i ostaje netaknuto

### 3.4 Upload slika

- koristi se postojeći `middlewares/upload.ts` **kakav jeste** (`uploads/`, 5 MB, JPG/PNG/GIF) i
  `server.ts` već servira `/uploads`
- ⚠️ **Ne** primenjivati `proveriDimenzijeSlike` na slike proizvoda — ta provera (100–250 px) je pravilo
  za **profilnu** sliku i odbila bi normalne slike proizvoda

### 3.5 Seed

**`seed.ts` se ne menja.** Postojeći podaci već pokrivaju ceo test (tabela u sekciji 6.2) — ali to
**treba proveriti u bazi**, ne pretpostaviti.

---

## 4. Frontend — štamparski deo

| Fajl | Namena |
|---|---|
| `services/stampar.service.ts` | Sve metode za gore navedene rute; multipart preko `FormData` (isti pristup kao registracija/profilna slika) |
| `guards/stampar.guard.ts` | Propušta samo `ulogovan.tip === 'stampar'`, inače redirect na `/` |
| `components/mojiProizvodi/` | Ruta `/moji-proizvodi` |
| `components/stamparNarudzbine/` | Ruta `/narudzbine-stamparija` |
| `app.routes.ts` | Dve nove rute sa `stamparGuard` |
| `app.html` | Za `tip === 'stampar'` dodati „🧾 Moji proizvodi" i „📦 Narudžbine" pored postojeće „🏷️ Licitacije" |

**Zašto novi guard:** postojeći `authGuard` proverava samo da `ulogovan` postoji u `localStorage` —
klijent bi mogao ručno da otvori `/moji-proizvodi`.

### 4.1 `mojiProizvodi` — tri sekcije

1. **Lista proizvoda** — tabela: šifra, naziv, kategorija/potkategorija, jedinična cena, količina,
   status (`aktivan`), slika. Po redu: input za količinu + dugme **„Sačuvaj količinu"**.
2. **Dodavanje proizvoda** — kategorija → potkategorija (kaskadni dropdown iz `/kategorije`), naziv,
   opis, jedinična cena, količina, dostupne boje (lista odvojena zapetom), **dinamički redovi za usluge
   štampe** (`tipStampe`, `dodatnaCenaPoKomadu`, `maxSirinaMm`, `maxVisinaMm`; dugmad „Dodaj uslugu" /
   „Ukloni"), slika opciono + preview, dugme „Dodaj proizvod".
3. **JSON import** — `<input type="file" accept=".json">` + dugme „Uvezi"; posle importa prikaz
   rezultata (uvezeni / ažurirani / preskočeni **sa razlogom**) i **dodatni korak za slike**:
   za svaki uvezeni proizvod mali file input „Dodaj sliku" koji poziva `/dodajSlike` (spec 4.4).

### 4.2 `stamparNarudzbine`

- tabela faktura: ID fakture, klijent, datum, stavke (naziv (količina)), iznos, status
- dugmad **„Prebaci u štampu"** / **„Označi kao isporučeno"** prikazuju se **samo** kada je promena
  dozvoljena (na osnovu `mozePromenitiStatus` sa servera)
- redovi pravnih lica dobijaju oznaku **„Pravno lice — status kroz nabavke"**
- filter po statusu (opciono)

---

## 5. N-1 — UI za ažuriranje profila

U `components/profil/` dodati formu za izmenu (preklopnik „Izmeni podatke" → forma; postojeći prikaz
ličnih podataka i dve tabele narudžbina ostaju netaknuti):

- polja: ime, prezime, telefon, e-mail
- za **pravno lice** i **štampara**: naziv institucije, adresa sedišta, matični broj, PIB
- za **štampara**: grad
- **korisničko ime je prikazano, ali onemogućeno za izmenu** (spec 3.1: „zabranjena promena
  korisničkog imena")
- nova profilna slika (file input + preview; ista pravila kao pri registraciji — 100–250 px, JPG/PNG/GIF)

Slanje: `FormData` POST na **postojeći** `POST /azurirajProfil`. Na uspeh:

1. prikazati poruku,
2. upisati vraćeni `user` nazad u `localStorage.ulogovan` (da se ime u headeru osveži),
3. greške serverske validacije prikazati u originalnom obliku
   (npr. `Matični broj mora imati tačno 8 cifara`, `I-mejl adresa je već zauzeta`).

Isti ekran rešava i spec 4.1 (štampar: „isto kao klijent") — bez dupliranja komponente.

---

## 6. N-2 — unos teksta za štampu

U klijentskom prikazu `components/proizvodDetalji/`:

- polje **„Tekst za štampu"** (textarea)
- opciono polje za **sličicu** (JPG/PNG/GIF) sa **CSS overlay pregledom** preko slike proizvoda
  (spec 3.3 dozvoljava HTML5 Canvas ili `position: absolute/relative`)
- „DODAJ U KORPU" šalje stvaran `tekst` (i `slika` kao data URL iz pregleda, uz ograničenje veličine)
  umesto praznih stringova

Backend već čuva `tekst` i `slika` u stavci korpe. Dodatno (male izmene `korpaController.ts`):
proslediti `tekst` i u `stavke` fakture pri `potvrdiKorpu`, da štampar vidi šta treba da odštampa.

---

## 7. Dokumentacija koja se ažurira pri implementaciji

| Fajl | Izmena |
|---|---|
| `IMPLEMENTACIJA_PLAN.md` | Štiklirati stavke Faze 7 i stavke N-1/N-2 |
| `MANUAL_TESTING.md` | Nova sekcija **„FAZA 7 — Štampar"** u istoj strukturi (šta zadatak zahteva / šta je implementirano / ✅ čeklista sa očekivanim ishodima), plus kratka sekcija za N-1 i N-2; nalaze N-1 i N-2 u tabeli označiti kao **rešeno** |
| `implementation_log.md` | Nova sekcija „Faza 7 — ✅" u postojećem stilu (tabela endpointa, fajlovi, seed, rezultat testa); **ispraviti zastareo header** (trenutno piše „Faza 4 — u toku", a Faze 4–6 su završene) |
| `CONVERSATION_LOG.md` | Upis sesije po pravilima iz `AGENTS.md` |

---

## 8. Verifikacija

### 8.1 Automatski

```bash
cd PIA_PROJEKAT/backend  && npx tsc --noEmit      # ili build
cd PIA_PROJEKAT/frontend && npx ng build          # očekivano: 0 warninga
```

### 8.2 Ručni test (svež seed, `kopistudio` / `Admin123!`)

1. **Dodavanje proizvoda** sa slikom i dve usluge štampe → pojavljuje se u listi i u javnoj pretrazi.
2. **Promena količine** → broj se menja i na `/proizvodiStamparije` i na javnoj strani.
3. **JSON import** `primer-proizvodi.json` → PR-001..003 se **ažuriraju**; **drugi import istog fajla
   ne pravi duplikate**. Test fajl sa tuđom šifrom (npr. `GPR-001`) → ta stavka se **preskače uz razlog**.
4. **Dodatni korak** — dodavanje slika uvezenim proizvodima → slike vidljive na javnoj strani detalja.
5. **Narudžbine** (vidi tabelu u 8.3) → dozvoljene i zabranjene promene statusa.
6. **N-1** — izmena profila klijenta (fizičko i pravno lice) i štampara; promena slike; korisničko ime
   nepromenljivo.
7. **N-2** — tekst i sličica u korpi, vidljivi u stavci fakture.

### 8.3 Seed podaci relevantni za Fazu 7 (proveriti u bazi pre implementacije)

**Proizvodi po štamparu** — svaki štampar ima po 3:

| Štampar | Proizvodi | Napomena |
|---|---|---|
| `kopistudio` | `PR-001`, `PR-002`, `PR-003` | svi aktivni — pokrivaju Prilog 1 import |
| `grafika` | `GPR-001`, `GPR-002`, `GPR-003` | `GPR-002` je **`aktivan: false`** → test da lista štampara prikazuje i neaktivne |
| `stamparija.centar` | `CPR-001`, `CPR-002`, `CPR-003` | — |

**Fakture po štamparu** — pokrivaju celu matricu promene statusa:

| Faktura | Štampar | Klijent | Vrsta klijenta | Status | Očekivano ponašanje |
|---|---|---|---|---|---|
| `F-2026-001` | `kopistudio` | `marko.markovic` | fizičko | `naruceno` | dozvoljeno → `u stampi` → `isporuceno` |
| `F-2026-002` | `grafika` | `marko.markovic` | fizičko | `u stampi` | dozvoljeno → `isporuceno`; **nije** u listi `kopistudio` |
| `F-2026-003` | `stamparija.centar` | `marko.markovic` | fizičko | `isporuceno` | nema dalje (sledeći korak je klijentski `primljeno`) |
| `F-2026-004` | `kopistudio` | `marko.markovic` | fizičko | `primljeno` | završeno |
| `F-2026-005` | `stamparija.centar` | `marko.markovic` | fizičko | `primljeno` | završeno |
| `F-2026-006` | `grafika` | `jovana.jovanovic` | fizičko | `primljeno` | završeno |
| `F-2026-007` | `grafika` | `jovana.jovanovic` | fizičko | `primljeno` | završeno |
| `F-2026-008` | `kopistudio` | `nenad.nedic` (TRGOPROM doo) | **pravno** | `u stampi` | **zaključano** — poruka o javnim nabavkama |

**Lozinke:** svi seedovani korisnici → `Admin123!`.
**Nalozi `na_cekanju`** (`nova.stamparija`, `nova.firma`) nisu relevantni za Fazu 7 (čekaju Fazu 8).

### 8.4 Negativni slučajevi (curl)

- negativna cena i negativna količina pri dodavanju,
- nepostojeća kategorija/potkategorija,
- dupla šifra (globalno),
- neispravan JSON fajl i JSON bez `proizvodi[]`,
- tuđi proizvod u `/azurirajKolicinu` i `/dodajSlike`,
- promena statusa tuđe fakture,
- promena statusa fakture pravnog lica,
- pokušaj preskakanja koraka (`naruceno` → `isporuceno`).

---

## 9. Predloženi redosled rada

1. `stamparController` + `stamparRouter` + registracija u `server.ts`; `/kategorije`, `/proizvodiStamparije`.
2. `/dodajProizvod`, `/azurirajKolicinu` (+ validacije) — `tsc --noEmit`.
3. `/importJSON` i `/dodajSlike`.
4. `/narudzbineStamparije` i `/promeniStatusNarudzbine`.
5. Frontend: `stampar.service.ts`, `stampar.guard.ts`, rute i meni.
6. Komponenta `mojiProizvodi` (lista → forma → import + slike).
7. Komponenta `stamparNarudzbine`.
8. **N-1** (profil) i **N-2** (tekst za štampu).
9. `ng build` (0 warninga) + ručni test po sekciji 8.
10. Dokumentacija (sekcija 7) i commit po završetku faze.

---

## 10. Otvorena pitanja i rizici

- **Tuđa šifra pri importu** — trenutna odluka je „preskoči i prijavi". Da li uopšte dozvoliti
  preuzimanje/prepisivanje tuđe šifre **ostaje otvoreno** (korisnik: „planiraj ostalo, rešićemo").
  Do tada ovo ponašanje ništa ne menja u tuđim podacima.
- **Nema tokena/autentifikacije** — endpointi veruju `stamparijaId` iz zahteva, kao i ostatak projekta.
  Ostaje tako radi konzistentnosti; vredi pomenuti na odbrani kao poznato ograničenje.
- **N-3 se u ovoj fazi nije dirao** — **ispravka (2026-09-23): rešen je naknadno**, e-mail fakture sada
  prolazi (Ethereal nalog u letu / SMTP iz okruženja). Ostaje jedino da se PDF **ne snima za preuzimanje**.
- **`backend/uploads/` je u `.gitignore`** — slike proizvoda ne prežive kloniranje repozitorijuma;
  prihvatljivo za demonstraciju, ali vredi znati pre odbrane.
- **Prazan netrackovan direktorijum** `PIA_PROJEKAT/PIA_PROJEKAT/frontend` (ostatak inicijalnog skela)
  — ne dira se u ovoj fazi.
- **`aktivan` polje** — novi i uvezeni proizvodi dobijaju `aktivan: true`; prekidač za aktivaciju
  pojedinačnog proizvoda nije u specifikaciji, pa se ne uvodi u ovoj fazi.
