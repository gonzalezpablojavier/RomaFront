import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/apiClient';
import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '../../session/sessionStore';
import {
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  SelectChangeEvent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper 
} from '@mui/material';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface ApiResponse {
  ok: number;
  message: string;
  data: Permiso[];
}

const initialState = {
  fechaPermiso: '',
  colaboradorCubre: '',
  motivo: '',
  area: '',
  observacion: '',
  horario: '',
  autorizado: 'Evaluando',
  colaboradorID: '',
  empresaId:''
};

interface FormData {
  fechaPermiso: string;
  colaboradorCubre: string;
  motivo: string;
  area: string;
  observacion: string;
  horario: string;
  autorizado: string;
  colaboradorID: string;
  empresaId:string;
}

interface Permiso {
  id: number;
  fechaPermiso: string;
  colaboradorCubre: string;
  motivo: string;
  area: string;
  observacion: string;
  horario: string;
  autorizado: string;
}

interface UsuarioRegistradoProfile {
  area?: string | null;
}

const PermisoTemporal: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [historialPermisos, setHistorialPermisos] = useState<Permiso[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  
  const motivos = ['Personal', 'Estudio', 'Salud', 'Tramites', 'Home','Sabado Ganado'];

  const obtenerHistorialPermisos = useCallback(async (colaboradorID: string,empresaId:string) => {
    try {
      const response = await apiClient.get<ApiResponse>(`/permiso-temporal/historial/${colaboradorID}?limit=100`
      );
      if (response.data.ok === 1 && Array.isArray(response.data.data)) {
           // Ordenar los datos por fechaPermiso descendente
      const historialOrdenado = response.data.data.sort((a, b) => {
        const fechaA = new Date(a.fechaPermiso);
        const fechaB = new Date(b.fechaPermiso);
        return fechaB.getTime() - fechaA.getTime(); // Orden descendente
      });
        setHistorialPermisos(historialOrdenado);
      } else {
        console.error('Respuesta inesperada:', response.data);
        setHistorialPermisos([]);
      }
    } catch (error) {
      console.error('Error al obtener el historial de permisos:', error);
      setHistorialPermisos([]);
    }
  }, []);

  useEffect(() => {
    const user = getSessionUserId();
    const colaboradorID = user;
    const storedEmpresa = getSessionEmpresaId();
    if (colaboradorID && storedEmpresa) {
      setFormData((prevData) => ({ ...prevData, colaboradorID,empresaId:storedEmpresa }));
      setEmpresaId(storedEmpresa);
      obtenerHistorialPermisos(colaboradorID,storedEmpresa);
    }
  }, [obtenerHistorialPermisos, refreshKey]);

  useEffect(() => {
    if (!formData.colaboradorID || !empresaId) return;

    const fetchUserArea = async () => {
      try {
        const profileResponse = await apiClient.get<{ ok: number; data?: UsuarioRegistradoProfile }>(
          `/usuarios-registrados/${formData.colaboradorID}`
        );
        const area = profileResponse.data?.data?.area ?? '';
        if (typeof area === 'string' && area.trim()) {
          setFormData((prevData) => ({ ...prevData, area: area.trim() }));
        }
      } catch (err) {
        console.error('Error al obtener el área del usuario:', err);
      }
    };

    fetchUserArea();
  }, [empresaId, formData.colaboradorID]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleMotivoChange = (event: SelectChangeEvent<string>) => {
    setFormData((prevData) => ({ ...prevData, motivo: event.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.fechaPermiso) {
      setError('La fecha del permiso es obligatoria');
      return;
    }
    if (!empresaId) {
      setError('No se ha especificado una empresa');
      return;
    }
    try {
      const payload: Record<string, unknown> = { ...formData };
      if (!formData.area || !formData.area.trim()) {
        delete payload.area;
      }
      const response = await apiClient.post<Permiso>(`/permiso-temporal`, payload);
      if (response.status === 201) {
        setRefreshKey(oldKey => oldKey + 1);
        setFormData((prevData) => ({
          ...initialState,
          colaboradorID: prevData.colaboradorID,
          empresaId: prevData.empresaId,
          area: prevData.area,
        }));
        obtenerHistorialPermisos(formData.colaboradorID,empresaId);
      } else {
        setError('Error al enviar la solicitud');
      }
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || 'Error al enviar la solicitud';
      setError(backendMessage);
      console.error(err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Fecha no disponible';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: es }) : 'Fecha inválida';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-bold mb-4">Solicitar Permiso Temporal</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Fecha del Permiso"
            type="date"
            name="fechaPermiso"
            value={formData.fechaPermiso}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
            error={!formData.fechaPermiso}
            helperText={!formData.fechaPermiso ? "La fecha es obligatoria" : ""}
  
          />
          <FormControl fullWidth>
            <InputLabel id="motivo-label">Motivo</InputLabel>
            <Select
              labelId="motivo-label"
              value={formData.motivo}
              onChange={handleMotivoChange}
              label="Motivo"
            >
              {motivos.map((motivo) => (
                <MenuItem key={motivo} value={motivo}>{motivo}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Colaborador que cubre"
            name="colaboradorCubre"
            value={formData.colaboradorCubre}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            label="Observación"
            name="observacion"
            value={formData.observacion}
            onChange={handleChange}
            multiline
            rows={2}
            required
          />
          <TextField
            fullWidth
            label="Horario"
            name="horario"
            value={formData.horario}
            onChange={handleChange}
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Enviar Solicitud
          </Button>
        </form>
      </div>

      {/* Historial de Permisos */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg mt-8">
        <h2 className="text-xl font-semibold mb-4">Historial de Permisos</h2>
        {historialPermisos.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'white' }}>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Motivo</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historialPermisos.map((permiso) => (
                  <TableRow key={permiso.id} sx={{ backgroundColor: 'white' }}>
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{formatDate(permiso.fechaPermiso)}</TableCell>
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{permiso.motivo}</TableCell>
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{permiso.autorizado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <p>No hay historial de permisos disponible.</p>
        )}
      </div>
    </div>
  );
};

export default PermisoTemporal;