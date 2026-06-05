import axios from 'axios';
const API_URL = import.meta.env.VITE_API_DISTRI_API;
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

  
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login-empresa`, credentials);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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





// Función para obtener información de la empresa
export const getEmpresaInfo = async (empresaId: number): Promise<EmpresaInfo> => {
  try {
    const response = await axios.get<EmpresaInfo>(`${API_URL}/empresas/${empresaId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
    const response = await axios.post<Colaborador>(
      `${API_URL}/colaboradores`,
      { ...colaboradorData}
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
    const response = await axios.put<Colaborador>(
      `${API_URL}/usuarios-registrados/by-empresaId/${colaboradorData.colaboradorID}`,
      colaboradorData
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
    const response = await axios.put<Colaborador>(
      `${API_URL}/usuarios-registrados/by-empresaId/${colaboradorData.colaboradorID}`,
      colaboradorData
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
    const response = await axios.put<EmpresaInfo>(`${API_URL}/empresas/${empresaId}`, empresaData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
    await axios.delete(`${API_URL}/colaboradores/${colaboradorId}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
    const response = await fetch(`${API_URL}/usuarios-registrados/by-empresaId/${empresaId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch usuarios registrados');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching usuarios registrados:', error);
    throw error;
  }
};
export const createEmpresa = async (empresaData: Partial<Empresa>): Promise<Empresa> => {
  try {
    const response = await axios.post<Empresa>(`${API_URL}/empresas`, empresaData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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

