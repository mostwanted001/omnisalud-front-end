import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArancelesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/aranceles`;

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
