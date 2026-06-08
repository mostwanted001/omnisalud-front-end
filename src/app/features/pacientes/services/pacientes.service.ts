import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Paciente } from '../../../core/models/atencion.model';
import { Observable, tap } from 'rxjs';




@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/patients`;

  // Signals para el estado
  public pacientes = signal<Paciente[]>([]);
  public filterQuery = signal<string>('');
  public notification = signal<{message: string, show: boolean}>({ message: '', show: false });


  showSuccess(msg: string) {
    this.notification.set({ message: msg, show: true });
    setTimeout(() => {
      this.notification.set({ message: '', show: false });
    }, 5000); // Se oculta tras 3 segundos
  }

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
  // Método limpio que retorna el flujo de datos
  /**
   * Obtiene todos los pacientes, actualiza el Signal global
   * y sigue retornando el Observable para componentes como DailyView.
   */
  findAll(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.apiUrl).pipe(
      tap((data: Paciente[]) => {
        // 🔥 Esto actualiza el Signal del servicio automáticamente
        this.pacientes.set(data);
        console.log('Signal global de pacientes actualizado desde el servicio');
      })
    );
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

  create(patient: any): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, patient);
  }

  update(id: string, patientData: any): Observable<Paciente> {
    return this.http.patch<Paciente>(`${this.apiUrl}/${id}`, patientData);
  }

  addPaciente(nuevo: Paciente) {
    this.pacientes.update(lista => [nuevo, ...lista]);
  }

  updatePacienteInList(editado: Paciente) {
    this.pacientes.update(lista =>
      lista.map(p => p.id === editado.id ? editado : p)
    );
  }

}


