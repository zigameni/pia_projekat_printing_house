import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { LoginAdmin } from './components/loginAdmin/loginAdmin';
import { Registracija } from './components/registracija/registracija';
import { Pocetna } from './components/pocetna/pocetna';
import { ProizvodDetalji } from './components/proizvodDetalji/proizvodDetalji';
import { Profil } from './components/profil/profil';
import { Ekorpa } from './components/ekorpa/ekorpa';
import { Arhiva } from './components/arhiva/arhiva';
import { JavneNabavke } from './components/javne-nabavke/javne-nabavke';
import { Licitacije } from './components/licitacije/licitacije';
import { MojiProizvodi } from './components/mojiProizvodi/mojiProizvodi';
import { StamparNarudzbine } from './components/stamparNarudzbine/stamparNarudzbine';
import { AdminKorisnici } from './components/adminKorisnici/adminKorisnici';
import { ZahteviZaRegistraciju } from './components/zahteviZaRegistraciju/zahteviZaRegistraciju';
import { AdminKategorije } from './components/adminKategorije/adminKategorije';
import { authGuard } from './guards/auth.guard';
import { stamparGuard } from './guards/stampar.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: '', component: Pocetna },
    { path: 'login', component: Login },
    { path: 'admin', component: LoginAdmin },
    { path: 'registracija', component: Registracija },
    { path: 'proizvod/:sifra', component: ProizvodDetalji },
    { path: 'profil', component: Profil, canActivate: [authGuard] },
    { path: 'korpa', component: Ekorpa, canActivate: [authGuard] },
    { path: 'arhiva', component: Arhiva, canActivate: [authGuard] },
    { path: 'nabavke', component: JavneNabavke, canActivate: [authGuard] },
    { path: 'licitacije', component: Licitacije, canActivate: [authGuard] },
    { path: 'moji-proizvodi', component: MojiProizvodi, canActivate: [stamparGuard] },
    { path: 'narudzbine-stamparija', component: StamparNarudzbine, canActivate: [stamparGuard] },
    { path: 'korisnici', component: AdminKorisnici, canActivate: [adminGuard] },
    { path: 'zahtevi-za-registraciju', component: ZahteviZaRegistraciju, canActivate: [adminGuard] },
    { path: 'kategorije', component: AdminKategorije, canActivate: [adminGuard] },
    { path: '**', redirectTo: '' }
];