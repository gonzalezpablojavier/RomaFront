import axios from 'axios';
import type {
  CambioNivel,
  CriterioConfig,
  ColaboradorDesempeno,
  Evaluacion,
  EvaluacionPayload,
  ResumenDesempeno,
} from '../types/desempeno';

const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;

type ApiResponse<T> = { ok: number; message: string; data: T };

const getHeaders = () => {
  const empresaId = localStorage.getItem('l_empresa_id') || 'default';
  const rawUser = localStorage.getItem('user');
  let userId = '';
  try {
    const parsed = rawUser ? JSON.parse(rawUser) : null;
    const maybe = parsed?.user_code ?? parsed?.userId ?? parsed?.id;
    if (maybe != null) userId = String(maybe);
  } catch {
    userId = '';
  }
  return {
    'x-empresa-id': empresaId,
    ...(userId ? { 'x-user-id': userId } : {}),
  };
};

export const desempenoService = {
  getConfig: () =>
    axios.get<
      ApiResponse<{
        CRITERIOS_POR_NIVEL: Record<'Jr' | 'Ssr' | 'Sr', CriterioConfig[]>;
        DESCRIPCION_NIVEL: Record<'Jr' | 'Ssr' | 'Sr', string>;
      }>
    >(`${API_URL}/desempeno/config/criterios`, { headers: getHeaders() }),

  getTrimestreActivo: () =>
    axios.get<ApiResponse<{ trimestre: string }>>(`${API_URL}/desempeno/config/trimestre-activo`, { headers: getHeaders() }),

  getColaboradores: (params?: { area?: string; sucursal?: string; nivel?: string; q?: string }) =>
    axios.get<ApiResponse<ColaboradorDesempeno[]>>(`${API_URL}/desempeno/colaboradores`, { headers: getHeaders(), params }),

  getColaborador: (colaboradorID: number) =>
    axios.get<ApiResponse<ColaboradorDesempeno>>(`${API_URL}/desempeno/colaborador/${colaboradorID}`, { headers: getHeaders() }),

  getEvaluacion: (colaboradorID: number, trimestre: string) =>
    axios.get<ApiResponse<Evaluacion | null>>(`${API_URL}/desempeno/evaluacion/${colaboradorID}/${trimestre}`, {
      headers: getHeaders(),
    }),

  getResumen: (trimestre: string) =>
    axios.get<ApiResponse<ResumenDesempeno>>(`${API_URL}/desempeno/resumen/${trimestre}`, { headers: getHeaders() }),

  getRanking: (trimestre: string, params?: { area?: string; sucursal?: string; nivel?: string }) =>
    axios.get<ApiResponse<ColaboradorDesempeno[]>>(`${API_URL}/desempeno/ranking/${trimestre}`, { headers: getHeaders(), params }),

  getEvolucionGeneral: () =>
    axios.get<ApiResponse<Array<{ trimestre: string; scorePromedio: string | number }>>>(`${API_URL}/desempeno/evolucion/general`, { headers: getHeaders() }),

  getEvolucionPorArea: () =>
    axios.get<ApiResponse<Array<{ trimestre: string; area: string; scorePromedio: string | number }>>>(`${API_URL}/desempeno/evolucion/por-area`, {
      headers: getHeaders(),
    }),

  getEvolucionNiveles: () =>
    axios.get<ApiResponse<Array<{ trimestre: string; nivel: 'Jr' | 'Ssr' | 'Sr'; cantidad: string | number }>>>(`${API_URL}/desempeno/evolucion/niveles`, {
      headers: getHeaders(),
    }),

  getEvolucionIndividual: (colaboradorID: number) =>
    axios.get<ApiResponse<Array<{ trimestre: string; scoreTotal: string | number; nivel: 'Jr' | 'Ssr' | 'Sr' }>>>(`${API_URL}/desempeno/evolucion/individual/${colaboradorID}`, {
      headers: getHeaders(),
    }),

  getCambiosNivel: (params?: { area?: string; direccion?: string }) =>
    axios.get<ApiResponse<CambioNivel[]>>(`${API_URL}/desempeno/cambios-nivel`, { headers: getHeaders(), params }),

  getMiDesempeno: () =>
    axios.get<
      ApiResponse<{
        colaboradorID: number;
        nombre: string;
        apellido: string;
        nivel: 'Jr' | 'Ssr' | 'Sr';
        evaluaciones: Array<{ id: number; trimestre: string; nivel: 'Jr' | 'Ssr' | 'Sr'; scoreTotal: number }>;
        scoreActual: number | null;
      }>
    >(`${API_URL}/desempeno/mi-desempeno`, { headers: getHeaders() }),

  guardarEvaluacion: (payload: EvaluacionPayload) =>
    axios.post<ApiResponse<any>>(`${API_URL}/desempeno/evaluacion`, payload, { headers: getHeaders() }),
};

