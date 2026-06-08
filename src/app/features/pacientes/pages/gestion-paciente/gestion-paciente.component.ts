import { CommonModule, Location } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { Paciente } from '../../../../core/models/atencion.model';
import { FormsModule } from '@angular/forms';
import { OdontogramaComponent } from "../../../../shared/components/ficha-clinica/odontograma/odontograma.component";
import { PacientesService } from '../../services/pacientes.service';
import { PeriodontogramaComponent } from '../../../../shared/components/ficha-clinica/periodontograma/periodontograma.component';
import { AntecedentesMedicosComponent } from "../../../../shared/components/ficha-clinica/antecedentes-medicos/antecedentes-medicos.component";
import { HistorialComponent } from '../../../../shared/components/ficha-clinica/historial/historial.component';
import { DatosPersonalesComponent } from "../../../../shared/components/datos-personales/datos-personales.component";
import { EvolucionesComponent } from '../../../../shared/components/ficha-clinica/evoluciones/evoluciones.component';
import { RxYDocumentosComponent } from "../../../../shared/components/ficha-clinica/rx-y-documentos/rx-y-documentos.component";
import { RecetasComponent } from "../../../../shared/components/ficha-clinica/recetas/recetas.component";
import { DocumentosComponent } from "../../../../shared/components/ficha-clinica/documentos/documentos.component";
import { ConsentimientosComponent } from "../../../../shared/components/ficha-clinica/consentimientos/consentimientos.component";
import { PlanesTratamientoComponent } from "../../../../shared/components/planes-tratamiento/planes-tratamiento.component";
import { AdminTenantService } from '../../../../shared/layouts/super-admin-layout/modulo-manager/admin-tenant.service';

@Component({
  selector: 'app-gestion-paciente',
  templateUrl: './gestion-paciente.component.html',
  styleUrls: ['./gestion-paciente.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OdontogramaComponent,
    PeriodontogramaComponent,
    AntecedentesMedicosComponent,
    HistorialComponent,
    DatosPersonalesComponent,
    EvolucionesComponent, RxYDocumentosComponent, RecetasComponent, DocumentosComponent, ConsentimientosComponent, PlanesTratamientoComponent],
})
export class GestionPacienteComponent implements OnInit {
  public pacientesService = inject(PacientesService);
  private adminService = inject(AdminTenantService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  // Usamos signals para manejar la info del paciente de forma reactiva
  pacienteId = signal<string | null>(null);
  loading = signal<boolean>(false);

  public selectedPaciente = signal<Paciente | null>(null);
  public tabActiva = signal<string>('Datos personales');
  public subTabActiva = signal<string>('Historial');

  listaPacientes = signal<any[]>([]); // Inicializado con los pacientes de la DB

    constructor() { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.pacienteId.set(id);
      if (id) {
        this.cargarDatosPaciente(id);

        // 🔥 Sincronizamos el punto de partida inicial: Datos personales
        this.tabActiva.set('Datos personales');
        this.subTabActiva.set('');
        this.location.go(`/pacientes/${id}/gestion/personales`);
      }
    });
  }

 // Creamos el mismo computed aquí para que el template pueda usarlo
 isEsteticaActive = computed(() => {
  const tenant = this.adminService.selectedTenant();
  return tenant ? tenant.hasModuloEstetica : false;
});


  // 🔥 MÉTODO NUEVO: Cambia la pestaña principal (Sidebar superior)
  public seleccionarTabPrincipal(tab: 'Datos personales' | 'Ficha clínica' | 'Planes de tratamiento'): void {
    this.tabActiva.set(tab);

    // Si cambian a Ficha Clínica, nos aseguramos de que cargue Historial por defecto
    if (tab === 'Ficha clínica') {
      this.subTabActiva.set('Historial');
    }

    this.actualizarUrlEstetica(this.pacienteId()!, tab, this.subTabActiva());
  }

  // 🔥 MÉTODO NUEVO: Cambia la sub-pestaña clínica (Sidebar inferior)
  public seleccionarSubTab(subTab: string): void {
    this.subTabActiva.set(subTab);
    this.actualizarUrlEstetica(this.pacienteId()!, this.tabActiva(), subTab);
  }

  /**
   * Reescribe la barra de direcciones del navegador sin recargar ni romper tus @if
   */
  private actualizarUrlEstetica(id: string, tab: string, subTab: string): void {
    let segmentoruta = '';

    if (tab === 'Datos personales') {
      segmentoruta = `gestion/personales`;
    } else if (tab === 'Ficha clínica') {
      // Mapeamos tus casos del switch a las URLs que querías
      const mapeoUrls: { [key: string]: string } = {
        'Historial': 'historial',
        'Antecedentes médicos': 'antecedentes',
        'Evoluciones': 'evoluciones',
        'Odontograma': 'odontograma',
        'Periodontograma': 'periodontograma',
        'Rx y Documentos': 'rx-documentos',
        'Recetas': 'recetas',
        'Documentos Clínicos': 'documentos-clinicos',
        'Consentimientos': 'consentimientos'
      };
      const subPath = mapeoUrls[subTab] || 'historial';
      segmentoruta = `ficha/${subPath}`;
    } else if (tab === 'Planes de tratamiento') {
      segmentoruta = `tratamientos`;
    }
    // Reescribe la URL limpia en el navegador: /pacientes/0de6d91d-.../ficha/antecedentes
    this.location.go(`/pacientes/${id}/${segmentoruta}`);
  }



  cargarDatosPaciente(id: string) {
    this.loading.set(true);

    this.pacientesService.getById(id).subscribe({
      next: (data) => {
        // Actualizamos el signal con la data real de la DB
        this.selectedPaciente.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando paciente en Chillán:', err);
        this.loading.set(false);
      }
    });
  }

  // Helpers de visualización
  getInitials(name: string | undefined): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  calcularEdad(fechaNacimiento: string | Date): number {
    const cumple = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return edad;
  }

  formatearSexo(sexo: string | undefined): string {
    if (!sexo) return 'No definido';
    const sexos: any = { 'MASCULINO': 'Hombre', 'FEMENINO': 'Mujer', 'OTRO': 'Otro' };
    return sexos[sexo] || sexo;
  }



  onSavePatientData() {
    const data = this.selectedPaciente();
    if (!data || !data.id) return;

    const {
      id,
      userId,
      createdAt,
      updatedAt,
      atenciones,
      presupuestos,
      user, // Extraemos el objeto user para aplanarlo si es necesario
      ...cleanData
    } = data;

    // Reconstruimos el objeto para que coincida exactamente con el UpdatePatientDto
    const updatePayload = {
      ...cleanData,
      fullName: user.fullName,
      email: user.email,
      rut: user.rut,
      phone: user.phone
    };

    console.log('Enviando actualización a NestJS:', id);

    // Llamamos al servicio pasando el ID y el cuerpo de los datos
    this.pacientesService.update(id, updatePayload).subscribe({
      next: (pacienteEditado: Paciente) => {
        // 1. Refrescamos el Signal de la tabla con los nuevos datos
        this.pacientesService.updatePacienteInList(pacienteEditado);

        // 2. Lanzamos la notificación de éxito (usando el método que creamos antes)
        this.pacientesService.showSuccess('Paciente actualizado correctamente');

        console.log('Cambios persistidos en la base de datos de QA');
      },
      error: (err) => {
        console.error('Error al actualizar el perfil clínico:', err);
        // Aquí podrías lanzar una notificación de error si prefieres
      }
    });
  }





// Añade este método dentro de la clase de tu componente de gestión de pacientes
/**
   * Recibe la data limpia procesada desde el formulario de antecedentes
   * y la guarda directamente en la base de datos.
   */
public actualizarDatosPaciente(nuevosAntecedentes: { alergias: string, enfermedades: string, medicamentos: string }): void {
  const pacienteActual = this.selectedPaciente();

  if (!pacienteActual || !pacienteActual.id) {
    console.warn('No hay un paciente seleccionado o falta el ID único.');
    return;
  }

  // 📦 Filtramos el payload: enviamos ÚNICAMENTE lo que tiene persistencia real en la DB
  const datosAPersistir = {
    alergias: nuevosAntecedentes.alergias,
    enfermedades: nuevosAntecedentes.enfermedades,
    medicamentos: nuevosAntecedentes.medicamentos
  };

  // 🚀 Llamada limpia a tu método PATCH genérico con la data que corresponde
  this.pacientesService.update(pacienteActual.id, datosAPersistir).subscribe({
    next: (pacienteActualizado) => {

      // 🔥 Mutamos la señal reactiva para actualizar las 3 card de arriba al instante
      this.selectedPaciente.set({
        ...pacienteActual,
        ...datosAPersistir
      });

      console.log('%c Ficha actualizada correctamente en la DB', 'background: #059669; color: #fff; padding: 4px 8px; border-radius: 4px;');
    },
    error: (err) => {
      console.error('Error al intentar guardar los datos en el backend:', err);
      alert('Hubo un problema de red al guardar los cambios. Intente nuevamente.');
    }
  });
}



}
