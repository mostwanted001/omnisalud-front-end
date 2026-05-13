import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AtencionesService } from '../../services/atenciones.service';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { FormsModule } from '@angular/forms';

registerLocaleData(localeEs); //

@Component({
  selector: 'app-daily-view',
  templateUrl: './daily-view.component.html',
  styleUrls: ['./daily-view.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DailyViewComponent implements OnInit {

  constructor() { }
  public atencionesService = inject(AtencionesService);

  // Signal de la fecha actual (Iniciamos en la fecha de tu captura)
  public selectedDate = signal<Date>(new Date());
  public searchTerm = signal<string>('');

  public atencionesFiltradas = computed(() => {
    const atenciones = this.atencionesService.atenciones();
    const d = this.selectedDate();
    const busqueda = this.searchTerm().toLowerCase();

    // 1. Normalizamos la fecha seleccionada (00:00:00 para comparar solo el día)
    const fechaSeleccionada = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    console.log('--- Filtrando Agenda ---');
    console.log('Fecha Seleccionada (Timestamp):', fechaSeleccionada);
    console.log('Total atenciones en Service:', atenciones.length);

    return atenciones.filter(cita => {
      // 2. Convertimos la fecha de la cita a objeto Date y normalizamos
      const dCita = new Date(cita.fecha);
      const fechaCitaNormalizada = new Date(dCita.getFullYear(), dCita.getMonth(), dCita.getDate()).getTime();

      const coincideFecha = fechaCitaNormalizada === fechaSeleccionada;

      const coincideBusqueda =
        cita.paciente?.user?.fullName.toLowerCase().includes(busqueda) ||
        cita.paciente?.rut?.includes(busqueda);

      // Debug por cada cita para ver por qué falla el match
      if (coincideFecha) {
        console.log('✅ Match encontrado para:', cita.paciente?.user?.fullName);
      }

      return coincideFecha && coincideBusqueda;
    });
  });



  ngOnInit() {
   this.cargarCitas();
  }

  // Helpers para los estilos dinámicos de tu captura
  getSituacionClass(situacion: string) {
    const styles: any = {
      'Diagnóstico': 'bg-emerald-600 text-white',
      'Deudas': 'bg-rose-600 text-white',
      'No hay saldo': 'bg-amber-500 text-white'
    };
    return styles[situacion] || 'bg-slate-200 text-slate-600';
  }

  getSituacionIcon(situacion: string) {
    const icons: any = {
      'Diagnóstico': 'fa-user-doctor',
      'Deudas': 'fa-triangle-exclamation',
      'No hay saldo': 'fa-dollar-sign'
    };
    return icons[situacion] || 'fa-circle';
  }


  changeDate(days: number) {
    const current = this.selectedDate();
    const next = new Date(current);
    next.setDate(current.getDate() + days);

    // Actualizamos el Signal (esto refresca el HTML)
    this.selectedDate.set(next);

    // Cargamos los nuevos datos de Chillán
    this.cargarCitas();
  }



  private cargarCitas() {
    // Formato YYYY-MM-DD
    const fechaISO = this.selectedDate().toISOString().split('T')[0];

    // Limpiamos el buscador al cambiar de fecha para evitar filtros cruzados
    this.searchTerm.set('');

    this.atencionesService.findAll(fechaISO).subscribe({
      next: (res) => {
        console.log(`✅ Datos recibidos para ${fechaISO}:`, res.length);
      }
    });



}

}
