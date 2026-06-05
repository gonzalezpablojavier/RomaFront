import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/apiClient';
import { format, isValid, parseISO, differenceInDays, getWeekOfMonth, startOfMonth, endOfMonth } from 'date-fns';
import { getAreasForEmpresa, getManagerIdsForEmpresa, getManagerAreasForEmpresa } from '../../services/empresaService';

interface Vacaciones {
  id: number;
  fechaPermisoDesde: string;
  fechaPermisoHasta: string;
  diasTotales: number;
  autorizado: string;
  colaboradorID: number;
  vacacionesPendientes: number;
  diasCorresponden: number;
  diasDisponibles: number;
  colaboradorCubre: string;
}

interface Colaborador {
  id: string;
  nombre: string;
  apellido: string;
  area: string;
  colaboradorID: number;
}

/** Áreas que entran en el total de colaboradores (editar acá). */
const areasQueCuentan = [
  'Sistemas',
  'Administración',
  'Depósito',
  'Comercial',
  'GerenciaOP',
  'Contabilidad',
  'Compras',
  'TV',
  'Gerencia',
  'Marketing',
  'Directorio',
  'Intercar',
] as const;

const PanelAdminVacaciones: React.FC = () => {
  const [vacaciones, setVacaciones] = useState<Vacaciones[]>([]);
  const [filteredVacaciones, setFilteredVacaciones] = useState<Vacaciones[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtroEstado, setFiltroEstado] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [areasDisponibles, setAreasDisponibles] = useState<string[]>([]);

  // Inyectar CSS para forzar estilos blancos
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .vacaciones-table thead {
        background-color: white !important;
      }
      .vacaciones-table thead th {
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
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [currentUserArea, setCurrentUserArea] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [areas, setAreas] = useState<string[]>([]);
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [managerAreas, setManagerAreas] = useState<{ [key: string]: string }>({});
  const estados = ['Evaluando', 'Aprobado', 'Rechazado'];

  const getColorForWeek = (date: Date): string => {
    const week = getWeekOfMonth(date);
    switch (week) {
      case 1: return 'bg-blue-200';
      case 2: return 'bg-green-200';
      case 3: return 'bg-yellow-200';
      case 4: return 'bg-red-200';
      case 5: return 'bg-purple-200';
      default: return '';
    }
  };

  



  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000,
    backoff = 2
  ): Promise<T> => {
    try {
      return await operation();
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, retries - 1, delay * backoff, backoff);
      } else {
        throw err;
      }
    }
  };

  const formatDateWithColor = (dateString: string) => {
    if (!dateString) return { formattedDate: 'Fecha no disponible', color: '' };
    const date = parseISO(dateString);
    if (!isValid(date)) return { formattedDate: 'Fecha inválida', color: '' };
    
    const formattedDate = format(date, 'dd/MM/yyyy');
    const color = getColorForWeek(date);
    
    return { formattedDate, color };
  };



  
 
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
      fetchVacaciones();
      fetchColaboradores();
    }
  }, [empresaId]);

  useEffect(() => {
    const userID = (
      (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null }
    )?.user_code;
    if (!userID) return;

    setCurrentUserID(userID);

    const userIDString = userID.toString();
    if (!managerIds.includes(userIDString)) return;

    const userArea = managerAreas[userIDString];
    console.log("area" + userArea);
    if (!userArea) {
      console.error(`Área no encontrada para el ID de usuario: ${userID}`);
      return;
    }

    setCurrentUserArea(userArea);
    if (userArea !== 'Gerencia' && userArea !== 'GerenciaOP' && userArea !== 'Directorio') {
      setFiltroArea(userArea);
    }
  }, [managerIds, managerAreas]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroArea, filtroFechaDesde, filtroFechaHasta, filtroEstado, vacaciones]);

  const fetchVacaciones = async () => {
    try {
      const response = await retryOperation(() => apiClient.get(`/vacaciones`));
      const sortedVacaciones = response.data.sort((a: Vacaciones, b: Vacaciones) => b.id - a.id);
      setVacaciones(sortedVacaciones);
    } catch (error) {
      setError('Error al obtener las vacaciones. Por favor, intente nuevamente.');
      console.error(error);
    }
  };

  const fetchColaboradores = async () => {
    try {
      const response = await retryOperation(() => apiClient.get(`/usuarios-registrados`
      ));
      if (response.data.ok === 1 && Array.isArray(response.data.data)) {
        setColaboradores(response.data.data);
        const uniqueAreas = Array.from(
          new Set<string>(
            response.data.data
              .map((c: Colaborador) => c.area)
              .filter(
                (a: unknown): a is string =>
                  typeof a === 'string' && a.trim() !== '' && areasQueCuentan.includes(a as (typeof areasQueCuentan)[number])
              )
          )
        );
        setAreasDisponibles(uniqueAreas);
      } else {
        console.error('La respuesta de colaboradores no es válida:', response.data);
        setColaboradores([]);
        setAreasDisponibles([]);
      }
    } catch (error) {
      console.error('Error al obtener los colaboradores:', error);
      setError('Error al obtener los colaboradores. Por favor, intente nuevamente.');
      setColaboradores([]);
      setAreasDisponibles([]);
    }
  };

  const aplicarFiltros = () => {
    let vacacionesFiltered = vacaciones;

    if (currentUserArea && currentUserArea !== 'Gerencia' && currentUserArea !== 'GerenciaOP' && currentUserArea !== 'Directorio') {
      vacacionesFiltered = vacacionesFiltered.filter(vacacion => 
        colaboradores.find(c => c.colaboradorID === vacacion.colaboradorID)?.area === currentUserArea
      );
    } else if (filtroArea) {
      vacacionesFiltered = vacacionesFiltered.filter(vacacion => 
        colaboradores.find(c => c.colaboradorID === vacacion.colaboradorID)?.area === filtroArea
      );
    }

    const fechaDesde = parseISO(filtroFechaDesde);
    const fechaHasta = parseISO(filtroFechaHasta);

    vacacionesFiltered = vacacionesFiltered.filter(vacacion => {
      const fechaInicio = parseISO(vacacion.fechaPermisoDesde);
      const fechaFin = parseISO(vacacion.fechaPermisoHasta);
      return isValid(fechaInicio) && isValid(fechaFin) &&
             ((fechaInicio >= fechaDesde && fechaInicio <= fechaHasta) ||
              (fechaFin >= fechaDesde && fechaFin <= fechaHasta) ||
              (fechaInicio <= fechaDesde && fechaFin >= fechaHasta));
    });

    if (filtroEstado) {
      vacacionesFiltered = vacacionesFiltered.filter(vacacion => vacacion.autorizado === filtroEstado);
    }

    setFilteredVacaciones(vacacionesFiltered);
  };

  const handleApprove = async (id: number) => {
    try {
      
      await retryOperation(async () => {
        await apiClient.put(`/vacaciones/${id}`, { autorizado: 'Aprobado' });
      });

 
  /*
      await retryOperation(() => apiClient.post(`/create-calendar-event`, {
        summary: `Vacaciones de ${colaborador.nombre} ${colaborador.apellido}`,
        description: `Vacaciones aprobadas para ${colaborador.nombre} ${colaborador.apellido} del área de ${colaborador.area}`,
        start: vacacionAprobada.fechaPermisoDesde,
        end: vacacionAprobada.fechaPermisoHasta,
        colaboradorId: colaborador.colaboradorID
      }));
*/
      fetchVacaciones();
    } catch (error) {
      setError('Error al aprobar las vacaciones. Por favor, intente nuevamente.');
      console.error(error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await retryOperation(async () => {
        await apiClient.put(`/vacaciones/${id}`, { autorizado: 'Rechazado' });
      });
      fetchVacaciones();
    } catch (error) {
      setError('Error al rechazar las vacaciones. Por favor, intente nuevamente.');
      console.error(error);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await retryOperation(async () => {
        await apiClient.put(`/vacaciones/${id}`, { autorizado: 'Evaluando' });
      });
      fetchVacaciones();
    } catch (error) {
      setError('Error al cancelar las vacaciones. Por favor, intente nuevamente.');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd/MM/yyyy') : 'Fecha inválida';
  };

  const calcularVacacionesPendientes = (vacacion: Vacaciones): number | 'N/A' => {
    try {
      return vacacion.vacacionesPendientes;
    } catch (error) {
      console.error('Error al calcular los días totales:', error);
      return 'N/A';
    }
  };

  const calcularDiasCorresponden = (vacacion: Vacaciones): number | 'N/A' => {
    try {
      return vacacion.diasCorresponden;
    } catch (error) {
      console.error('Error al calcular los días totales:', error);
      return 'N/A';
    }
  };

  const calcularDiasDisponibles = (vacacion: Vacaciones): number | 'N/A' => {
    const diasTotales = calcularDiasTotales(vacacion.fechaPermisoDesde, vacacion.fechaPermisoHasta);
  
    if (diasTotales === 'N/A' || typeof vacacion.diasDisponibles !== 'number') {
      return 'N/A';
    }

    if (vacacion.autorizado === 'Aprobado') {
      return diasTotales;
    } else {
      return 0;
    }
  };

  const calcularDiasTotales = (fechaInicio: string, fechaFin: string): number | 'N/A' => {
    try {
      const inicio = parseISO(fechaInicio);
      const fin = parseISO(fechaFin);
      if (!isValid(inicio) || !isValid(fin)) {
        return 'N/A';
      }
      return differenceInDays(fin, inicio) + 1;
    } catch (error) {
      console.error('Error al calcular los días totales:', error);
      return 'N/A';
    }
  };

  const canViewAllAreas = currentUserArea === 'Gerencia' || currentUserArea === 'GerenciaOP' || currentUserArea === 'Directorio';
  const colaboradorCuentaParaTotalesPorArea = (c: Colaborador) => areasQueCuentan.includes(c.area as (typeof areasQueCuentan)[number]);

  const totalColaboradores = colaboradores.filter(colaboradorCuentaParaTotalesPorArea).length;
  const areaEfectiva =
    currentUserArea && !canViewAllAreas
      ? currentUserArea
      : (canViewAllAreas && filtroArea ? filtroArea : '');

  const totalColaboradoresArea = areaEfectiva
    ? colaboradores.filter((c) => c.area === areaEfectiva && colaboradorCuentaParaTotalesPorArea(c)).length
    : null;

  const rangoDesde = parseISO(filtroFechaDesde);
  const rangoHasta = parseISO(filtroFechaHasta);
  const colaboradoresEnVacacionesSet = new Set<number>();

  vacaciones.forEach((v) => {
    if (v.autorizado !== 'Aprobado') return;

    const inicio = parseISO(v.fechaPermisoDesde);
    const fin = parseISO(v.fechaPermisoHasta);
    if (!isValid(inicio) || !isValid(fin)) return;
    if (!isValid(rangoDesde) || !isValid(rangoHasta)) return;
    // Solape de rangos: [inicio, fin] con [rangoDesde, rangoHasta]
    if (!(inicio <= rangoHasta && fin >= rangoDesde)) return;

    if (areaEfectiva) {
      const areaColaborador = colaboradores.find((c) => c.colaboradorID === v.colaboradorID)?.area;
      if (!areaColaborador || areaColaborador !== areaEfectiva) return;
    }

    colaboradoresEnVacacionesSet.add(v.colaboradorID);
  });

  const totalEnVacaciones = colaboradoresEnVacacionesSet.size;
  const totalBasePct = areaEfectiva ? (totalColaboradoresArea ?? 0) : totalColaboradores;
  const pctEnVacaciones = totalBasePct > 0 ? (totalEnVacaciones / totalBasePct) * 100 : 0;

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Panel de Vacaciones</h1>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">Colaboradores totales</div>
          <div className="text-2xl font-bold text-gray-900">{totalColaboradores}</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Total del área{areaEfectiva ? ` (${areaEfectiva})` : ''}
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalColaboradoresArea ?? '—'}</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">Vacaciones</div>
          <div className="text-2xl font-bold text-gray-900">{totalEnVacaciones}</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">% vacaciones</div>
          <div className="text-2xl font-bold text-gray-900">{pctEnVacaciones.toFixed(1)}%</div>
        </div>
      </div>
      
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
        {(canViewAllAreas) && (
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todas las áreas</option>
            {areasDisponibles.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        )}

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
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {estados.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto vacaciones-table">
          <thead className="bg-white border-b-2 border-gray-300" style={{ backgroundColor: 'white !important' }}>
            <tr>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Acciones</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Colaborador</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Área</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Cubre</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Inicio</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Final</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Pedido(Días)</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Corresponden</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Vac Pend</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Tomados</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredVacaciones.map((vacacion) => {
              const colaborador = colaboradores.find(c => c.colaboradorID === vacacion.colaboradorID);
              const fechaInicio = formatDateWithColor(vacacion.fechaPermisoDesde);
              const fechaFin = formatDateWithColor(vacacion.fechaPermisoHasta);

              return (
                <tr key={vacacion.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {vacacion.autorizado === 'Evaluando' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(vacacion.id)}
                          className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                        >
                          SI
                        </button>
                        <button
                          onClick={() => handleReject(vacacion.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                        >
                          NO
                        </button>
                      </div>
                    )}
                    {(vacacion.autorizado === 'Aprobado' || vacacion.autorizado === 'Rechazado') && (
                      <button
                        onClick={() => handleCancel(vacacion.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2">{colaborador ? `${colaborador.nombre} ${colaborador.apellido}` : 'N/A'}</td>
                  <td className="px-4 py-2">{colaborador ? colaborador.area : 'N/A'}</td>
                  <td className="px-4 py-2">{vacacion.colaboradorCubre}</td>
                  <td className={`px-4 py-2 ${fechaInicio.color}`}>
                    {fechaInicio.formattedDate}
                  </td>
                  <td className={`px-4 py-2 ${fechaFin.color}`}>
                    {fechaFin.formattedDate}
                  </td>
                  <td className="px-4 py-2">{calcularDiasTotales(vacacion.fechaPermisoDesde, vacacion.fechaPermisoHasta)}</td>
                  <td className="px-4 py-2">{calcularDiasCorresponden(vacacion)}</td>
                  <td className="px-4 py-2">{calcularVacacionesPendientes(vacacion)}</td>
                  <td className="px-4 py-2">{calcularDiasDisponibles(vacacion)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      vacacion.autorizado === 'Aprobado' ? 'bg-green-200 text-green-800' :
                      vacacion.autorizado === 'Rechazado' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {vacacion.autorizado}
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

export default PanelAdminVacaciones;