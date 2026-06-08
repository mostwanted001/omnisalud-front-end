import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from "@angular/router";
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-clinical-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './clinical-layout.component.html',
  styleUrl: './clinical-layout.component.scss'
})
export class ClinicalLayoutComponent {

  authService = inject(AuthService);
  router = inject(Router);
  isPatientContext = computed(() => this.urlSignal()?.includes('/pacientes/'));

  private urlSignal = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url) // Empezamos con la URL actual
    )
  );

  onLogout() {
    this.authService.logout();
  }

  get user() {
    return this.authService.currentUser();
  }

  get initials(): string {
    const name = this.user?.fullName;
    if (!name) return '??';

    return name
      .split(' ')
      .filter((part: string) => part.length > 0) // Tipamos 'part' como string
      .map((n: string) => n[0])                // Tipamos 'n' como string
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
