import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PrijavaOdgovor } from '../../models';

@Component({
    selector: 'app-login-admin',
    imports: [FormsModule],
    templateUrl: './loginAdmin.html',
    styleUrl: './loginAdmin.css',
})
export class LoginAdmin implements OnInit {
    private authService = inject(AuthService)

    korisnickoIme = ''
    lozinka = ''
    poruka = ''

    ngOnInit() {
        // Prijavljen korisnik ne ostaje na formi za prijavu
        if (localStorage.getItem('ulogovan') != null) window.location.href = this.pocetnaStrana()
    }

    // Administrator posle prijave ide na svoj panel, ostali na početnu
    private pocetnaStrana(): string {
        const str = localStorage.getItem('ulogovan')
        if (str) {
            const korisnik = JSON.parse(str)
            if (korisnik.tip === 'admin') return '/korisnici'
        }
        return '/'
    }

    prijava() {
        this.poruka = ''
        this.authService.loginAdmin(this.korisnickoIme, this.lozinka).subscribe((odg: PrijavaOdgovor) => {
            if (odg.message == 'Uspešno') {
                localStorage.setItem('ulogovan', JSON.stringify(odg.user))
                window.location.href = this.pocetnaStrana()
            } else {
                this.poruka = odg.message
            }
        })
    }
}