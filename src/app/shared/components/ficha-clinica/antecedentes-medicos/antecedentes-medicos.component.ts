import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-antecedentes-medicos',
  templateUrl: './antecedentes-medicos.component.html',
  styleUrls: ['./antecedentes-medicos.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class AntecedentesMedicosComponent implements OnInit {
  @Input() paciente: any;

  public formAntecedentes!: FormGroup;

  // Estados dinámicos para mostrar u ocultar el input inline de cada tarjeta
  public editModes = { alertas: false, medicamentos: false, enfermedades: false, habitos: false };

  // Variables temporales bindeadas a los inputs inline de escritura
  public currentInputs = { alertas: '', medicamentos: '', enfermedades: '', habitos: '' };

  // 🎛️ Control de Dropdowns activos (Abre/Cierra el panel flotante)
  public activeDropdown: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos' | null = null;

  // 📝 LISTAS TEMPORALES: Almacenan los elementos agregados dentro del drop antes de darle a "Aceptar"
  public tempLists = { alertas: [] as string[], medicamentos: [] as string[], enfermedades: [] as string[], habitos: [] as string[] };

  public loading = signal<boolean>(false);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarDatosDesdePaciente();

  }

  // Añade este método para parsear los strings de la DB hacia tus FormArrays planos
// 1. FILTRADO AL CARGAR: Evita que "Ninguna" o "Ninguno" se transformen en checkboxes
private cargarDatosDesdePaciente(): void {
  if (!this.paciente){
    this.loading.set(false);
    return;
  }

  this.loading.set(true);

  const textosVacios = ['ninguna', 'ninguno', 'sin registros', 'sin información', 'sin registro'];

  // 🟥 Cargar Alertas
  if (this.paciente.alergias) {
    const alertas = this.paciente.alergias.split(', ');
    alertas.forEach((alerta: string) => {
      const item = alerta.trim();
      if (item && !textosVacios.includes(item.toLowerCase()) && !this.alertasList.value.includes(item)) {
        this.alertasList.push(this.fb.control(item));
      }
    });
  }

  // 🟩 Cargar Enfermedades
  if (this.paciente.enfermedades) {
    const enfermedades = this.paciente.enfermedades.split(', ');
    enfermedades.forEach((enfermedad: string) => {
      const item = enfermedad.trim();
      if (item && !textosVacios.includes(item.toLowerCase()) && !this.enfermedadesList.value.includes(item)) {
        this.enfermedadesList.push(this.fb.control(item));
      }
    });
  }

  // 🟦 Cargar Medicamentos
  if (this.paciente.medicamentos) {
    const medicamentos = this.paciente.medicamentos.split(', ');
    medicamentos.forEach((medicamento: string) => {
      const item = medicamento.trim();
      if (item && !textosVacios.includes(item.toLowerCase()) && !this.medicamentosList.value.includes(item)) {
        this.medicamentosList.push(this.fb.control(item));
      }
    });
  }
  this.loading.set(false);
}




  nngOnChanges(changes: SimpleChanges): void {
    if (changes['paciente'] && !changes['paciente'].firstChange) {
      this.resetearFormularioParaNuevoPaciente();
      this.cargarDatosDesdePaciente(); // <-- Volvemos a cargar los datos del nuevo paciente
    }
  }

  private initForm(): void {
    this.formAntecedentes = this.fb.group({
      alertasMedicas: this.fb.array([]),
      medicamentos: this.fb.array([]),
      enfermedades: this.fb.array([]),
      habitos: this.fb.array([]),

      otrasAlertas: [''],
      otrosMedicamentos: [''],
      otrasEnfermedades: [''],
      otrosHabitos: ['']
    });
  }

  private resetearFormularioParaNuevoPaciente(): void {
    if (!this.formAntecedentes) return;
    this.alertasList.clear();
    this.medicamentosList.clear();
    this.enfermedadesList.clear();
    this.habitosList.clear();

    // Resetear modos de edición
    this.editModes = { alertas: false, medicamentos: false, enfermedades: false, habitos: false };
    this.currentInputs = { alertas: '', medicamentos: '', enfermedades: '', habitos: '' };

    this.formAntecedentes.patchValue({
      otrasAlertas: '', otrosMedicamentos: '', otrasEnfermedades: '', otrosHabitos: ''
    });
  }

  // --- GETTERS DE LOS FORMARRAYS ---
  get alertasList() { return this.formAntecedentes.get('alertasMedicas') as FormArray; }
  get medicamentosList() { return this.formAntecedentes.get('medicamentos') as FormArray; }
  get enfermedadesList() { return this.formAntecedentes.get('enfermedades') as FormArray; }
  get habitosList() { return this.formAntecedentes.get('habitos') as FormArray; }

  public toggleDropdown(type: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos'): void {
    if (this.activeDropdown === type) {
      this.activeDropdown = null;
      this.editModes[type] = false;
    } else {
      this.activeDropdown = type;
      this.editModes[type] = false;
      // Al abrir, cargamos lo que ya tiene el cuadro principal en la lista temporal por si quiere editar
      this.tempLists[type] = [...this.getArrayByType(type).value];
    }
    this.currentInputs[type] = '';
  }

  // --- FLUJO INTERACTIVO INLINE (Añadir desde Input) ---
  public activarEdicion(type: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos'): void {
    this.editModes[type] = true;
    this.currentInputs[type] = ''; // Limpiar cualquier residuo previo
  }

  public cancelarEdicion(type: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos'): void {
    this.editModes[type] = false;
    this.currentInputs[type] = '';
  }

  public confirmarItem(type: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos'): void {
    const texto = this.currentInputs[type].trim();
    if (!texto) return;

    // Insertar en la lista temporal interna si no está duplicado
    if (!this.tempLists[type].includes(texto)) {
      this.tempLists[type].push(texto);
    }

    const targetArray = this.getArrayByType(type);

    // Evitamos duplicados idénticos en la lista de chips
    if (!targetArray.value.includes(texto)) {
      targetArray.push(this.fb.control(texto));
    }

    // Cerramos el modo edición automáticamente al confirmar (Como en tu flujo)
    this.editModes[type] = false;
    this.currentInputs[type] = '';
  }

  public removeItem(type: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos', index: number): void {
    this.getArrayByType(type).removeAt(index);
  }

  private getArrayByType(type: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos'): FormArray {
    const map = { alertas: this.alertasList, medicamentos: this.medicamentosList, enfermedades: this.enfermedadesList, habitos: this.habitosList };
    return map[type];
  }

  // Método que gatilla la barra superior de acciones al guardar
  // Cambiamos el método para que retorne los strings procesados al componente padre
  public guardarAntecedentesFrontend(): { alergias: string, enfermedades: string, medicamentos: string, habitos: string } {

    // Convertimos los arreglos de FormArray a strings limpios separados por comas
    const alertasString = this.alertasList.value.join(', ');
    const enfermedadesString = this.enfermedadesList.value.join(', ');
    const medicamentosString = this.medicamentosList.value.join(', ');
    const habitosString = this.habitosList.value.join(', ');

    // 📦 Retornamos la estructura limpia estructurada
    return {
      alergias: alertasString || 'Sin información',
      enfermedades: enfermedadesString || 'Sin registros',
      medicamentos: medicamentosString || 'Sin registros',
      habitos: habitosString || 'Sin registros'
    };
  }

  // ➕ Agrega el ítem a la lista interna del drop (Gatillado por el Check ✔)
  public confirmarItemInline(type: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos'): void {
    const texto = this.currentInputs[type].trim();
    if (!texto) return;

    // Insertar en la lista temporal interna si no está duplicado
    if (!this.tempLists[type].includes(texto)) {
      this.tempLists[type].push(texto);
    }

    this.editModes[type] = false;
    this.currentInputs[type] = '';
  }

  // ✕ Quita un elemento desde adentro del dropdown antes de consolidar
  public removerItemTemporal(type: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos', index: number): void {
    this.tempLists[type].splice(index, 1);
  }

  // 💾 BOTÓN ACEPTAR: Mueve todo el contenido temporal al FormArray definitivo de la tarjeta principal
  public consolidarDropdown(type: 'alertas' | 'medicamentos' | 'enfermedades' | 'habitos'): void {
    const targetArray = this.getArrayByType(type);
    targetArray.clear(); // Limpiamos el estado anterior para inyectar la lista actualizada

    this.tempLists[type].forEach(item => {
      targetArray.push(this.fb.control(item));
    });

    // Cierre total del panel flotante
    this.activeDropdown = null;
    this.editModes[type] = false;
  }



}
