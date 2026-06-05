import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildCertificadoAdminUrl } from '../../config/env';
import { format, parseISO, isValid } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { getAreasForEmpresa, getManagerIdsForEmpresa, getManagerAreasForEmpresa } from '../../services/empresaService';
interface Comprobante {
  id: number;
  fechaSubida: string;
  estado: string;
  colaboradorID: number;
  rutaArchivo: string;
}

interface Colaborador {
  id: string;
  nombre: string;
  apellido: string;
  area: string;
  colaboradorID: number;
}

const PanelComprobantes: React.FC = () => {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [filteredComprobantes, setFilteredComprobantes] = useState<Comprobante[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [areas, setAreas] = useState<string[]>([]);
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [managerAreas, setManagerAreas] = useState<{ [key: string]: string }>({});

  const tipos = ['Factura', 'Recibo', 'Nota de Crédito', 'Nota de Débito'];
  const estados = ['Pendiente', 'Aprobado', 'Rechazado'];

  const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;
 
  useEffect(() => {
    const storedEmpresaID = localStorage.getItem('l_empresa_id');
    if (storedEmpresaID) {
      setEmpresaId(storedEmpresaID);
      const empresaAreas = getAreasForEmpresa(storedEmpresaID);
      const empresaManagerIds = getManagerIdsForEmpresa(storedEmpresaID);
      const empresaManagerAreas = getManagerAreasForEmpresa(storedEmpresaID);
      setAreas(empresaAreas);
      setManagerIds(empresaManagerIds);
      setManagerAreas(empresaManagerAreas);
    } else {
      setError('No se ha especificado una empresa');
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      fetchComprobantes();
      fetchColaboradores();
    }
  }, [empresaId]);


  useEffect(() => {
    aplicarFiltros();
  }, [filtroArea, filtroTipo, filtroEstado, filtroFechaDesde, filtroFechaHasta, comprobantes]);

  const fetchComprobantes = async () => {
    try {
      const response = await axios.get(`${API_URL}/certificados`,
        {
          headers: { 'x-empresa-id': empresaId }
        }
      );
      const sortedComprobantes = response.data.sort((a: Comprobante, b: Comprobante) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime());
      setComprobantes(sortedComprobantes);
    } catch (error) {
      setError('Error al obtener los comprobantes. Por favor, intente nuevamente.');
      console.error(error);
    }
  };

  const fetchColaboradores = async () => {
    try {
      const response = await axios.get(`${API_URL}/usuarios-registrados`, {
        headers: { 'x-empresa-id': empresaId }
      });
      if (response.data.ok === 1 && Array.isArray(response.data.data)) {
        setColaboradores(response.data.data);
      } else {
        console.error('La respuesta de colaboradores no es válida:', response.data);
        setColaboradores([]);
      }
    } catch (error) {
      console.error('Error al obtener los colaboradores:', error);
      setError('Error al obtener los colaboradores. Por favor, intente nuevamente.');
      setColaboradores([]);
    }
  };

  const aplicarFiltros = () => {
    let comprobantesFiltered = comprobantes;

    if (filtroArea) {
      comprobantesFiltered = comprobantesFiltered.filter(comprobante => 
        colaboradores.find(c => c.colaboradorID === comprobante.colaboradorID)?.area === filtroArea
      );
    }


    if (filtroEstado) {
      comprobantesFiltered = comprobantesFiltered.filter(comprobante => comprobante.estado === filtroEstado);
    }

    if (filtroFechaDesde) {
      const fechaDesde = parseISO(filtroFechaDesde);
      comprobantesFiltered = comprobantesFiltered.filter(comprobante => {
        const fechaComprobante = parseISO(comprobante.fechaSubida);
        return isValid(fechaComprobante) && fechaComprobante >= fechaDesde;
      });
    }

    if (filtroFechaHasta) {
      const fechaHasta = parseISO(filtroFechaHasta);
      comprobantesFiltered = comprobantesFiltered.filter(comprobante => {
        const fechaComprobante = parseISO(comprobante.fechaSubida);
        return isValid(fechaComprobante) && fechaComprobante <= fechaHasta;
      });
    }

    setFilteredComprobantes(comprobantesFiltered);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd/MM/yyyy') : 'Fecha inválida';
  };

  const handleVerComprobante = (rutaArchivo: string) => {
    window.open(buildCertificadoAdminUrl(rutaArchivo), '_blank');
  };

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Panel de Certificados</h1>
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Cerrar</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>
      )}
      
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Todas las áreas</option>
          {areas.map((area) => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>


  

        <input
          type="date"
          value={filtroFechaDesde}
          onChange={(e) => setFiltroFechaDesde(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="date"
          value={filtroFechaHasta}
          onChange={(e) => setFiltroFechaHasta(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-xl font-semibold mb-4">Historial de Comprobantes</h2>
        {filteredComprobantes.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'white' }}>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Fecha</TableCell>               
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Colaborador</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Importe</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Certificado</TableCell>
                 
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredComprobantes.map((comprobante) => {
                  const colaborador = colaboradores.find(c => c.colaboradorID === comprobante.colaboradorID);
                  return (
                    <TableRow key={comprobante.id} sx={{ backgroundColor: 'white' }}>
                      <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{formatDate(comprobante.fechaSubida)}</TableCell>                  
                 
                      <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{colaborador ? `${colaborador.nombre} ${colaborador.apellido}` : 'N/A'}</TableCell>
                      <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{colaborador ? colaborador.area : 'N/A'}</TableCell>
                      <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                        <Tooltip title="Ver comprobante">
                          <IconButton
                            onClick={() => handleVerComprobante(comprobante.rutaArchivo)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <p>No hay historial de comprobantes disponible.</p>
        )}
      </div>
    </div>
  );
};

export default PanelComprobantes;