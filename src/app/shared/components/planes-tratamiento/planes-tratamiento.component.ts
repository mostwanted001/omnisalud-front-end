import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { PacientesService } from '../../../features/pacientes/services/pacientes.service';
import { PresupuestoResponse, TratamientosService } from '../../../core/services/clinical/tratamientos.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

interface PlanTratamiento {
  id: string;
  idNumerico: string; // Ej: #3974
  nombre: string;     // Ej: restauracion
  profesional: string;
  especialidad: string;
  ultimaCita: string;
  progreso: number;   // Porcentaje ej: 0
  estadoFinanciero: string; // Ej: Diagnóstico
  enEjecucion: boolean;
  totalNeto: number;
}

@Component({
  selector: 'app-planes-tratamiento',
  templateUrl: './planes-tratamiento.component.html',
  styleUrls: ['./planes-tratamiento.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterModule],
})
export class PlanesTratamientoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tratamientosService = inject(TratamientosService);
  private pacientesService = inject(PacientesService); // 👈 Inyectado correctamente para usar showSuccess
  private authService = inject(AuthService);
  private router = inject(Router);

  // 📥 Signals para controlar el nuevo modal de la captura
  showCrearModal = signal<boolean>(false);
  nombreNuevoTratamiento = signal<string>('');
  creandoPlanBackend = signal<boolean>(false); // Spinner de bloqueo para el botón Crear

  pacienteId = signal<string | null>(null);
  loading = signal<boolean>(false);

  // Señal reactiva mapeada para la interfaz visual
  planes = signal<PlanTratamiento[]>([]);

  // 🔥 SEÑALES CALCULADAS DESDE EL TS (Evitan lógica en el HTML)
  planesEjecucion = computed(() => this.planes().filter(p => p.enEjecucion));
  planesOtros = computed(() => this.planes().filter(p => !p.enEjecucion));

  // Filtros de navegación
  filtroActivo = signal<'todos' | 'mis-planes'>('todos');

  ngOnInit() {
    // 1. Clon de seguridad A: Buscar el parámetro 'id' en la ruta actual activa
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.pacienteId.set(id);
        this.obtenerTratamientosDeServidor(id);
      }
    });

    // 2. Clon de seguridad B: Buscar en la ruta padre (Ficha layout / children)
    if (!this.pacienteId() && this.route.parent) {
      this.route.parent.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.pacienteId.set(id);
          this.obtenerTratamientosDeServidor(id);
        }
      });
    }

    // 3. Clon de seguridad C: Buscar de forma profunda en la URL completa (Snapshot)
    if (!this.pacienteId()) {
      let currentRoute = this.route;
      while (currentRoute.parent) {
        currentRoute = currentRoute.parent;
        const id = currentRoute.snapshot.paramMap.get('id');
        if (id) {
          this.pacienteId.set(id);
          this.obtenerTratamientosDeServidor(id);
          break;
        }
      }
    }
  }

// Cambia únicamente el método obtenerTratamientosDeServidor dentro de tu archivo .ts
private obtenerTratamientosDeServidor(id: string) {
  this.loading.set(true);

  this.tratamientosService.getTratamientosByPaciente(id).subscribe({
    next: (presupuestosDesdeNest: PresupuestoResponse[]) => {

      const planesMapeados = presupuestosDesdeNest.map((p) => {
        // 🔥 CORREGIDO: Leemos p.items[0].descripcion para el título visual
        const primerProcedimiento = p.items && p.items.length > 0 ? p.items[0].descripcion : 'Tratamiento';
        const nombrePlan = (primerProcedimiento || 'rehabilitación').toLowerCase();

        const fechaFormateada = p.createdAt
          ? new Date(p.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
          : 'Sin sesiones';

        // Calculamos el progreso evaluando si tus ítems tienen estados o por defecto 0
        const itemsRealizados = p.items ? p.items.filter((i: any) => i.estado === 'REALIZADO').length : 0;
        const totalItems = p.items ? p.items.length : 0;
        const porcentajeProgreso = totalItems > 0 ? Math.round((itemsRealizados / totalItems) * 100) : 0;

        return {
          id: p.id,
          idNumerico: `#${p.id.toString().slice(-4)}`,
          nombre: nombrePlan,
          profesional: p.profesional?.user?.fullName || 'Pamela Rodriguez',
          especialidad: p.profesional?.especialidad || 'Rehabilitación oral',
          ultimaCita: `Creado el ${fechaFormateada}`,
          progreso: porcentajeProgreso,
          estadoFinanciero: p.estado === 'PENDIENTE' ? 'Diagnóstico' : p.estado,
          enEjecucion: p.estado === 'EN_PROGRESO',
          totalNeto: p.total
        };
      });

      this.planes.set(planesMapeados);
      this.loading.set(false);
    },
    error: (err) => {
      console.error('Error recuperando tratamientos en QA:', err);
      this.loading.set(false);
    }
  });
}

  cambiarFiltro(tipo: 'todos' | 'mis-planes') {
    this.filtroActivo.set(tipo);
  }

  eliminarTratamiento(id: string) {
    this.planes.update(lista => lista.filter(p => p.id !== id));
    this.pacientesService.showSuccess('Tratamiento removido de la ficha');
  }
// Métodos del Modal de la captura
crearNuevoPlan() {
  this.nombreNuevoTratamiento.set(''); // Limpiamos el input
  this.showCrearModal.set(true);       // Desplegamos el modal
}

cerrarModal() {
  this.showCrearModal.set(false);
}

confirmarCrearPlan() {
  const nombre = this.nombreNuevoTratamiento().trim();
  const pId = this.pacienteId();
  // 👤 dId es inferido como 'string | null'
  const dId = this.authService.getProfesionalId();

  if (!nombre || !pId) return;

  if (!dId) {
    this.pacientesService.showSuccess('Error: No se encontró una sesión activa de dentista.');
    return;
  }

  this.creandoPlanBackend.set(true);

  // 📦 Estructuramos el Payload idéntico al CreateTreatmentDto del backend
  const payload = {
    pacienteId: pId,
    profesionalId: dId, // 🔥 Cambia a minúscula para que coincida con tu DTO y backend
    odontogramaRaw: { nombrePlan: nombre, diagnosticos: [] },
    items: [
      {
        descripcion: nombre,
        cantidad: 1,
        precioUnitario: 0
      }
    ]
};

  // 🔥 CORREGIDO: Eliminamos 'pId' de los argumentos. Ahora viaja solo el payload.
  this.tratamientosService.crearPlanTratamiento(payload).subscribe({
    next: (nuevoPresupuestoCreado: any) => {
      // Formateamos la respuesta de Prisma para meterla al feed reactivo al vuelo
      const nuevoPlanVisual = this.mapearPlanAFormatoVisual(nuevoPresupuestoCreado);

      this.planes.update(lista => [nuevoPlanVisual, ...lista]);
      this.pacientesService.showSuccess('Plan de tratamiento creado en el servidor');

      this.creandoPlanBackend.set(false);
      this.cerrarModal();
      this.router.navigate([
        `/pacientes/${pId}/tratamientos/${nuevoPresupuestoCreado.id}`
      ]);
    },
    error: (err) => {
      console.error('Error al insertar presupuesto en NestJS:', err);
      this.creandoPlanBackend.set(false);
    }
  });
}

// Helper para reutilizar el formateo de Prisma de forma limpia
private mapearPlanAFormatoVisual(p: any): PlanTratamiento {
  const primerProcedimiento = p.items && p.items.length > 0 ? p.items[0].descripcion : 'Tratamiento';
  const nombrePlan = (primerProcedimiento || 'rehabilitación').toLowerCase();

  const fechaFormateada = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
    : 'Sin sesiones';

  const itemsRealizados = p.items ? p.items.filter((i: any) => i.estado === 'REALIZADO').length : 0;
  const totalItems = p.items ? p.items.length : 0;
  const porcentajeProgreso = totalItems > 0 ? Math.round((itemsRealizados / totalItems) * 100) : 0;

  return {
    id: p.id,
    idNumerico: `#${p.id.toString().slice(-4)}`,
    nombre: nombrePlan,
    profesional: p.profesional?.fullName || 'Pamela Rodriguez',
    especialidad: p.profesional?.especialidad || 'Rehabilitación oral',
    ultimaCita: `Creado el ${fechaFormateada}`,
    progreso: porcentajeProgreso,
    estadoFinanciero: p.estado === 'PENDIENTE' ? 'Diagnóstico' : p.estado,
    enEjecucion: p.estado === 'EN_PROGRESO',
    totalNeto: p.total
  };
}

get routeHasId(): boolean {
  // Comprueba si la ruta activa o alguna sub-ruta anidada contiene el parámetro
  let currentRoute = this.route;
  while (currentRoute.firstChild) {
    currentRoute = currentRoute.firstChild;
  }
  return currentRoute.snapshot.paramMap.has('tratamientoId');
}

}
