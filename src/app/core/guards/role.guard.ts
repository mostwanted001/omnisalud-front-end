import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtenemos el rol del usuario desde el Signal o el estado de Auth
  const user = authService.currentUser();
  const requiredRole = route.data['role'];

  // 1. Si no está logueado, fuera
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Si es SUPER_ADMIN, tiene acceso total (bypass)
  if (user.role === 'SUPER_ADMIN') return true;

  // 3. Si el rol coincide, pasa
  if (user.role === requiredRole) return true;

  // 4. Si no, denegado
  router.navigate(['/unauthorized']);
  return false;
};