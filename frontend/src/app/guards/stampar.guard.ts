import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Propušta samo prijavljenog štampara.
 *
 * `authGuard` proverava samo da sesija postoji u `localStorage`, pa bi klijent mogao
 * ručno da otvori štamparske strane.
 */
export const stamparGuard: CanActivateFn = () => {
    const router = inject(Router)
    const ulogovan = localStorage.getItem('ulogovan')
    if (ulogovan != null) {
        const korisnik = JSON.parse(ulogovan)
        if (korisnik.tip === 'stampar') return true
    }
    return router.createUrlTree(['/'])
};
