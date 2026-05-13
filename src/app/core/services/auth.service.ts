import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // URL de tu NestJS (ajusta según tu environment)
  private apiUrl = 'http://localhost:3000/api/v1/auth';

  // Signal para manejar el estado global del usuario
  public currentUser = signal<any>(null);

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        // Si el login es exitoso, guardamos el JWT para futuras peticiones
        if (res.access_token) {
          localStorage.setItem('token', res.access_token);
          localStorage.setItem('user_role', res.user.role);
        }
        this.router.navigate(['/agenda']);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}