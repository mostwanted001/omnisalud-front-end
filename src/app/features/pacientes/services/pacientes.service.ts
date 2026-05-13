import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { Paciente } from '../../../core/models/atencion.model';
import { Observable } from 'rxjs';




@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/patients`;

  // Signals para el estado
  public pacientes = signal<Paciente[]>([]);
  public filterQuery = signal<string>('');



// ✅ Lógica de filtrado inteligente (Computed)
  // Se recalcula automáticamente cuando cambia la lista o el texto de búsqueda
  public filteredPacientes = computed(() => {
    const query = this.filterQuery().toLowerCase().trim();
    // Forzamos el tipo aquí para que TS no use 'any' o un tipo base genérico
    const lista: Paciente[] = this.pacientes();

    if (!query) return lista;

    return lista.filter((p: Paciente) => {
      // Acceso seguro usando la interfaz que definimos
      // Ahora TS reconocerá que p.user tiene rut y email
      const name = (p.user?.fullName || '').toLowerCase();
      const rut = (p.user?.rut || '').toLowerCase();
      const email = (p.user?.email || '').toLowerCase();
      const comuna = (p.comuna || '').toLowerCase();

      return (
        name.includes(query) ||
        rut.includes(query) ||
        email.includes(query) ||
        comuna.includes(query)
      );
    });
  });

  /**
   * Obtiene todos los pacientes desde NestJS
   * El backend debe retornar el objeto con: include: { user: true }
   */
  findAll() {
    return this.http.get<Paciente[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.pacientes.set(data);
      },
      error: (err) => {
        console.error('Error al cargar pacientes en Sede Chillán:', err);
      }
    });
  }

  /**
   * Obtiene un solo paciente por ID con todo su perfil clínico
   */
  findOne(id: string) {
    return this.http.get<Paciente>(`${this.apiUrl}/${id}`);
  }


  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

}


