import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, signal } from '@angular/core';
import { ArancelesService } from '../../../core/services/aranceles.service';
import { PrestacionesService } from '../../../core/services/prestaciones.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DienteComponent } from "./components/diente/diente.component";
import { FormsModule } from '@angular/forms';
import { EstadoPieza, RegistroHistorial } from './models/odontograma.models';

export interface DienteFDI {
  numero: number;
  v: string; l: string; m: string; d: string; o: string;
  [key: string]: any;
}

export interface Hallazgo {
  pieza: number;
  cara: string;
  diagnostico: string;
  precio: number;
}

interface HallazgoGuardado {
  pieza: number;
  hallazgoId: string;
  comentario: string;
  icon: string;
  tipo: 'diagnostico' | 'lesion' | 'otros';
}




type VistaDrawer = 'ARANCELES' | 'PRESTACIONES';


@Component({
  selector: 'app-odontograma',
  standalone: true,
  imports: [CommonModule, DienteComponent, FormsModule],
  templateUrl: './odontograma.component.html',
  styleUrl: './odontograma.component.scss'
})
export class OdontogramaComponent {

  private arancelesService = inject(ArancelesService);

  // --- Inputs de Contexto ---
  @Input() pacienteId: string = '';
  @Input() dentistaId: string = '';

  // --- Signals de Interfaz ---
  public tipoDenticion = signal<'permanente' | 'temporal'>('permanente');
  public showSextantes = signal<boolean>(true);
  public isDrawerOpen = signal(false);
  public vistaActual = signal<VistaDrawer>('ARANCELES');

  // --- Signals de Datos y Hallazgos ---
  // Guardamos el estado global de lo que el dentista va marcando
  public piezasMarcadas = signal<Record<number, any>>({});
  public seleccionActual = signal<{ pieza: number, cara: string } | null>(null);
  public prestacionesSeleccionadas = signal<any[]>([]);
  public arancelesParaDrawer = signal<any[]>([]);

  // Estas son las señales que te faltan para controlar la barra de herramientas
  public modoVisualizacion = signal<'diagnostico' | 'informacion' | 'odontograma'>('odontograma');
  public soloDiagnostico = signal<boolean>(false);

  public hallazgosSextantes = signal<Set<string>>(new Set());

  // Define una señal o variable para el hallazgo seleccionado
  public hallazgoSeleccionado = signal<any | null>(null);

  // Signal para controlar qué hallazgo está activo en el panel
  public hallazgoActivo = signal<any | null>(null);

  // Signal que almacena todos los hallazgos del paciente
public hallazgosPaciente = signal<HallazgoGuardado[]>([]);

// Signal para la tabla de abajo
public historialOdontograma = signal<RegistroHistorial[]>([]);

// Referencia al textarea para capturar el texto
public comentarioTexto = '';

public mostrarAlertaExito = signal<boolean>(false);

public estadoOdontograma = signal<Record<number, EstadoPieza>>(this.generarEstadoInicial());

  posicionesHallazgo: Record<string, string> = {
    'corona': '45px',           // Solo el valor
    'corona_prov': '45px',
    'endodoncia': '16px',
    'restauracion': '43px',
    'implante': '6px',
    'perno': '42px',
    'otro': '76px',
    'protesis': '76px', // Bien abajo del diente
    'corona_malo': '45px',           // Igual que corona
    'corona_prov_malo': '45px',      // Igual que corona_prov
    'perno_malo': '42px',            // Igual que perno
    'restauracion_malo': '43px',     // Igual que restauracion
    'amalgama_malo': '43px',         // Igual que amalgama
    'implante_malo': '6px',          // Igual que implante
    'endodoncia_malo': '16px',       // Igual que endodoncia

    // Lesiones

    'caries': '43px',          // Centro de la corona
    'inf_pulpar': '12px',      // Dentro de la cámara pulpar (raíces)
    'fractura': '13px',        // Parte superior de la pieza
    'movilidad': '2px',       // Envuelve los costados del diente
    'residuo': '44px',         // Solo en el área radicular
    'erosion': '45px',         // Superficie oclusal/incisal
    'atricion': '54px',        // Desgaste en la punta (base del dibujo)
    'abfraccion': '34px',      // Cuello del diente
    'otro_lesion': '75px',

    // --- OTRAS SIMBOLOGÍAS ---
    'sin_erupcionar': '75px',  // Debajo del diente
    'diente_sano': '75px',     // Debajo del diente
  };

  public sextantesConfig = [
    { id: 's1', label: 'Sextante I' },
    { id: 's2', label: 'Sextante II' },
    { id: 's3', label: 'Sextante III' },
    { id: 's4', label: 'Sextante IV' },
    { id: 's5', label: 'Sextante V' },
    { id: 's6', label: 'Sextante VI' },
    { id: 'as', label: 'Arcada Sup.' },
    { id: 'ai', label: 'Arcada Inf.' },
  ];

  public opcionesDiagnostico = [
    { id: 'corona', nombre: 'Corona', icon: 'corona.svg' },
    { id: 'corona_prov', nombre: 'Corona provisoria', icon: 'corona_prov.svg' },
    { id: 'endodoncia', nombre: 'Endodoncia', icon: 'endo.svg' },
    { id: 'restauracion', nombre: 'Restauración', icon: 'restauracion.svg' },
    { id: 'implante', nombre: 'Implante', icon: 'implante.svg' },
    { id: 'perno', nombre: 'Perno muñón', icon: 'perno.svg' },
    { id: 'otro', nombre: 'Otro', icon: 'otro.svg' },
    { id: 'protesis', nombre: 'Prótesis removible', icon: 'protesis.svg' },
    { id: 'corona_malo', nombre: 'Corona (Mal Estado)', icon: 'corona_malo.svg' },
    { id: 'corona_prov_malo', nombre: 'Corona Prov. (Mal Estado)', icon: 'corona_prov_malo.svg' },
    { id: 'perno_malo', nombre: 'Perno Muñón (Mal Estado)', icon: 'perno_malo.svg' },
    { id: 'restauracion_malo', nombre: 'Restauración (Mal Estado)', icon: 'restauracion_malo.svg' },
    { id: 'amalgama', nombre: 'Amalgama', icon: 'amalgama.svg' },
    { id: 'amalgama_malo', nombre: 'Amalgama (Mal Estado)', icon: 'amalgama_malo.svg' },
    { id: 'sellante', nombre: 'Sellante', icon: 'sellante.svg' },
    { id: 'implante_malo', nombre: 'Implante (Mal Estado)', icon: 'implante_malo.svg' },
    { id: 'endodoncia_malo', nombre: 'Endodoncia (Mal Estado)', icon: 'endo_malo.svg' },
    { id: 'ausente', nombre: 'Ausente'},



  ];

  public opcionesLesiones = [
    { id: 'caries', nombre: 'Caries', icon: 'caries.svg' },
    { id: 'inf_pulpar', nombre: 'Infección Pulpar', icon: 'inf_pulpar.svg' },
    { id: 'fractura', nombre: 'Fractura', icon: 'fractura.svg' },
    { id: 'movilidad', nombre: 'Movilidad', icon: 'movilidad.svg' },
    { id: 'residuo', nombre: 'Residuo Radicular', icon: 'residuo.svg' },
    { id: 'erosion', nombre: 'Erosión', icon: 'erosion.svg' },
    { id: 'atricion', nombre: 'Atrición', icon: 'atricion.svg' },
    { id: 'abfraccion', nombre: 'Abfracción', icon: 'abfraccion.svg' },
    { id: 'otro_lesion', nombre: 'Otro', icon: 'otro_lesion.svg' },
];

public opcionesOtras = [
  { id: 'sin_erupcionar', nombre: 'Sin erupcionar', icon: 'sin_erupcionar.svg' },
  { id: 'diente_sano', nombre: 'Diente sano', icon: 'diente_sano.svg' },
];

  // --- Lógica de Cuadrantes (Números FDI) ---
  // Permanentes
  readonly cuadrante1 = [1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1];
  readonly cuadrante2 = [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8];
  readonly cuadrante4 = [4.8, 4.7, 4.6, 4.5, 4.4, 4.3, 4.2, 4.1];
  readonly cuadrante3 = [3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8];

  // Temporales
  readonly cuadrante5 = [5.5, 5.4, 5.3, 5.2, 5.1];
  readonly cuadrante6 = [6.1, 6.2, 6.3, 6.4, 6.5];
  readonly cuadrante8 = [8.5, 8.4, 8.3, 8.2, 8.1];
  readonly cuadrante7 = [7.1, 7.2, 7.3, 7.4, 7.5];




  // Función auxiliar para generar el registro inicial
  private generarEstadoInicial(): Record<number, EstadoPieza> {
    const piezas = [
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
      48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
    ];

    const estado: Record<number, EstadoPieza> = {};
    piezas.forEach(p => {
      estado[p] = { pieza: p, hallazgos: [], ausente: false };
    });
    return estado;
  }



  // --- Computed Signals ---
  public canDiagnose = computed(() => this.seleccionActual() !== null);

  public totalTratamiento = computed(() => {
    return this.prestacionesSeleccionadas().reduce((acc, p) => acc + p.precio, 0);
  });

  ngOnInit() {
    this.arancelesService.getAranceles().subscribe(res => this.arancelesParaDrawer.set(res));
  }

  /**
   * Obtiene el path SVG desde el diccionario basado en el número de pieza.
   * Maneja automáticamente la herencia visual de los temporales.
   */


  /**
   * Se ejecuta cuando el DienteComponent emite un cambio (click en cara o selección total)
   */
  onDienteCambio(evento: any) {
    // Actualizamos el registro de piezas marcadas
    this.piezasMarcadas.update(prev => ({
      ...prev,
      [evento.pieza]: evento
    }));

    // Seteamos la última selección para el drawer de diagnósticos
    this.seleccionActual.set({
      pieza: evento.pieza,
      cara: Object.keys(evento.caras).find(key => evento.caras[key]) || 'O'
    });

    console.log('Estado actualizado para pieza:', evento.pieza);
  }

  // --- Helpers de UI ---
  esIzquierdo(numero: number): boolean {
    const cuadrante = Math.floor(numero / 10);
    return [2, 3, 6, 7].includes(cuadrante);
  }

  toggleSextantes() {
    this.showSextantes.update(v => !v);
  }
  cambiarDenticion(tipo: 'permanente' | 'temporal'): void {
    this.tipoDenticion.set(tipo);

    // Opcional: Limpiar la selección actual al cambiar de vista
    // para evitar que quede un diagnóstico "fantasma" de una pieza que ya no se ve
    this.seleccionActual.set(null);

    console.log(`CitaSalud: Cambiando vista a dentición ${tipo}`);
  }

  setModoVisualizacion(modo: 'diagnostico' | 'informacion'): void {
    this.modoVisualizacion.set(modo);

    // Si pasamos a modo información, quizás quieras cerrar el drawer
    if (modo === 'informacion') {
      this.isDrawerOpen.set(false);
    }

    console.log(`CitaSalud: Modo cambiado a ${modo}`);
  }

  /**
   * Alterna el filtro para mostrar solo piezas con hallazgos
   */
  toggleSoloDiagnostico(): void {
    this.soloDiagnostico.update(val => !val);
  }

  imprimirOdontograma(): void {
    console.log('CitaSalud - Preparando impresión...');


  }

  toggleHallazgoSextante(id: string): void {
    this.hallazgosSextantes.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    console.log('CitaSalud - Sextante actualizado:', id);
  }


  // Método para manejar el toggle
seleccionarHallazgo(hallazgo: any) {
  if (this.hallazgoSeleccionado()?.id === hallazgo.id) {
    // Si hago clic en el mismo que ya está abierto, lo cierro (Toggle OFF)
    this.hallazgoSeleccionado.set(null);
  } else {
    // Si es uno nuevo o no había nada, lo abro (Toggle ON)
    this.hallazgoSeleccionado.set(hallazgo);
  }
}

toggleHallazgo(item: any) {
  // Si el usuario hace clic en el que ya está abierto, lo cerramos
  if (this.hallazgoActivo()?.id === item.id) {
    this.hallazgoActivo.set(null);
  } else {
    // Si hace clic en uno nuevo, abrimos el panel con ese item
    this.hallazgoActivo.set(item);
  }
}

agregarHallazgo() {
  console.log('🚀 Click detectado en agregarHallazgo');


  console.log('Selección:', this.hallazgoSeleccionado(), this.seleccionActual());


  const hallazgo = this.hallazgoSeleccionado();
  const piezaActual = this.seleccionActual()?.pieza;

  console.log('Estado actual:', { hallazgo, piezaActual });

  if (!hallazgo) {
    console.warn('⚠️ No hay hallazgo seleccionado');
    return;
  }

  if (!piezaActual) {
    console.warn('⚠️ No hay pieza seleccionada');
    return;
  }

  // Si llega aquí, debería funcionar todo lo demás
  this.actualizarEstadoPieza(piezaActual, hallazgo);
  // ... resto del código ...
  this.mostrarAlertaExito.set(true);
  setTimeout(() => this.mostrarAlertaExito.set(false), 2500);
}

actualizarEstadoPieza(numPieza: any, hallazgo: any) {
  // Convertimos a entero para evitar el "1.8"
  const piezaId = parseInt(numPieza.toString().replace('.', ''));

  this.estadoOdontograma.update(estadoAnterior => {
    const nuevoEstado = { ...estadoAnterior };

    // Si por alguna razón la pieza no existe en el mapa, la creamos
    if (!nuevoEstado[piezaId]) {
      nuevoEstado[piezaId] = { pieza: piezaId, hallazgos: [], ausente: false };
    }

    const piezaEditada = {
      ...nuevoEstado[piezaId],
      hallazgos: [...nuevoEstado[piezaId].hallazgos, { ...hallazgo }]
    };

    if (hallazgo.id === 'ausente') piezaEditada.ausente = true;

    nuevoEstado[piezaId] = piezaEditada;
    return nuevoEstado;
  });
}


}



