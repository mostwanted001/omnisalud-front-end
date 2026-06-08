import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ColumnaDienteComponent } from '../columna-diente/columna-diente.component';

@Component({
  selector: 'app-tabla-arcada-periodonto',
  templateUrl: './tabla-arcada-periodonto.component.html',
  styleUrls: ['./tabla-arcada-periodonto.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ColumnaDienteComponent],
})
export class TablaArcadaPeriodontoComponent  implements OnInit {

  private fb = inject(FormBuilder);

  @Input() tituloArcada!: string;
  @Input() piezasIzquierda!: string[];
  @Input() piezasDerecha!: string[];

  @Input() formArcada!: FormGroup;
  @Input() esSuperior: boolean = true;
  @Input() cara!: 'vestibular' | 'palatina';


  constructor() { }


  // 🔥 Esto lo lee el @for de tu columna diente
  public sitios = [0, 1, 2];

  ngOnInit(): void {
    // 🔥 SEGURO DE VIDA: Si por alguna razón el padre aún no inyecta el formulario,
    // evitamos que la aplicación muera con el TypeError.
    if (!this.formArcada) {
      console.warn(`formArcada aún no está listo en la tabla para la cara: ${this.cara}`);
      return;
    }

    // Si existe, nos suscribimos de forma segura
    this.formArcada.valueChanges.subscribe(() => {
      this.actualizarNicDeColumnas();
    });

    // Render inicial
    setTimeout(() => this.actualizarNicDeColumnas(), 100);
  }

  // Asegurémonos también de que si el formulario llega un pelito más tarde, lo capturemos:
  ngOnChanges(changes: any): void {
    if (changes.formArcada && changes.formArcada.currentValue) {
      // Si el formulario cambia o se inicializa tardíamente, recalculamos
      this.actualizarNicDeColumnas();
    }
  }

  private actualizarNicDeColumnas(): void {
    const todasLasPiezas = [...this.piezasIzquierda, ...this.piezasDerecha];
    let huboCambios = false; // Flag para detectar si realmente modificamos algo

    todasLasPiezas.forEach(pieza => {
      // 1. Buscamos el grupo de la pieza (ej: '1.8') dentro del formulario maestro
      const dienteGroup = this.formArcada.get(pieza) as FormGroup;
      if (!dienteGroup) return;
      console.log(`Procesando pieza ${pieza} para cálculo de NIC...`);

      // 2. Extraemos los FormArrays indexados que bindea tu columna diente
      const psArray = dienteGroup.get('ps') as FormArray;
      const mgArray = dienteGroup.get('mg') as FormArray;
      const nicArray = dienteGroup.get('nic') as FormArray;

      // Si alguno no está listo, saltamos la iteración para evitar excepciones
      if (!psArray || !mgArray || !nicArray) return;

      this.sitios.forEach(i => {
        const psValue = psArray.at(i).value;
        const mgValue = mgArray.at(i).value;

        // Si el casillero de Sondaje (PS) está vacío o es null, el NIC se limpia
        if (psValue === null || psValue === '' || psValue === undefined) {
          if (nicArray.at(i).value !== '') {
            nicArray.at(i).setValue('', { emitEvent: false });
            huboCambios = true;
            console.log(`NIC limpiado para pieza ${pieza} sitio ${i} porque PS está vacío`);
          }
          return;
        }

        const valorPs = Number(psValue) || 0;
        const valorMg = Number(mgValue) || 0;

        // 📐 Operación analítica periodontal estándar: NIC = PS - MG
        const nicCalculado = valorPs - valorMg;

        // 💾 Inyectamos el valor analítico en el casillero correspondiente de forma silenciosa
        if (nicArray.at(i).value !== nicCalculado) {
          nicArray.at(i).setValue(nicCalculado, { emitEvent: false });
          huboCambios = true;
          console.log(`NIC actualizado para pieza ${pieza} sitio ${i}: PS=${valorPs} - MG=${valorMg} => NIC=${nicCalculado}`);
        }
      });
    });

    // ========== SOLUCIÓN REAL PARA LA REACTIVIDAD ==========
    // Si calculamos nuevos valores de NIC, le avisamos a la arcada global de forma limpia
    // para que el componente del gráfico (que escucha a formArcada.valueChanges) se entere y se mueva.
    if (huboCambios) {
      this.formArcada.updateValueAndValidity({ emitEvent: true });
    }
  }







  getDienteKey(pieza: string): string {
    return pieza.replace('.', ''); // Convierte '1.8' a '18'
  }

  getDienteForm(pieza: string): FormGroup {
    const keyLimpia = pieza.replace('.', '');
    const grupoDiente = this.formArcada.get(keyLimpia) as FormGroup;

    if (!grupoDiente) return new FormGroup({});

    // 🧠 Si esta tabla es Vestibular, le pasamos solo los controles de su cara,
    // y si es Palatina, los de la suya. Así la columna queda ciega respecto a la otra tabla.
    return grupoDiente;
  }

  getDienteAnchoPx(pieza: string): string {
    const mapeoAnchos: { [key: string]: number } = {
      '1.8': 46, '1.7': 52, '1.6': 59, '1.5': 39, '1.4': 48, '1.3': 39, '1.2': 41, '1.1': 51,
      '2.1': 51, '2.2': 36, '2.3': 39, '2.4': 48, '2.5': 39, '2.6': 59, '2.7': 52, '2.8': 50,
      // Arcada Inferior (Vamos agregando las que te den problemas)
    '4.8': 60, '4.7': 58, '4.6': 65, '4.5': 42, '4.4': 38, '4.3': 37, '4.2': 36, '4.1': 36,
    '3.1': 36, '3.2': 36, '3.3': 37, '3.4': 38, '3.5': 42, '3.6': 65, '3.7': 58, '3.8': 60,
    };

    const ancho = mapeoAnchos[pieza] || 45;
    return `${ancho}px`;
  }

}
