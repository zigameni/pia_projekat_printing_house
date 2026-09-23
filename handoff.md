# Handoff Document - Codebuff Exam Assistant

## Purpose
This document contains everything needed to start working on a new exam immediately.
When returning, tell the agent: **"Read handoff.md and let's start the next exam."**

---

## 1. Course Materials Location & Content

### Study Material Root: `Study material/`

### Angular (Part 1): `Study material/ANGULAR/`
| File/Folder | What it contains |
|-------------|-----------------|
| `Angular_2025.pdf` | Theoretical intro to Angular |
| `angular_v1_2025_2026/` | Solved example: basic Angular app with Writers, Books, services, routing, models, @for loops, inject() DI |
| `angular_v2_2025_2026/` | Solved example: adds route guards (CanActivateFn), @Input() child components, [(ngModel)] forms, ActivatedRoute params, DatePipe, sorting, search, programmatic navigation |
| `frontend/` | **Empty starter project** (Angular 20, standalone components, empty routes) - this is the starting point for Angular-only exams |

### MEAN Stack (Part 2): `Study material/MEAN/`
| File/Folder | What it contains |
|-------------|-----------------|
| `Mongo_2025.pdf` | Theoretical intro to MongoDB |
| `Node_2025.pdf` | Theoretical intro to Node.js/Express |
| `mean_v1/` | Solved example: Express + in-memory data, login/register, no database |
| `mean_v2/` | Solved example: adds MongoDB/Mongoose (findOneAndUpdate, insertOne), schema/model pattern |
| `mean_v3/` | Solved example: multiple entities (users + books), favourites ($push), delete, multi-page routing |
| `mean4/` | Solved example: full CRUD, localStorage session, route guards, NgModule-style Angular (older), $pull/$set with arrayFilters |
| `Lab_angular_node/` | **Exam-like practical** - two user types (kupac/radnik), role-based routing, product approval workflow, auto-increment IDs, cross-entity queries. **This is the closest thing to a real exam.** |
| `backend_Node/` | **Empty starter backend** (bare Express on port 4000) - this is the starting point for MEAN exams |

### Reference Summary: `Study material/COURSE_MATERIALS_SUMMARY.md`
A detailed markdown file explaining every material in depth. Read this first if you need a refresher.

---

## 2. Angular Version Differences

The course uses TWO Angular styles. Exams use **Modern (Angular 20)**:

| Feature | Modern (exams) | Older (mean4) |
|---------|---------------|---------------|
| Components | Standalone (`imports` in @Component) | NgModule-based (`declarations`) |
| DI | `inject()` function | `constructor(private service: Service)` |
| HTTP | `provideHttpClient()` in config | `HttpClientModule` in imports |
| Templates | `@for`, `@if` | `*ngFor`, `*ngIf` |
| Routing | `routes: Routes = []` in file | `RouterModule.forRoot(routes)` in module |

---

## 3. Exam Structure

### Folder Layout
```
<YYYY-MM>/                          # e.g., 2026-03/
├── materijali/                     # Exam materials
│   ├── PIA_XX_YYYY.pdf            # Exam PDF with requirements
│   └── <database_name>/           # Initial JSON data for MongoDB
│       ├── collection1.json
│       └── collection2.json
├── implementacija/                 # Implementation (starter projects)
│   ├── backend_Node/              # Bare Express server
│   │   ├── src/server.ts          # Minimal: app.get('/', ...) on port 4000
│   │   ├── package.json           # express, cors, mongoose, mongodb
│   │   └── tsconfig.json
│   └── frontend/                  # Bare Angular 20 project
│       ├── src/app/app.ts         # Minimal root component
│       ├── src/app/app.html       # "<h3>Welcome, {{title}}</h3><router-outlet>"
│       ├── src/app/app.routes.ts  # Empty routes array
│       ├── src/app/app.config.ts  # provideRouter only (no HttpClient yet)
│       └── package.json           # Angular 20.3.x
└── EXAM_STEPS.md                  # Step-by-step implementation log (we create this)
```

### What We Create During the Exam
1. `EXAM_STEPS.md` - Complete step-by-step documentation with full code listings
2. Backend: `models/`, `controllers/`, `routers/` folders and files
3. Frontend: `models/`, `services/`, component folders and files

---

## 4. Exam Rules & Conventions

### Speed Rules (Critical for Time-Limited Exams)
| Rule | Why |
|------|-----|
| **One `apiController.ts`** for ALL controller functions | Faster than managing multiple files |
| **One `apiRouter.ts`** for ALL routes | Faster than managing multiple files |
| **One `apiService.ts`** for ALL frontend service methods | Faster than managing multiple files |
| **Use `any[]` for responses** | No time for interfaces |
| **Use `: any` in Mongoose casts** | Avoids TypeScript errors with nested schemas |
| **Single `promeniStatus` endpoint** for all status changes | Generic endpoint accepts any status string |

### Coding Style (Must Match Course Materials)
- **Backend:** Express Router + Controller class pattern
- **Models:** Mongoose Schema with `const Schema = mongoose.Schema`, export default `mongoose.model("Name", Schema, "collection_name")`
- **Controllers:** Arrow functions as class properties: `methodName = (req, res) => { ... }`
- **Routers:** `router.route("/path").method((req, res) => new Controller().method(req, res))`
- **Frontend Services:** `inject(HttpClient)`, `providedIn: 'root'`
- **Frontend Components:** Standalone with `imports` array, `inject()` for DI
- **Templates:** `@for`, `@if`/`@else`, `[(ngModel)]`, `(click)`, `routerLink`
- **Session:** `localStorage.setItem('ulogovan', JSON.stringify(obj))` / `localStorage.clear()`

### Backend Patterns

#### Server Setup Template:
```typescript
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import apiRouter from './routers/apiRouter'

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect("mongodb://127.0.0.1:27017/<DB_NAME>")
const connection = mongoose.connection
connection.once("open", () => {
    console.log("Connected to MongoDB on port 27017")
})

const router = express.Router()
router.use("/", apiRouter)
app.use("/", router)
app.listen(4000, () => console.log("Express running on port 4000!"))
```

#### Mongoose Model Template:
```typescript
import mongoose from "mongoose"
const Schema = mongoose.Schema

let ModelName = new Schema({
    field1: String,
    field2: Number,
    field3: { type: Array }
})
export default mongoose.model("ModelName", ModelName, "collection_name")
```

#### Controller - READ Pattern (Flatten):
```typescript
methodName = (req: express.Request, res: express.Response) => {
    KlubModel.find({}).then((klubovi) => {
        let result: any[] = []
        for (let k of klubovi) {
            for (let t of k.tereni) {
                for (let r of t.rezervacije) {
                    if (/* condition */) {
                        result.push({ klub: k.naziv, teren: t.oznaka, ...r })
                    }
                }
            }
        }
        res.json(result)
    }).catch((err) => { console.log(err) })
}
```

#### Controller - WRITE Pattern (Find-Modify-Save):
```typescript
methodName = (req: express.Request, res: express.Response) => {
    let param = req.body.param
    KlubModel.findOne({ naziv: param }).then((k) => {
        if (!k) { res.json({ message: 'Greska' }); return }
        let t = k.tereni.find((t: any) => t.oznaka == param)
        if (!t) { res.json({ message: 'Greska' }); return }
        let r = t.rezervacije.find((r: any) => r.vreme_rezervacije == param)
        if (!r) { res.json({ message: 'Greska' }); return }
        // MODIFY r here
        k.save().then(() => {
            res.json({ message: 'Success' })
        }).catch((err) => { console.log(err); res.json({ message: 'Greska' }) })
    }).catch((err) => { console.log(err) })
}
```

#### Router Template:
```typescript
import express from 'express'
import { ApiController } from '../controllers/apiController'

const apiRouter = express.Router()

apiRouter.route("/endpoint").get(
    (req, res) => new ApiController().method(req, res)
)
apiRouter.route("/endpoint").post(
    (req, res) => new ApiController().method(req, res)
)

export default apiRouter
```

### Frontend Patterns

#### app.config.ts (always add provideHttpClient):
```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient()
    ]
};
```

#### Service Template:
```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
    uri = 'http://localhost:4000'
    private http = inject(HttpClient)

    // GET
    getAll() {
        return this.http.get<any[]>(`${this.uri}/endpoint`)
    }
    // POST
    postData(data: any) {
        return this.http.post<any>(`${this.uri}/endpoint`, data)
    }
}
```

#### Component Template:
```typescript
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
    selector: 'app-name',
    imports: [FormsModule, RouterLink],
    templateUrl: './name.component.html',
    styleUrl: './name.component.css',
})
export class NameComponent implements OnInit {
    private apiService = inject(ApiService)

    data: any[] = []
    ulogovan: any = null

    ngOnInit() {
        let korisnik = localStorage.getItem('ulogovan')
        if (korisnik != null) this.ulogovan = JSON.parse(korisnik)
        this.ucitaj()
    }

    ucitaj() {
        this.apiService.getAll().subscribe((data) => { this.data = data })
    }

    odjaviSe() { localStorage.clear() }
}
```

---

## 5. Step-by-Step Exam Workflow

When given a new exam, follow this exact order:

### Phase 1: Setup (5 minutes)
1. Read the exam PDF to understand requirements
2. Note the database name and collection names from the JSON files
3. Create `EXAM_STEPS.md`
4. Create backend folders: `src/models/`, `src/controllers/`, `src/routers/`
5. Update `server.ts` with MongoDB connection, CORS, JSON parsing
6. Create models matching the JSON structure
7. Create initial `apiController.ts` with login function
8. Create initial `apiRouter.ts` with login route
9. Compile: `npx tsc --noEmit`
10. Create frontend folders: `models/`, `services/`, component folders
11. Create models, service, login component, routes, config
12. Compile frontend

### Phase 2: Implement Features (Step by Step)
For each feature from the PDF:
1. Read the requirement
2. Add backend endpoint(s) to `apiController.ts` + `apiRouter.ts`
3. Add service method(s) to `api.service.ts`
4. Create/modify component(s)
5. Update routes if needed
6. Compile both backend and frontend
7. Update `EXAM_STEPS.md` with full code

### Phase 3: Documentation
- Keep `EXAM_STEPS.md` updated after each step
- Include full file contents, not just diffs
- Add endpoint summary table at the end

---

## 6. Key MongoDB Patterns

### Nested Array Queries (Most Common)
MongoDB doesn't efficiently query deeply nested arrays. Instead:
1. Fetch all documents: `KlubModel.find({})`
2. Iterate in code: `for (let k of klubovi) { for (let t of k.tereni) { ... } }`
3. Filter in code with `if` conditions

### Common Mongoose Operations
| Operation | Code |
|-----------|------|
| Find all | `Model.find({})` |
| Find one | `Model.findOne({ field: value })` |
| Insert | `new Model(data).save()` or `Model.insertOne(data)` |
| Update | `r.field = newValue; k.save()` |
| Push to array | `r.array.push(item); k.save()` |
| Delete | `Model.deleteOne({ field: value })` |
| Increment | `r.counter += 1; k.save()` |

### Important: Nested Schema Updates
When modifying nested subdocuments, modify the object in memory then call `parent.save()`:
```typescript
let k = await KlubModel.findOne({ naziv: 'X' })
let t = k.tereni.find(t => t.oznaka == 'Y')
let r = t.rezervacije.find(r => r.id == 'r1')
r.status = 'nova'  // modify in memory
await k.save()      // save the parent document
```

---

## 7. Quick Reference - Common Exam Features

| Feature | Backend Pattern | Frontend Pattern |
|---------|----------------|------------------|
| Login | `findOne({kor_ime, lozinka, tip})` | Form + localStorage + router.navigate |
| Session | N/A | `localStorage.setItem('ulogovan', JSON.stringify(obj))` |
| Logout | N/A | `localStorage.clear()` + routerLink to login |
| List all | `find({})` + flatten loop | `@for` loop in template |
| Search | `find({})` + filter in code | Form with inputs + service call |
| Create | `findOne() → push() → save()` | Form + service call + reload |
| Update | `findOne() → modify → save()` | Button + service call + reload |
| Delete | `findOne() → splice/pull → save()` | Button + confirm + service call |
| Status change | Generic `promeniStatus` endpoint | Button with status parameter |
| Auto-increment ID | Find max ID in code, increment | N/A |
| Route params | `req.params.id` | `this.route.snapshot.paramMap.get('id')` |
| Query params | N/A | `this.router.navigate([], { queryParams: {} })` |
| Route guard | N/A | `CanActivateFn` checking localStorage |

---

## 8. Files Modified Per Step (Typical Flow)

| Step | Backend Files | Frontend Files |
|------|--------------|----------------|
| 1. Setup + Login | server.ts, models/*, apiController.ts, apiRouter.ts | models/*, api.service.ts, login/*, app.routes.ts, app.config.ts, app.html |
| 2. Read data | apiController.ts, apiRouter.ts | api.service.ts, page-component.* |
| 3. Search | apiController.ts, apiRouter.ts | api.service.ts, page-component.* |
| 4. Create | apiController.ts, apiRouter.ts | api.service.ts, new-component.* |
| 5. Update/Join | apiController.ts, apiRouter.ts | api.service.ts, page-component.* |
| 6. Admin read | apiController.ts, apiRouter.ts | api.service.ts, admin-page.* |
| 7. Admin write | apiController.ts, apiRouter.ts | api.service.ts, admin-page.* |

---

## 9. Compilation Commands

```bash
# Backend (from backend_Node/)
npx tsc --noEmit          # Check for errors without emitting files

# Frontend (from frontend/)
npx tsc --noEmit          # Check for errors
npx ng build              # Full build (slower, only if needed)
```

**Always compile after each step. Fix errors immediately before moving on.**

---

## 10. Common TypeScript Errors & Fixes

| Error | Fix |
|-------|-----|
| `'x' is possibly null or undefined` | Add `&& x` check before using |
| `Argument of type 'string \| null' is not assignable` | Add `?` or `|| ''` fallback |
| `Property 'x' does not exist on type` | Cast to `any`: `(obj as any).x` or add `: any` in forEach |
| `Cannot find module` | Check import path, make sure file exists |
| `NgModule` errors | Make sure using standalone components with `imports` array |

---

## 11. Exam Folder Naming Convention

Previous exam we solved:
- **March 2026:** `2026-03/` (Padel reservation system)

When starting a new exam, look for:
- `<YYYY-MM>/materijali/` - exam PDF + DB files
- `<YYYY-MM>/implementacija/` - starter projects

---

## 12. Remember

1. **Speed over perfection** - Use `any`, copy-paste, move fast
2. **Backend first** - Models → Controller → Router → compile
3. **One file per type** - One controller, one router, one service
4. **Compile frequently** - `npx tsc --noEmit` after each change
5. **Follow course style** - Match the patterns from solved examples
6. **Document as you go** - Keep EXAM_STEPS.md updated
7. **MongoDB JSON import** - Use MongoDB Compass to import initial data
8. **The flatten pattern** - 80% of endpoints use the triple nested loop
9. **The find-modify-save pattern** - All write operations follow this
10. **Good luck!** 🎯

---

*Document created: August 28, 2026*
*Last exam solved: March 2026 - Padel Reservation System (35 points)*
