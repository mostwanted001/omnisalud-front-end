import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    // ✅ Hay token, permitimos el paso
    return true;
  } else {
    // ❌ No hay token, lo mandamos al login
    router.navigate(['/login']);
    return false;
  }
};