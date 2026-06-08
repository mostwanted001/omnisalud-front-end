import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PacientesService } from '../../../../features/pacientes/services/pacientes.service';

interface Prescripcion {
  id: string;
  doctor: string;
  iniciales: string;
  tratamientoAsociado: string;
  fecha: string;
  contenido: string;
  anulada: boolean;
}

@Component({
  selector: 'app-recetas',
  templateUrl: './recetas.component.html',
  styleUrls: ['./recetas.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class RecetasComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public pacientesService = inject(PacientesService);

  pacienteId = signal<string | null>(null);

  // Modelos del formulario izquierdo
  textoPrescripcion = signal<string>('');
  plantillaSeleccionada = signal<string>('');

  // Control de filtros de la derecha
  mostrarAnuladas = signal<boolean>(false);
  filtroTratamiento = signal<string>('');

  // Historial de recetas emitidas
  recetasEmitidas = signal<Prescripcion[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.pacienteId.set(params.get('id'));
    });

    // Inicializamos con la receta exacta de tu captura para el MVP de QA
    this.recetasEmitidas.set([
      {
        id: '1',
        doctor: 'Dr.(a) Pamela Rodriguez',
        iniciales: 'PR',
        tratamientoAsociado: 'Tratamiento #2353',
        fecha: '27 de jun. 2024, 13:06',
        contenido: 'Optagen Compuesto (solución oftalmica)\n\n1 gota en cada ojo cada 8 horas por 7 dias',
        anulada: false
      }
    ]);
  }

  aplicarPlantilla() {
    if (this.plantillaSeleccionada() === 'amoxicilina') {
      this.textoPrescripcion.set('Amoxicilina 500mg (Cápsulas)\n\nTomar 1 cápsula cada 8 horas por 7 días.');
    } else if (this.plantillaSeleccionada() === 'ibuprofeno') {
      this.textoPrescripcion.set('Ibuprofeno 600mg (Tabletas)\n\nTomar 1 tableta cada 12 horas en caso de dolor o inflamación por 3 días.');
    }
  }

  emitirNuevaPrescripcion() {
    if (!this.textoPrescripcion().trim()) {
      this.pacientesService.showSuccess('Por favor escribe las indicaciones de la prescripción.');
      return;
    }

    const nueva: Prescripcion = {
      id: Date.now().toString(),
      doctor: 'Dr.(a) Pamela Rodriguez', // Podrá mapearse desde tu Auth más adelante
      iniciales: 'PR',
      tratamientoAsociado: `Tratamiento #${Math.floor(1000 + Math.random() * 9000)}`,
      fecha: new Date().toLocaleString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      contenido: this.textoPrescripcion(),
      anulada: false
    };

    this.recetasEmitidas.update(lista => [nueva, ...lista]);
    this.textoPrescripcion.set(''); // Limpiamos el editor izquierdo
    this.plantillaSeleccionada.set('');
    this.pacientesService.showSuccess('OmniSalud: Prescripción creada con éxito');
  }

  anularReceta(id: string) {
    this.recetasEmitidas.update(lista =>
      lista.map(rec => rec.id === id ? { ...rec, anulada: true } : rec)
    );
    this.pacientesService.showSuccess('Prescripción anulada correctamente');
  }

  imprimirReceta(id: string) {
    this.pacientesService.showSuccess('Generando PDF listo para impresión corporativa...');
  }




}
