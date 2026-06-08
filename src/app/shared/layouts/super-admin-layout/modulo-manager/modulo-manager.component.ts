import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AdminTenantService, Tenant } from './admin-tenant.service';



@Component({
  selector: 'app-modulo-manager',
  templateUrl: './modulo-manager.component.html',
  styleUrls: ['./modulo-manager.component.css'],
  standalone: true,
  imports: []
})
export class ModuloManagerComponent implements OnInit {
  private adminService = inject(AdminTenantService);

  ngOnInit() {
    console.log('✅ ModuloManagerComponent iniciado');

    this.adminService.loadTenants().subscribe({
      next: (data) => {
        console.log('🎉 ¡Datos recibidos exitosamente!', data);
      },
      error: (err) => {
        console.error('❌ Error en el servicio:', err);
      }
    });
  }

  // Ahora, accedes a los datos mediante el signal del servicio
  tenants = this.adminService.tenants;


  // 1. Signal para el texto de búsqueda
  searchTerm = signal('');

  // 2. Aquí tendrías tu lista original (cargada desde el servicio)



  filteredTenants = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.tenants().filter(tenant =>
      tenant.nombre.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }




  // Accedemos a la clínica seleccionada desde el servicio
  selectedTenant = this.adminService.selectedTenant;


// Mapeo para traducir tus strings del HTML a los campos de la BD
private moduleMapping: Record<string, keyof Tenant> = {
  'dental': 'hasModuloDental',
  'estetica': 'hasModuloEstetica',
  'medica': 'hasModuloMedicina'
};

isModuleActive(tenant: Tenant, modulo: string): boolean {
  const map: Record<string, keyof Tenant> = {
    'dental': 'hasModuloDental',
    'estetica': 'hasModuloEstetica',
    'medica': 'hasModuloMedicina'
  };

  const field = this.moduleMapping[modulo];
  // Convertimos a booleano de forma segura
  return !!tenant[field];
}

toggleModulo(tenant: Tenant, modulo: string) {
  // Este objeto debe coincidir con el mapping del backend
  const map: Record<string, string> = {
    'dental': 'DENTAL_CORE',
    'estetica': 'ESTETICA_CORE',
    'medica': 'MEDICA_CORE'
  };

  // 1. Identificamos el campo real en el objeto (ej: 'hasModuloDental')
  const field = this.moduleMapping[modulo];
  const moduleKey = map[modulo];
  const newState = !tenant[this.moduleMapping[modulo]];

  this.adminService.updateModule(tenant.id, moduleKey, newState).subscribe();
}

isEsteticaActive = computed(() => {
  const tenant = this.selectedTenant(); // Asumo que este es el que tiene la clínica actual
  return tenant ? tenant.hasModuloEstetica : false;
});

}


