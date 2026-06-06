import { apiClient, isAxiosError } from '../api/apiClient';
import {
  clearEmpresaSession,
  getEmpresaAccessToken,
  getEmpresaPanelId,
  purgeLegacyEmpresaAuthStorage,
  setEmpresaSession,
} from '../session/empresaSessionStore';
interface Empresa {
  id: number;
  nombre: string;
  email: string;
  colaboradores: Colaborador[];
  // Añade más campos según sea necesario
}

// Interfaces
interface EmpresaInfo {
  id: number;
  nombre: string;
  email: string;
  colaboradores: Colaborador[];
  // Añade más campos según sea necesario
}

interface Colaborador {
  id:number;
  empresaId:string;
  nombre: string;
  apellido: string;
  email: string;
  fechaNacimiento: string;
  miFamilia: string;
  direccion: string;
  localidad: string;
  sucursal: string;
  area: string;
  cuil: string;
  foto: string;
  nombreUsuario:string;
  password:string;
  colaboradorID:number;
}

interface UsuarioRegistrado {
  id:number;
  empresaId:string;
  nombre: string;
  apellido: string;
  email: string;
  fechaNacimiento: string;
  miFamilia: string;
  direccion: string;
  localidad: string;
  sucursal: string;
  area: string;
  cuil: string;
  foto: string;
  nombreUsuario:string;
  password:string;
  colaboradorID:number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  nombre: string;
  email: string;
  token: string;
  // Añade cualquier otro campo que tu backend devuelva tras un login exitoso
}

export const loginEmpresa = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login-empresa', credentials);
    const data = response.data;
    if (data.token) {
      setEmpresaSession(data.token, data.id);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      apiClient.defaults.headers.common['x-empresa-id'] = String(data.id);
    }
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al iniciar sesión');
      } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
      } else {
        throw new Error('Error al configurar la petición');
      }
    } else {
      throw new Error('Error desconocido al iniciar sesión');
    }
  }
};

purgeLegacyEmpresaAuthStorage();

export const logoutEmpresa = (): void => {
  clearEmpresaSession();
  delete apiClient.defaults.headers.common['Authorization'];
  delete apiClient.defaults.headers.common['x-empresa-id'];
};

// Función para obtener información de la empresa
export const getEmpresaInfo = async (empresaId: number): Promise<EmpresaInfo> => {
  try {
    const response = await apiClient.get<EmpresaInfo>(`/empresas/${empresaId}`);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al obtener información de la empresa');
      } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
      } else {
        throw new Error('Error al configurar la petición');
      }
    } else {
      throw new Error('Error desconocido al obtener información de la empresa');
    }
  }
};

// Función para añadir un colaborador
export const addColaborador = async (colaboradorData: Colaborador): Promise<Colaborador> => {
  try {
    const response = await apiClient.post<Colaborador>(
      '/colaboradores',
      { ...colaboradorData},
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al añadir colaborador');
      } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
      } else {
        throw new Error('Error al configurar la petición');
      }
    } else {
      throw new Error('Error desconocido al añadir colaborador');
    }
  }
};


export const updateColaboradorUserPass = async (colaboradorId: number,colaboradorData: Colaborador): Promise<Colaborador> => {
  try {
    const response = await apiClient.put<Colaborador>(
      `/usuarios-registrados/by-empresaId/${colaboradorData.colaboradorID}`,
      colaboradorData,
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar colaborador');
      } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
      } else {
        throw new Error('Error al configurar la petición');
      }
    } else {
      throw new Error('Error desconocido al actualizar colaborador');
    }
  }
};

export const updateColaborador = async (colaboradorData: Colaborador): Promise<Colaborador> => {
  try {
    const response = await apiClient.put<Colaborador>(
      `/usuarios-registrados/by-empresaId/${colaboradorData.colaboradorID}`,
      colaboradorData,
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar colaborador');
      } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
      } else {
        throw new Error('Error al configurar la petición');
      }
    } else {
      throw new Error('Error desconocido al actualizar colaborador');
    }
  }
};
// Función para actualizar información de la empresa
export const updateEmpresaInfo = async (empresaId: number, empresaData: Partial<EmpresaInfo>): Promise<EmpresaInfo> => {
  try {
    const response = await apiClient.put<EmpresaInfo>(`/empresas/${empresaId}`, empresaData);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar información de la empresa');
      } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
      } else {
        throw new Error('Error al configurar la petición');
      }
    } else {
      throw new Error('Error desconocido al actualizar información de la empresa');
    }
  }
};

// Función para eliminar un colaborador
export const deleteColaborador = async (colaboradorId: number): Promise<void> => {
  try {
    await apiClient.delete(`/colaboradores/${colaboradorId}`);
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al eliminar colaborador');
      } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
      } else {
        throw new Error('Error al configurar la petición');
      }
    } else {
      throw new Error('Error desconocido al eliminar colaborador');
    }
  }
};

// Función para actualizar un colaborador

export const getUsuariosRegistrados = async (empresaId: string): Promise<{ ok: number; message: string; data: UsuarioRegistrado[] }> => {
  try {
    const response = await apiClient.get<{ ok: number; message: string; data: UsuarioRegistrado[] }>(
      `/usuarios-registrados/by-empresaId/${empresaId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching usuarios registrados:', error);
    throw error;
  }
};
export const createEmpresa = async (empresaData: Partial<Empresa>): Promise<Empresa> => {
  try {
    const response = await apiClient.post<Empresa>('/empresas', empresaData);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al crear la empresa');
      } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
      } else {
        throw new Error('Error al configurar la petición');
      }
    } else {
      throw new Error('Error desconocido al crear la empresa');
    }
  }
};

