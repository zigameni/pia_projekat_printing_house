# PIA Projekat — Plan Implementacije (Faze)

> Projekat: **„Printing House"** — veb sistem za štamparije
> Tehnologije: Angular 20 (frontend) + Express/NodeJS + MongoDB (backend)
> Kompletni zahtevi: `PIA_PROJEKAT/SPECIFIKACIJA.md`
> Starter projekti: `PIA_PROJEKAT/backend_Node/` (Express, port 4000) i `PIA_PROJEKAT/frontend/` (Angular 20)

---

## Radni principi (iz handoff.md)

- **Backend prvi**: modeli → kontroler → ruter → kompajliranje (`npx tsc --noEmit`)
- **Jedan fajl po tipu**: jedan `apiController.ts`, jedan `apiRouter.ts`, jedan `api.service.ts`
- **Brzo i često kompajlirati** oba projekta nakon svake izmene
- Frontend: standalone komponente, `inject()` DI, `@for`/`@if` u šablonima, `localStorage` sesija
- Backend: Mongoose modeli, `find-modify-save` i `flatten` patterni

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

- [ ] Model `korisnici` + hash lozinke (bcrypt)
- [ ] Backend: `login` (klijent/štampar), `loginAdmin` — provera tipa
- [ ] Backend: `registracijaFizickoLice` (odmah aktivan), `registracijaPravnoLice` / `registracijaStampara` (status `na_cekanju`)
- [ ] Server-side validacije: jedinstveno korisničko ime, jedinstveni e-mejl, matični broj (8 cifara), PIB (9 cifara, ne počinje 0)
- [ ] Profilna slika: `multer` upload, provera dimenzija (100–250px) i formata (JPG/PNG/GIF), default slika
- [ ] Backend: `zaboravljenaLozinka` (token, 5 min istek) + `promeniLozinku` preko linka
- [ ] Frontend: login strana (javna), admin login (posebna ruta), registracija (3 forme), forma za zaboravljenu lozinku
- [ ] `localStorage` sesija (`ulogovan`) + zaštita ruta (guard)
- [ ] **Kontrola:** kompletan tok ručno proveren (registracija → login → odjava), oba kompajlera prolaze

## Faza 2 — Javni deo (neregistrovani korisnik)
**Cilj:** početna strana sa statistikama, pretragom i detaljima proizvoda.

- [ ] Backend: `brojStamparija`, `top5Proizvoda`, `pretragaProizvoda` (naziv i/ili kategorija; samo aktivni + na stanju), `kategorijeZaDropdown` (samo kategorije sa aktivnim proizvodima na stanju), `detaljiProizvoda`
- [ ] Frontend: početna strana (broj štamparija, TOP 5), forma za pretragu, tabela sa sortiranjem po nazivu (↑/↓), dugme „DETALJI"
- [ ] Strana detalja: naziv, štamparija, grad, brojevi lajkova/dislajkova, galerija (1 glavna + do 3 thumbnail), izbor slike pamti u cookie
- [ ] **Kontrola:** pretraga, sortiranje, galerija i cookie rade bez prijave

## Faza 3 — Klijent: profil, narudžbine, pretraga i detalji
**Cilj:** klijentski profil i proširena pretraga sa detaljima.

- [ ] Backend: `azurirajProfil` (bez korisničkog imena; sa promenom slike), `narudzbineKlijenta`, `otkaziNarudzbinu` (samo status `naruceno`)
- [ ] Backend: `detaljiProizvodaKlijent` (dugi opis, cena, boje, usluge štampe, podaci o štampariji za mapu)
- [ ] Frontend: profil (2 tabele + sortiranje narudžbina + „Otkaži"), pretraga + prošireni detalji (boja dropdown — default bela, vrste štampe, **mapa** preko eksternog API-ja)
- [ ] **Kontrola:** izmena profila radi, otkazivanje radi samo za „naruceno", mapa se prikazuje

## Faza 4 — Klijent: priprema proizvoda, e-korpa, fakture i plaćanje
**Cilj:** ceo tok od pripreme proizvoda do faktura (i opciono plaćanja).

- [ ] Backend: `dodajUKorpu` (provera lagera — poruka „Nema dovoljno proizvoda trenutno na stanju"), `korpaKlijenta`, `potvrdiKorpu` (formira fakture po štamparijama, smanjuje lager, šalje PDF na e-mejl), `proveriStatusPonude` (opciono)
- [ ] Frontend: strana pripreme proizvoda (tekst/sličica preko slike — Canvas/CSS overlay; količina; „DODAJ U KORPU", „PONIŠTI", „NAZAD"), e-korpa (grupisanje po štamparijama, „POTVRDI")
- [ ] PDF fakture: `pdfkit`/`jspdf` na backendu ili frontendu + `nodemailer` za slanje na i-mejl
- [ ] (Opc.) Plaćanje: Stripe Test Mode ili PayPal Sandbox forma (tip, broj kartice, CVC, MM/GG) → status „placeno"
- [ ] **Kontrola:** naručivanje iz 2+ štamparija pravi 2+ fakture; PDF stiže mejlom; lager se smanjuje; upozorenje za preveliku količinu

## Faza 5 — Klijent: arhiva, lajkovi, komentari
**Cilj:** arhiva proizvoda sa ocenjivanjem.

- [ ] Backend: `arhivaProizvoda` (statusi „isporuceno" + „primljeno", sortiranje po datumu/nazivu/količini/štampariji), `promeniStatusPrimljeno`, `dodajKomentar` (lajk/dislajk + tekst), `komentariProizvoda` (poslednjih 5)
- [ ] Frontend: arhiva (dugme za prebacivanje isporučeno→primljeno), forma za ocenu i komentar, prikaz 5 komentara (svoje uokviriti narandžasto)
- [ ] **Kontrola:** lajk/dislajk menja brojeve na detaljima; komentari prikazani sa korisničkim imenom, datumom, tekstom; svoje komentare imaju narandžasti okvir

## Faza 6 — Javne nabavke (pravna lica + štamparije)
**Cilj:** licitacije od raspisivanja do izbora pobednika.

- [ ] Backend: `raspisiNabavku` (10 min rok; e-mejl svim štamparijama), `otvoreneNabavke` (za štampare), `posaljiPonudu` (jedna ponuda po štampariji), `mojeNabavke` (za pravno lice), `proveriIstekNabavki` (pri sledećoj prijavi — izbor najniže ponude sa dovoljnom količinom, fakturisanje, status „u stampi", e-mejl)
- [ ] Frontend: strana „Javne nabavke" (pravno lice: raspisivanje + status), strana licitacija (štampar: otvorene nabavke, slanje ponude)
- [ ] PDF izveštaj o ponudama i pobedniku za svaku štampariju
- [ ] **Kontrola:** simulacija 10-min intervala (podešavanje vremena u bazi), izbor najbolje ponude, fakturisanje, PDF izveštaj

## Faza 7 — Štampar: proizvodi, JSON import, statusi
**Cilj:** kompletan štamparski deo.

- [ ] Backend: `dodajProizvod` (+ usluge štampe), `azurirajKolicinu`, `proizvodiStamparije`, `importJSON` (Prilog 1 format), `dodajSlike` (korak nakon importa), `narudzbineStamparije` + `promeniStatusNarudzbine` („naruceno"→„u stampi"→„isporuceno" — samo za fizička lica)
- [ ] Frontend: proizvodi i usluge (forma + lista), ažuriranje količina, JSON upload + korak za slike, naručeni proizvodi (statusi)
- [ ] **Kontrola:** dodavanje proizvoda, izmena količine, JSON import iz `primer-proizvodi.json`, prebacivanje statusa

## Faza 8 — Administrator
**Cilj:** upravljanje korisnicima, kategorijama i statistike.

- [ ] Backend: `sviKorisnici`, `azurirajKorisnika`, `obrisiKorisnika`, `neodobreniKorisnici`, `odobriKorisnika`/`odbijKorisnika`, `dodajKategoriju`, `dodajPotkategoriju`
- [ ] Backend statistike: `prometPoStamparijama` (kvartal — bar grafikon), `najcesciProizvodi` (mesec dana — pita grafikon), `kretanjeOcena` (vreme — linijski grafikon)
- [ ] Frontend: admin panel (tabela korisnika + CRUD, pregled neodobrenih + prihvati/odbij, kategorije), stranica statistika sa grafikonima (Chart.js) — linijski sa isključivanjem proizvoda
- [ ] **Kontrola:** odobravanje zahteva aktivira nalog; grafikoni prikazuju realne podatke iz baze

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