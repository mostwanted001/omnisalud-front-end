import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArancelesService {
  private http = inject(HttpClient);

  // URL de tu API en NestJS
  private readonly apiUrl = 'http://localhost:3000/api/v1/aranceles';

  // Listar todos los aranceles (Vista principal)
  getAranceles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Crear una nueva "Carpeta" (Modal Azul)
  createArancel(data: { nombre: string; dentistaId: string; tipo?: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  deleteArancel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}
