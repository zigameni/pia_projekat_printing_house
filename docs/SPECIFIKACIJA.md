# PIA Projekat — "Printing House" — Kompletna Specifikacija

> Izvor: `PIA_Projekat_specifikacija.md` (preuzeto iz PDF-a projekta za 2025/26).
> Ovaj dokument je strukturisan sažetak SVIH zahteva, korak po korak, po modulima.
> Plan implementacije: `IMPLEMENTACIJA_PLAN.md`.

---

## 0. Pregled projekta

Veb sistem **„Printing House"** — platforma za štamparije. Omogućava upravljanje resursima
i praćenje aktivnosti korisnika. Tri vrste korisnika:

| Tip | Opis |
|-----|------|
| **Klijent** | Fizičko ili pravno lice koje naručuje štampu |
| **Štampar** | Štamparija koja nudi proizvode i usluge štampe |
| **Administrator** | Upravlja korisnicima, kategorijama i statistikama |

**Tehnologije (opcija 2 iz zadatka):**
- Frontend: **Angular 20** (standalone komponente)
- Backend: **Express + NodeJS** (TypeScript)
- Baza: **MongoDB** (nije-relaciona)

**Važna pravila:**
- Bazu **ne kreira aplikacija** — inicijalno se kreira i puni nezavisno (Compass / import).
- Na odbranu se donosi baza popunjena sa dovoljno podataka (inače **−5 poena**).
- Vrednost: **maksimalno 30 poena**.
- AI alati: dozvoljeni za dizajn strana, **NE** za kompletnu arhitekturu ili server-side kod
  (odgovara se usmeno na odbrani).
- Dozvoljene biblioteke: PDF generisanje, slanje e-pošte, statistike/grafikoni, mape, spoljašnji API-ji.

---

## 1. Autentifikacija i registracija

### 1.1. Prijava (login)
- Svi korisnici se prijavljuju korisničkim imenom i lozinkom.
- Pogrešni podaci → prikazati odgovarajuću poruku.
- Klijenti i štampari: **javno vidljiva forma** na početnoj strani.
- Administrator: **posebna forma na posebnoj ruti/putanji** (nije javno vidljiva), ista polja.

### 1.2. Zaboravljena lozinka
- LNK ispod forme za prijavu → nova strana sa formom: korisničko ime **ili** i-mejl adresa.
- Korisnik dobija **veb link** za poništavanje lozinke i postavljanje nove.
- Link je **privremen**: važi **5 minuta** od trenutka zahteva.

### 1.3. Registracija — klijent fizičko lice (odmah aktivna)
Polja:
1. Korisničko ime — **jedinstveno na nivou svih korisnika**
2. Lozinka
3. Ime
4. Prezime
5. Kontakt telefon
6. I-mejl adresa — **jedinstvena** (najviše jedan nalog po i-mejlu)
7. Profilna slika (fajl)

### 1.4. Registracija — klijent pravno lice i štamparija (zahtev za odobrenje)
Pored osnovnih podataka (ista polja kao fizičko lice — ime/prezime = odgovorno lice), unose se:
- Naziv institucije
- Adresa sedišta
- **Matični broj** — tačno **8 cifara**, jedinstven za sve institucije
- **PIB** — **9 cifara**, jedinstven, **ne sme počinjati nulom**

Tok: ispravno uneti podaci (JavaScript provere) → kreira se **zahtev za registraciju** koji
**čeka odobrenje administratora**. Administrator prihvata ili odbacuje zahtev.
- Registracija novog administratora **nije potrebna**.

### 1.5. Lozinka — pravila
- Regex provera: **min 8, max 12 karaktera**, bar **jedno veliko slovo**, bar **jedan broj**,
  bar **jedan specijalni karakter**, mora **počinjati slovom**.
- U bazi lozinka **obavezno kriptovana** (hash).

### 1.6. Profilna slika
- Unosi se preko **FileUpload** prozora (nije prihvatljivo: ručno unete, eksterni linkovi).
- Minimalna veličina **100×100 px**, maksimalna **250×250 px**.
- Formati: **JPG / PNG / GIF**.
- Ako se ne doda → podrazumevana slika **`default_profile_image.jpg`** (već definisana u sistemu).

---

## 2. Neregistrovani korisnik — početna strana

1. Prikazati **ukupan broj registrovanih štamparija**.
2. Prikazati **TOP 5 najbolje ocenjenih štampanih proizvoda** po broju „sviđanja" (lajkova).
3. **Forma za pretragu:** naziv proizvoda (npr. „Hemijska olovka", „Polo majica") **i/ili**
   kategorija iz padajuće liste.
   - Lista inicijalno prikazuje **„Sve kategorije"**.
   - U listi su **samo kategorije** u kojima postoje **trenutno aktivni proizvodi na stanju**.
4. **Tabela rezultata** ispod forme, pored svakog rezultata dugme **„DETALJI"**.
5. **Sortiranje:** abecedno po nazivu proizvoda (opadajuće/rastuće) klikom na zaglavlje kolone.
6. **„DETALJI"** → strana sa detaljima proizvoda:
   - Naziv proizvoda, naziv štamparije, grad
   - Broj „sviđanja"/„nesviđanja"
   - **Galerija**: glavna slika + opciono najviše **3 dodatne manje slike (thumbnail)**
   - Thumbnail se može uvećati — uvek se prikazuje **izabrana slika**
   - Izabrana slika se pamti u **kolačiću (cookie)** pregledača kao trenutna glavna slika za taj proizvod

---

## 3. Klijent (fizičko i pravno lice)

Nakon prijave, klijent kroz glavni meni pristupa:

### 3.1. Profil
- Pregled i ažuriranje ličnih podataka — **zabranjena promena korisničkog imena**.
- Ažuriranje uključuje promenu profilne slike.
- **Druga tabela** ispod ličnih podataka: **sve prethodne i trenutno aktuelne (nerealizovane) narudžbine**,
  sa sortiranjem.
- Kolone: **ID fakture** | naziv štamparije | grad | numerisani proizvodi (u zagradi količina) |
  ukupan iznos fakture (u dinarima) | opciono dugme **„Otkaži"**.
- „Otkaži" **samo** za narudžbine gde: nije započeta štampa i status je **„naruceno"**.

**Statusi narudžbina (sekvenca):**
```
„naruceno" => [„placeno"] => „u stampi" => „isporuceno" => „primljeno"
```
> „placeno" se realizuje samo ako se implementira veb servis za plaćanje.

### 3.2. Pretraga proizvoda
- Ista forma kao kod neregistrovanog korisnika (naziv i/ili kategorija), tabela rezultata + „DETALJI".
- **„DETALJI"** → strana sa **proširenim informacijama** (za razliku od javne strane):
  - Dugi opis proizvoda
  - Cena po komadu
  - **Boja** iz padajuće liste (ako nema boja → podrazumevano **bela**)
  - **Vrste štampe** koje se mogu izvršiti na proizvodu (npr. Preslikač, Digitalna FLEKS štampa,
    Direktna štampa na tekstil...) sa **maksimalnim dimenzijama** i **dodatnom cenom po komadu**
  - **Mapa** gde se štamparija nalazi (ispod naziva štamparije)

### 3.3. Priprema proizvoda (strana „priprema")
- Dugme **„DALJE"** na strani detalja → strana pripreme proizvoda.
- Korisnik unosi:
  - **Tekst** ili postavlja **sličicu** (JPG/PNG/GIF) koja se **renderuje na samoj slici proizvoda**
    (dozvoljeno: HTML5 Canvas ili CSS preklapanje `position: absolute/relative`)
  - **Količina** (broj komada)
- Dugme **„DODAJ U KORPU"** → ubacuje u e-korpu.
- Dodatna dugmad: **„PONIŠTI"** (vraća stranu pripreme na inicijalno stanje) i
  **„NAZAD"** (vraća na stranu detalja proizvoda).
- U pretrazi se **ne pojavljuju** proizvodi kojih nema na stanju.
- Ako se naruči više nego što ima na lageru → upozorenje:
  **„Nema dovoljno proizvoda trenutno na stanju"**.

### 3.4. E-korpa (trenutna elektronska korpa)
- **Grupisanje po štatmparijama** — svi naručeni proizvodi sa: pun naziv, količina, tip štampe,
  ukupna cena za taj proizvod.
- **„POTVRDI"** → formira se **više faktura prema broju štamparija** (npr. 3 štamparije = 3 fakture).
- Status narudžbina (bez plaćanja): **„naruceno"** dok ih štamparija ne prebaci u **„u stampi"**.
- Nakon formiranja, **fakturu/e dostaviti kao PDF fajl(ove) klijentu na i-mejl**.

### 3.5. Plaćanje (opciono — samo ako se radi veb servis za plaćanje)
- Nakon „POTVRDI" → besplatan servis za plaćanje (**Stripe Test Mode** ili **Sandbox PayPal Developer**).
- Polja: tip kartice, broj kartice, **CVC** kod, **datum isticanja (MM/GG)**.
- Uspešno plaćanje → međustatus **„placeno"** između „naruceno" i „u stampi".
- Neuspešno → poruka, ponavlja se korak plaćanja.

### 3.6. Javne nabavke (samo klijent — pravno lice)
- Dodatna veb strana **„Javne nabavke"**.
- Umesto faktura pri potvrdi e-korpe → formira se **poziv za podnošenje ponuda** (licitacija),
  koji **traje 10 minuta**.
- **Svim štamparijama** stiže i-mejl: otvorena je licitacija za javnu nabavku + lista potrebnih proizvoda.
- **Nakon isteka vremena:** štamparija sa **najnižom ukupnom ponudom** za sve proizvode **i dovoljnom
  količinom svakog proizvoda na stanju** dobija nabavku.
- Tada se proizvodi fakturišu i status narudžbine je **„u stampi"**.
- **Napomena (fusnota 6):** NIJE potrebno realizovati tajmer u bazi ni WebSocket/Background job.
  Pri **sledećoj prijavi** ustanove koja je raspisala nabavku proveriti da li je prošao interval i
  zaključiti sve pristigle ponude izborom najbolje.

### 3.7. Arhiva proizvoda
- Veb strana **„Arhiva proizvoda"**:
  - Svi proizvodi u statusu **„Primljeno"**.
  - U istoj listi i proizvodi sa statusom **„Isporučeno"** — klijent ih može prebaciti u **„Primljeno"**.
- Sortiranje: **po datumu naručivanja** (izdavanja fakture) podrazumevano, ali i po:
  nazivu proizvoda, količini, štampariji od koje je nabavljen.
- Za svaki **primljen** proizvod klijent može:
  - ostaviti **„sviđanje"** (lajk) ili **„nesviđanje"** (dislajk)
  - ostaviti **komentar**
- Na strani detalja proizvoda vidi se: broj sviđanja/nesviđanja + **poslednjih 5 komentara** svih
  klijenata (**korisničko ime, datum, tekst**).
- **Komentare koje je on ostavio** uokviriti diskretnom linijom u **narandžastoj boji**.

---

## 4. Štampar

### 4.1. Profil
- Isto kao klijent: pregled/ažuriranje ličnih podataka (bez promene korisničkog imena), promena profilne slike.

### 4.2. Proizvodi i usluge
- Dodavanje proizvoda u **predefinisane kategorije i potkategorije** iz baze:

| Kategorija | Potkategorije (primeri) |
|-----------|------------------------|
| **Štampa malih formata** | Olovke, vizit karte, flajeri, zahvalnice, pozivnice, fascikle... |
| **Štampa velikih formata** | Posteri, rollups, foto-tapete |
| **Kreativne štampe** | Šolje, štampa na majicama, štampa na duksericama, štampa na cegerima |

- **Usluge** = specijalizovani tipovi štampe ili preslikača koji **povećavaju cenu po proizvodu**.
- Pri dodavanju proizvoda: **jedinična cena** + svi relevantni podaci + **slika/e proizvoda**.
- Uz proizvod se definišu i **usluge koje se nude**.

### 4.3. Ažuriranje količina
- Za sve postojeće proizvode može se promeniti **količina**.

### 4.4. Dodavanje iz fajla
- Učitavanje **JSON fajla** sa lager listom → postavljaju se definisani proizvodi i usluge za njih.
- U **dodatnom koraku** nakon učitavanja fajla dodati **slike**.
- Format fajla: **Prilog 1** (videti u originalnoj specifikaciji / `primer-proizvodi.json`).

### 4.5. Naručeni proizvodi
- Za proizvode naručene od strane klijenata **fizičkih lica**, štampar može prebacivati status:
  **„naruceno" → „u stampi" → „isporuceno"**.

### 4.6. Licitacije (javne nabavke)
- Za proizvode naručene od **pravnih lica**, štampar može u definisanom vremenskom intervalu
  proslediti **zvanične ponude** za otvorene javne nabavke.
- Svaka javna nabavka ima: **ID**, **datum i vreme raspisivanja**, **potrebne proizvode i količine**.
- Štampar šalje **jednu ponudu** (sa svim traženim proizvodima) po javnoj nabavci.

### 4.7. Izveštavanje
- Nakon završetka licitacije, svaka ustanova (štamparija) u svom odeljku za javne nabavke dobija
  **PDF izveštaj** o: svim poslatim ponudama + onoj koja je dobila javnu nabavku (najniži iznos).

---

## 5. Administrator sistema

### 5.1. Upravljanje korisnicima
- Pregled, ažuriranje i **brisanje** svih korisničkih naloga.
- **Odobravanje zahteva za registraciju** klijenata i štampara: poseban tabelarni pregled svih
  **neodobrenih** korisnika → prihvatanje ili odbijanje.

### 5.2. Upravljanje kategorijama
- Dodavanje **nove kategorije** i unutar nje **potkategorija**.

### 5.3. Statistike (grafikoni)
1. **Stubičasti (bar) grafikon:** opadajuća lista štamparija sa **najvećim prometom ka klijentima
   u poslednjem kvartalu (3 meseca)**.
2. **Pita (pie) grafikon:** proizvodi **najčešće naručivani u poslednjih mesec dana**
   (po količini/procentu učešća u svim proizvodima).
3. **Linijski (line) grafikon:** kretanje **ocene proizvoda u zavisnosti od vremena**
   (sa mogućnošću **isključivanja pojedinih proizvoda** iz prikaza).

---

## 6. Opšti zahtevi aplikacije

1. **Otpornost na neispravne podatke** — svaki vid server-side validacije što efikasnije.
2. **Uniforman izgled** — CSS; svaka strana ima **meni**, **header** i **footer**.
3. **Povratak na početni ekran** sa korisničkim opcijama na svim ekranima (ukoliko nema uvek vidljivog menija).
4. **Link „Izloguj se"** na svim ekranima (vodi na početni ekran za prijavu).
5. **Responsive dizajn** — prilagodljivo manjim i većim ekranima; testirati u **najmanje 3 pregledača**.

---

## 7. Prilog 1 — Struktura JSON fajla za unos proizvoda

```json
{
  "stampaorijaId": "stampa_001",
  "nazivStamparije": "Copy Studio Kumanovska",
  "proizvodi": [
    {
      "sifra": "PR-001",
      "naziv": "Pamucna Polo Majica",
      "opis": "Kvalitetna pamučna polo majica 180g/m2, ...",
      "kategorija": "Kreativne štampe",
      "potkategorija": "Štampa na majicama",
      "jedinicnaCena": 1200.00,
      "kolicinaNaLageru": 150,
      "dostupneBoje": ["Bela", "Crna", "Tamno plava", "Siva"],
      "slikaUrl": "",
      "dodatneSlike": [],
      "uslugeStampe": [
        {
          "idUsluge": "USL-01",
          "tipStampe": "Direktna štampa na tekstil (DTG)",
          "dodatnaCenaPoKomadu": 350.00,
          "maxSirinaMm": 300,
          "maxVisinaMm": 400
        }
      ]
    }
  ]
}
```

> Pun primer: `PIA_PROJEKAT/primer-proizvodi.json`

---

## 8. Kontrolna lista (checklist) za praćenje

### Autentifikacija
- [ ] Login klijent/štampar (javna forma)
- [ ] Login administrator (posebna ruta)
- [ ] Registracija fizičko lice (odmah aktivna)
- [ ] Registracija pravno lice / štamparija (zahtev + odobrenje)
- [ ] Validacije: korisničko ime, i-mejl, lozinka regex, matični broj (8 cifara), PIB (9 cifara, ne počinje 0)
- [ ] Lozinka hash u bazi
- [ ] Profilna slika (FileUpload, 100–250px, JPG/PNG/GIF, default slika)
- [ ] Zaboravljena lozinka (privremeni link, 5 min)

### Javni deo
- [ ] Broj štamparija + TOP 5 proizvoda na početnoj strani
- [ ] Pretraga po nazivu i/ili kategoriji (samo aktivni proizvodi na stanju)
- [ ] Sortiranje po nazivu (↑/↓)
- [ ] Detalji proizvoda: galerija (1 glavna + do 3 thumbnails), izbor slike u cookie

### Klijent
- [ ] Profil (izmena podataka + slika, bez korisničkog imena)
- [ ] Tabela narudžbina (kolone + „Otkaži" za status „naruceno")
- [ ] Pretraga + prošireni detalji (opis, cena, boja, vrste štampe, mapa)
- [ ] Strana pripreme (tekst/sličica preko slike, količina, DODAJ U KORPU / PONIŠTI / NAZAD)
- [ ] Provera lagera („Nema dovoljno proizvoda trenutno na stanju")
- [ ] E-korpa grupísana po štamparijama + POTVRDI
- [ ] Fakture (jedna po štampariji) + PDF na i-mejl
- [ ] (Opc.) Plaćanje: Stripe/PayPal test mode + status „placeno"
- [ ] Javne nabavke (pravno lice): licitacija 10 min, e-mejl štamparijama, izbor najbolje ponude
- [ ] Arhiva proizvoda: „Isporučeno" → „Primljeno", sortiranja, lajk/dislajk + komentari (5 poslednjih, narandžasti okvir za svoje)

### Štampar
- [ ] Profil
- [ ] Dodavanje proizvoda + usluga (kategorije/potkategorije iz baze)
- [ ] Ažuriranje količina
- [ ] JSON import (Prilog 1) + korak za slike
- [ ] Statusi narudžbina fizičkih lica: „naruceno" → „u stampi" → „isporuceno"
- [ ] Licitacije: pregled javnih nabavki, slanje jedne ponude po nabavci
- [ ] PDF izveštaj o ponudama i pobedniku

### Administrator
- [ ] CRUD korisnici + pregled neodobrenih + prihvatanje/odbijanje
- [ ] Kategorije i potkategorije
- [ ] Bar grafikon (promet po štamparijama, kvartal)
- [ ] Pita grafikon (najčešće naručivani proizvodi, mesec dana)
- [ ] Linijski grafikon (ocena proizvoda kroz vreme, isključivanje proizvoda)

### Opšte
- [ ] Server-side validacija
- [ ] Uniforman CSS, header/footer/menu na svim stranama, „Izloguj se"
- [ ] Responsive dizajn + test u 3 pregledača
- [ ] Baza popunjena sa dovoljno podataka za odbranu