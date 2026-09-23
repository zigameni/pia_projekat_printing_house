import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PrijavaOdgovor } from '../../models';

@Component({
    selector: 'app-login',
    imports: [FormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.css',
})
export class Login implements OnInit {
    private authService = inject(AuthService)

    korisnickoIme = ''
    lozinka = ''
    poruka = ''

    ngOnInit() {
        // Prijavljen korisnik ne ostaje na formi za prijavu
        if (localStorage.getItem('ulogovan') != null) window.location.href = '/'
    }

    prijava() {
        this.poruka = ''
        this.authService.login(this.korisnickoIme, this.lozinka).subscribe((odg: PrijavaOdgovor) => {
            if (odg.message == 'Uspešno') {
                localStorage.setItem('ulogovan', JSON.stringify(odg.user))
                window.location.href = '/'
            } else {
                this.poruka = odg.message
            }
        })
    }
}