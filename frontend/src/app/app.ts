import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Korisnik } from './models';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  ulogovan: Korisnik | null = null

  meniOtvoren = false             // burger meni (mali ekrani)
  korisnickiMeniOtvoren = false   // padajuci meni korisnika

  ngOnInit() {
    const korisnik = localStorage.getItem('ulogovan')
    if (korisnik != null) this.ulogovan = JSON.parse(korisnik) as Korisnik
  }

  // ==== Burger meni (mali ekrani) ====
  prebaciMeni() {
    this.meniOtvoren = !this.meniOtvoren
    this.korisnickiMeniOtvoren = false
  }

  zatvoriMeni() {
    this.meniOtvoren = false
  }

  // ==== Padajuci meni korisnika ====
  prebaciKorisnickiMeni() {
    this.korisnickiMeniOtvoren = !this.korisnickiMeniOtvoren
  }

  // Klik van padajuceg menija ga zatvara
  @HostListener('document:click', ['$event'])
  klikVanMenija(dogadjaj: MouseEvent) {
    const cilj = dogadjaj.target as HTMLElement
    if (!cilj.closest('.nav-korisnik')) this.korisnickiMeniOtvoren = false
  }

  // Profil je izmenjen (profil.ts emituje `profil-azuriran`) — osvezi ime/avatar u zaglavlju bez reload-a
  @HostListener('window:profil-azuriran')
  osveziUlogovanog() {
    const korisnik = localStorage.getItem('ulogovan')
    if (korisnik != null) this.ulogovan = JSON.parse(korisnik) as Korisnik
  }

  prikazanoIme(): string {
    if (!this.ulogovan) return ''
    if (this.ulogovan.ime) return `${this.ulogovan.ime} ${this.ulogovan.prezime || ''}`.trim()
    return this.ulogovan.korisnickoIme
  }

  inicijal(): string {
    if (!this.ulogovan) return '?'
    const osnova = this.ulogovan.ime || this.ulogovan.korisnickoIme || '?'
    return osnova.charAt(0).toUpperCase()
  }

  odjaviSe() {
    localStorage.clear()
    window.location.href = '/login'
  }
}