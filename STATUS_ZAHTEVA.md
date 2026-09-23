# Статус минималних захтева — детаљна провера

> Провера: **2026-09-22**. Извор: [`minimalni_zahtevi.md`](minimalni_zahtevi.md) (30 ставки).
> Стање кода: завршене и комитоване фазе **0–6** (HEAD `1a37d51`), плус неке некомитоване дораде
> (навигација, сортирање, модели, проширена претрага). **Фазе 7 и 8 нису започете.**
>
> Ознаке: ✅ урађено · ⚠️ делимично · ❌ није урађено · 🔴 необавезна ставка
>
> ⚠️ **Ажурирано 2026-09-23:** ставке ниже су допуњене новијим стањем — **Фазе 7 и 8 су завршене**
> (#14–#16 и #18–#20). Од обавезних ставки **не остаје ниједна**; од необавезних су остале само
> #8 (JSON import) и #10 (статистике/графикони). **#6** (ПДФ на и-мејл) је затворена 2026-09-23.
> Бројеви endpoint-а и рута у секцији 6 су такође промењени (види допуну на крају те секције).

---

## 1. Како је проверавано

Статус **није преписан из плана** — проверен је читањем кода, јер се план и код на једном месту
разликују (види напомену у секцији 5).

- Прочитани су **сви рутери** (`backend/src/routers/`) → инвентар од **26 endpoint-а** (секција 6).
- Прочитане су **све 4 компоненте** релевантне за спорне ставке (`profil`, `proizvodDetalji`,
  `pocetna`, `registracija`) и `app.routes.ts`, `seed.ts`, `emailUtils.ts`, `komentariController`,
  `korpaController`, `nabavkeController`.
- Проверено је шта **не постоји**: `zaboravljenaLozinka`/`promeniLozinku`, `otkaziNarudzbinu`,
  било који `admin` или `stampar` endpoint, `canvas`/`sličica`/унос текста у фронтенду, `stripe`/`paypal`.

---

## 2. Резиме

| Група | Укупно | ✅ | ⚠️ | ❌ |
|---|---|---|---|---|
| **Обавезне ставке** | **20** | **19** | **0** | **1** |
| Необавезне („није обавезна") | 10 | 0 | 1 | 9 |
| **Све заједно** | **30** | **19** | **1** | **10** |

> **Ажурирано 2026-09-22:** затворени су налази **N-1** (#6 и #13 — приказ и ажурирање профила),
> **N-2** (#9 — унос текста за штампу), а у оквиру **Фазе 7** су затворене **#14**
> (додавање производа и услуга штампе), **#15** (ажурирање количина) и **#16** (промена статуса
> наруџбина) — тиме су све обавезне ставке Фазе 7 завршене. У **Фази 8** су затворене **#18**
> (управљање корисничким налозима) и **#19** (обрада захтева за регистрацију).
> **Нема више делимичних обавезних ставки.**

**Кључни закључак:** сви обавезни делови за **јавни део, клијента, штампapa-лицитације и
аутентификацију су готови**. Оно што недостаје није разбацано — то су тачно **две фазе**:

- **Фаза 7 — ЗАВРШЕНА** (све 3 обавезне ставке: #14, #15, #16); остаје само необавезна #8 (JSON import)
- **Фаза 8 — ЗАВРШЕНА** (делови 1–3: #18 кориснички налози, #19 захтеви за регистрацију, #20 категорије) — **нема више обавезних ставки**
- **Нема више делимичних обавезних ставки** — N-1 и N-2 су затворени 2026-09-22.

Фазе 7 и 8 су завршене → **свих 20 обавезних ставки је испуњено** (минимални праг од 15 поена пређен).

---

## 3. Обавезне ставке (20)

| # | Ставка | Статус | Доказ у коду | Шта недостаје |
|---|---|---|---|---|
| 1 | Пријава корисника | ✅ | `POST /login`, `POST /loginAdmin`; `login.ts`, `loginAdmin.ts` | — |
| 2 | Регистрација свих типова корисника | ✅ | `POST /registracijaFizickoLice` / `…PravnoLice` / `…Stampara` | — |
| 3 | Укупан број штампарија + ТОП 5 | ✅ | `GET /brojStamparija`, `GET /top5Proizvoda`; `pocetna.ts` | — |
| 4 | Претрага по више параметара + сортирање | ✅ | `GET /pretragaProizvoda` (назив, категорија, **град**, **штампарија**), `GET /kategorijeZaPretragu`, `GET /gradoviIStamparije`; сортирање по називу **и цени** | — (проширено изнад минимума) |
| 5 | Детаљи производа (са једном сликом) | ✅ | `GET /detaljiProizvoda/:sifra`, `GET /detaljiProizvodaKlijent/:sifra`; `proizvodDetalji.html` | Функционално ради, али **у seed-у су сви `slikaUrl` празни** → приказује се резервни приказ. Видљиво тек кад се додају слике |
| 6 | Приказ и ажурирање профила — **клијент** | ✅ | Приказ + **форма за измену** у `components/profil/` → `POST /azurirajProfil` (multipart, опциона нова слика) | — ✅ (N-1 решен 2026-09-22) |
| 7 | Табела са претходним и актуелним наруџбинама | ✅ | `GET /narudzbineKlijenta`; `profil.html` (2 табеле + сортирање) | — |
| 8 | Претраживање производа и детаљи — клијент | ✅ | `GET /detaljiProizvodaKlijent/:sifra` (боје, услуге штампе, подаци о штампарији) | — |
| 9 | Додавање услуге и текста за штампу | ✅ | Избор услуге + **поље „Tekst za štampu"** (`proizvodDetalji`, 500 карактера); текст се види у е-корпи, преноси у `stavke` фактуре и исписује у ПДФ-у | — ✅ (N-2 решен 2026-09-22) |
| 10 | Е-корпа — приказ и затварање наруџбине | ✅ | `POST /dodajUKorpu`, `GET /korpaKlijenta`, `POST /ukloniIzKorpe`, `POST /potvrdiKorpu`; `ekorpa` | — |
| 11 | Јавне набавке | ✅ | `POST /raspisiNabavku`, `GET /mojeNabavke`, `GET /otvoreneNabavke`, `POST /posaljiPonudu`; аутоматско затварање после 10 мин | — (ПДФ извештај је засебна 🔴 ставка) |
| 12 | Лајковање и коментарисање | ✅ | `POST /dodajKomentar`, `GET /komentariProizvoda`; 👍/👎 бројачи, сопствени коментар уоквирен | — |
| 13 | Приказ и ажурирање профила — **штампар** | ✅ | Исти дељени екран `/profil` (спец. 4.1: „исто као клијент") — форма приказује и додатна поља (институција, ПИБ, **град**) | — ✅ (N-1 решен 2026-09-22) |
| 14 | Производи и услуге — додавање | ✅ | `stamparController`: `/kategorije` (све преdef. категорије), `/proizvodiStamparije` (и неактивни), `/dodajProizvod` (multipart + услуге штампе); UI `components/mojiProizvodi/` + `stamparGuard` | — ✅ (2026-09-22) |
| 15 | Ажурирање количина | ✅ | `POST /azurirajKolicinu` (JSON `{stamparijaId, sifra, kolicinaNaLageru}`) — мења **само** количину, само производ тог штампара; у UI поље + „Сачувај количину“ у колони Количина на `/moji-proizvodi` | — ✅ (2026-09-22) |
| 16 | Наручени производи — промена статуса | ✅ | `GET /narudzbineStamparije` (фактуре штампара + `vrstaKlijenta` и `mozePromeniStatus` рачуна сервер), `POST /promeniStatusNarudzbine` (само `naruceno → u stampi → isporuceno`, само физичка лица); UI `components/stamparNarudzbine/` на `/narudzbine-stamparija` | — ✅ (2026-09-22) |
| 17 | Лицитације | ✅ | `GET /otvoreneNabavke`, `POST /posaljiPonudu`; `licitacije` | — |
| 18 | Управљање корисничким налозима | ✅ | `GET /sviKorisnici`, `POST /azurirajKorisnika` (подаци + статус + тип), `POST /obrisiKorisnika` (налог + корпа/ресет + производи штампара); UI `components/adminKorisnici/` на `/korisnici` + `adminGuard` | — ✅ (2026-09-23) |
| 19 | Обрада захтева за регистрацију | ✅ | `GET /neodobreniKorisnici` (само `na_cekanju`), `POST /odobriKorisnika` (→ `aktivan`), `POST /odbijKorisnika` (брише зајахтев, његову слику и приватне податке — ослобађа и-мејл, МБ и ПИБ); UI `components/zahteviZaRegistraciju/` на `/zahtevi-za-registraciju` | — ✅ (2026-09-23) |
| 20 | Управљање категоријама производа | ✅ | `adminController`: `GET /sveKategorije` (категорије + поткатегорије + број производа), `POST /dodajKategoriju`, `/dodajPotkategoriju`, `/obrisiKategoriju`, `/obrisiPotkategoriju` (брисање се одбија док ставку користи било који производ); UI `components/adminKategorije/` на `/kategorije` | — ✅ (2026-09-23) |

---

## 4. Необавезне ставке (10)

| # | Ставка | Статус | Коментар |
|---|---|---|---|
| 1 | Заборављена лозинка | ❌ | Модел `password_reset` постоји, али **нема endpoint-а ни екрана** |
| 2 | Галерија са додатним сликама | ❌ | Поље `dodatneSlike` постоји у моделу, али се **нигде не приказује** |
| 3 | Отказивање наруџбине („наручена") | ❌ | `otkaziNarudzbinu` не постоји; статусна машина само иде напред |
| 4 | Мапа где је штампарија | ❌ | **Подаци постоје** (адреса, град се приказују као текст у детаљима, Фаза 3) — недостаје само мапа |
| 5 | Припрема производа (сличица + приказ штампе на слици) | ❌ | **Backend и модел корпе већ подржавају `tekst` и `slika`** — недостаје само UI (Canvas/overlay) |
| 6 | Достављање ПДФ фактуре на и-мејл | ✅ | **Затворено 2026-09-23** (налази **N-3**, **N-15**, **N-16** решени). `emailUtils.ts` прави Ethereal налог у лету и кешира транспортер (или користи прави SMTP из `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASS`); `posaljiFakturuEmail` враћа `true`/`false`, `potvrdiKorpu` чека исход и враћа `emailPoslat`/`emailPrimaoca`, `ekorpa` приказује „📧 Фактура је послата на и-мејл: …". Уз то је исправљен и сам ПДФ: **„Шифра" је прва колона**, висина реда се мери из највише ћелије (нема преклапања), уграђени **Roboto** дају исправне дијакритике č/ć/ž/đ. ПДФ се и даље не чува за преузимање |
| 7 | Сервис за плаћање | ❌ | Није започето (нема `stripe`/`paypal` у коду) |
| 8 | Додавање из JSON фајла | ❌ | Фаза 7 је завршена без ове ставке; план остаје у `PIA_PROJEKAT/PLAN_FAZE_7.md` (`/importJSON`, формат `primer-proizvodi.json`) |
| 9 | Извештавање (ПДФ извештај о понудама) | ❌ | Није започето; Фаза 7 је завршена без ове ставке |
| 10 | Статистике у виду графикона | ❌ | Остаје ван обавезног обима; `chart.js` је **већ инсталиран** у Фази 0 |

**Прва необавезна ставка је затворена: #6 ПДФ фактура на и-мејл (2026-09-23)** — мејл стварно одлази
(налаз **N-3** решен), а ПДФ је притом исправљен (налази **N-15**/**N-16**) и документован у прилогу.
Од осталих, две имају „полугу" већ направљену (#4 подаци, #5 backend) — то су најјефтиније следеће победе.

---

## 5. Напомене и налази који утичу на статус

1. **Обавезна ставка #5 је „урађена", али се не види.** Свих 9 производа у `seed.ts` имају
   `slikaUrl: ""`, па детаљи приказују резервни блок. За одбрану/демонстрацију ово треба
   попунити — упутство и промпти су већ у [`PROMPTI_ZA_SLIKE_PROIZVODA.md`](PROMPTI_ZA_SLIKE_PROIZVODA.md).
2. **N-1 и N-2 су исте ставке као #6, #9 и #13** — нису „нови задаци", већ обавезне ставке које су
   биле полу-завршене. **Оба су решена 2026-09-22** — N-1 (#6, #13) и N-2 (#9).
3. **План прецењује Фазу 4.** `IMPLEMENTACIJA_PLAN.md` означава „страна припреме производа
   (текст/сличица преко слике — Canvas/CSS overlay)" као `[x]`, али у коду **не постоји ни `canvas`
   ни унос текста**, ни засебна компонента припреме. Реално стање = e-корпа ради, припрема не.
4. ~~**Статус `na_cekanju` се додељује, али нико га не одобрава**~~ **РЕШЕНО 2026-09-23** — администраторски
   екран `/zahtevi-za-registraciju` („📝 Zahtevi") приказује све неодобрене налоге са прихвати/одбиј;
   одобравање пребацује налог у `aktivan` и тај налог се одмах може пријавити. Затворена је обавезна ставка #19.
5. **N-4:** `/detaljiProizvoda/:sifra` не проверава `aktivan`, па се неактиван производ отвара
   директним URL-ом (козметички проблем, не утиче на статус).
6. **N-8:** `/raspisiNabavku` и `/licitacije` немају серверску проверу улоге (само guard на
   фронтенду) — за Фазу 9 („серверска валидација свих endpoint-а").
7. Секција **„ОСТАЛЕ КАРАКТЕРИСТИКЕ"** у захтевима је празна — и у `.md` и у изворном
   `minimalni zahtevi.txt` из git-а. Ништа није прескочено.

---

## 6. Инвентар endpoint-а (26) — доказ

| Рутер | Endpoint-и |
|---|---|
| `authRouter` (5) | `POST /login`, `POST /loginAdmin`, `POST /registracijaFizickoLice`, `POST /registracijaPravnoLice`, `POST /registracijaStampara` |
| `proizvodiRouter` (7) | `GET /brojStamparija`, `/top5Proizvoda`, `/kategorijeZaPretragu`, `/gradoviIStamparije`, `/pretragaProizvoda`, `/detaljiProizvoda/:sifra`, `/detaljiProizvodaKlijent/:sifra` |
| `korpaRouter` (4) | `POST /dodajUKorpu`, `POST /ukloniIzKorpe`, `GET /korpaKlijenta`, `POST /potvrdiKorpu` |
| `nabavkeRouter` (4) | `POST /raspisiNabavku`, `GET /otvoreneNabavke`, `POST /posaljiPonudu`, `GET /mojeNabavke` |
| `narudzbineRouter` (3) | `GET /narudzbineKlijenta`, `GET /arhivaProizvoda`, `POST /promeniStatusPrimljeno` |
| `komentariRouter` (2) | `POST /dodajKomentar`, `GET /komentariProizvoda` |
| `korisniciRouter` (1) | `POST /azurirajProfil` |

**Не постоји:** било који `admin*` endpoint, било који `stampar*` endpoint, `zaboravljenaLozinka`,
`promeniLozinku`, `otkaziNarudzbinu` — што се поклапа са статусом ставки #14–#20.

> **Допуна 2026-09-23 (стање после Фаза 7 и 8):** додата су **два нова домена** —
> `stamparRouter` (6) и `adminRouter` (**11**), па укупно има **43 endpoint-а** (не 26).
> `stamparRouter`: `GET /kategorije`, `GET /proizvodiStamparije`, `POST /dodajProizvod`,
> `POST /azurirajKolicinu`, `GET /narudzbineStamparije`, `POST /promeniStatusNarudzbine`.
> `adminRouter`: `GET /sviKorisnici`, `POST /azurirajKorisnika`, `POST /obrisiKorisnika`,
> `GET /neodobreniKorisnici`, `POST /odobriKorisnika`, `POST /odbijKorisnika`,
> `GET /sveKategorije`, `POST /dodajKategoriju`, `POST /dodajPotkategoriju`,
> `POST /obrisiKategoriju`, `POST /obrisiPotkategoriju`.
> Фронтенд сада има **15 рута**: претходнима су додати `/moji-proizvodi`, `/narudzbine-stamparija`,
> `/korisnici`, `/zahtevi-za-registraciju` и `/kategorije`.

Фронтенд руте (`app.routes.ts`): `/`, `/login`, `/admin`, `/registracija`, `/proizvod/:sifra`,
`/profil`, `/korpa`, `/arhiva`, `/nabavke`, `/licitacije` — **10 рута, 10 компоненти**.

---

## 7. Шта следи (по приоритету)

1. **Фазе 7 и 8 су завршене** — затворена је и **#20** (категорије: додавање и **безбедно брисање**).
   **Свих 20 обавезних ставки је испуњено (20/20).** Од необавезних су остале #8 (JSON import)
   и #10 (статистике/графикони — `chart.js` је већ инсталиран).
3. **Јефтине необавезне победе** (мали диф, велики ефекат на демонстрацији):
   слике производа (#5 видљивост), мапа (#4 — подаци већ постоје), галерија (#2 — поље постоји).
   **ПДФ на мејл (#6) је затворен 2026-09-23** (види ставку #6 у табели изнад).
4. **Фаза 9** — серверска валидација (N-8), responsive, 3 прегледача, попуњавање базе, одбрана.
