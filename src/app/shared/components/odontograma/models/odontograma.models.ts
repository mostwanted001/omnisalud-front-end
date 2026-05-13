// odontograma.models.ts
export interface EstadoPieza {
  pieza: number;
  hallazgos: any[];
  ausente: boolean;
}

export interface RegistroHistorial {
  fecha: string;
  pieza: string;
  caras: string;
  estado: string;
  creador: string;
}