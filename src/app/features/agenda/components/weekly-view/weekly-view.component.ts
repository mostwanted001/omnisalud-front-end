import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AtencionesService } from '../../services/atenciones.service';

@Component({
  selector: 'app-weekly-view',
  templateUrl: './weekly-view.component.html',
  styleUrls: ['./weekly-view.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class WeeklyViewComponent implements OnInit {
  public atencionesService = inject(AtencionesService);
  public atenciones = computed(() => this.atencionesService.atenciones());
  // Estado para el menú contextual
public activeMenu = signal<{ day: Date, interval: string, x: number, y: number } | null>(null);
public activeCitaMenu = signal<{ cita: any, x: number, y: number } | null>(null);

// 1. Define la altura de un bloque de 15 minutos en píxeles
readonly DURACION_HEIGHTS: { [key: number]: number } = {
  15: 79,
  30: 116,
  45: 157,
  60: 200,
  90: 276
};
readonly HORA_INICIO = 8; // Tu agenda empieza a las 08:00 AM


  public today = new Date();

  // Horas de 08:00 a 22:00
  public hours = Array.from({ length: 15 }, (_, i) => i + 8);

  public intervals = Array.from({ length: (22 - 8) * 4 + 1 }, (_, i) => {
    const totalMinutes = i * 15;
    const hour = Math.floor(totalMinutes / 60) + 8;
    const minutes = totalMinutes % 60;
    return {
      label: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      hour,
      minutes
    };
  });

  // Signal para el lunes de la semana actual
  public startOfWeek = signal<Date>(this.getMonday(new Date()));

  // Genera los 7 días de la semana (Lunes a Domingo)
  public weekDays = computed(() => {
    const days = [];
    const start = new Date(this.startOfWeek());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  });

  constructor() { }

  ngOnInit() {
    this.atencionesService.findAll().subscribe();
  }

  private getMonday(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  changeWeek(weeks: number) {
    const next = new Date(this.startOfWeek());
    next.setDate(next.getDate() + (weeks * 7));
    this.startOfWeek.set(next);
    this.cargarAtencionesSemana();
  }

  isSunday(date: Date): boolean {
    return date.getDay() === 0;
  }

  getAtencionesPorDia(day: Date) {
    // Formato "YYYY-MM-DD" local de la columna de la agenda
    const fechaGrilla = day.toLocaleDateString('sv-SE');

    return this.atencionesService.atenciones().filter(cita => {
        // Extraemos solo la parte de la fecha del ISO que viene de Prisma
        // cita.fecha es "2026-05-18T00:00:00.000Z" -> split da "2026-05-18"
        const fechaCita = cita.fecha.split('T')[0];

        return fechaCita === fechaGrilla;
    });
  }

  // 4. Cálculo de posición (Celdas de h-24 = 96px)
  calcularTop(fecha: string): string {
    if (!fecha) return '0px';

    const date = new Date(fecha);

    // USAMOS UTC PARA EVITAR EL DESFASE DE CHILE (UTC-4)
    const hour = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    // Offset desde las 08:00 AM
    const hourOffset = hour - 8;

    // 40px por cada 15 min = 160px por hora
    const topFromHours = hourOffset * 160;
    const topFromMinutes = (minutes / 15) * 40;

    const totalTop = topFromHours + topFromMinutes;

    // El log ahora debería decir: Cita a las 10:30 -> Top: 400px
    console.log(`Cita a las ${hour}:${minutes} (UTC) -> Top: ${totalTop}px`);

    return `${totalTop}px`;
  }
  private cargarAtencionesSemana() {
    const fechaISO = this.startOfWeek().toISOString().split('T')[0];
    // Llamada a NestJS usando el parámetro fecha
    this.atencionesService.findAll(fechaISO).subscribe();
  }

  openMenu(event: MouseEvent, day: Date, interval: string) {
    // Evitamos que el clic se propague si hay algo detrás
    event.stopPropagation();

    // Si ya está abierto en la misma celda, lo cerramos (toggle)
    if (this.activeMenu()?.interval === interval && this.activeMenu()?.day === day) {
      this.activeMenu.set(null);
      return;
    }

    // Guardamos la posición del clic y los datos de la celda
    this.activeMenu.set({
      day,
      interval,
      x: event.clientX,
      y: event.clientY
    });
  }

  // Cerrar menú al hacer clic fuera (llamar desde el scroll o el fondo)
  closeMenu() {
    this.activeMenu.set(null);
  }

  openCitaMenu(event: MouseEvent, cita: any) {
    event.preventDefault();
    event.stopPropagation();

    // Cerramos el menú de "Dar cita" si estuviera abierto
    this.activeMenu.set(null);

    this.activeCitaMenu.set({
      cita,
      x: event.clientX,
      y: event.clientY
    });
  }

  closeCitaMenu() {
    this.activeCitaMenu.set(null);
  }


  getPosicionTop(horaStr: string): string {
    if (!horaStr) return '0px';
    const [horas, minutos] = horaStr.split(':').map(Number);

    // Calculamos la posición basándonos en bloques de 15 min
    // Cada salto de 15 min debe coincidir con el inicio de la siguiente celda
    const minutosDesdeInicio = (horas - this.HORA_INICIO) * 60 + minutos;
    const bloquesDe15 = minutosDesdeInicio / 15;

    // IMPORTANTE: El 'top' debe ser acumulativo.
    // Si un bloque de 15min mide 79px pero el de 30min no es el doble,
    // hay que ajustar el multiplicador. Prueba con 39.5px como base de posicionamiento:
    return `${bloquesDe15 * 39.5}px`;
  }

  getAlturaDinamica(duracion: string | number): string {
    const min = Number(duracion);

    // Si la duración está en nuestro mapa, usamos el valor exacto
    if (this.DURACION_HEIGHTS[min]) {
      return `${this.DURACION_HEIGHTS[min]}px`;
    }

    // Fallback por si hay una duración distinta (ej: 20 min)
    // Calculamos una base promedio de 5.3px por minuto basada en tus datos
    return `${min * 5.3}px`;
  }

}
