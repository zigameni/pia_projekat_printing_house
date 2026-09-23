import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PorukaOdgovor } from '../../models';

@Component({
  selector: 'app-registracija',
  imports: [FormsModule, RouterLink],
  templateUrl: './registracija.html',
  styleUrl: './registracija.css',
})
export class Registracija {
  private authService = inject(AuthService);

  tip = 'fizicko'; // fizicko | pravno | stampar

  korisnickoIme = '';
  lozinka = '';
  ime = '';
  prezime = '';
  telefon = '';
  email = '';
  nazivInstitucije = '';
  adresa = '';
  grad = '';
  maticniBroj = '';
  pib = '';

  slika: File | null = null;
  porukaSlika = '';
  poruka = '';
  porukaUspeh = '';

  // ==== Regex (ista pravila kao na serveru) ====
  private lozinkaRegex =
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[A-Za-z][A-Za-z0-9@#$%^&+=!._\-]{7,11}$/;
  private emailRegex = /^\S+@\S+\.\S+$/;

  // ==== Izbor slike + klijentska provera (format i dimenzije) ====
  naIzborSlike(event: Event) {
    const fajl = (event.target as HTMLInputElement).files?.[0];

    if (!fajl) {
      this.slika = null;
      return;
    }

    const dozvoljeno = ['image/jpeg', 'image/png', 'image/gif'];

    if (dozvoljeno.indexOf(fajl.type) == -1) {
      this.porukaSlika = 'Format slike mora biti JPG, PNG ili GIF';
      this.slika = null;
      return;
    }
    const slika = new Image();
    slika.onload = () => {
      if (slika.width < 100 || slika.width > 250 || slika.height < 100 || slika.height > 250) {
        this.porukaSlika = 'Slika mora biti između 100x100 i 250x250 px';
        this.slika = null;
      } else {
        this.porukaSlika = '';
        this.slika = fajl;
      }
    };
    slika.src = URL.createObjectURL(fajl);
  }

  // ==== Klijentska validacija ====
  validiraj(): string[] {
    let greske: string[] = [];

    if (this.korisnickoIme.trim().length < 3)
      greske.push('Korisničko ime mora imati bar 3 karaktera');
    if (!this.lozinkaRegex.test(this.lozinka))
      greske.push(
        'Lozinka: 8-12 karaktera, bar jedno veliko slovo, jedan broj i jedan specijalni karakter, mora počinjati slovom',
      );
    if (!this.ime.trim()) greske.push('Ime je obavezno');
    if (!this.prezime.trim()) greske.push('Prezime je obavezno');
    if (!this.telefon.trim()) greske.push('Kontakt telefon je obavezan');
    if (!this.emailRegex.test(this.email)) greske.push('E-mejl adresa nije ispravna');
    if (this.tip != 'fizicko') {
      if (!this.nazivInstitucije.trim()) greske.push('Naziv institucije je obavezan');
      if (!this.adresa.trim()) greske.push('Adresa sedišta je obavezna');
      if (!/^\d{8}$/.test(this.maticniBroj)) greske.push('Matični broj mora imati tačno 8 cifara');
      if (!/^[1-9]\d{8}$/.test(this.pib))
        greske.push('PIB mora imati 9 cifara i ne sme počinjati nulom');
    }
    if (this.tip == 'stampar' && !this.grad.trim()) greske.push('Grad je obavezan');
    return greske;
  }

  // ==== Slanje forme ====
  posalji() {
    this.poruka = '';
    this.porukaUspeh = '';
    const greske = this.validiraj();
    if (greske.length > 0) {
      this.poruka = greske.join('; ');
      return;
    }

    const fd = new FormData();
    fd.append('korisnickoIme', this.korisnickoIme);
    fd.append('lozinka', this.lozinka);
    fd.append('ime', this.ime);
    fd.append('prezime', this.prezime);
    fd.append('telefon', this.telefon);
    fd.append('email', this.email);
    if (this.tip != 'fizicko') {
      fd.append('nazivInstitucije', this.nazivInstitucije);
      fd.append('adresa', this.adresa);
      fd.append('maticniBroj', this.maticniBroj);
      fd.append('pib', this.pib);
    }
    if (this.tip == 'stampar') fd.append('grad', this.grad);
    if (this.slika) fd.append('slika', this.slika);

    let zahtev: Observable<PorukaOdgovor>;
    if (this.tip == 'fizicko') zahtev = this.authService.registracijaFizickoLice(fd);
    else if (this.tip == 'pravno') zahtev = this.authService.registracijaPravnoLice(fd);
    else zahtev = this.authService.registracijaStampara(fd);

    zahtev.subscribe((odg: PorukaOdgovor) => {
      if (
        odg.message == 'Uspešno ste se registrovali' ||
        odg.message == 'Zahtev za registraciju je poslat na odobrenje administratora'
      ) {
        this.porukaUspeh = odg.message + ' Preusmeravanje na prijavu...';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        this.poruka = odg.message;
      }
    });
  }
}
