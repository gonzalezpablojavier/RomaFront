import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { buildCertificadoViewUrl } from '../../config/env';
import { 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ApiResponse {
  ok: number;
  message: string;
  data: Certificado[];
}

interface Certificado {
  id: number;
  nombreArchivo: string;
  tipoArchivo: string;
  fechaSubida: string;
  rutaArchivo: string;  // Añadimos este campo para la URL del archivo
}

const CertificadoUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historialCertificados, setHistorialCertificados] = useState<Certificado[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [empresaId, setEmpresaId] = useState<string>('');
  const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;

  const obtenerHistorialCertificados = useCallback(async (colaboradorID: string, empresaId: string) => {
    try {

      const response = await axios.get<ApiResponse>(`${API_URL}/certificados/historial/${colaboradorID}?limit=10`,{   headers: { 'x-empresa-id': empresaId }});
      if (response.data.ok === 1 && Array.isArray(response.data.data)) {
        setHistorialCertificados(response.data.data);
      } else {
        console.error('Respuesta inesperada:', response.data);
        setHistorialCertificados([]);
      }
    } catch (error) {
      console.error('Error al obtener el historial de certificados:', error);
      setHistorialCertificados([]);
    }
  }, [API_URL]);

  useEffect(() => {
    const user = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;
    const colaboradorID = user;
    const storedEmpresa = localStorage.getItem('l_empresa_id');
    if (colaboradorID && storedEmpresa) {
      setEmpresaId(storedEmpresa);
      obtenerHistorialCertificados(colaboradorID,storedEmpresa);
    }
  }, [obtenerHistorialCertificados, refreshKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, seleccione un archivo');
      return;
    }

    const user = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;
    const colaboradorID = user;

    if (!colaboradorID) {
      setError('No se pudo obtener el ID del colaborador');
      return;
    }

    
    if (!colaboradorID || !empresaId) {
      setError('No se pudo obtener el ID del colaborador o de la empresa');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('colaboradorID', colaboradorID);
    formData.append('empresaId', empresaId);

    try {
      const response = await axios.post(`${API_URL}/certificados`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', 'x-empresa-id': empresaId
        },
      });
      if (response.data.ok === 1) {
        setRefreshKey(oldKey => oldKey + 1);
        setFile(null);
        obtenerHistorialCertificados(colaboradorID,empresaId);
      } else {
        setError('Error al subir el certificado');
      }
    } catch (error) {
      setError('Error al subir el certificado');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const handleVerComprobante = (rutaArchivo: string) => {
    window.open(buildCertificadoViewUrl(rutaArchivo), '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white p-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-bold mb-4">Mis Certificados</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full p-2 border border-gray-300 rounded"
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Subir Certificado'}
          </Button>
        </form>
      </div>

      {/* Historial de Certificados */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg mt-8">
        <h2 className="text-xl font-semibold mb-4">Historial de Certificados</h2>
        {historialCertificados.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'white' }}>
                <TableRow>
                
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Fecha de Subida</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historialCertificados.map((certificado) => (
                  <TableRow key={certificado.id} sx={{ backgroundColor: 'white' }}>
                 
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{formatDate(certificado.fechaSubida)}</TableCell>
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                      <Tooltip title="Ver comprobante">
                        <IconButton 
                          onClick={() => handleVerComprobante(certificado.rutaArchivo)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <p>No hay historial de certificados disponible.</p>
        )}
      </div>
    </div>
  );
};

export default CertificadoUpload;