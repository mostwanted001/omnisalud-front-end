import { SuperAdminLayoutComponent } from './shared/layouts/super-admin-layout/super-admin-layout.component';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout.component';
import { ClinicalLayoutComponent } from './shared/layouts/clinical-layout/clinical-layout.component';
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  // 1. ÁREA CLÍNICA (Layout Principal)
  {
    path: '',
    loadComponent: () => import('./shared/layouts/clinical-layout/clinical-layout.component').then(m => m.ClinicalLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'agenda',
        loadComponent: () => import('./features/agenda/pages/agenda-view/agenda-view.component').then(m => m.AgendaViewComponent)
      },
      {
        path: 'pacientes',
        loadChildren: () => import('./features/pacientes/pacientes.routes').then(m => m.PACIENTES_ROUTES)
      }
    ]
  },
  // 2. ÁREA ADMIN (Lazy Loaded por completo)
  {
    path: 'admin',
    loadComponent: () => import('./shared/layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  // 3. ÁREA SUPER ADMIN
  {
    path: 'superadmin',
    loadComponent: () => import('./shared/layouts/super-admin-layout/super-admin-layout.component').then(m => m.SuperAdminLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'SUPER_ADMIN' },
    loadChildren: () => import('./features/superadmin/superadmin.routes').then(m => m.SUPERADMIN_ROUTES)
  },
  { path: '**', redirectTo: 'login' }
];
