import { Component, OnInit } from '@angular/core';
import { TablaArcadaPeriodontoComponent } from "./tabla-arcada-periodonto/tabla-arcada-periodonto.component";
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { GraficoArcadaComponent } from './grafico-arcada/grafico-arcada.component';

@Component({
  selector: 'app-periodontograma',
  templateUrl: './periodontograma.component.html',
  styleUrls: ['./periodontograma.component.css'],
  imports: [TablaArcadaPeriodontoComponent, CommonModule, ReactiveFormsModule, GraficoArcadaComponent],
  standalone: true,
})
export class PeriodontogramaComponent implements OnInit {
// 1. Declaramos el formulario que espera el HTML
public formGroupCita!: FormGroup;

constructor(private fb: FormBuilder) {}

ngOnInit() {
  const grupoDientes: any = {};

  // 2. Unimos todas las piezas clínicas de la boca para inicializar sus controles
  const todasLasPiezas = [
    // Maxilar Superior
    '1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1',
    '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8',
    // Mandíbula Inferior
    '4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1',
    '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8'
  ];
// En el bucle de inicialización de tus dientes en periodontograma.component.ts:
// En el ngOnInit de periodontograma.component.ts
todasLasPiezas.forEach(p => {
  const key = p.replace('.', '');

  grupoDientes[key] = this.fb.group({
    // Cara Vestibular
    ps_v: this.fb.array([0, 0, 0]),
    mg_v: this.fb.array([0, 0, 0]),
    nic_v: this.fb.array([0, 0, 0]),

    // Cara Palatina
    ps_p: this.fb.array([0, 0, 0]),
    mg_p: this.fb.array([0, 0, 0]),
    nic_p: this.fb.array([0, 0, 0]),

    // Generales
    furca: [0],
    exudado: this.fb.array([false, false, false]),
    sangramiento: this.fb.array([false, false, false]),
    movilidad: [0]
  });
});

this.formGroupCita = this.fb.group(grupoDientes);
}

}
