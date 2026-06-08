import { CommonModule, Location } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PacientesService } from '../services/pacientes.service';
import { Paciente } from '../../../core/models/atencion.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  standalone: true
})
export class PacientesComponent implements OnInit {
  public pacientesService = inject(PacientesService);
  public openMenuId = signal<string | null>(null);
  private location = inject(Location);


  private router = inject(Router);

  // Signal para controlar el paciente seleccionado en el modal
  public selectedPaciente = signal<Paciente | null>(null);
  public isFichaOpen = signal(false);
  private fb = inject(FormBuilder);
  public showModal = signal(false); // Manejo de estado con Signals

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
  listaPacientes = signal<any[]>([]); // Inicializado con los pacientes de la DB

  newPatient: any = {
    fullName: '',        // Ya no están dentro de "user"
    rut: '',
    email: '',
    fechaNacimiento: '',
    sexo: '',
    direccion: '',
    comuna: 'Chillán',
    ciudad: 'Chillán',
    enfermedades: '',
    alergias: '',
    medicamentos: ''
  };



  savePatient() {
    // Ya sabemos que this.newPatient debe ser plano (sin el objeto .user)
    this.pacientesService.create(this.newPatient).subscribe({
      next: (pacienteCreado: Paciente) => {
        // 1. Actualizamos el signal del servicio
        // Al actualizar 'pacientes', el 'filteredPacientes' se recalcula solo
        this.pacientesService.addPaciente(pacienteCreado);
        this.pacientesService.showSuccess('¡Paciente registrado con éxito!');



        // 2. Limpieza de UI
        this.closeModal();
        this.resetNewPatient();
        console.log('Paciente registrado y lista actualizada en QA');
      },
      error: (err) => {
        console.error('Error al guardar en el servidor de Chillán:', err);
      }
    });
  }


  closeModal() {
    this.showModal.set(false);
    this.resetNewPatient();
  }

  openModal() {
    this.resetNewPatient();
    this.showModal.set(true);
  }

  private resetNewPatient() {
    this.newPatient = {
      fullName: '',
      rut: '',
      email: '',
      phone: '', // Agrégalo aquí también para que el backend cree el usuario
      fechaNacimiento: '',
      sexo: 'FEMENINO',
      direccion: '',
      comuna: 'Chillán',
      ciudad: 'Chillán',
      enfermedades: '',
      alergias: '',
      medicamentos: ''
    };
  }


  ngOnInit() {
    this.loadPacientes();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.pacientesService.filterQuery.set(value);
  }

  loadPacientes() {
    this.pacientesService.findAll().subscribe({
      next: (data) => {
        // Le inyectamos la data al Signal del servicio desde acá
        this.pacientesService.pacientes.set(data);
      },
      error: (err) => console.error('Error en el componente al traer pacientes:', err)
    })
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

    // 1. Cargamos los datos del paciente en el estado global / señal del padre
    this.selectedPaciente.set(paciente);

    // 2. Extraemos el ID único para la navegación
    const id = paciente.id;

    // 3. Forzamos a que las señales del Sidebar se inicialicen apuntando a Datos Personales
    this.tabActiva.set('Datos personales');
    this.subTabActiva.set(''); // Limpiamos cualquier subtab clínica residual anterior

    // 4. Navegamos al componente contenedor padre
    this.router.navigate(['/pacientes', id]).then(() => {
      // 5. Una vez que la navegación termina, reescribimos estéticamente la URL
      // para que quede exactamente en la sub-rama administrativa fuera de la ficha
      this.location.go(`/pacientes/${id}/gestion/personales`);
    });

    // Tip Senior: Si necesitas precargar el odontograma o periodontograma en segundo plano
    // para que cuando el doctor pinche esas pestañas carguen instantáneamente, hazlo aquí:
    // this.treatmentService.preloadOdontograma(id);
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


}
