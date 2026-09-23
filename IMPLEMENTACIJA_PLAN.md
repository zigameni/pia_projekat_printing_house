# PIA Projekat — Plan Implementacije (Faze)

> Projekat: **„Printing House"** — veb sistem za štamparije
> Tehnologije: Angular 20 (frontend) + Express/NodeJS + MongoDB (backend)
> Kompletni zahtevi: `PIA_PROJEKAT/SPECIFIKACIJA.md`
> Starter projekti: `PIA_PROJEKAT/backend_Node/` (Express, port 4000) i `PIA_PROJEKAT/frontend/` (Angular 20)

---

## Radni principi (iz handoff.md)

- **Backend prvi**: modeli → kontroler → ruter → kompajliranje (`npx tsc --noEmit`)
- **Brzo i često kompajlirati** oba projekta nakon svake izmene
- Frontend: standalone komponente, `inject()` DI, `@for`/`@if` u šablonima, `localStorage` sesija
- Backend: Mongoose modeli, `find-modify-save` i `flatten` patterni
- **Commit nakon svake faze**: čim je faza završena i proverena (kompajliranje + testiranje),
  odmah se pravi git commit — nikad se ne prelazi na sledeću fazu sa necommitovanim radom

---

## Prioriteti implementacije (iz `minimalni zahtevi.txt`)

> Fajl u korenu projekta. Crne stavke = **obavezne** (min. 15 poena), stavke
> označene sa **„-"** = crvene, rade se **na kraju** (do 30 poena).

### Obavezne stavke — radimo prvo
- [ ] Prijava korisnika (klijent/štampar + admin na posebnoj ruti)
- [ ] Registracija svih tipova korisnika
- [ ] Broj štamparija + TOP 5 proizvoda (početna strana)
- [ ] Pretraga po više parametara + sortiranje rezultata
- [ ] Detalji proizvoda (sa jednom slikom)
- [ ] Klijent: profil (prikaz/ažuriranje), tabela narudžbina, pretraga + detalji,
      dodavanje usluge i teksta za štampu, e-korpa + zatvaranje narudžbine,
      javne nabavke, lajkovanje i komentarisanje
- [ ] Štampar: profil, proizvodi/usluge + ažuriranje količina, promena statusa
      naručenih proizvoda, licitacije
- [ ] Admin: upravljanje korisničkim nalozima, obrada zahteva za registraciju,
      upravljanje kategorijama proizvoda

### Stavke sa „-" — ostavljamo za kraj
1. Zaboravljena lozinka
2. Galerija sa dodatnim slikama u detaljima
3. Otkazivanje narudžbine (status „naručeno")
4. Mapa gde je štamparija (u detaljima)
5. Priprema proizvoda (sličica za štampu + prikaz štampe na slici proizvoda)
6. Dostavljanje PDF fakture na i-mejl
7. Servis za plaćanje
8. Dodavanje iz JSON fajla (štampar)
9. Izveštavanje (PDF izveštaj o ponudama)
10. Statistike u vidu grafikona (admin)

---

## Predlog modela podataka (MongoDB kolekcije)

> Baza se kreira i puni **nezavisno od aplikacije** (Compass import). Aplikacija samo čita/pisuje.

### `korisnici`
| Polje | Tip | Napomena |
|-------|-----|----------|
| korisnickoIme | String | jedinstveno |
| lozinka | String | **hash** (bcrypt) |
| ime, prezime | String | odgovorno lice za pravna lica/štamparije |
| telefon | String | |
| email | String | jedinstven |
| tip | String | `klijent`, `stampar`, `admin` |
| vrsta | String | `fizicko` / `pravno` (samo klijent) |
| slika | String | putanja; default: `default_profile_image.jpg` |
| status | String | `aktivan` / `neaktivan` / `na_cekanju` (zahtev za odobrenje) |
| nazivInstitucije, adresa, maticniBroj (8 cifara), PIB (9 cifara, ne počinje 0) | String | za pravna lica i štamparije |
| grad | String | potrebno za prikaz na mapama/detaljima |

### `kategorije`
```
{ naziv: "Štampa malih formata", potkategorije: ["Olovke", "Vizit karte", ...] }
```

### `proizvodi`
```
{
  stamparijaId, nazivStamparije, grad,
  sifra, naziv, opis,
  kategorija, potkategorija,
  jedinicnaCena, kolicinaNaLageru,
  dostupneBoje: [String],
  slikaUrl, dodatneSlike: [String],
  uslugeStampe: [{ idUsluge, tipStampe, dodatnaCenaPoKomadu, maxSirinaMm, maxVisinaMm }],
  aktivan: Boolean   // da li se prikazuje u pretrazi
}
```

### `fakture` / `narudzbine`
```
{
  idFakture: String,           // auto-increment ili generisan
  klijentId, klijentIme,
  stamparijaId, nazivStamparije, grad,
  stavke: [{ sifra, naziv, kolicina, tipStampe, boja, jedinicnaCena, iznos }],
  ukupanIznos, datumIzdavanja,
  status: "naruceno" | "placeno" | "u stampi" | "isporuceno" | "primljeno"
}
```

### `korpa` (opciono — može i u localStorage-u, ali je sigurnije u bazi)
```
{ klijentId, stavke: [{ proizvodId, stamparijaId, kolicina, tipStampe, boja, tekst/slika, cena }] }
```

### `javne_nabavke`
```
{
  idNabavke, klijentId (pravno lice), datumVremeRaspisivanja, rok (10 min),
  stavke: [{ sifra, naziv, kolicina }],
  zavrsena: Boolean, pobednikId
}
```

### `ponude`
```
{ nabavkaId, stamparijaId, stavke: [{sifra, naziv, kolicina, jedinicnaCena}], ukupanIznos, datum }
```

### `komentari` / `ocene`
```
{ proizvodId, korisnickoIme, datum, tekst, ocena: "svidja" | "ne_svidja" }
```

### `password_reset`
```
{ korisnickoIme/email, token, datumIsticanja (5 min) }
```

---

## Faza 0 — Priprema okruženja i baze
**Cilj:** radno okruženje + popunjena baza da sve kasnije faze imaju podatke.

- [ ] Provera `node_modules` u `backend_Node/` i `frontend/` (npm install ako treba)
- [x] Instalacija dodatnih paketa: backend `bcrypt` (+`@types/bcrypt`), `multer` (+`@types/multer`), `nodemailer` (+`@types/nodemailer`), `pdfkit` (+`@types/pdfkit`); frontend `chart.js` (ima ugrađene TS tipove)
- [ ] Lokalni MongoDB pokrenut; kreiranje baze `printing_house`
- [ ] **Seed skripta / JSON import** (Compass): korisnici (svi tipovi), kategorije/potkategorije, proizvodi (iz `primer-proizvodi.json`), fakture, komentari, nabavke — dovoljno podataka za sve ekrane
- [ ] Angular: `provideHttpClient()` u `app.config.ts`, globalni `styles.css` (uniforman izgled, header/footer)
- [ ] Folder struktura backend: `src/models/`, `src/controllers/`, `src/routers/`; frontend: `src/app/models/`, `src/app/services/`, komponente
- [ ] **Kontrola:** oba projekta se kompajliraju (`npx tsc --noEmit`)

## Faza 1 — Autentifikacija i registracija
**Cilj:** kompletan tok prijave/registracije za sve tri vrste korisnika.

- [x] Model `korisnici` + hash lozinke (bcrypt)
- [x] Backend: `login` (klijent/štampar), `loginAdmin` — provera tipa
- [x] Backend: `registracijaFizickoLice` (odmah aktivan), `registracijaPravnoLice` / `registracijaStampara` (status `na_cekanju`)
- [x] Server-side validacije: jedinstveno korisničko ime, jedinstveni e-mejl, matični broj (8 cifara), PIB (9 cifara, ne počinje 0)
- [x] Profilna slika: `multer` upload, provera dimenzija (100–250px) i formata (JPG/PNG/GIF), default slika (`public/default_profile_image.jpg`)
- [ ] Backend: `zaboravljenaLozinka` (token, 5 min istek) + `promeniLozinku` preko linka — **odloženo za kraj** (stavka sa „-")
- [x] Frontend: login strana (javna), admin login (posebna ruta), registracija (3 forme)
- [x] `localStorage` sesija (`ulogovan`) + zaštita ruta (guard)
- [x] **Kontrola:** kompletan tok proveren (registracija → login → odjava) — backend curl + frontend preview ✅

## Faza 2 — Javni deo (neregistrovani korisnik)
**Cilj:** početna strana sa statistikama, pretragom i detaljima proizvoda.

- [x] Backend: `brojStamparija`, `top5Proizvoda`, `pretragaProizvoda` (naziv i/ili kategorija; samo aktivni + na stanju), `kategorijeZaPretragu`, `detaljiProizvoda`
- [x] **Dopuna (2026-09-22):** pretraga je proširena i na **grad** i **štampariju** (+ dugme „Očisti" u formi); novi endpoint `gradoviIStamparije` puni te dve padajuće liste. *Ovo je iznad minimalnih zahteva (spec traži samo naziv i/ili kategoriju) — dodato kao UX poboljšanje na zahtev korisnika.*
- [x] Frontend: početna strana (broj štamparija, TOP 5), forma za pretragu, tabela sa sortiranjem po nazivu (↑/↓), dugme „DETALJI"
- [ ] Strana detalja: galerija (1 glavna + do 3 thumbnail), izbor slike pamti u cookie — **odloženo za kraj** (stavka sa „-"); detalji sa jednom slikom rade ✅
- [x] **Kontrola:** pretraga, sortiranje i detalji rade bez prijave ✅

## Faza 3 — Klijent: profil, narudžbine, pretraga i detalji
**Cilj:** klijentski profil i proširena pretraga sa detaljima.

- [x] Backend: `azurirajProfil` (bez korisničkog imena; sa promenom slike) ✅
- [~] Backend: `narudzbineKlijenta`, `otkaziNarudzbinu` (samo status `naruceno` — **odloženo**, stavka sa „-") — narudzbineKlijenta implementiran u Fazi 3.4; otkaziNarudzbinu ostaje za kraj
- [x] Backend: `detaljiProizvodaKlijent` (dugi opis, cena, boje, usluge štampe, podaci o štampariji za mapu) ✅
- [x] Frontend: profil (2 tabele + sortiranje narudžbina), pretraga + prošireni detalji (boja dropdown, vrste štampe) ✅ (mapa — odložena za kraj)
- [~] **Kontrola:** izmena profila radi, otkazivanje za „naruceno" — odloženo; mapa — odložena

## Faza 4 — Klijent: priprema proizvoda, e-korpa, fakture i plaćanje
**Cilj:** ceo tok od pripreme proizvoda do faktura (i opciono plaćanja).

- [x] Backend: `dodajUKorpu` (provera lagera — poruka „Nema dovoljno proizvoda trenutno na stanju"), `korpaKlijenta`, `potvrdiKorpu` (formira fakture po štamparijama, smanjuje lager, šalje PDF na e-mejl), `proveriStatusPonude` (opciono)
- [x] Frontend: strana pripreme proizvoda (tekst/sličica preko slike — Canvas/CSS overlay; količina; „DODAJ U KORPU", „PONIŠTI", „NAZAD"), e-korpa (grupisanje po štamparijama, „POTVRDI")
- [x] PDF fakture: `pdfkit`/`jspdf` na backendu ili frontendu + `nodemailer` za slanje na i-mejl
- [ ] (Opc.) Plaćanje — ostaje za kraj: Stripe Test Mode ili PayPal Sandbox forma (tip, broj kartice, CVC, MM/GG) → status „placeno"
- [x] **Kontrola:** naručivanje iz 2+ štamparija pravi 2+ fakture; PDF stiže mejlom; lager se smanjuje; upozorenje za preveliku količinu

## Faza 5 — Klijent: arhiva, lajkovi, komentari
**Cilj:** arhiva proizvoda sa ocenjivanjem.

- [x] Backend: `arhivaProizvoda` (statusi „isporuceno" + „primljeno", sortiranje po datumu/nazivu/količini/štampariji), `promeniStatusPrimljeno`, `dodajKomentar` (lajk/dislajk + tekst), `komentariProizvoda` (poslednjih 5)
- [x] Frontend: arhiva (dugme za prebacivanje isporučeno→primljeno), forma za ocenu i komentar, prikaz 5 komentara (svoje uokviriti narandžasto)
- [x] **Kontrola:** lajk/dislajk menja brojeve na detaljima; komentari prikazani sa korisničkim imenom, datumom, tekstom; svoje komentare imaju narandžasti okvir

## Faza 6 — Javne nabavke (pravna lica + štamparije)
**Cilj:** licitacije od raspisivanja do izbora pobednika.

- [x] Backend: `raspisiNabavku` (10 min rok; e-mejl svim štamparijama), `otvoreneNabavke` (za štampare), `posaljiPonudu` (jedna ponuda po štampariji), `mojeNabavke` (za pravno lice), `proveriIstekNabavki` (pri sledećoj prijavi — izbor najniže ponude sa dovoljnom količinom, fakturisanje, status „u stampi", e-mejl)
- [x] Frontend: strana „Javne nabavke" (pravno lice: raspisivanje + status), strana licitacija (štampar: otvorene nabavke, slanje ponude)
- [ ] PDF izveštaj o ponudama — ostaje za kraj i pobedniku za svaku štampariju
- [x] **Kontrola:** simulacija 10-min intervala (podešavanje vremena u bazi), izbor najbolje ponude, fakturisanje, PDF izveštaj

## Faza 7 — Štampar: proizvodi, JSON import, statusi
**Cilj:** kompletan štamparski deo.

> 📄 Detaljan plan implementacije (odobren): [`PLAN_FAZE_7.md`](PLAN_FAZE_7.md) — obuhvata i zatvaranje
> nalaza **N-1** (UI za ažuriranje profila) i **N-2** (unos teksta za štampu).

**Stanje (2026-09-22):** sve **obavezne** stavke faze su završene — **N-1**, **N-2**, **dodavanje proizvoda i
usluga** (spec 4.2), **ažuriranje količina** (spec 4.3) i **narudžbine + promena statusa** (spec 4.5).
Ostaje samo neobavezna stavka — JSON import (spec 4.4).

- [x] Backend: `/kategorije`, `/proizvodiStamparije`, `/dodajProizvod` (+ usluge štampe), `/azurirajKolicinu` — novi `stamparController` / `stamparRouter`
- [x] Backend: `narudzbineStamparije` + `promeniStatusNarudzbine` (samo korak napred, samo fizička lica)
- [ ] Backend: `importJSON`, `dodajSlike` (neobavezna stavka spec 4.4)
- [x] Frontend: forma + lista proizvoda (`components/mojiProizvodi/`, `stamparGuard`, meni „🧾 Moji proizvodi") sa poljem za količinu i dugmetom „Sačuvaj količinu"
- [x] Frontend: narudžbine (`components/stamparNarudzbine/`, `/narudzbine-stamparija`, meni „📦 Narudžbine") sa statusima i dugmadima za korak napred
- [ ] Frontend: JSON upload + korak za slike
- [x] **Kontrola:** dodavanje proizvoda sa uslugama i slikom → vidljivo u listi i u javnoj pretrazi; izmena količine → vidljiva u listi, u javnoj pretrazi i na strani detalja; promena statusa → vidljiva i kod klijenta na `/profil` ✅
- [ ] **Kontrola:** JSON import iz `primer-proizvodi.json`

- [ ] Backend: `dodajProizvod` (+ usluge štampe), `azurirajKolicinu`, `proizvodiStamparije`, `importJSON` (Prilog 1 format), `dodajSlike` (korak nakon importa), `narudzbineStamparije` + `promeniStatusNarudzbine` („naruceno"→„u stampi"→„isporuceno" — samo za fizička lica)
- [ ] Frontend: proizvodi i usluge (forma + lista), ažuriranje količina, JSON upload + korak za slike, naručeni proizvodi (statusi)
- [ ] **Kontrola:** dodavanje proizvoda, izmena količine, JSON import iz `primer-proizvodi.json`, prebacivanje statusa

## Faza 8 — Administrator
**Cilj:** upravljanje korisnicima, kategorijama i statistike.

**Stanje (2026-09-23):** **završeno za sve obavezno** — **upravljanje korisničkim nalozima** (spec 5.1), **obrada zahteva za registraciju** (spec 5.1) i **upravljanje kategorijama** (spec 5.2) su gotovi. Ostaje samo neobavezna sekcija 5.3 (statistike/grafikoni).

> **Napomena (spec 5.2):** specifikacija traži samo **dodavanje** kategorija i potkategorija. Dodato je i **bezbedno brisanje** (odobrava se samo ako stavku ne koristi nijedan proizvod) — na zahtev korisnika, kao „upravljanje" a ne samo „dodavanje".

- [x] Backend: `sviKorisnici`, `azurirajKorisnika`, `obrisiKorisnika` (novi domen `admin`, spec 5.1) ✅ 2026-09-23
- [x] Backend: `neodobreniKorisnici`, `odobriKorisnika` (status → `aktivan`), `odbijKorisnika` (briše zahtev i oslobađa podatke za novu registraciju) ✅ 2026-09-23
- [x] Backend: `dodajKategoriju`, `dodajPotkategoriju` (+ `sveKategorije` sa brojem proizvoda i `obrisiKategoriju`/`obrisiPotkategoriju` koji se odbijaju dok stavku koristi proizvod) ✅ 2026-09-23
- [ ] Backend statistike: `prometPoStamparijama` (kvartal — bar grafikon), `najcesciProizvodi` (mesec dana — pita grafikon), `kretanjeOcena` (vreme — linijski grafikon)
- [x] Frontend: panel **Korisnici** (`components/adminKorisnici/`, `/korisnici`, `adminGuard`, meni „👥 Korisnici") — tabela + pretraga + filter po tipu, izmena u redu (podaci/status/tip) i brisanje u dva koraka ✅
- [x] Frontend: pregled neodobrenih + prihvati/odbij (`components/zahteviZaRegistraciju/`, `/zahtevi-za-registraciju`, `adminGuard`, meni „📝 Zahtevi") ✅ 2026-09-23
- [x] Frontend: panel **Kategorije** (`components/adminKategorije/`, `/kategorije`, `adminGuard`, meni „🗂️ Kategorije") — dodavanje kategorije i potkategorije u redu, broj proizvoda po stavci, brisanje u dva koraka ✅ 2026-09-23
- [ ] Frontend: stranica statistika sa grafikonima (Chart.js) — linijski sa isključivanjem proizvoda *(neobavezna 5.3)*
- [x] **Kontrola (deo):** izmena statusa na `aktivan` stvarno odobrava nalog (taj nalog se posle može prijaviti); brisanje uklanja nalog i ono što je samo njegovo ✅
- [x] **Kontrola (deo):** odobren zahtev → nalog se odmah može prijaviti; odbijen zahtev → nalog, profilna slika i zauzeti podaci (imejl, MB, PIB) su uklonjeni, pa ista registracija ponovo prolazi ✅ 2026-09-23
- [x] **Kontrola (deo):** nova kategorija se odmah vidi u formi štampara (`/moji-proizvodi`), a u javnoj pretrazi se pojavljuje tek kad u njoj postoji aktivan proizvod na stanju ✅ 2026-09-23
- [ ] **Kontrola:** preostalo — grafikoni prikazuju realne podatke iz baze

## Faza 9 — Završno doterivanje i priprema za odbranu
**Cilj:** kvalitet, otpornost na greške, kompletna baza.

- [ ] Server-side validacija svih endpointa (neispravni podaci → jasna poruka)
- [ ] Uniforman CSS, header/footer/meni na svim stranama, „Izloguj se" svuda
- [ ] Responsive provera + test u 3 pregledača (Chrome, Firefox, Edge)
- [ ] Provera svih tokova iz kontrolne liste u `SPECIFIKACIJA.md` (sekcija 8)
- [ ] Popunjavanje baze sa dovoljno podataka (različiti scenariji: više štamparija, statusi u svim fazama, prošle i aktuelne narudžbine, završene i otvorene nabavke)
- [ ] Priprema kratkih odgovora za odbranu (arhitektura, modeli, najteži delovi, poznati nedostaci)

---

## Zavisnosti faza (redosled rada)

```
Faza 0 → Faza 1 → Faza 2 → Faza 3 → Faza 4 → Faza 5
                                  └──→ Faza 6 (delom paralelno sa 4/5)
Faza 1..6 → Faza 7 (štampar zavisi od 1 i 4)
Faza 1..7 → Faza 8 (admin zavisi od svih prethodnih podataka)
Faza 1..8 → Faza 9
```

**Preporuka:** Fazе 1–4 čine „kostur" sistema (login → pretraga → naručivanje → faktura) i treba ih
završiti prve. Faze 6 i 8 su najkompleksnije (licitacije i statistike) — ostaviti dovoljno vremena.
Faza 5 (arhiva/komentari) je relativno samostalna i može se raditi kao pauza od težih faza.