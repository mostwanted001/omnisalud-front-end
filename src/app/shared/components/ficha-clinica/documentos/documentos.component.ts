import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PacientesService } from '../../../../features/pacientes/services/pacientes.service';
import { FormsModule } from '@angular/forms';

interface DocumentoClinico {
  id: string;
  nombre: string;
  fecha: string;
  usuarioSubida: string;
  anulado: boolean;
}

@Component({
  selector: 'app-documentos',
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DocumentosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public pacientesService = inject(PacientesService);

  pacienteId = signal<string | null>(null);

  // Flag para el filtro superior de la captura
  mostrarAnulados = signal<boolean>(false);

  // Inicializado vacío para ver el estado calcado de la imagen
  documentos = signal<DocumentoClinico[]>([]);

  showModal = signal<boolean>(false);
  tipoDocumentoSeleccionado = signal<string>('')

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.pacienteId.set(params.get('id'));
    });
  }

  abrirSelectorDocumento() {
    this.showModal.set(true);
    // Aquí puedes enlazar un modal o un input file tradicional más adelante
    this.pacientesService.showSuccess('OmniSalud: Preparando carga de nuevo documento clínico');
  }

  cerrarModal() {
    this.showModal.set(false);
    this.tipoDocumentoSeleccionado.set(''); // Limpiamos la selección
  }

  procesarContinuar() {
    if (!this.tipoDocumentoSeleccionado()) {
      this.pacientesService.showSuccess('Por favor, seleccione un tipo de documento clínico');
      return;
    }

    this.pacientesService.showSuccess(`Creando: ${this.tipoDocumentoSeleccionado()}`);
    this.cerrarModal();
  }

}
