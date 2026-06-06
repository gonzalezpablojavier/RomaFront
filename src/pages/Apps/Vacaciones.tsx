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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface FormData {
  fechaPermisoDesde: string;
  fechaPermisoHasta: string;
  colaboradorCubre: string;
  motivo: string;
  observacion: string;
  autorizado: string;
  colaboradorID: string;
  area: string;
  empresaId:string;
}

interface Vacacion {
  id: number;
  fechaPermisoDesde: string;
  fechaPermisoHasta: string;
  colaboradorCubre: string;
  area: string;
  autorizado: string;
}

const Vacaciones: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fechaPermisoDesde: '',
    fechaPermisoHasta: '',
    colaboradorCubre: '',
    motivo: '',
    observacion: '',
    autorizado: 'Evaluando',
    colaboradorID: '',
    area: '',
    empresaId:'',
  });
  const [historialVacaciones, setHistorialVacaciones] = useState<Vacacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    const areas = ['Sistemas', 'Administración', 'Depósito', 'Comercial', 'GerenciaOP', 'Contabilidad', 'Compras', 'TV', 'Gerencia','Aoki'];
  const [empresaId, setEmpresaId] = useState<string>('');
  const obtenerHistorialVacaciones = useCallback(async (colaboradorID: string,empresaId:string) => {
    try {
      const response = await apiClient.get<{ ok: number; data: Vacacion[] }>(`/vacaciones/historial/${colaboradorID}?limit=10`
      );
      if (response.data.ok === 1 && Array.isArray(response.data.data)) {
        setHistorialVacaciones(response.data.data);
      } else {
        console.error('Respuesta inesperada:', response.data);
        setHistorialVacaciones([]);
      }
    } catch (error) {
      console.error('Error al obtener el historial de vacaciones:', error);
      setHistorialVacaciones([]);
    }
  }, []);

  useEffect(() => {
    const user = getSessionUserId();
    const colaboradorID = user;
    const storedEmpresa = getSessionEmpresaId();
  
    if (colaboradorID && storedEmpresa) {
      setFormData((prevData) => ({ ...prevData, colaboradorID,empresaId:storedEmpresa }));
      setEmpresaId(storedEmpresa);
      obtenerHistorialVacaciones(colaboradorID,storedEmpresa);
    }
  }, [obtenerHistorialVacaciones]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleAreaChange = (event: SelectChangeEvent<string>) => {
    setFormData((prevData) => ({ ...prevData, area: event.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fechaPermisoDesde || !formData.fechaPermisoHasta || !formData.area) {
      setValidationMessage({ type: 'error', message: 'Por favor, complete todos los campos.' });
      return;
    }

    if (!empresaId) {
      setValidationMessage({ type: 'error', message: 'No se ha especificado una empresa.' });
      return;
    }

    try {
      const response = await apiClient.post(`/vacaciones`, formData);
      if (response.status === 201) {
        console.log('Datos de la respuesta:', response.data); // Log de los datos de la respuesta
        setError(null);
        setValidationMessage({ type: 'success', message: 'Solicitud enviada con éxito.' });
        obtenerHistorialVacaciones(formData.colaboradorID,empresaId);
        setFormData({ ...formData, fechaPermisoDesde: '', fechaPermisoHasta: '', colaboradorCubre: '' });
      } else {
        setError('Error al enviar la solicitud');
      }
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || 'Error al enviar la solicitud';
      setError(backendMessage);
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  const renderHistorialVacaciones = () => {
    if (!Array.isArray(historialVacaciones) || historialVacaciones.length === 0) {
      return <p>No hay historial de vacaciones disponible.</p>;
    }

    return (
      <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'white' }}>
            <TableRow>
              <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Desde</TableCell>
              <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Hasta</TableCell>
              <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historialVacaciones.map((vacacion) => (
              <TableRow key={vacacion.id} sx={{ backgroundColor: 'white' }}>
                <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{formatDate(vacacion.fechaPermisoDesde)}</TableCell>
                <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{formatDate(vacacion.fechaPermisoHasta)}</TableCell>
                <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{vacacion.autorizado}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white p-4">
      {error && <Alert severity="error" className="mb-4">{error}</Alert>}
      {validationMessage && (
        <Alert severity={validationMessage.type} className="mb-4">
          {validationMessage.message}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-bold mb-4">Mis Vacaciones</h1>
        <TextField
          fullWidth
          label="Fecha de inicio"
          type="date"
          name="fechaPermisoDesde"
          value={formData.fechaPermisoDesde}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          fullWidth
          label="Fecha de fin"
          type="date"
          name="fechaPermisoHasta"
          value={formData.fechaPermisoHasta}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl fullWidth>
          <InputLabel id="area-label">Área</InputLabel>
          <Select
            labelId="area-label"
            value={formData.area}
            onChange={handleAreaChange}
            label="Área"
          >
            {areas.map((area) => (
              <MenuItem key={area} value={area}>
                {area}
              </MenuItem>
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
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Enviar Solicitud
        </Button>
      </form>

      {/* Historial de Vacaciones */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg mt-8">
        <h2 className="text-xl font-semibold mb-4">Historial de Vacaciones</h2>
        {renderHistorialVacaciones()}
      </div>
    </div>
  );
};

export default Vacaciones;