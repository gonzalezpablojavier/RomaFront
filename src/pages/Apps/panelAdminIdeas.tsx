import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/apiClient';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { getAreasForEmpresa, getManagerIdsForEmpresa, getManagerAreasForEmpresa } from '../../services/empresaService';
import IdeaEvaluation from './IdeaEvaluation';
import { Star } from 'lucide-react';
import { Coins } from 'lucide-react';
import CoinRating from './CoinRating';
import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '../../session/sessionStore';

interface Idea {
  id: number;
  colaboradorID: number;
  titulo: string;
  idea: string;
  fechaCreacion: string;
  estado: string;
  categoria: string;
  puntaje:number;
}

interface Colaborador {
  id: string;
  nombre: string;
  apellido: string;
  area: string;
  colaboradorID: number;
}

const PanelAdminIdeas: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [error, setError] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string>('');

  // Inyectar CSS para forzar estilos blancos
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ideas-table thead {
        background-color: white !important;
      }
      .ideas-table thead th {
        background-color: white !important;
        color: black !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  const [areas, setAreas] = useState<string[]>([]);
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [managerAreas, setManagerAreas] = useState<{ [key: string]: string }>({});



  
  useEffect(() => {
    const storedEmpresaID = getSessionEmpresaId();
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
      fetchIdeas();
      fetchColaboradores();
    }
  }, [empresaId]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroArea, filtroEstado, filtroCategoria, filtroFechaDesde, filtroFechaHasta, ideas]);

  const fetchIdeas = async () => {
    try {
      const response = await apiClient.get(`/idea-box`
      );
      const sortedIdeas = response.data.sort((a: Idea, b: Idea) => b.id - a.id);
      setIdeas(sortedIdeas);
    } catch (error) {
      setError('Error al obtener las ideas. Por favor, intente nuevamente.');
      console.error(error);
    }
  };

  const fetchColaboradores = async () => {
    try {
      const response = await apiClient.get(`/usuarios-registrados`);
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
    let ideasFiltradas = ideas;

    if (filtroArea) {
      ideasFiltradas = ideasFiltradas.filter(idea => 
        colaboradores.find(c => c.colaboradorID === idea.colaboradorID)?.area === filtroArea
      );
    }

    if (filtroEstado) {
      ideasFiltradas = ideasFiltradas.filter(idea => idea.estado === filtroEstado);
    }

    if (filtroCategoria) {
      ideasFiltradas = ideasFiltradas.filter(idea => idea.categoria === filtroCategoria);
    }

    const fechaDesde = parseISO(filtroFechaDesde);
    const fechaHasta = parseISO(filtroFechaHasta);

    ideasFiltradas = ideasFiltradas.filter(idea => {
      const fechaCreacion = parseISO(idea.fechaCreacion);
      return fechaCreacion >= fechaDesde && fechaCreacion <= fechaHasta;
    });

    setFilteredIdeas(ideasFiltradas);
  };
  const handleStatusChange = async (ideaId: number, newStatus: string) => {
    try {
      await apiClient.post(`/idea-box/${ideaId}/evaluate`, 
        { estado: newStatus }
      );
      fetchIdeas();
    } catch (error) {
      setError('Error al actualizar el estado de la idea');
    }
  };

  const handleRatingChange = async (ideaId: number, rating: number) => {
    try {
      if (rating < 3) {
        setError('El puntaje debe estar entre 3 y 5 monedas');
        return;
      }
      await apiClient.post(`/idea-box/${ideaId}/evaluate`, 
        { puntaje: rating }
      );
      fetchIdeas();
    } catch (error) {
      setError('Error al asignar puntaje a la idea');
    }
  };


  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Panel de Ideas</h1>
      
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

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto ideas-table">
          <thead className="bg-white border-b-2 border-gray-300" style={{ backgroundColor: 'white !important' }}>
            <tr>
           
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Idea</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Colaborador</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Área</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Fecha</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Estado</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Puntaje</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Acciones</th>
           
            </tr>
          </thead>
          <tbody>
            {filteredIdeas.map((idea) => {
              const colaborador = colaboradores.find(c => c.colaboradorID === idea.colaboradorID);
              return (
                <tr key={idea.id} className="border-b hover:bg-gray-50">
         
                  <td className="px-4 py-2">{idea.idea}</td>
                  <td className="px-4 py-2">{colaborador ? `${colaborador.nombre} ${colaborador.apellido}` : 'N/A'}</td>
                  <td className="px-4 py-2">{colaborador ? colaborador.area : 'N/A'}</td>
                  <td className="px-4 py-2">{format(parseISO(idea.fechaCreacion), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-2">
                    <select
                      value={idea.estado || 'pendiente'}
                      onChange={(e) => handleStatusChange(idea.id, e.target.value)}
                      className="p-2 border rounded"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="revision">En Revisión</option>
                      <option value="evaluada">Evaluada</option>
                     
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <CoinRating
                      value={idea.puntaje || 0}
                      onRatingChange={(newRating) => handleRatingChange(idea.id, newRating)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      idea.estado === 'evaluada' ? 'bg-green-200 text-green-800' :
                      idea.estado === 'rechazada' ? 'bg-red-200 text-red-800' :
                      idea.estado === 'revision' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {idea.estado || 'pendiente'}
                    </span>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PanelAdminIdeas;