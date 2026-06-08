import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  public currentUser = signal<any>(this.getInitialUser());

  private getInitialUser(): any {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.access_token) {
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('user_data', JSON.stringify(res.user));
          this.currentUser.set(res.user);
          // Redirección genérica o basada en rol
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  logout() {
    localStorage.clear(); // 🔥 Borra todo de una vez
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // 🔥 NUEVO: Método genérico para obtener el ID de perfil (Doctor/Dentista/Esteticista)
  getProfesionalId(): string | null {
    const user = this.currentUser();
    return user?.profileId || null;
  }

  // 🔥 NUEVOS: Helpers de Rol (Útiles para esconder botones en el UI)
  isDoctor() { return this.currentUser()?.role === 'DOCTOR'; }
  isDentista() { return this.currentUser()?.role === 'DENTISTA'; }
  isEsteticista() { return this.currentUser()?.role === 'ESTETICISTA'; }
  isAdmin() { return this.currentUser()?.role === 'ADMIN'; }
}
