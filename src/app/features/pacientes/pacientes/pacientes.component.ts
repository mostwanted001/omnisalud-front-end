import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PacientesService } from '../services/pacientes.service';
import { Paciente } from '../../../core/models/atencion.model';
import { OdontogramaComponent } from "../../../shared/components/odontograma/odontograma.component";
import { Router } from '@angular/router';

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss'],
  imports: [CommonModule, FormsModule, OdontogramaComponent],
  standalone: true
})
export class PacientesComponent implements OnInit {
  public pacientesService = inject(PacientesService);
  public openMenuId = signal<string | null>(null);

  private router = inject(Router);

  // Signal para controlar el paciente seleccionado en el modal
  public selectedPaciente = signal<Paciente | null>(null);
  public isFichaOpen = signal(false);

  public tabActiva = signal<string>('Datos personales');
  public subTabActiva = signal<string>('Historial');
  viewMode = signal<'list' | 'odontograma'>('list');

  showModalNuevo = signal(false);
  nombreNuevoPlan = signal('');
  // En tu componente
  recetaTexto = signal('');
  plantillaSeleccionada = signal('');
  showModalDocumento = signal(false);
  tipoDocumentoSeleccionado = signal('');

  selectedFiles = signal<any[]>([]);
  isUploading = signal(false);

  opcionesDocumentos = [
    'Certificado Médico',
    'Informe de Alta',
    'Presupuesto Detallado',
    'Consentimiento Informado Especial'
  ];

  showModalConsentimiento = signal(false);
  nuevoConsentimiento = signal({
  tipo: '',
  planTratamiento: '',
  profesional: 'Pamela Rodriguez' // Valor por defecto según captura
});



  ngOnInit() {
    this.pacientesService.findAll();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.pacientesService.filterQuery.set(value);
  }

  formatRut(rut: string): string {
    if (!rut) return '';

    // 1. Limpiamos todo lo que no sea número o K
    let value = rut.replace(/[^0-9kK]/g, '');

    if (value.length < 2) return value;

    // 2. Extraemos el cuerpo y el dígito verificador
    const body = value.slice(0, -1);
    const dv = value.slice(-1).toUpperCase();

    // 3. Formateamos el cuerpo con puntos usando una Regex Senior
    // Esta regex inserta un punto cada 3 dígitos de derecha a izquierda
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formattedBody}-${dv}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Si el clic no es dentro de un botón de menú, cerramos todo
    if (!target.closest('.relative')) {
      this.openMenuId.set(null);
    }
  }

  toggleMenu(id: string, event: Event) {
    event.stopPropagation(); // Evitamos que el clic se propague al HostListener
    // Si ya está abierto, lo cerramos; si no, abrimos el nuevo
    this.openMenuId.update(currentId => currentId === id ? null : id);
  }

  // Métodos de acción para el menú
  goToPersonalData(paciente: Paciente) {
    console.log('Navegando a datos de:', paciente.user.fullName);
    this.openMenuId.set(null);
  }

  disablePatient(id: string) {
    // Aquí iría tu lógica con SweetAlert2 o similar para Chillán
    console.warn('Deshabilitando paciente:', id);
    this.openMenuId.set(null);
  }

  openFichaClinica(paciente: Paciente) {
    console.log('Abriendo ficha de:', paciente.user.fullName);

    // 1. Cargamos los datos del paciente en el estado
    this.selectedPaciente.set(paciente);

    // 2. Extraemos el ID del objeto paciente para la navegación
    const id = paciente.id;

    this.router.navigate(['/pacientes', id]);

    // Tip Senior: Si necesitas cargar datos extra (como el odontograma)
    // este es el momento de llamar a tu TreatmentService
  }

  closeFicha() {
    this.isFichaOpen.set(false);
    this.selectedPaciente.set(null);
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
    // Aquí conectas con tu PacientesService para el update en NestJS
    console.log('Guardando datos de:', this.selectedPaciente()?.user?.fullName);
  }

  // Función para transformar Date/ISO a YYYY-MM-DD
formatDateForInput(date: string | Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  // Usamos el locale 'sv-SE' que devuelve YYYY-MM-DD de forma nativa
  return d.toLocaleDateString('sv-SE');
}

// Función para capturar el cambio del input y devolverlo al modelo
onDateChange(event: any, paciente: any) {
  const newDate = event.target.value; // Viene como "1990-05-15"
  paciente.fechaNacimiento = newDate ? new Date(newDate).toISOString() : null;
}



crearPlan() {
  if (this.nombreNuevoPlan().length > 3) {
    this.showModalNuevo.set(false);
    this.viewMode.set('odontograma');
    // Aquí podrías llamar a tu servicio para guardar el nombre inicial
  }
}

onFileSelected(event: any) {
  const files: FileList = event.target.files;
  if (!files || files.length === 0) return;

  // Convertimos FileList a Array para manipularlo mejor
  const filesArray = Array.from(files);

  filesArray.forEach(file => {
    // 1. Validar tamaño (ej: máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(`El archivo ${file.name} es muy pesado. Máximo 10MB.`);
      return;
    }

    // 2. Crear previsualización si es imagen
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedFiles.update(current => [
        ...current,
        {
          file,
          name: file.name,
          type: file.type,
          preview: file.type.startsWith('image') ? e.target.result : null,
          progress: 0
        }
      ]);
    };
    reader.readAsDataURL(file);
  });

  // 3. Opcional: Iniciar subida automática o esperar a botón "Guardar"
  // this.uploadFiles();
}

crearPrescripcion() {
  const nuevaReceta = {
    profesional: 'Dr(a). Pamela Rodriguez', // Podría venir de tu sesión
    fecha: new Date(),
    contenido: this.recetaTexto(),
    tratamientoId: '#2353'
  };
  // Aquí llamarías a tu servicio de NestJS para guardar
  console.log('Guardando receta:', nuevaReceta);
}

abrirModalDocumento() {
  this.tipoDocumentoSeleccionado.set('');
  this.showModalDocumento.set(true);
}

continuarCreacionDoc() {
  if (this.tipoDocumentoSeleccionado()) {
    console.log('Creando documento tipo:', this.tipoDocumentoSeleccionado());
    this.showModalDocumento.set(false);
    // Aquí podrías redirigir a un editor o abrir otro modal específico
  }
}

abrirModalConsentimiento() {
  this.nuevoConsentimiento.set({ tipo: '', planTratamiento: '', profesional: 'Pamela Rodriguez' });
  this.showModalConsentimiento.set(true);
}

crearConsentimiento() {
  console.log('Generando documento:', this.nuevoConsentimiento());
  this.showModalConsentimiento.set(false);
  // Aquí lanzarías la generación del PDF o el editor de firma
}




}
