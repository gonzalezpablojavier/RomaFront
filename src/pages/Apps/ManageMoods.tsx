import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../api/apiClient';
import { format } from 'date-fns';
import {
  getAreasForEmpresa,
  getManagerAreasForEmpresa,
  getManagerIdsForEmpresa,
} from '../../services/empresaService';
import { getTenantAreaNames } from '../../services/tenantRbacService';


interface Mood {
  id: number;
  mood: string;
  date: string;
  colaboradorID: number;
}

interface Colaborador {
  id: string;
  area: string;
  apellido: string;
  nombre: string;
  colaboradorID: number;
}

const ManageMoods: React.FC = () => {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [filteredMoods, setFilteredMoods] = useState<Mood[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroMood, setFiltroMood] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [currentUserArea, setCurrentUserArea] = useState<string | null>(null);

  // Inyectar CSS para forzar estilos blancos
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .moods-table thead {
        background-color: white !important;
      }
      .moods-table thead th {
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
  const [empresaId, setEmpresaId] = useState<string>('');
  const areas = useMemo(() => {
    const fromCatalog = getTenantAreaNames();
    if (fromCatalog.length) return fromCatalog;
    return empresaId ? getAreasForEmpresa(empresaId) : [];
  }, [empresaId]);

  const moodEmojis = {
    contento: '😊',
    enojado: '😠',
    mal: '😢',
  };

  useEffect(() => {
    const userID = (
      localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')!)
        : null
    ) as { user_code: string | null } | null;
    const userCode = userID?.user_code;
    const storedEmpresaID = localStorage.getItem('l_empresa_id') || 'default';
    if (userCode) {
      setCurrentUserID(String(userCode));
      const userIDString = String(userCode);
      const managerIds = getManagerIdsForEmpresa(storedEmpresaID);
      const managerAreas = getManagerAreasForEmpresa(storedEmpresaID);
      if (managerIds.includes(userIDString)) {
        const userArea = managerAreas[userIDString];
        if (userArea) {
          setCurrentUserArea(userArea);
          if (userArea !== 'Gerencia' && userArea !== 'GerenciaOP') {
            setFiltroArea(userArea);
          }
        }
      }
    }


    
    if (storedEmpresaID) {
      setEmpresaId(storedEmpresaID);
      fetchMoods(storedEmpresaID);
      fetchColaboradores(storedEmpresaID);
    } else {
      setError('No se ha especificado una empresa');
    }
  }, []);


  useEffect(() => {
    if (empresaId) {
      fetchMoods(empresaId);
      fetchColaboradores(empresaId);
    }
  }, [empresaId]);


  useEffect(() => {
    aplicarFiltros();
  }, [filtroArea, filtroFecha, filtroMood, moods, colaboradores]);

  const fetchMoods = async (empresaId: string) => {
    try {
      const response = await apiClient.get(`/howareyou`
      );
      const sortedMoods = response.data.sort((a: Mood, b: Mood) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setMoods(sortedMoods);
    } catch (error) {
      setError('Error al obtener los estados de ánimo');
      console.error(error);
    }
  };

  const fetchColaboradores = async (empresaId: string) => {
    try {
      const response = await apiClient.get(`/usuarios-registrados`
        

      );
      if (response.data.ok === 1 && Array.isArray(response.data.data)) {
        setColaboradores(response.data.data);
      } else {
        console.error('La respuesta de colaboradores no es válida:', response.data);
        setColaboradores([]);
      }
    } catch (error) {
      console.error('Error al obtener los colaboradores:', error);
      setError('Error al obtener los colaboradores');
      setColaboradores([]);
    }
  };

  const aplicarFiltros = () => {
    let moodsFiltered = moods;


    if (currentUserArea && currentUserArea !== 'Gerencia' && currentUserArea !== 'GerenciaOP') {
      moodsFiltered = moodsFiltered.filter(mood => 
        colaboradores.find(c => c.colaboradorID === mood.colaboradorID)?.area === currentUserArea
      );
    } else if (filtroArea) {
      moodsFiltered = moodsFiltered.filter(mood => 
        colaboradores.find(c => c.colaboradorID === mood.colaboradorID)?.area === filtroArea
      );
    }

    if (filtroFecha) {
      moodsFiltered = moodsFiltered.filter(mood => 
        mood.date.split('T')[0] === filtroFecha
      );
    }

    if (filtroMood) {
      moodsFiltered = moodsFiltered.filter(mood => mood.mood === filtroMood);
    }

    setFilteredMoods(moodsFiltered);
  };

  const handleMoodFilter = (mood: string) => {
    setFiltroMood(mood === filtroMood ? '' : mood);
  };

  const isManager =
    !!currentUserID &&
    getManagerIdsForEmpresa(empresaId || 'default').includes(currentUserID);
  const canViewAllAreas = currentUserArea === 'Gerencia' || currentUserArea === 'GerenciaOP';

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Panel ¿Cómo estás Hoy?</h1>
      
      {error && <p className="text-red-500 mb-4 bg-red-100 p-3 rounded">{error}</p>}
      
      <div className="mb-6 flex flex-wrap gap-4 items-center">
      {(canViewAllAreas) && (
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todas las áreas</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <div className="flex gap-2">
          {Object.entries(moodEmojis).map(([mood, emoji]) => (
            <button
              key={mood}
              onClick={() => handleMoodFilter(mood)}
              className={`text-2xl p-2 rounded-full ${filtroMood === mood ? 'bg-blue-200' : 'bg-gray-200'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto moods-table">
          <thead className="bg-white border-b-2 border-gray-300" style={{ backgroundColor: 'white !important' }}>
            <tr>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Fecha</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Colaborador</th>        
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Área</th>  
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredMoods.map((mood) => {
              const colaborador = colaboradores.find(c => c.colaboradorID === mood.colaboradorID);
              return (
                <tr key={mood.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{format(new Date(mood.date), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-2">{colaborador ? `${colaborador.nombre} ${colaborador.apellido}` : 'N/A'}</td> 
                  <td className="px-4 py-2">{colaborador ? colaborador.area : 'N/A'}</td>
                  <td className="px-4 py-2">{moodEmojis[mood.mood as keyof typeof moodEmojis] || mood.mood}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageMoods;