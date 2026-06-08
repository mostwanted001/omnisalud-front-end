import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PacientesService } from '../../../../features/pacientes/services/pacientes.service';

interface ConsentimientoClinico {
  id: string;
  titulo: string;
  fecha: string;
  firmado: boolean;
  anulado: boolean;
}

@Component({
  selector: 'app-consentimientos',
  templateUrl: './consentimientos.component.html',
  styleUrls: ['./consentimientos.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ConsentimientosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public pacientesService = inject(PacientesService);

  pacienteId = signal<string | null>(null);

  // Flag para el filtro de la captura
  mostrarAnulados = signal<boolean>(false);

  // Inicializado vacío para ver el estado calcado de la imagen
  consentimientos = signal<ConsentimientoClinico[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.pacienteId.set(params.get('id'));
    });
  }

  crearNuevoConsentimiento() {
    this.pacientesService.showSuccess('OmniSalud: Abriendo catálogo de documentos de consentimiento');
  }

}
