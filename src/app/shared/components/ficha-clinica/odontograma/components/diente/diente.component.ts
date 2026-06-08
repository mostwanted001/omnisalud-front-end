import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { EstadoPieza } from '../../models/odontograma.models';

// Interfaz para TypeScript estricto
export interface CarasDiente {
  v: boolean; o: boolean; m: boolean; d: boolean; l: boolean; corona?: boolean;
}

@Component({
  selector: 'app-diente',
  templateUrl: './diente.component.html',
  styleUrls: ['./diente.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class DienteComponent  {
  @Input() numero: number = 0;
  @Input() esSuperior: boolean = true;
  @Input() esIzquierdo: boolean = false;
  @Input() posiciones: Record<string, string> = {};



  @Output() seleccionCambio = new EventEmitter<any>();

  // Señales de estado
  public seleccionadoTotal = signal(false);
  public caras = signal<CarasDiente>({
    v: false,
    o: false,
    m: false,
    d: false,
    l: false,
    corona: false
  });

  private _estado: EstadoPieza | undefined;

@Input()
set estado(val: EstadoPieza | undefined) {
  this._estado = val;
  if (val) {
    console.log(`✅ Pieza ${this.numero} actualizada:`, val.hallazgos);
  } else {
    console.warn(`⚠️ Pieza ${this.numero} recibió undefined`);
  }
}

get estado() { return this._estado; }

  ngOnChanges() {
    console.log(`Pieza ${this.numero} recibió hallazgos:`, this.estado?.hallazgos);
  }

  /**
   * Genera la URL del archivo SVG basado en el número FDI.
   * Asumimos que los archivos están en assets/odontograma/
   */
  getImagenUrl(): string {
    // Simplemente concatenamos la 'p' con el número de la pieza
    // Si numero es 11, devuelve assets/odontograma/p11.svg
    return `assets/odontograma/p${this.numero}.svg`;
  }
  // --- (Lógica de toggleCara y toggleDienteCompleto se mantiene igual) ---
  toggleCara(cara: keyof CarasDiente, event: Event) {
    event.stopPropagation();

    // Ahora .update() funcionará porque caras es un Signal
    this.caras.update(prev => ({
      ...prev,
      [cara]: !prev[cara]
    }));

    this.emitirEstado();
  }

  estaSiendoEditado(): boolean {
    // 1. Verificamos si el signal de selección total es true
    if (this.seleccionadoTotal()) return true;

    // 2. Verificamos si alguna de las caras (v, o, m, d, l) es true
    // Al ser un Signal, accedemos al valor con caras()
    return Object.values(this.caras()).some(activa => activa);
  }

  tieneCorona(): boolean {
    return this.caras().corona || false;
  }



  toggleDienteCompleto() {
    const nuevoEstado = !this.seleccionadoTotal();
  this.seleccionadoTotal.set(nuevoEstado);

  // ERROR ANTERIOR: this.caras = { ... }
  // CORRECCIÓN: Usar .set() para actualizar el Signal completo
  this.caras.set({
    v: nuevoEstado,
    o: nuevoEstado,
    m: nuevoEstado,
    d: nuevoEstado,
    l: nuevoEstado
  });

  this.emitirEstado();
  }

  private emitirEstado() {
    this.seleccionCambio.emit({
      pieza: this.numero,
      seleccionado: this.seleccionadoTotal(),
      caras: this.caras
    });
  }

  // Método para activar la corona desde el drawer de diagnóstico
  setDiagnosticoCorona(estado: boolean) {
    this.caras.update(prev => ({
      ...prev,
      corona: estado
    }));
  }




}
