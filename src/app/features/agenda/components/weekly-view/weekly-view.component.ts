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

  // 3. Filtrado por día para el renderizado en la grilla
  getAtencionesPorDia(day: Date) {
    // 1. Obtenemos el string YYYY-MM-DD del día de la grilla (local)
    const y = day.getFullYear();
    const m = (day.getMonth() + 1).toString().padStart(2, '0');
    const d = day.getDate().toString().padStart(2, '0');
    const fechaGrilla = `${y}-${m}-${d}`;

    // 2. Filtramos asegurándonos de comparar manzanas con manzanas
    return this.atencionesService.atenciones().filter(cita => {
      // Si cita.fecha es "2026-04-21T10:30:00.000Z", tomamos solo los primeros 10 caracteres
      const fechaCita = cita.fecha.substring(0, 10);
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

}
