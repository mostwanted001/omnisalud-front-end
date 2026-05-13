import { Routes } from '@angular/router';
import { DentistLayoutComponent } from './shared/layouts/dentist-layout/dentist-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { GestionPacienteComponent } from './features/pacientes/pages/gestion-paciente/gestion-paciente.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: DentistLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'agenda',
        loadComponent: () => import('./features/agenda/pages/agenda-view/agenda-view.component').then(m => m.AgendaViewComponent)
      },
      {
        path: 'pacientes',
        loadComponent: () => import('./features/pacientes/pacientes/pacientes.component')
          .then(m => m.PacientesComponent),
      },
      { path: '', redirectTo: 'agenda', pathMatch: 'full' }
    ]
  },
  // ESTRUCTURA DE GESTIÓN DE PACIENTE (Estilo Dentalink)
  {
    path: 'pacientes/:id',
    component: GestionPacienteComponent,
    canActivate: [authGuard],
    children: [
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
