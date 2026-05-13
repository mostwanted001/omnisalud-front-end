import { Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from "@angular/router";
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dentist-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './dentist-layout.component.html',
  styleUrl: './dentist-layout.component.scss'
})
export class DentistLayoutComponent {

  authService = inject(AuthService);

  onLogout() {
    this.authService.logout();
  }
}
