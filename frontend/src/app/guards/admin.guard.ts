import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Propušta samo prijavljenog administratora.
 *
 * `authGuard` proverava samo da sesija postoji u `localStorage`, pa bi klijent ili štampar
 * mogao ručno da otvori administratorske strane.
 */
export const adminGuard: CanActivateFn = () => {
    const router = inject(Router)
    const ulogovan = localStorage.getItem('ulogovan')
    if (ulogovan != null) {
        const korisnik = JSON.parse(ulogovan)
        if (korisnik.tip === 'admin') return true
    }
    return router.createUrlTree(['/'])
};
