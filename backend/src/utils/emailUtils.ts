import nodemailer, { Transporter } from 'nodemailer'

// ==== Slanje i-mejla ====
//
// Podrazumevano se koristi Ethereal — besplatan SMTP servis za testiranje. Nalog se pravi
// u letu (`createTestAccount`). Ranije su ovde stajali placeholder podaci
// (test@ethereal.email / testpassword), pa je `sendMail` pucao, a greška se samo logovala
// i pošta nikada nije odlazila — to je bio nalaz **N-3**.
//
// VAŽNO: Ethereal NE dostavlja poštu na pravu adresu primaoca. Poruka se prihvata i može se
// pogledati preko `getTestMessageUrl`. Za stvarnu dostavu pokrenuti server sa pravim SMTP
// podacima (npr. Gmail uz „app password"):
//   SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... node dist/server.js

let transporterPromise: Promise<Transporter> | null = null

// Transporter se pravi jednom i kešira — Ethereal nalog se kreira samo pri prvom slanju
function napraviTransporter(): Promise<Transporter> {
    // 1) Pravi SMTP, ako su podaci prosleđeni kroz okruženje
    if (process.env.SMTP_HOST) {
        console.log('I-mejl: koristi se SMTP iz okruženja (' + process.env.SMTP_HOST + ')')
        return Promise.resolve(nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE == 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        }))
    }

    // 2) Inače Ethereal test nalog
    return nodemailer.createTestAccount().then((test) => {
        console.log('I-mejl: napravljen Ethereal test nalog ' + test.user)
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: test.user, pass: test.pass }
        })
    })
}

function dobaviTransporter(): Promise<Transporter> {
    if (!transporterPromise) transporterPromise = napraviTransporter()
    return transporterPromise
}

export async function posaljiFakturuEmail(
    emailPrimaoca: string,
    nazivPrimaoca: string,
    idFakture: string,
    pdfBuffer: Buffer
): Promise<boolean> {
    try {
        const transporter = await dobaviTransporter()

        const info = await transporter.sendMail({
            from: '"Printing House" <noreply@printing-house.rs>',
            to: emailPrimaoca,
            subject: `Faktura ${idFakture} - Printing House`,
            text: `Poštovani ${nazivPrimaoca},\n\nPriloženu fakturu ${idFakture} možete pogledati u prilogu.\n\nSrdačan pozdrav,\nPrinting House`,
            attachments: [{
                filename: `faktura_${idFakture}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        })

        console.log(`Email poslat na ${emailPrimaoca} za fakturu ${idFakture}`)

        // Ethereal ne dostavlja poštu primaocu, ali daje link gde se poslata poruka vidi u pregledaču
        const pregled = nodemailer.getTestMessageUrl(info)
        if (pregled) console.log(`Pregled poslatog i-mejla: ${pregled}`)

        return true
    } catch (err) {
        console.log(`Greška pri slanju emaila za fakturu ${idFakture}:`, err)
        return false
    }
}
