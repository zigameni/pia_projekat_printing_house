import multer from 'multer'
import path from 'path'
import fs from 'fs'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('uploads')) fs.mkdirSync('uploads', { recursive: true })
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext)
    }
})

// Zajednički multer za sve upload-e slika u aplikaciji
export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const dozvoljeno = ['image/jpeg', 'image/png', 'image/gif']
        if (dozvoljeno.indexOf(file.mimetype) != -1) cb(null, true)
        else cb(new Error('Format slike mora biti JPG, PNG ili GIF'))
    }
})