import React, { useState, useEffect,useCallback  } from 'react';
import { apiClient } from '../../api/apiClient';
import { format } from 'date-fns';
import { getAreasForEmpresa, getManagerIdsForEmpresa, getManagerAreasForEmpresa } from '../../services/empresaService';

interface Feedback {
  id: number;
  createdAt: string;
  normaID: string;
  tipo: string;
  colaboradorIDDestino: number;
  colaboradorID: number;
  habito:string;
  motivo:string;
}

interface Colaborador {
  id: string;
  nombre: string;
  apellido: string;
  area: string;
  colaboradorID: number;
}

const PanelFeedBack: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Inyectar CSS para forzar estilos blancos
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .feedback-table thead {
        background-color: white !important;
      }
      .feedback-table thead th {
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
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroHabito, setFiltroHabito] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [managerAreas, setManagerAreas] = useState<{ [key: string]: string }>({});

  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const tipos = ['revision', 'felicitacion'];
  const habitos = [
    'Nos orientamos al cliente', 'Comunicamos(preguntamos)', '80/20', 'Somos protagonistas',
    'Al problema solución y plazo', 'Nos ponemos objetivos', 'Agendamos', 'Confianza',
    'Actitud', 'Capacidad de trabajo', 'Conocimiento'
  ];


  
  
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
    aplicarFiltros();
  }, [filtroArea, filtroFecha, filtroTipo,filtroHabito, feedbacks]);

  const fetchFeedbacks = useCallback(async () => {
    if (!empresaId) return;
    try {
      const response = await apiClient.get(`/feedback`);
      const sortedFeedbacks = response.data.sort((a: Feedback, b: Feedback) => b.id - a.id);
      setFeedbacks(sortedFeedbacks);
    } catch (error) {
      setError('Error al obtener los feedbacks');
      console.error(error);
    }
  }, [empresaId]);

  const fetchColaboradores = useCallback(async () => {
    if (!empresaId) return;
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
      setError('Error al obtener los colaboradores');
      setColaboradores([]);
    }
  }, [empresaId]);

  useEffect(() => {
    if (empresaId) {
      fetchFeedbacks();
      fetchColaboradores();
    }
  }, [empresaId, fetchFeedbacks, fetchColaboradores]);

  const aplicarFiltros = () => {
    let feedbacksFiltered = feedbacks;

    if (filtroArea) {
      feedbacksFiltered = feedbacksFiltered.filter(feedback => 
        colaboradores.find(c => c.colaboradorID === feedback.colaboradorIDDestino)?.area === filtroArea
      );
    }

    if (filtroFecha) {
      feedbacksFiltered = feedbacksFiltered.filter(feedback => 
        format(new Date(feedback.createdAt), 'yyyy-MM-dd') === filtroFecha
      );
    }

    if (filtroTipo) {
      feedbacksFiltered = feedbacksFiltered.filter(feedback => 
        feedback.tipo === filtroTipo
      );
    }

    if (filtroHabito) {
      feedbacksFiltered = feedbacksFiltered.filter(feedback => 
        getHabitoName(feedback.normaID) === filtroHabito
      );
    }

    setFilteredFeedbacks(feedbacksFiltered);
  };

  const getHabitoName = (normaID: string) => {
    const index = parseInt(normaID) - 1; // Asumiendo que normaID es un string numérico empezando desde "1"
    return habitos[index] || 'Hábito no encontrado';
  };

  return (
    <div className="container mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Panel de Reconocer/Revisar</h1>
      
      {error && <p className="text-red-500 mb-4 bg-red-100 p-3 rounded">{error}</p>}
      
      <div className="mb-6 flex flex-wrap gap-4">
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

        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Todos los tipos</option>
          {tipos.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>

        <select
          value={filtroHabito}
          onChange={(e) => setFiltroHabito(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Todos los Habitos</option>
          {habitos.map((habitos) => (
            <option key={habitos} value={habitos}>
              {habitos}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto feedback-table">
          <thead className="bg-white border-b-2 border-gray-300" style={{ backgroundColor: 'white !important' }}>
            <tr>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Fecha</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Envia</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Recibe</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Área</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Tipo</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Hábito</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.map((feedback) => {
              const colaborador = colaboradores.find(c => c.colaboradorID === feedback.colaboradorIDDestino);
              const colaboradorenvia = colaboradores.find(c => c.colaboradorID === feedback.colaboradorID);
              return (
                <tr key={feedback.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{format(new Date(feedback.createdAt), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-2">{colaboradorenvia ? `${colaboradorenvia.nombre} ${colaboradorenvia.apellido}` : 'N/A'}</td>
                  <td className="px-4 py-2">{colaborador ? `${colaborador.nombre} ${colaborador.apellido}` : 'N/A'}</td>

                  <td className="px-4 py-2">{colaborador ? colaborador.area : 'N/A'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      feedback.tipo === 'Nos comunicamos' ? 'bg-blue-200 text-blue-800' :
                      feedback.tipo === 'revision' ? ' text-red-800' :
                      feedback.tipo === 'felicitacion' ? 'text-green-900' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {feedback.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-2">{getHabitoName(feedback.normaID)}</td>
                  <td className="px-4 py-2">{feedback.motivo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PanelFeedBack;