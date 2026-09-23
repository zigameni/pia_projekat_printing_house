import { Jimp } from 'jimp'
import fs from 'fs'

// Provera dimenzija slike (100-250 px) — vraća true/false
export const proveriDimenzijeSlike = async (putanja: string): Promise<boolean> => {
    try {
        const slika = await Jimp.read(putanja)
        return slika.width >= 100 && slika.width <= 250 &&
               slika.height >= 100 && slika.height <= 250
    } catch (err) {
        return false
    }
}

// Bezbedno brisanje fajla (kada upload treba odbaciti)
export const obrisiFajl = (putanja: string | undefined) => {
    if (putanja) fs.unlink(putanja, () => { })
}