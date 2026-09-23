import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

// ==== Fontovi ====
// Standardni pdfkit fontovi (Helvetica) koriste WinAnsi kodiranje, koje ne sadrži
// č, ć, ž i đ — u PDF su izlazili besmisleni znakovi („KeramiÖ¶ ¦öÆ¦33ÖÀ" umesto
// „Keramička šolja 330ml"), a isto je pogađalo i imena klijenata („Marković").
// Zato se koristi Roboto (SIL Open Font License 1.1) iz `backend/assets/fonts/`.
// Ako fontovi nisu na mestu, kod se ne ruši: prelazi na Helvetiku i ta četiri
// slova transliteruje, da se nikad ne dobiju besmisleni znakovi.
const FONT_DIR = path.join(__dirname, '..', '..', 'assets', 'fonts')

const FONT_FAJLOVI = {
    redovan: 'Roboto-Regular.ttf',
    bold: 'Roboto-Bold.ttf',
    kurziv: 'Roboto-Italic.ttf'
}

type IzborFontova = { redovan: string; bold: string; kurziv: string; unicode: boolean }

let kesirano: IzborFontova | null = null

function izaberiFontove(): IzborFontova {
    if (kesirano) return kesirano

    const imaSve = Object.keys(FONT_FAJLOVI).every((k) =>
        fs.existsSync(path.join(FONT_DIR, FONT_FAJLOVI[k as keyof typeof FONT_FAJLOVI]))
    )

    kesirano = imaSve
        ? { redovan: 'Roboto', bold: 'Roboto-Bold', kurziv: 'Roboto-Italic', unicode: true }
        : { redovan: 'Helvetica', bold: 'Helvetica-Bold', kurziv: 'Helvetica-Oblique', unicode: false }

    if (!imaSve) {
        console.log(`PDF: fontovi nisu nađeni u ${FONT_DIR} — koristi se Helvetica (č/ć/ž/đ se transliteruju)`)
    }
    return kesirano
}

// Zamene za slučaj bez Unicode fonta (š i Š postoje i u WinAnsi kodiranju)
const TRANSLITERACIJA: Record<string, string> = {
    'č': 'c', 'ć': 'c', 'ž': 'z', 'đ': 'dj',
    'Č': 'C', 'Ć': 'C', 'Ž': 'Z', 'Đ': 'Dj'
}

function transliteruj(tekst: string): string {
    return tekst.replace(/[čćžđČĆŽĐ]/g, (slovo) => TRANSLITERACIJA[slovo] || slovo)
}

// ==== Izgled tabele stavki ====
// Kolone su „koraci" u tačkama; tekst se crta u okviru `sirina - RAZMAK_KOLONE`
// da se susedne kolone ne bi dodirivale. Zbir korakâ (532 pt) odgovara širini
// teksta stranice = 612 pt − 2 × 40 pt margine (pdfkit podrazumevano pravi Letter).
const KOLONE = [
    { naziv: 'Šifra', sirina: 52, desno: false },
    { naziv: 'Proizvod', sirina: 150, desno: false },
    { naziv: 'Boja', sirina: 62, desno: false },
    { naziv: 'Kol.', sirina: 42, desno: true },
    { naziv: 'Usluga', sirina: 122, desno: false },
    { naziv: 'Cena/kom', sirina: 52, desno: true },
    { naziv: 'Iznos', sirina: 52, desno: true }
]

const MARGINA = 40
const RAZMAK_KOLONE = 6
const VISINA_ZAGLAVLJA = 22
const RAZMAK_REDA = 7
const VELICINA_CELIJE = 9
const VELICINA_TEKSTA = 7
const LINIJA_REDA = '#dddddd'
const LINIJA_ZAGLAVLJA = '#888888'

export function generisiPdfFakturu(faktura: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: MARGINA })
        const chunks: Buffer[] = []

        doc.on('data', (chunk: Buffer) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        // Fontovi — registruju se na svaki dokument (pdfkit ih drži po dokumentu)
        const font = izaberiFontove()
        if (font.unicode) {
            doc.registerFont(font.redovan, path.join(FONT_DIR, FONT_FAJLOVI.redovan))
            doc.registerFont(font.bold, path.join(FONT_DIR, FONT_FAJLOVI.bold))
            doc.registerFont(font.kurziv, path.join(FONT_DIR, FONT_FAJLOVI.kurziv))
        }

        // Svaki tekst ide kroz ovu funkciju — bez Unicode fonta č/ć/ž/đ se transliteruju
        const tekst = (vrednost: any): string => {
            const s = String(vrednost === undefined || vrednost === null ? '' : vrednost)
            return font.unicode ? s : transliteruj(s)
        }

        const sirinaTabele = doc.page.width - MARGINA * 2
        const donjaGranica = doc.page.height - MARGINA * 1.5
        const sirinaCelije = (i: number) => KOLONE[i].sirina - RAZMAK_KOLONE

        // Zaglavlje
        doc.font(font.bold).fontSize(20).text(tekst('FAKTURA'), { align: 'center' })
        doc.moveDown(0.5)
        doc.font(font.redovan).fontSize(10)
            .text(tekst(`Broj fakture: ${faktura.idFakture}`), { align: 'right' })
        doc.text(tekst(`Datum: ${new Date(faktura.datumIzdavanja).toLocaleDateString('sr-Latn-RS')}`))
        doc.moveDown()

        // Podaci o štampariji
        doc.font(font.bold).fontSize(12).text(tekst('Štamparija:'))
        doc.font(font.redovan).fontSize(10)
        doc.text(tekst(`Naziv: ${faktura.nazivStamparije}`))
        doc.text(tekst(`Grad: ${faktura.grad}`))
        doc.moveDown()

        // Podaci o klijentu
        doc.font(font.bold).fontSize(12).text(tekst('Klijent:'))
        doc.font(font.redovan).fontSize(10)
        doc.text(tekst(`Ime: ${faktura.klijentIme}`))
        doc.moveDown()

        // Tabela stavki
        doc.font(font.bold).fontSize(12).text(tekst('Stavke:'))
        doc.moveDown(0.3)

        // Visina koju bi tekst zauzeo u datoj koloni — red se meri pre crtanja,
        // da višelinijske ćelije ne bi prešle u sledeći red
        const visinaTeksta = (sadrzaj: string, nazivFonta: string, velicina: number, sirina: number) => {
            doc.font(nazivFonta).fontSize(velicina)
            return doc.heightOfString(sadrzaj, { width: sirina })
        }

        const nacrtajZaglavlje = (y: number): number => {
            doc.font(font.bold).fontSize(VELICINA_CELIJE)
            let x = MARGINA
            for (let i = 0; i < KOLONE.length; i++) {
                doc.text(tekst(KOLONE[i].naziv), x, y, { width: sirinaCelije(i), align: KOLONE[i].desno ? 'right' : 'left' })
                x += KOLONE[i].sirina
            }
            doc.moveTo(MARGINA, y + VISINA_ZAGLAVLJA - 8)
                .lineTo(MARGINA + sirinaTabele, y + VISINA_ZAGLAVLJA - 8)
                .lineWidth(0.7).strokeColor(LINIJA_ZAGLAVLJA).stroke()
            doc.font(font.redovan)
            return y + VISINA_ZAGLAVLJA
        }

        let y = nacrtajZaglavlje(doc.y)

        // Redovi
        for (let s of faktura.stavke || []) {
            const red = [
                tekst(s.sifra),
                tekst(s.naziv),
                tekst(s.boja || '—'),
                tekst(s.kolicina),
                tekst(s.tipStampe || '—'),
                tekst(s.jedinicnaCena),
                tekst(s.iznos)
            ]

            // Visina reda se izračuna unapred iz najviše ćelije
            let visinaCelija = 0
            for (let i = 0; i < red.length; i++) {
                visinaCelija = Math.max(visinaCelija, visinaTeksta(red[i], font.redovan, VELICINA_CELIJE, sirinaCelije(i)))
            }

            // N-2: tekst za štampu stoji ISPOD ćelija svog reda (ranije se ispisivao preko njih)
            const tekstZaStampu = s.tekst ? tekst(`Tekst za štampu: ${s.tekst}`) : ''
            const visinaStampe = tekstZaStampu
                ? visinaTeksta(tekstZaStampu, font.kurziv, VELICINA_TEKSTA, sirinaTabele) + 2
                : 0

            const visinaReda = visinaCelija + visinaStampe + RAZMAK_REDA

            // Nova strana pre crtanja reda — red se ne sme prelomiti preko margine
            if (y + visinaReda > donjaGranica) {
                doc.addPage()
                y = nacrtajZaglavlje(MARGINA)
            }

            let x = MARGINA
            for (let i = 0; i < red.length; i++) {
                doc.font(font.redovan).fontSize(VELICINA_CELIJE)
                    .text(red[i], x, y, { width: sirinaCelije(i), align: KOLONE[i].desno ? 'right' : 'left' })
                x += KOLONE[i].sirina
            }

            if (tekstZaStampu) {
                doc.font(font.kurziv).fontSize(VELICINA_TEKSTA)
                    .text(tekstZaStampu, MARGINA, y + visinaCelija + 2, { width: sirinaTabele })
                doc.font(font.redovan)
            }

            // Tanki razdelni red — redovi mogu biti različite visine (prelomljeni nazivi),
            // pa je ovako jasno šta pripada kojoj stavci
            doc.moveTo(MARGINA, y + visinaReda - 3)
                .lineTo(MARGINA + sirinaTabele, y + visinaReda - 3)
                .lineWidth(0.5).strokeColor(LINIJA_REDA).stroke()

            y += visinaReda
        }

        // Ukupno — eksplicitna pozicija i širina, jer se ranije oslanjalo na to
        // gde je `doc.x` ostao posle poslednje kolone tabele
        if (y + 60 > donjaGranica) {
            doc.addPage()
            y = MARGINA
        }
        y += 12
        doc.font(font.bold).fontSize(12)
        doc.text(tekst(`UKUPNO: ${faktura.ukupanIznos} RSD`), MARGINA, y, { width: sirinaTabele, align: 'right' })

        // Footer
        doc.font(font.redovan).fontSize(8)
        doc.text(tekst('Printing House — Projekat iz PIA 2025/26'), MARGINA, y + 30, { width: sirinaTabele, align: 'center' })

        doc.end()
    })
}
