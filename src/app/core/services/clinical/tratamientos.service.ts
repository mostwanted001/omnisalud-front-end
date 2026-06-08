import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable, shareReplay } from 'rxjs';

// 1. Ítems del Presupuesto (lo que el backend guarda en la tabla 'presupuesto_items')
export interface PresupuestoItem {
  id: string;
  presupuestoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  pieza?: number | null; // El diente (opcional para estética)
  cara?: string | null;  // (opcional para estética)
  completacion: number;
  futuraRealizacion: boolean;
  estado?: 'PENDIENTE' | 'ABONADO' | 'PAGADO';
  codigo?: string;
  categoria?: string;
  nombre?: string;
}

// 2. Respuesta completa del Presupuesto (espejo de tu modelo Prisma)
export interface PresupuestoResponse {
  id: string;
  pacienteId: string;
  profesionalId: string; // 🔥 CLAVE: Ya no es dentistaId
  odontogramaRaw: any;
  total: number;
  estado: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'FINALIZADO' | 'EN_PROGRESO';
  items: PresupuestoItem[];
  profesional?: {
    especialidad: string;
    user: {
      fullName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// 3. DTO para crear (lo que tu formulario envía)
export interface CreateTreatmentDto {
  pacienteId: string;
  profesionalId: string;
  odontogramaRaw?: any;
  items: {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    pieza?: number;
    cara?: string;
  }[];
}


@Injectable({
  providedIn: 'root'
})
export class TratamientosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/treatments`;
  private catalogUrl = `${environment.apiUrl}/treatments/catalog`;

  private cache$: Observable<any[]> | null = null;

  // 2. Obtener historial (ya validado con tu ruta del controller)
  getTratamientosByPaciente(pacienteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}`);
  }

  // 3. Crear plan (enviando el payload exacto que espera tu Service en NestJS)
  crearPlanTratamiento(dto: CreateTreatmentDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  // 4. Catálogo genérico (Dental/Estética)
  getAllCatalog(): Observable<any[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<any[]>(this.catalogUrl).pipe(shareReplay(1));
    }
    return this.cache$;
  }

  getTreatmentsByCategory(category: 'DENTAL' | 'ESTETICA'): Observable<any[]> {
    return new Observable<any[]>(subscriber => {
      this.getAllCatalog().subscribe(all => {
        const filtered = all.filter(t => t.category === category);
        subscriber.next(filtered);
        subscriber.complete();
      });
    });
  }
}




