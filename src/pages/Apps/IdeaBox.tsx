import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/apiClient';
import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '../../session/sessionStore';
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
  TextField,
  Tooltip,
  Rating
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAreasForEmpresa, getManagerIdsForEmpresa, getManagerAreasForEmpresa } from '../../services/empresaService';
import CoinRating from './CoinRating';
interface ApiResponse {
  ok: number;
  message: string;
  data: Idea[];
}

interface Idea {
  id: number;
  colaboradorID: number;
  idea: string;
  fechaCreacion: string;
  estado: string | null;
  comentarios: string | null;
  puntaje: number | null;
  areaDestino: string | null;
}

const IdeaBox: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [historialIdeas, setHistorialIdeas] = useState<Idea[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [areas, setAreas] = useState<string[]>([]);
  const [filtroArea, setFiltroArea] = useState('');
    const [areaDestino, setAreaDestino] = useState('');
  const obtenerHistorialIdeas = useCallback(async (colaboradorID: string,empresaId:string) => {
    try {
      const response = await apiClient.get<Idea[]>(`/idea-box/colaborador/${colaboradorID}`
      );
   
        setHistorialIdeas(response.data);
      
    } catch (error) {
      console.error('Error al obtener el historial de ideas:', error);
      setHistorialIdeas([]);
    }
  }, []);


  


  useEffect(() => {
    const user = getSessionUserId();
    const colaboradorID = user;
    const storedEmpresa = getSessionEmpresaId();
    if (storedEmpresa) {
    const empresaAreas = getAreasForEmpresa(storedEmpresa);
    if (colaboradorID && storedEmpresa) {
      setAreas(empresaAreas);
      setEmpresaId(storedEmpresa);
      obtenerHistorialIdeas(colaboradorID, storedEmpresa);
    }
  }


    
  }, [obtenerHistorialIdeas, refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      setError('Por favor, ingrese una idea');
      return;
    }
    if (!areaDestino) {
      setError('Por favor, seleccione un área destino');
      return;
    }


    const user = getSessionUserId();
    const colaboradorID = user;

 
    if (!colaboradorID || !empresaId) {
      setError('No se pudo obtener el ID del colaborador o de la empresa');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post(`/idea-box`, {
        colaboradorID,
        idea,
        empresaId,
        areaDestino
      });
      if (response.data.ok === 1) {
        setRefreshKey(oldKey => oldKey + 1);
        setIdea('');
        setAreaDestino(''); 
        obtenerHistorialIdeas(colaboradorID,empresaId);
      } else {
        setError('Error al enviar la idea');
      }
    } catch (error) {
      setError('Error al enviar la idea');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const getEstadoColor = (estado: string | null) => {
    switch (estado) {
      case 'aceptada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      case 'revision':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string | null): string => {
    if (!estado) return 'Pendiente';
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white p-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-bold mb-4">Caja de Ideas</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            multiline
            rows={4}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Escribe tu idea aquí..."
            fullWidth
            variant="outlined"
          />


        <select
          value={areaDestino}
          onChange={(e) => setAreaDestino(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
         <option value="">Seleccione un área destino...</option>
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Enviar Idea'}
          </Button>
        </form>
      </div>

      {/* Historial de Ideas */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg mt-8">
        <h2 className="text-xl font-semibold mb-4">Historial de Ideas</h2>
        {historialIdeas.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'white' }}>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Fecha de Creación</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Idea</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Puntaje</TableCell>
               
                </TableRow>
              </TableHead>
              <TableBody>
                {historialIdeas.map((idea) => (
                  <TableRow key={idea.id} sx={{ backgroundColor: 'white' }}>
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{formatDate(idea.fechaCreacion)}</TableCell>
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                      <Tooltip title={idea.idea}>
                        <span>{idea.idea.length > 50 ? `${idea.idea.substring(0, 50)}...` : idea.idea}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{idea.estado || 'Pendiente'}</TableCell>
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                      {idea.puntaje ? (
                        <CoinRating value={idea.puntaje} />
                      ) : (
                        <span className="text-gray-500">Sin evaluar</span>
                      )}
                    </TableCell>
                    <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{idea.comentarios || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <p>No hay historial de ideas disponible.</p>
        )}
      </div>
    </div>
  );
};

export default IdeaBox;