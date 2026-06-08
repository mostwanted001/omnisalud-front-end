import { Routes } from "@angular/router";
import { SuperAdminLayoutComponent } from "../../shared/layouts/super-admin-layout/super-admin-layout.component";

export const SUPERADMIN_ROUTES: Routes = [
  {
    path: '', // Esto corresponde al path '' dentro de 'superadmin' en app.routes
    // No definas 'component: SuperAdminLayoutComponent' aquí,
    // porque ya lo definiste en app.routes.ts
    children: [
       // Aquí podrías poner rutas hijas si quisieras navegar a otras cosas
    ]
  }
];