import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-columna-diente',
  templateUrl: './columna-diente.component.html',
  styleUrls: ['./columna-diente.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ColumnaDienteComponent implements OnInit  {
  @Input({ required: true }) numeroPieza!: string;
  @Input({ required: true }) formGroupCita!: FormGroup;
  @Input({ required: true }) formArcada!: FormGroup; // El Formulario maestro global de la arcada// Recibe el subformulario del padre
  @Input() pieza!: string;
  @Input() cara!: 'vestibular' | 'palatina';

  public sitios = [0, 1, 2];
  private calculandoNic = false;

  get psArray() { return this.formGroupCita.get(this.cara === 'vestibular' ? 'ps_v' : 'ps_p') as FormArray; }
  get mgArray() { return this.formGroupCita.get(this.cara === 'vestibular' ? 'mg_v' : 'mg_p') as FormArray; }
  get nicArray() { return this.formGroupCita.get(this.cara === 'vestibular' ? 'nic_v' : 'nic_p') as FormArray; }
  get exudadoArray() { return this.formGroupCita.get('exudado') as FormArray; }
  get sangramientoArray() { return this.formGroupCita.get('sangramiento') as FormArray; }

  toggleIndicador(arrayName: 'sangramiento' | 'exudado', index: number) {
    const control = this.formGroupCita.get(arrayName)?.get(index.toString());
    if (control) control.setValue(!control.value);
  }

  toggleFurcaEstado(): void {
    const control = this.formGroupCita.get('furca');
    if (!control) return;

    // Obtenemos el valor actual (si es null o vacío, asumimos 0)
    const estadoActual = control.value ? Number(control.value) : 0;

    // Calculamos el siguiente estado de forma cíclica (del 0 al 3)
    // 0 = Vacío, 1 = Izquierda, 2 = Derecha, 3 = Completo
    let siguienteEstado = estadoActual + 1;
    if (siguienteEstado > 3) {
      siguienteEstado = 0; // Resetea al llegar al final
    }

    // Actualizamos el valor en el Form Group para que Angular reactive la vista
    control.setValue(siguienteEstado);
    control.markAsDirty();
  }

  getDienteOffset(): string {
    // Mapeamos la posición exacta de cada una de las 16 piezas (índice 0 al 15 de izquierda a derecha)
    const ordenPiezas = [
      '1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1',
      '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8'
    ];

    const idx = ordenPiezas.indexOf(this.numeroPieza);
    if (idx === -1) return '0px';

    // Multiplicamos el índice por el ancho exacto de tu celda (45px)
    const offset = idx * 45;

    // Retornamos el desplazamiento negativo para mover la tira de imágenes
    return `-${offset}px`;
  }
  // 4. Un getter limpio para que tu HTML pueda leer el nicArray sin problemas

  ngOnInit(): void {
    // 🔥 ESCUCHA AISLADA Y DETENIDA
    // Escuchamos los cambios numéricos de los inputs, pero controlamos el flujo con un candado
    if (this.psArray && this.mgArray) {
      this.psArray.valueChanges.subscribe(() => {
        if (!this.calculandoNic) this.recalcularNicLocal();
      });
      this.mgArray.valueChanges.subscribe(() => {
        if (!this.calculandoNic) this.recalcularNicLocal();
      });
    }
  }


  public recalcularNicLocal(): void {
    // ACTIVAMOS EL CANDADO: Mientras esto sea true, ninguna línea de código acá dentro
    // podrá volver a disparar el subscribe del ngOnInit.
    this.calculandoNic = true;

    let huboCambios = false;

    this.sitios.forEach(i => {
      const psValue = this.psArray.at(i).value;
      const mgValue = this.mgArray.at(i).value;

      if (psValue === null || psValue === '' || psValue === undefined) {
        if (this.nicArray.at(i).value !== '') {
          this.nicArray.at(i).setValue('', { emitEvent: false });
          huboCambios = true;
        }
        return;
      }

      const valorPs = Number(psValue) || 0;
      const valorMg = Number(mgValue) || 0;
      const nicCalculado = valorPs - valorMg;

      if (this.nicArray.at(i).value !== nicCalculado) {
        // Asignamos el valor de forma silenciosa para no despertar a nadie
        this.nicArray.at(i).setValue(nicCalculado, { emitEvent: false });
        huboCambios = true;
      }
    });

    // 🔥 EL ENLACE AL MAESTRO SIN REVERBERACIÓN
    if (this.formArcada) {
      const keyLimpia = this.numeroPieza.replace('.', '');
      const sufijo = this.cara === 'vestibular' ? '_v' : '_p';

      const dienteMasterGroup = this.formArcada.get(keyLimpia) as FormGroup;

      if (dienteMasterGroup) {
        // Modificamos los valores crudos en la raíz del árbol maestro
        dienteMasterGroup.get('ps' + sufijo)?.setValue(this.psArray.value, { emitEvent: false });
        dienteMasterGroup.get('mg' + sufijo)?.setValue(this.mgArray.value, { emitEvent: false });
        dienteMasterGroup.get('nic' + sufijo)?.setValue(this.nicArray.value, { emitEvent: false });

        // Enviar el aviso al gráfico de forma controlada
        this.formArcada.patchValue({
          [keyLimpia]: dienteMasterGroup.value
        }, { emitEvent: true }); // <--- Esto despierta al gráfico instantáneamente
      }
    }

    // LIBERAMOS EL CANDADO: El hilo terminó limpio y el navegador puede respirar
    this.calculandoNic = false;
  }


}


