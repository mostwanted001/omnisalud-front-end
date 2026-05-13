import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { Presupuesto } from '../../../core/models/atencion.model';


@Injectable({
  providedIn: 'root'
})
export class TratamientosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/treatments`;

  // Obtener tratamientos por paciente (usando el ID del paciente)
  getByPaciente(pacienteId: string) {
    return this.http.get<Presupuesto[]>(`${this.apiUrl}/paciente/${pacienteId}`);
  }



  // Lógica de cálculo Senior: Sumar los ítems de un tratamiento
  calculateTotal(presupuesto: Presupuesto): number {
    // Verificación de seguridad por si items viene undefined
    if (!presupuesto.items || presupuesto.items.length === 0) return 0;

    return presupuesto.items.reduce((acc, item) => {
      // Convertimos a Number por si Prisma los envía como string/Decimal
      const cantidad = Number(item.cantidad) || 0;
      const precio = Number(item.precioUnitario) || 0;

      return acc + (cantidad * precio);
    }, 0);
  }

}
