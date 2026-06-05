export type Nivel = 'Jr' | 'Ssr' | 'Sr';

export interface CriterioConfig {
  nombre: string;
  descripcion: string;
}

export interface CriterioPuntaje {
  nombre: string;
  puntaje: number;
}

export interface Evaluacion {
  id: number;
  colaboradorID: number;
  trimestre: string;
  nivel: Nivel;
  scoreTotal: number;
  observaciones?: string;
  objetivos?: string;
  evaluadorID: number;
  criterios: CriterioPuntaje[];
  createdAt: string;
  updatedAt: string;
}

export interface ColaboradorDesempeno {
  id: number;
  colaboradorID: number;
  nombre: string;
  apellido: string;
  area: string;
  sucursal: string;
  nivel: Nivel;
  evaluacion?: Evaluacion; // evaluación del trimestre seleccionado, si existe
}

export interface ResumenDesempeno {
  totalColaboradores: number;
  evaluados: number;
  scorePromedio: number | null;
  topPerformers: number;
  atencion: number;
  areas: number;
  sucursales: number;
  porArea: AreaResumen[];
}

export interface AreaResumen {
  area: string;
  totalPersonas: number;
  evaluados: number;
  scorePromedio: number | null;
  distribucion: { Jr: number; Ssr: number; Sr: number };
}

export interface CambioNivel {
  id: number;
  colaboradorID: number;
  nombreCompleto: string;
  area: string;
  sucursal: string;
  nivelAnterior: Nivel;
  nivelNuevo: Nivel;
  trimestre: string;
  esAscenso: boolean;
  createdAt: string;
}

export interface EvaluacionPayload {
  colaboradorID: number;
  trimestre: string;
  nivel: Nivel;
  criterios: CriterioPuntaje[];
  observaciones?: string;
  objetivos?: string;
}

