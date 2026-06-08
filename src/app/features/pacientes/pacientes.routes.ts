import { Routes } from '@angular/router';

export const PACIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pacientes/pacientes.component').then(m => m.PacientesComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/gestion-paciente/gestion-paciente.component').then(m => m.GestionPacienteComponent),
    children: [
      { path: '', redirectTo: 'gestion/personales', pathMatch: 'full' },

      // Rama Gestión
      { path: 'gestion/personales', loadComponent: () => import('../../shared/components/datos-personales/datos-personales.component').then(m => m.DatosPersonalesComponent) },
      { path: 'tratamientos', loadComponent: () => import('../../shared/components/planes-tratamiento/planes-tratamiento.component').then(m => m.PlanesTratamientoComponent) },
      { path: 'tratamientos/:tratamientoId', loadComponent: () => import('../../shared/components/planes-tratamiento/detalle-odontograma/detalle-odontograma.component').then(m => m.DetalleOdontogramaComponent) },

      // Rama Ficha (Lazy loaded uno a uno o agrupados)
      {
        path: 'ficha',
        children: [
          { path: 'historial', loadComponent: () => import('../../shared/components/ficha-clinica/historial/historial.component').then(m => m.HistorialComponent) },
          { path: 'evoluciones', loadComponent: () => import('../../shared/components/ficha-clinica/evoluciones/evoluciones.component').then(m => m.EvolucionesComponent) },
          { path: 'odontograma', loadComponent: () => import('../../shared/components/ficha-clinica/odontograma/odontograma.component').then(m => m.OdontogramaComponent) },
          { path: 'periodontograma', loadComponent: () => import('../../shared/components/ficha-clinica/periodontograma/periodontograma.component').then(m => m.PeriodontogramaComponent) },
          { path: 'antecedentes', loadComponent: () => import('../../shared/components/ficha-clinica/antecedentes-medicos/antecedentes-medicos.component').then(m => m.AntecedentesMedicosComponent) },
          { path: 'rx-documentos', loadComponent: () => import('../../shared/components/ficha-clinica/rx-y-documentos/rx-y-documentos.component').then(m => m.RxYDocumentosComponent) },
          { path: 'recetas', loadComponent: () => import('../../shared/components/ficha-clinica/recetas/recetas.component').then(m => m.RecetasComponent) },
          { path: 'documentos-clinicos', loadComponent: () => import('../../shared/components/ficha-clinica/documentos/documentos.component').then(m => m.DocumentosComponent) }
        ]
      }
    ]
  }
];