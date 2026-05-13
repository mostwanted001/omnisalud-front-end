import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AtencionesService } from '../../services/atenciones.service';
import { DailyViewComponent } from '../../components/daily-view/daily-view.component';
import { WeeklyViewComponent } from '../../components/weekly-view/weekly-view.component';

@Component({
  selector: 'app-agenda-view',
  standalone: true,
  imports: [CommonModule, DailyViewComponent, WeeklyViewComponent],
  templateUrl: './agenda-view.component.html',
  styleUrl: './agenda-view.component.scss'
})
export class AgendaViewComponent implements OnInit {

  public viewMode = signal<'dia' | 'semana'>('dia');



  public atencionesService = inject(AtencionesService);
  hoy = new Date();

  constructor() { }

  ngOnInit(): void {
    // Disparamos la carga inicial

  }

  setMode(mode: 'dia' | 'semana') {
    this.viewMode.set(mode);
  }


}
