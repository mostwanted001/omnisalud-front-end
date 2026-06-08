import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';

export interface Tenant {
  id: string;
  nombre: string;
  // Asegúrate de que estos nombres coincidan con tu base de datos
  hasModuloDental: boolean;
  hasModuloEstetica: boolean;
  hasModuloMedicina: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminTenantService {
  private http = inject(HttpClient);

  // Lista de clínicas para el buscador/selector
  tenants = signal<Tenant[]>([]);
  // Clínica seleccionada actualmente para editar
  selectedTenant = signal<Tenant | null>(null);

  // Obtener todas las clínicas
  loadTenants() {
    const token = localStorage.getItem('token'); // O la llave que uses

    return this.http.get<Tenant[]>('/api/v1/admin/clinicas', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      tap(data => this.tenants.set(data))
    );
  }

  // Actualizar un módulo específico
  // En tu servicio
  updateModule(tenantId: string, moduleKey: string, status: boolean) {
    return this.http.patch(`/api/v1/admin/clinicas/${tenantId}/modules`, {
      module: moduleKey,
      active: status
    }).pipe(
      tap(() => {
        // ESTO ES LO QUE HACE QUE LA UI CAMBIE
        this.tenants.update(list => list.map(t =>
          t.id === tenantId ? { ...t, [this.getFieldByModule(moduleKey)]: status } : t
        ));
      })
    );
  }

  // Helper auxiliar para saber qué campo actualizar en el signal
  private getFieldByModule(moduleKey: string): keyof Tenant {
    const map: Record<string, keyof Tenant> = {
      'DENTAL_CORE': 'hasModuloDental',
      'ESTETICA_CORE': 'hasModuloEstetica',
      'MEDICA_CORE': 'hasModuloMedicina'
    };
    return map[moduleKey];
  }
}
