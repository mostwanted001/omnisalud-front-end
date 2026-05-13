import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router';
import { Paciente } from '../../../../core/models/atencion.model';
import { FormsModule } from '@angular/forms';
import { OdontogramaComponent } from "../../../../shared/components/odontograma/odontograma.component";
import { PacientesService } from '../../services/pacientes.service';

@Component({
  selector: 'app-gestion-paciente',
  templateUrl: './gestion-paciente.component.html',
  styleUrls: ['./gestion-paciente.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, FormsModule, OdontogramaComponent]
})
export class GestionPacienteComponent implements OnInit {
  public pacientesService = inject(PacientesService);
  private route = inject(ActivatedRoute);

  // Usamos signals para manejar la info del paciente de forma reactiva
  pacienteId = signal<string | null>(null);
  loading = signal<boolean>(false);

  public selectedPaciente = signal<Paciente | null>(null);
  public tabActiva = signal<string>('Datos personales');
  public subTabActiva = signal<string>('Historial');

  viewMode = signal<'list' | 'odontograma'>('list');

  constructor() { }

  ngOnInit() {
    // Obtenemos el ID desde la ruta /pacientes/:id
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.pacienteId.set(id);
      if (id) {
        this.cargarDatosPaciente(id);
      }
    });
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



  guardarTodo() {
    console.log('Disparando guardado global para el paciente:', this.pacienteId());
    // Lógica para persistir los cambios del odontograma
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
    console.log('Guardando datos en NestJS para:', this.pacienteId());
    // Lógica para enviar el signal selectedPaciente() al backend
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
