import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Estado para el botón de carga y errores
  isLoading = signal(false);
  errorMessage = signal('');

  // Definimos el formulario con los mismos nombres que usaremos en el HTML
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.value as { email: string; password: string };

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.isLoading.set(false);

        // DEBUG: Para que veas en la consola qué está llegando
        console.log('Respuesta del servidor:', res);

        // 1. Extraemos los datos usando los nombres exactos del JSON
        const role = res.user?.role || res.role; // Captura "ADMIN"
        const name = res.user?.fullName || res.fullName;

        // 2. Guardamos en LocalStorage
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_name', name);

        // 3. REDIRECCIÓN: Ajustamos la comparación a "ADMIN"
        if (role === 'ADMIN' || role === 'ADMINISTRADOR') {
          this.router.navigate(['/admin/stats']);
        } else {
          this.router.navigate(['/agenda']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        // Si el servidor dio 200 pero entraste aquí, es un error de código en el 'next'
        this.errorMessage.set('Error al procesar el inicio de sesión.');
        console.error('Error:', err);
      }
    });
  }
}
