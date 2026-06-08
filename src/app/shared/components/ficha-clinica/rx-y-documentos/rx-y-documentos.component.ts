import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PacientesService } from '../../../../features/pacientes/services/pacientes.service';

interface ArchivoClinico {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  url: string;
  tamano: string;
}

@Component({
  selector: 'app-rx-y-documentos',
  templateUrl: './rx-y-documentos.component.html',
  styleUrls: ['./rx-y-documentos.component.css'],
  standalone  : true,
  imports: []
})
export class RxYDocumentosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public pacientesService = inject(PacientesService);

  pacienteId = signal<string | null>(null);
  // 🔥 Inicializado vacío para renderizar el contenedor gris calcado de la captura
  archivos = signal<ArchivoClinico[]>([]);
  isDragging = signal<boolean>(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.pacienteId.set(params.get('id'));
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.procesarArchivoLocal(files[0]);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.procesarArchivoLocal(files[0]);
    }
  }

  private procesarArchivoLocal(file: File) {
    const nuevoArchivo: ArchivoClinico = {
      id: Date.now().toString(),
      nombre: file.name,
      tipo: file.type.includes('image') ? 'Radiografía' : 'Documento',
      fecha: new Date().toLocaleDateString('sv-SE'), // Formato YYYY-MM-DD
      url: URL.createObjectURL(file), // Genera una preview real de la radiografía cargada
      tamano: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    };

    this.archivos.update(lista => [nuevoArchivo, ...lista]);
    this.pacientesService.showSuccess('Documento incorporado a OmniSalud');
  }

  eliminarArchivo(id: string) {
    this.archivos.update(lista => lista.filter(arc => arc.id !== id));
    this.pacientesService.showSuccess('Archivo removido');
  }

}
