# Printing House — PIA Projekat 2025/26

Veb sistem **„Printing House"** — platforma za štamparije. Omogućava upravljanje
resursima i praćenje aktivnosti korisnika: klijenata (fizičkih i pravnih lica),
štamparija i administratora sistema.

## Tehnologije

- **Frontend:** Angular 20 (standalone komponente)
- **Backend:** Express + NodeJS (TypeScript)
- **Baza:** MongoDB (kolekcije se kreiraju i pune nezavisno od aplikacije, npr. MongoDB Compass)

## Struktura

```
PIA_PROJEKAT/
├── backend/       # Express server (port 4000)
├── frontend/      # Angular 20 aplikacija
├── docs/          # Specifikacija i plan implementacije (lokalno, van git-a)
├── README.md
└── *.pdf / *.txt  # Izvorni materijali projekta
```

## Pokretanje

### Backend (port 4000)

```bash
cd backend
npm install
npm run build     # tsc -> dist/
npm start         # node dist/server.js
```

### Frontend (port 4200)

```bash
cd frontend
npm install
npm start         # ng serve
```

## Dokumentacija

- `docs/SPECIFIKACIJA.md` — kompletan pregled zahteva, korak po korak
- `docs/IMPLEMENTACIJA_PLAN.md` — plan implementacije po fazama
- `PIA_Projekat_specifikacija.md` — originalni tekst projektnog zadatka