# Prompti za slike proizvoda (seed)

Ovaj dokument sadrži gotove prompte za generisanje **glavne slike (`slikaUrl`)** za svih 9 proizvoda
koji se nalaze u `backend/src/seed.ts`.

Prompti su **na engleskom** jer generatori slika (Midjourney, DALL·E, Stable Diffusion, Leonardo…)
daju znatno bolje rezultate na engleskom. Naslovi i objašnjenja su na srpskom, kao i ostatak dokumentacije.

---

## 1. Kako se koristi

1. Generiši sliku pomoću **zajedničkog stila** (odeljak 2) + **opisa proizvoda** (odeljak 3).
2. Sačuvaj je u `PIA_PROJEKAT/backend/uploads/` pod imenom iz tabele (npr. `PR-001.jpg`).
3. U `seed.ts` postavi `slikaUrl` na **relativnu putanju**, npr. `"uploads/PR-001.jpg"`.
   *(Frontend sam dodaje `http://localhost:4000/` preko `slikaPutanja()`.)*
4. Pokreni seed ponovo: `cd backend && npm run build && node dist/seed.js`.

> **Važno:** trenutno **ne postoji UI za dodavanje slika** — to dolazi u Fazi 7 (`/dodajSlike`).
> Do tada se slike dodaju ručno (korak 2–4). Zato i `slikaUrl` u seedu stoji kao `""`.

**Tehnički zahtevi** (isti kao u `upload.ts`):

| Pravilo | Vrednost |
|---|---|
| Format | JPG, PNG ili GIF |
| Maksimalna veličina | 5 MB |
| Preporučena rezolucija | **1000 × 1000 px** (kvadrat, 1:1) |
| Preporučeni format fajla | `.jpg` |

> Napomena: `proveriDimenzijeSlike` (provera 100–250 px) važi **samo za profilne slike korisnika**.
> Slike proizvoda nisu njome ograničene — zato su 1000 × 1000 px ispravna veličina za njih.

---

## 2. Zajednički stil (nalepi ispred svakog opisa)

Ovaj deo je isti za sve proizvode i daje katalogu **ujednačen izgled** (isto svetlo, ista pozadina,
ista perspektiva). Ako generator dozvoljava samo jedan prompt, spoji ga sa opisom iz odeljka 3.

```text
Professional e-commerce product photograph, single centered subject,
seamless light grey studio background with a soft vertical gradient,
gentle diffused softbox lighting from the upper left, subtle soft shadow
directly under the product, sharp focus, crisp detail, photorealistic,
square 1:1 composition, generous empty margin around the product,
catalogue style, no text, no lettering, no watermark, no brand logo,
no people, no hands, no extra props, no clutter
```

**Negativni prompt** (za Stable Diffusion / Leonardo):

```text
text, letters, numbers, words, typography, watermark, signature, logo,
blurry, low resolution, jpeg artifacts, distorted proportions, extra objects,
busy background, harsh shadows, reflections of a room, people, hands, faces
```

> **Zašto „no text":** generatori slika pouzdano *ne* umeju da napišu čitljiv tekst — dobije se
> izmišljeno slovo-šlovo. Zato su svi „štampani" proizvodi opisani kao prazni ili sa apstraktnim
> oblicima. To je i realno: prazan proizvod = podloga na koju klijent stavlja svoj dizajn.

**Ako želiš varijante u drugoj boji** (proizvodi imaju polje `dostupneBoje`), najlakše je dodati npr.:
`keep the identical composition, lighting and background, only change the garment colour to grey`.
Meni na strani detalja prikazuje samo **jednu** glavnu sliku, pa je varijanta korisna samo za
`dodatneSlike` (galerija — dolazi u Fazi 9).

---

## 3. Prompti po proizvodu

### PR-001 — Pamucna Polo Majica

| | |
|---|---|
| Štamparija | Copy Studio Kumanovska (Beograd) |
| Kategorija | Kreativne štampe / Štampa na majicama |
| Boje | Bela, Crna, Tamno plava, Siva |
| Cena | 1200 RSD |
| Fajl | `PR-001.jpg` |

```text
a single plain white cotton piqué polo shirt, 180 gsm, short sleeves,
ribbed folded collar, three-button placket with pearl buttons,
displayed on an invisible mannequin so it holds a natural worn shape,
crisp clean woven fabric texture with visible piqué weave,
sleeves relaxed, no prints and no embroidery
```

*Varijante boja:* `…only change the shirt colour to black / dark navy blue / grey`.

---

### PR-002 — Keramička šolja 330ml

| | |
|---|---|
| Štamparija | Copy Studio Kumanovska (Beograd) |
| Kategorija | Kreativne štampe / Šolje |
| Boje | Bela |
| Cena | 320 RSD |
| Fajl | `PR-002.jpg` |

```text
a single plain glossy white ceramic mug, 330 ml, classic cylindrical body
with a smoothly rounded handle on the right side, high-gloss glaze with a
soft elongated specular highlight running down the left of the body,
perfectly clean empty surface, no print and no decoration
```

---

### PR-003 — Promotivni Roll-up Baner 85x200cm

| | |
|---|---|
| Štamparija | Copy Studio Kumanovska (Beograd) |
| Kategorija | Štampa velikih formata / Rollups |
| Boje | Bela, Crna |
| Cena | 4500 RSD |
| Fajl | `PR-003.jpg` |

```text
a fully extended roll-up banner stand, 85 x 200 cm, slim silver anodized
aluminium cassette base with two small swivel feet, thin telescopic
support pole at the back, tall blank white matte banner fabric stretched
tight with a subtle gentle curl along the top edge, a small black padded
carry bag lying on the floor beside the base
```

> Baner je visok i uzak — za kvadratnu kompoziciju traži `portrait orientation, product
> centered with equal empty space above and below`.

---

### GPR-001 — Hemijska olovka

| | |
|---|---|
| Štamparija | Grafika Art Print (Novi Sad) |
| Kategorija | Štampa malih formata / Olovke |
| Boje | Crna, Plava, Crvena |
| Cena | 45 RSD |
| Fajl | `GPR-001.jpg` |

```text
a single classic ballpoint pen with a matching snap-on cap, glossy black
plastic barrel, slim silver metal pocket clip and a small silver writing
tip, laid diagonally across the frame, cap closed and aligned,
clean uniform barrel with no print and no engraving
```

*Varijante boja:* `…only change the pen barrel colour to blue / red`.

---

### GPR-002 — Vizit karta

| | |
|---|---|
| Štamparija | Grafika Art Print (Novi Sad) |
| Kategorija | Štampa malih formata / Vizit karte |
| Boje | Bela, Bež, Crna |
| Cena | 8 RSD |
| Fajl | `GPR-002.jpg` |
| **Napomena** | `aktivan: false` — proizvod se **ne prikazuje** u pretrazi (namerno, za test). Slika mu ipak treba ako ćeš ga kasnije aktivirati. |

```text
a neat stack of premium business cards, 90 x 55 mm, 350 gsm card stock
with a soft matte lamination, the stack fanned slightly so the crisp
layered edges are clearly visible, the top card lying face up and
completely blank, warm off-white card colour
```

---

### GPR-003 — Poster A3

| | |
|---|---|
| Štamparija | Grafika Art Print (Novi Sad) |
| Kategorija | Štampa velikih formata / Posteri |
| Boje | Bela |
| Cena | 250 RSD |
| Fajl | `GPR-003.jpg` |

```text
a single A3 poster, 297 x 420 mm, printed on matte photo paper,
standing upright on a slim minimalist black wooden easel inside a thin
black metal frame, the print shows only a clean abstract composition of
soft flat geometric colour blocks in muted blue, sand and warm grey,
absolutely no text and no lettering
```

---

### CPR-001 — Flajer A5

| | |
|---|---|
| Štamparija | Štamparija Centar (Niš) |
| Kategorija | Štampa malih formata / Flajeri |
| Boje | Bela, Siva |
| Cena | 12 RSD |
| Fajl | `CPR-001.jpg` |

```text
a tidy stack of A5 flyers, 148 x 210 mm, 135 gsm glossy coated paper,
stacked in a slightly fanned arrangement so the individual glossy sheets
and their layered edges are visible, the top flyer completely blank
bright white with a soft sheen catching the light
```

---

### CPR-002 — Pamučni duks

| | |
|---|---|
| Štamparija | Štamparija Centar (Niš) |
| Kategorija | Kreativne štampe / Štampa na duksericama |
| Boje | Crna, Siva |
| Cena | 1800 RSD |
| Fajl | `CPR-002.jpg` |

```text
a single plain black cotton hoodie, 280 gsm heavy brushed fleece,
with a hood and flat drawstrings, a kangaroo front pocket, and ribbed
cuffs and hem, displayed on an invisible mannequin so it holds a natural
worn shape, soft fleece texture visible in the folds, no print and no
embroidery
```

*Varijanta boje:* `…only change the hoodie colour to heather grey`.

---

### CPR-003 — Štamparski ceger

| | |
|---|---|
| Štamparija | Štamparija Centar (Niš) |
| Kategorija | Kreativne štampe / Štampa na cegerima |
| Boje | Bela, Crna |
| Cena | 150 RSD |
| Fajl | `CPR-003.jpg` |

```text
a single natural cream canvas tote bag with two long flat handles,
sturdy cotton canvas weave with a visible texture, gusseted sides,
standing upright and slightly filled so the shape and volume read
clearly, completely blank with no print
```

---

## 4. Preporučeni redosled i prioritet

Ako ne želiš da generišeš svih 9 odjednom, ovo je najkorisniji redosled — pokriva sve tri kategorije
i sve tri štamparije:

1. **PR-001** (Polo majica) — TOP 5 proizvod sa 4 👍, prvi koji se vidi na početnoj
2. **GPR-001** (Hemijska olovka) — TOP 5, druga štamparija, druga kategorija
3. **PR-002** (Šolja) — TOP 5, ima i komentare
4. **CPR-002** (Duks) — jedini proizvod iz otvorene javne nabavke `JN-2026-002`
5. **PR-003**, **GPR-003**, **CPR-001**, **CPR-003** — popunjavaju ostatak tabele
6. **GPR-002** (Vizit karta) — najniži prioritet, jer je `aktivan: false`

---

## 5. Ako slika ipak ne treba generatoru

Slike se mogu i samo **preuzeti** sa besplatnih stock sajtova (Unsplash, Pexels, Pixabay) — za
katalog je i to sasvim u redu. U tom slučaju traži po istim ključnim rečima kao u naslovima
odeljka 3 (`white polo shirt product photo white background`, `blank ceramic mug studio`, …),
pa primeni iste tehničke zahteve iz odeljka 1 (1:1, JPG, < 5 MB).
