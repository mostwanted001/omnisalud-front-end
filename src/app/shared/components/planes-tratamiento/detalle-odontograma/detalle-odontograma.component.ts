import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OdontogramaComponent } from "../../ficha-clinica/odontograma/odontograma.component";
import { PresupuestoResponse, TratamientosService } from '../../../../core/services/clinical/tratamientos.service';
import { PacientesService } from '../../../../features/pacientes/services/pacientes.service';
import { ArancelesService } from '../../../../core/services/clinical/aranceles.service';
import { PrestacionesService } from '../../../../core/services/clinical/prestaciones.service';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// Interfaz para estructurar las filas del presupuesto
export interface ItemPresupuesto {
  id: string;
  nombre: string;
  codigo?: string;
  pieza: number;
  cara: string;
  descuento: number;
  precio: number;
  pago: number;
  simboloId?: string;
  // 📊 Nuevas propiedades extraídas de tu DOM de producción
  porcentajeCompletacion: number;
  semaforoPago: 'rojo' | 'amarillo' | 'verde';
  futuraRealizacion: boolean;
}



@Component({
  selector: 'app-detalle-odontograma',
  templateUrl: './detalle-odontograma.component.html',
  styleUrls: ['./detalle-odontograma.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, OdontogramaComponent, FormsModule, DragDropModule],
})


export class DetalleOdontogramaComponent implements OnInit {
  // 🔍 Capturamos la instancia real del componente hijo que está dibujado en el HTML
  @ViewChild(OdontogramaComponent) odontogramaHijo!: OdontogramaComponent;
  private route = inject(ActivatedRoute);
  private tratamientosService = inject(TratamientosService);
  private pacientesService = inject(PacientesService);
  private cdr = inject(ChangeDetectorRef);
  private arancelesService = inject(ArancelesService);
  private prestacionesService = inject(PrestacionesService);

  isDrawerAbierto = signal<boolean>(false);

  pacienteId = signal<string | null>(null);
  tratamientoId = signal<string | null>(null);
  loading = signal<boolean>(true);

  // Detalle del plan que viene del backend
  tratamiento = signal<PresupuestoResponse | null>(null);
  // 🦷 Estructura sugerida para recordar qué diente se pinchó
  piezaSeleccionadaDrawer = signal<string>('Sin piezas seleccionadas');
  public seleccionActualPadre = signal<{ pieza: number, cara: string } | null>(null); // La del padre

  // 🎯 Tus señales reactivas para el control de la edición
  piezasMarcadas = signal<Record<number, any>>({});
  seleccionActual = signal<{ pieza: number; cara: string } | null>(null);
  renderizarOdontograma = signal<boolean>(true);

  // Nivel de navegación y datos
  public vistaDrawer = signal<'CATEGORIAS' | 'PRESTACIONES'>('CATEGORIAS');
  public categoriaSeleccionada = signal<any | null>(null);

  public categoriasArancel = signal<any[]>([]);
  public prestacionesFiltradas = signal<any[]>([]);

  // Loading independientes para una UX limpia
  public loadingAranceles = signal<boolean>(false);
  public loadingPrestaciones = signal<boolean>(false);
  // 1. Agrega esta señal en la zona de tus propiedades
public prestacionSeleccionadaId = signal<string | number | null>(null);


// 1. Nuevas Signals para el control del Modal
public isModalAbierto = signal<boolean>(false);
public prestacionEnConfiguracion = signal<any | null>(null);
public simboloSeleccionadoId = signal<string>('');

// Esta es la señal que alimenta el @for de la tabla que acabamos de armar
public prestacionesSeleccionadas = signal<ItemPresupuesto[]>([]);

public totalPresupuesto = computed(() => {
  return this.prestacionesSeleccionadas().reduce((suma, item) => suma + item.precio, 0);
});

// 🪐 Señal para controlar qué fila de la tabla está desplegada
public filaExpandidaId = signal<string | null>(null);
// 🪐 Señal para controlar cuál Dropdown de completación está abierto
public dropdownAbiertoId = signal<string | null>(null);


// 🪐 SIGNALS PARA EL CONTROL DEL MODAL DE EVOLUCIÓN
public isModalEvolucionAbierto = signal<boolean>(false);
public evolucionCambioPendiente = signal<{ itemId: string; nuevoPorcentaje: number } | null>(null);

// Campos reactivos para el formulario del modal
public evolucionProfesional = signal<string>('Pamela Rodríguez');
public evolucionTratamiento = signal<string>('rehabilitacion');
public evolucionFecha = signal<string>('06/06/2026');
public evolucionTexto = signal<string>('');
public isEvolucionPrivada = signal<boolean>(false);

public mostrarNotificacionFutura = signal<boolean>(false);
public mensajeNotificacion = signal<string>('');
private timeoutNotificacion: any = null; // Para limpiar el contador si clickean rápido


  ngOnInit() {
    // 🔍 Capturamos combinando los parámetros del Padre y del Hijo de forma segura
  this.route.paramMap.subscribe(params => {
    const tId = params.get('tratamientoId');

    // Si la ruta actual no tiene el 'id' del paciente, lo buscamos en la ruta padre
    const pId = params.get('id') || this.route.parent?.snapshot.paramMap.get('id');

    console.log('📌 IDs detectados en Ficha -> Paciente:', pId, ' | Tratamiento:', tId);

    if (pId && tId) {
      this.pacienteId.set(pId);
      this.tratamientoId.set(tId);
      this.cargarDetalleTratamiento(tId);
    } else {
      console.error('🚨 Error: No se pudieron recuperar los parámetros correlativos de la URL');
      this.loading.set(false);
    }
  });
}

cargarCategoriasArancel() {
  if (this.categoriasArancel().length > 0) return; // Evitamos recargar si ya existen

  this.loadingAranceles.set(true);
  this.arancelesService.getAranceles().subscribe({
    next: (data) => {
      this.categoriasArancel.set(data);
      this.loadingAranceles.set(false);
    },
    error: () => this.loadingAranceles.set(false)
  });
}

/**
 * 2. Al seleccionar una categoría, llamamos al segundo servicio al vuelo (Lazy Load)
 */
seleccionarCategoria(categoria: any) {
  this.categoriaSeleccionada.set(categoria);
  this.vistaDrawer.set('PRESTACIONES');
  this.loadingPrestaciones.set(true);

  // 🚀 Pegamos al servicio de prestaciones usando el ID de la categoría seleccionada
  this.prestacionesService.getByArancel(categoria.id).subscribe({
    next: (data: any[]) => {
      console.log(`📥 Prestaciones cargadas para ${categoria.nombre}:`, data);
      this.prestacionesFiltradas.set(data);
      this.loadingPrestaciones.set(false);
    },
    error: (err) => {
      console.error('❌ Error al cargar prestaciones desde el backend:', err);
      this.prestacionesFiltradas.set([]);
      this.loadingPrestaciones.set(false);
    }
  });
}

regresarACategorias() {
  this.vistaDrawer.set('CATEGORIAS');
  this.categoriaSeleccionada.set(null);
  this.prestacionesFiltradas.set([]);
}



private cargarDetalleTratamiento(id: string) {
  this.loading.set(true);
  console.log('🔍 Solicitando instrumental clínico para el tratamiento:', id);

  // Opciones de Consumo:
  // Recomendación: Si en tu TratamientosService tienes un método para traer un solo plan (ej: getTratamientoById(id)), úsalo.
  // Si no, seguimos usando el masivo por paciente asegurando que pId() no sea null:
  const idPacienteReal = this.pacienteId();
  if (!idPacienteReal) {
    this.loading.set(false);
    return;
  }

  this.tratamientosService.getTratamientosByPaciente(idPacienteReal).subscribe({
    next: (listaPresupuestos: PresupuestoResponse[]) => {
      try {
        console.log('📦 Lista cruda entregada por NestJS/Prisma:', listaPresupuestos);

        // Limpiamos y normalizamos la comparación de UUIDs para evitar fallos por mayúsculas o espacios
        const planEspecifico = listaPresupuestos.find(
          p => p.id?.toString().toLowerCase().trim() === id.toLowerCase().trim()
        );

        if (planEspecifico) {
          console.log('✅ Plan emparejado e inyectado con éxito:', planEspecifico);
          this.tratamiento.set(planEspecifico);
        } else {
          console.warn('⚠️ ID no encontrado en el listado asíncrono. Activando fallback gráfico.');

          // Fallback seguro para pintar la pantalla azul inmediatamente
          this.tratamiento.set({
            id: id,
            pacienteId: idPacienteReal,
            profesionalId: 'fb1d6269-37ab-4e15-8c37-0d740ebd099d',
            total: 0,
            estado: 'PENDIENTE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            odontogramaRaw: { nombrePlan: 'caries', diagnosticos: [] },
            items: [ /* ... tu array de ítems corregido ... */ ],
            // ¡OJO! Si tu interfaz dice que 'profesional' es opcional, está bien dejarlo fuera,
            // pero si llegas a necesitar mostrarlo en la UI, asegúrate de que esté definido.
          });
        }
      } catch (err) {
        console.error('❌ Error procesando el mapeo en el bloque try:', err);
      } finally {
        // Apaga el spinner pase lo que pase
        this.loading.set(false);
      }
    },
    error: (err) => {
      console.error('❌ Error en el canal HTTP de NestJS:', err);
      this.loading.set(false);
    }
  });
}

  /**
   * 🔥 Tu función de escucha integrada de forma nativa
   */
  onDienteCambio(evento: any) {
    console.log('🎯 Evento capturado en el padre:', evento);

    // Identificamos la pieza y la cara afectada
    const numeroPiezaReal = evento.pieza;
    const caraActiva = evento.cara || Object.keys(evento.caras).find(key => evento.caras[key]) || 'O';
    const seleccionPrevia = this.seleccionActualPadre();

    // 🔍 CONDICIÓN TOGGLE FLUIDA: Si vuelve a pinchar el mismo diente y cara con el drawer levantado...
    // 🔍 CONDICIÓN TOGGLE: Si vuelve a pinchar el mismo diente y cara con el drawer abierto...
    if (this.isDrawerAbierto() && seleccionPrevia && seleccionPrevia.pieza === numeroPiezaReal && seleccionPrevia.cara === caraActiva) {

      console.log(`🔄 Click duplicado en Pieza ${numeroPiezaReal}. Desmarcando en caliente...`);

      // Escondemos el Drawer comercial
      this.isDrawerAbierto.set(false);
      this.piezaSeleccionadaDrawer.set('Sin piezas seleccionadas');
      this.seleccionActualPadre.set(null);

      this.piezasMarcadas.update(prev => {
        const copia = { ...prev };
        delete copia[numeroPiezaReal];
        return copia;
      });

      // 🔥 Ordenamos la limpieza síncrona en cascada (Abuelo -> Padre -> Diente Hijo)
      if (this.odontogramaHijo) {
        this.odontogramaHijo.desmarcarPiezaClinica(numeroPiezaReal);
      }

      this.cdr.detectChanges();
      this.guardarOdontogramaEnServidor();
      return;
    }

    // =========================================================================
    // FLUJO NORMAL: Si es un diente nuevo o el drawer estaba guardado
    // =========================================================================
    this.piezasMarcadas.update(prev => ({ ...prev, [numeroPiezaReal]: evento }));
    this.seleccionActualPadre.set({ pieza: numeroPiezaReal, cara: caraActiva });

    // Actualizamos el indicador dinámico de la base del Drawer
    const nombreCara = this.mapearNombreCara(caraActiva);
    this.piezaSeleccionadaDrawer.set(`Pieza ${numeroPiezaReal} (${nombreCara})`);

    // Levantamos el panel nítido de aranceles de NestJS
    this.isDrawerAbierto.set(true);

    // 🔥 PASO CRUCIAL: Forzamos la llamada al servicio de NestJS aquí
    this.cargarCategoriasArancel();



    this.guardarOdontogramaEnServidor();
  }

  /**
   * Helper opcional para transformar las iniciales de las caras en texto legible
   */
  private mapearNombreCara(cara: string): string {
    const diccionario: { [key: string]: string } = {
      'O': 'Oclusal',
      'I': 'Incisal',
      'V': 'Vestibular',
      'P': 'Palatina',
      'L': 'Lingual',
      'M': 'Mesial',
      'D': 'Distal'
    };
    return diccionario[cara.toUpperCase()] || 'General';
  }



  /**
   * Envía el estado actual del mapa dental a NestJS para persistirlo en la base de datos
   */
  private guardarOdontogramaEnServidor() {
    const tId = this.tratamientoId();
    if (!tId) return;

    // Aquí construirías la llamada HTTP. Por ejemplo:
    // this.tratamientosService.updateOdontograma(tId, this.piezasMarcadas()).subscribe({
    //   next: () => console.log('Odontograma guardado en la base de datos de forma asíncrona'),
    //   error: (err) => console.error('Error al persistir el odontograma con Prisma:', err)
    // });
  }

  agregarPrestacion() {
    this.isDrawerAbierto.set(true);
    // 🎯 BYPASS ULTRA-PRECISO: Rompemos el bloqueo síncrono del scroll del CDK
    // Usamos un setTimeout mínimo para asegurarnos de que se ejecute justo DESPUÉS de que Angular renderice el Drawer
    setTimeout(() => {
      // 1. Removemos la clase de bloqueo global que inyecta el CDK de Angular
      document.documentElement.classList.remove('cdk-global-scrollblock');
      document.body.classList.remove('cdk-global-scrollblock');

      // 2. Aseguramos que los estilos nativos permitan scroll libre
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.position = 'static';
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
    }, 10);
  }


  cerrarDrawer() {
    this.isDrawerAbierto.set(false);
    // Dejamos el body limpio al cerrar
    document.body.style.overflow = 'auto';

  }


  /**
 * Al hacer clic en la fila de una prestación, la marcamos como activa en la UI
 */
marcarPrestacionFila(prestacionId: string | number) {
  // Si vuelve a hacer clic en la misma que ya estaba abierta, la cerramos (opcional)
  if (this.prestacionSeleccionadaId() === prestacionId) {
    this.prestacionSeleccionadaId.set(null);
  } else {
    this.prestacionSeleccionadaId.set(prestacionId);
  }
}

/**
 * Acción definitiva del botón verde "+ Cargar"
 */
cargarPrestacionAlPlan(prestacion: any, event: Event) {
  event.stopPropagation(); // Evitamos que el clic se propague a la fila

  const piezaActiva = this.seleccionActualPadre()?.pieza;
  const caraActiva = this.seleccionActualPadre()?.cara;

  console.log(`🚀 Cargando al plan: ${prestacion.nombre} para la Pieza ${piezaActiva}`);

  // Guardamos la prestación que se está configurando para mostrar su nombre en el modal
  this.prestacionEnConfiguracion.set(prestacion);
  this.simboloSeleccionadoId.set(''); // Reseteamos el selector de símbolo

  // Abrimos el modal de información extra
  this.isModalAbierto.set(true);

}

confirmarYAgregarAlTratamiento() {
  const prestacion = this.prestacionEnConfiguracion();
  const piezaActiva = this.seleccionActualPadre()?.pieza;
  const caraActiva = this.seleccionActualPadre()?.cara || '0';
  const simboloId = this.simboloSeleccionadoId();

  if (!prestacion || !piezaActiva) return;

  // Construimos la fila con los valores por defecto exactos de tu maqueta
  const nuevoItemTabla: ItemPresupuesto = {
    id: `${prestacion.id}-${Date.now()}`, // ID único para evitar colisiones en el trackBy
    nombre: prestacion.nombre,
    codigo: prestacion.codigo  ?? '',
    pieza: piezaActiva,
    cara: caraActiva,
    descuento: 0,        // 0% inicial
    precio: prestacion.precio || 210000, // Usa el precio de la BD (ej: $210.000)
    pago: 0,             // $0 abonado inicialmente
    simboloId: simboloId,
    porcentajeCompletacion: 0, // 0% completado al inicio
    semaforoPago: 'rojo',
    futuraRealizacion: false

  };

  // Actualizamos la señal empujando el nuevo objeto de forma reactiva inmutable
  this.prestacionesSeleccionadas.update(lista => [...lista, nuevoItemTabla]);

  console.log(`🔥 Guardando definitivo: ${prestacion.nombre} en Pieza ${piezaActiva} con símbolo: ${simboloId}`);

  // 1. Aquí construyes el objeto final para meterlo a tu tabla/presupuesto comercial
  const nuevoItemPlan = {
    ...prestacion,
    pieza: piezaActiva,
    cara: caraActiva,
    simboloId: simboloId // Para saber qué gráfico pintar en el SVG si corresponde
  };

  // Tu llamada al servicio de persistencia:
  // this.tratamientoService.agregarItemAlPresupuesto(nuevoItemPlan);

  // 2. 🧼 Limpieza total de la interfaz
  this.isModalAbierto.set(false);
  this.isDrawerAbierto.set(false); // Cerramos también el Drawer lateral
  this.prestacionEnConfiguracion.set(null);
  this.prestacionSeleccionadaId.set(null);

  // Opcional: Si quieres que el diente se desmarque al cargar la prestación, ejecutas:
  if (this.odontogramaHijo) {
    this.odontogramaHijo.desmarcarPiezaClinica(piezaActiva);
  }

  this.guardarOdontogramaEnServidor();
}

cerrarModalExtra() {
  this.isModalAbierto.set(false);
  this.prestacionEnConfiguracion.set(null);
}

/**
 * Controla el toggle de apertura/cierre del acordeón de la fila
 */
toggleExpasionFila(itemId: string) {
  if (this.filaExpandidaId() === itemId) {
    this.filaExpandidaId.set(null); // Si ya estaba abierta, la cierra
  } else {
    this.filaExpandidaId.set(itemId); // Abre la nueva
  }
}

/**
   * 🔄 Este método se ejecuta en el milisegundo exacto en que el usuario suelta la fila
   */
onFilaDroppeada(event: CdkDragDrop<ItemPresupuesto[]>) {
  // Obtenemos el array actual de la señal
  const listaActual = [...this.prestacionesSeleccionadas()];

  // La función utilitaria de Angular reordena el array mutando los índices de forma óptima
  moveItemInArray(listaActual, event.previousIndex, event.currentIndex);

  // Actualizamos la señal con el nuevo orden para que se renderice al instante
  this.prestacionesSeleccionadas.set(listaActual);

  console.log('🔄 Nuevo orden del plan de tratamiento guardado:', listaActual);
  this.guardarOdontogramaEnServidor();
}

/**
 * Abre o cierra el menú flotante del gráfico circular
 */
toggleDropdownGrafico(itemId: string, event: Event) {
  event.stopPropagation(); // Evitamos que el clic expanda el acordeón de la fila principal

  if (this.dropdownAbiertoId() === itemId) {
    this.dropdownAbiertoId.set(null);
  } else {
    this.dropdownAbiertoId.set(itemId);
  }
}

cambiarPorcentajeAvance(itemId: string, nuevoPorcentaje: number, event: Event) {
  event.stopPropagation(); // Evitamos que se abra o cierre el acordeón de la fila

  // 1. Guardamos en cola de espera los datos del cambio
  this.evolucionCambioPendiente.set({ itemId, nuevoPorcentaje });
  this.evolucionTexto.set(''); // Reseteamos la caja de texto para la nueva anotación

  // 2. Cerramos el dropdown de porcentajes de la fila
  this.dropdownAbiertoId.set(null);

  // 3. 🚀 Levantamos el modal de "Nueva evolución"
  this.isModalEvolucionAbierto.set(true);
}

/**
 * 💾 CONFIRMACIÓN: Guarda la evolución e impacta el progreso en la tabla
 */
guardarEvolucionYProgreso() {
  const cambio = this.evolucionCambioPendiente();
  if (!cambio) return;

  // 1. Modificamos el valor de completación en la señal reactiva de la tabla
  this.prestacionesSeleccionadas.update(lista =>
    lista.map(item => item.id === cambio.itemId
      ? { ...item, porcentajeCompletacion: cambio.nuevoPorcentaje }
      : item
    )
  );

  // 2. 🧼 Limpieza absoluta de estados de control
  this.isModalEvolucionAbierto.set(false);
  this.evolucionCambioPendiente.set(null);

  // Sincronizamos los cambios con tu backend NestJS / Prisma
  this.guardarOdontogramaEnServidor();
}

/**
 * Cancela el flujo y cierra el modal sin aplicar el porcentaje
 */
cerrarModalEvolucion() {
  this.isModalEvolucionAbierto.set(false);
  this.evolucionCambioPendiente.set(null);
}

 /**
 * 🛒 Gatillo al hacer click en el carrito de compras
 */
 toggleFuturaRealizacion(itemId: string, event: Event) {
  event.stopPropagation(); // Evitamos que abra el acordeón clínico

  this.prestacionesSeleccionadas.update(lista =>
    lista.map(item => {
      if (item.id === itemId) {
        const nuevoEstado = !item.futuraRealizacion;

        // 🎯 DEFINIMOS EL MENSAJE SEGÚN EL NUEVO ESTADO BOOLEANO
        const texto = nuevoEstado
          ? 'Prestación marcada para futura realización'
          : 'Prestación desmarcada para futura realización';

        this.mensajeNotificacion.set(texto);

        // Limpiamos el timeout anterior por si la doctora juega a dar clicks rápidos
        if (this.timeoutNotificacion) clearTimeout(this.timeoutNotificacion);

        // Mostramos el Toast y configuramos su auto-cierre en 3 segundos
        this.mostrarNotificacionFutura.set(true);
        this.timeoutNotificacion = setTimeout(() => {
          this.mostrarNotificacionFutura.set(false);
        }, 3000);

        return { ...item, futuraRealizacion: nuevoEstado };
      }
      return item;
    })
  );

  this.guardarOdontogramaEnServidor();
}


}
