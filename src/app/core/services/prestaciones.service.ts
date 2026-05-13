import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PrestacionesService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/prestaciones`;

  // Traer items de una carpeta específica
  getByArancel(arancelId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/arancel/${arancelId}`);
  }

  // Crear item (Modal Verde)
  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}


