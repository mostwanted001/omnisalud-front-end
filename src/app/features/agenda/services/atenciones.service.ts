import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { Atencion } from '../../../core/models/atencion.model';


@Injectable({
  providedIn: 'root'
})
export class AtencionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/atenciones`;

  // --- SIGNALS (Single Source of Truth) ---
  public atenciones = signal<any[]>([]);
  public isLoading = signal<boolean>(false);

  // --- COMPUTED SIGNALS (Lógica reactiva sin peticiones extra) ---
  // Se actualizan solos cuando 'atenciones' cambia
  public proximasCitas = computed(() =>
    this.atenciones().filter(a => a.status === 'PROGRAMADA')
  );

  public atencionesDelDia = computed(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return this.atenciones().filter(a => a.fecha.startsWith(hoy));
  });

  constructor() {
    this.initData();
  }

  private initData() {
    this.findAll().subscribe();
  }

  /**
   * Obtener todas las atenciones
   * Eliminamos el caché manual para forzar la sincronización con el Backend
   */
  findAll(fecha?: string) {
    // Asegúrate de que baseUrl sea solo http://localhost:3000/api/v1
    const endpoint = `${this.apiUrl}`;

    // Usamos HttpParams para que Angular maneje los símbolos '?' y '=' por nosotros
    let params = new HttpParams();
    if (fecha) {
      params = params.append('fecha', fecha);
    }

    return this.http.get<Atencion[]>(endpoint, { params }).pipe(
      tap(res => {
        this.atenciones.set(res);
        console.log('Sincronizado con NestJS:', res);
      })
    );
  }

  /**
   * Crear nueva cita
   */
  create(atencionData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, atencionData).pipe(
      tap(nueva => {
        // Optimistic UI: agregamos al signal de inmediato
        this.atenciones.update(list => [nueva, ...list]);
      })
    );
  }

  /**
   * Actualizar estado o datos clínicos
   */
  update(id: number | string, data: Partial<any>): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updated => {
        this.atenciones.update(list =>
          list.map(a => a.id === id ? { ...a, ...updated } : a)
        );
      })
    );
  }

  /**
   * Eliminar cita
   */
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.atenciones.update(list => list.filter(a => a.id !== id));
      })
    );
  }

  /**
   * Consultas específicas por Paciente
   */
  getHistorialByPaciente(pacienteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}/historial`);
  }
}

