import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService); // Inyecta tu servicio

  // Si no hay token, fuera
  if (!localStorage.getItem('token')) {
    router.navigate(['/login']);
    return false;
  }

  // Opcional: Si tienes un método para validar si el token expiró, úsalo aquí
  return true;
};