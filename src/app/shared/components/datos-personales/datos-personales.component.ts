import { Component, inject, OnInit, signal } from '@angular/core';
import { PacientesService } from '../../../features/pacientes/services/pacientes.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Paciente } from '../../../core/models/atencion.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-datos-personales',
  templateUrl: './datos-personales.component.html',
  styleUrls: ['./datos-personales.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ],
})
export class DatosPersonalesComponent implements OnInit {

  public pacientesService = inject(PacientesService);
  private route = inject(ActivatedRoute);

  // Usamos signals para manejar la info del paciente de forma reactiva
  pacienteId = signal<string | null>(null);
  public selectedPaciente = signal<Paciente | null>(null);
  public loading = signal<boolean>(false);
  constructor() { }

  ngOnInit() {
    // 🔍 Quitamos ".parent" y leemos directamente la ruta activa
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.pacienteId.set(id);

      console.log('ID Capturado en Datos Personales:', id); // <-- Pon este log para verificar

      if (id) {
        this.cargarDatosPaciente(id);
      } else {
        console.warn('No se pudo capturar el ID del paciente en la URL.');
      }
    });
  }

  // Permite que el componente sea autónomo y se rellene solo al cargar la pestaña
  private cargarDatosPaciente(id: string) {
    this.loading.set(true);
    this.pacientesService.getById(id).subscribe({
      next: (data: Paciente) => {
        // 🔥 Rellenamos el signal local con la data real de la DB de QA
        this.selectedPaciente.set(data);
        this.loading.set(false);

      },
      error: (err) => {
        console.error('Error cargando los datos personales en Chillán:', err);
        this.loading.set(false);
      }
    });
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

  formatearSexo(sexo: string | undefined): string {
    if (!sexo) return 'No definido';
    const sexos: any = { 'MASCULINO': 'Hombre', 'FEMENINO': 'Mujer', 'OTRO': 'Otro' };
    return sexos[sexo] || sexo;
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
