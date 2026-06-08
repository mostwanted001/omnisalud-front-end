import { CommonModule } from '@angular/common';
import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-grafico-arcada',
  templateUrl: './grafico-arcada.component.html',
  styleUrls: ['./grafico-arcada.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class GraficoArcadaComponent  {
  @Input({ required: true }) formArcada!: FormGroup;
  @Input({ required: true }) piezasIzquierda!: string[];
  @Input({ required: true }) piezasDerecha!: string[];
  @Input() esSuperior: boolean = true;

  // 🔥 Trigger reactivo manual para los Signals de Angular
  public cambioFormTrigger = signal<number>(0);

  // 📍 Sincronización exacta con el alto de sub-capas de 149px (Total 298px)
  public get Y_BASE_VESTIBULAR(): number {
    return this.esSuperior ? 94 : 52;
  }

  public get Y_BASE_INTERNA(): number {
    return this.esSuperior ? 88 : 62; // Calibrado sutilmente para el eje Palatino
  }

  // Sensibilidad milimétrica para el movimiento de las ondas en el fondo gris
  private readonly MULTIPLICADOR_MM = 3.8;

  // Diccionario estricto de anchos anatómicos asimétricos
  private readonly MAPEO_ANCHOS: { [key: string]: number } = {
    '1.8': 46, '1.7': 52, '1.6': 59, '1.5': 39, '1.4': 41, '1.3': 39, '1.2': 36, '1.1': 51,
    '2.1': 51, '2.2': 36, '2.3': 39, '2.4': 41, '2.5': 39, '2.6': 59, '2.7': 52, '2.8': 56,
    '4.8': 55, '4.7': 52, '4.6': 59, '4.5': 39, '4.4': 41, '4.3': 39, '4.2': 36, '4.1': 51,
    '3.1': 51, '3.2': 36, '3.3': 39, '3.4': 41, '3.5': 39, '3.6': 59, '3.7': 52, '3.8': 55
  };

  ngOnInit(): void {
    // Escucha activa global de los cambios del formulario
    if (this.formArcada) {
      this.formArcada.valueChanges.subscribe(() => {
        // Cada vez que la columna emita su cambio, actualizamos el trigger del Signal.
        // Esto obliga a que los métodos de los paths (SVG) se vuelvan a ejecutar.
        this.cambioFormTrigger.update(n => n + 1);
      });
    }

    // Renderizado inicial por defecto
    setTimeout(() => {
      this.cambioFormTrigger.update(n => n + 1);
    }, 100);
  }

  private calcularPuntosCara(esVestibular: boolean) {
    this.cambioFormTrigger(); // Enlaza el computed con el ciclo reactivo

    const puntos: Array<{ x: number; yMg: number; yPs: number }> = [];
    const sufijo = esVestibular ? '_v' : '_p';

    // 📍 MARGEN INICIAL PERSONALIZADO:
    // En Vestibular arranca en 11px, pero en Palatina (interna) lo ajustamos a 7px
    // para que se desplace hacia la izquierda y abrace el inicio real del molar 1.8
    let xAcumulado = esVestibular ? 11 : 7;

    // --- PROCESAR LADO IZQUIERDO ---
    this.piezasIzquierda.forEach((pieza) => {
      const anchoDiente = this.MAPEO_ANCHOS[pieza] || 45;
      const tercio = anchoDiente / 3;

      const keyLimpia = pieza.replace('.', '');
      const dienteGroup = this.formArcada.get(keyLimpia);

      // 🔍 CORREGIDO: Ahora busca dinámicamente 'ps_v', 'ps_p', etc. en el lado izquierdo
      const psValues = dienteGroup?.get('ps' + sufijo)?.value || [0, 0, 0];
      const mgValues = dienteGroup?.get('mg' + sufijo)?.value || [0, 0, 0];

      for (let i = 0; i < 3; i++) {
        const x = xAcumulado + (tercio * i) + (tercio / 2);
        const yBase = esVestibular ? this.Y_BASE_VESTIBULAR : this.Y_BASE_INTERNA;

        const { yMg, yPs } = this.calcularCoordenadasY(Number(mgValues[i]) || 0, Number(psValues[i]) || 0, yBase, esVestibular);
        puntos.push({ x, yMg, yPs });
      }
      xAcumulado += anchoDiente;
    });

    // 📍 CANALETA CENTRAL ADAPTADA
    xAcumulado += esVestibular ? 12 : 11;

    // --- PROCESAR LADO DERECHO ---
    this.piezasDerecha.forEach((pieza) => {
      const anchoDiente = this.MAPEO_ANCHOS[pieza] || 45;
      const tercio = anchoDiente / 3;

      const keyLimpia = pieza.replace('.', '');
      const dienteGroup = this.formArcada.get(keyLimpia);
      const sufijo = esVestibular ? '_v' : '_p';
      const psValues = dienteGroup?.get('ps' + sufijo)?.value || [0, 0, 0];
      const mgValues = dienteGroup?.get('mg' + sufijo)?.value || [0, 0, 0];

      for (let i = 0; i < 3; i++) {
        const x = xAcumulado + (tercio * i) + (tercio / 2);
        const yBase = esVestibular ? this.Y_BASE_VESTIBULAR : this.Y_BASE_INTERNA;

        const { yMg, yPs } = this.calcularCoordenadasY(Number(mgValues[i]) || 0, Number(psValues[i]) || 0, yBase, esVestibular);
        puntos.push({ x, yMg, yPs });
      }
      xAcumulado += anchoDiente;
    });

    // ==================================================================
    // 🔥 ESCALADO INDEPENDIENTE POR CAPA ASIMÉTRICA
    // ==================================================================
    const anchoContenedorReal = 788;
    const margenIzquierdo = esVestibular ? 11 : 7;
    const margenDerechoFreno = esVestibular ? 6 : 4; // Ajuste fino para el extremo derecho de la palatina

    const anchoUtilTarget = anchoContenedorReal - margenIzquierdo - margenDerechoFreno;
    const factorEscalaX = anchoUtilTarget / (xAcumulado - margenIzquierdo);

    return puntos.map(pt => {
      const xProcesada = ((pt.x - margenIzquierdo) * factorEscalaX) + margenIzquierdo;

      return {
        x: xProcesada,
        yMg: pt.yMg,
        yPs: pt.yPs
      };
    });
  }

  // 🔥 Helper matemático corregido para procesar las variables de ambos lados de la arcada
  private calcularCoordenadasY(mg: number, ps: number, yBase: number, esVestibular: boolean) {
    let yMg = yBase;
    let yPs = yBase;

    if (this.esSuperior) {
      // 🦷 MAXILAR SUPERIOR:
      // 1. El Margen (Línea Roja) BAJA sumando píxeles en base a tu maquetación visual
      yMg = yBase + (mg * this.MULTIPLICADOR_MM);

      // 2. El Sondaje (Línea Azul) NACE desde la posición real del Margen (yMg)
      // y SUBE (resta) adentrándose hacia la raíz del diente
      yPs = yMg - (ps * this.MULTIPLICADOR_MM);

    } else {
      // 🦷 MANDÍBULA INFERIOR (Efecto espejo):
      // 1. El Margen (Línea Roja) SUBE restando píxeles
      yMg = yBase - (mg * this.MULTIPLICADOR_MM);

      // 2. El Sondaje (Línea Azul) NACE desde el Margen (yMg) y BAJA (suma) hacia la raíz inferior
      yPs = yMg + (ps * this.MULTIPLICADOR_MM);
    }

    return { yMg, yPs };
  }

  // SIGNALS DE CÓMPUTO REACTIVOS
  public puntosVestibulares = computed(() => this.calcularPuntosCara(true));
  public puntosInternos = computed(() => this.calcularPuntosCara(false));

  public pathMargen(cara: 'vestibular' | 'interna'): string {
    const pts = cara === 'vestibular' ? this.puntosVestibulares() : this.puntosInternos();
    if (pts.length === 0) return '';
    return pts.reduce((acc, pt, i) => i === 0 ? `M${pt.x},${pt.yMg}` : `${acc} L${pt.x},${pt.yMg}`, '');
  }

  public pathSondaje(cara: 'vestibular' | 'interna'): string {
    const pts = cara === 'vestibular' ? this.puntosVestibulares() : this.puntosInternos();
    if (pts.length === 0) return '';
    return pts.reduce((acc, pt, i) => i === 0 ? `M${pt.x},${pt.yPs}` : `${acc} L${pt.x},${pt.yPs}`, '');
  }

  public pathSombreado(cara: 'vestibular' | 'interna'): string {
    const pts = cara === 'vestibular' ? this.puntosVestibulares() : this.puntosInternos();
    if (pts.length === 0) return '';
    const ida = pts.reduce((acc, pt, i) => i === 0 ? `M${pt.x},${pt.yMg}` : `${acc} L${pt.x},${pt.yMg}`, '');
    const regreso = pts.reduceRight((acc, pt) => `${acc} L${pt.x},${pt.yPs}`, '');
    return `${ida} ${regreso} Z`;
  }
}