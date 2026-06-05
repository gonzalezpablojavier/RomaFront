import React, { useMemo, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, parseISO, addDays, isValid, startOfMonth, endOfMonth } from 'date-fns';
import { getAreasForEmpresa, getManagerIdsForEmpresa, getManagerAreasForEmpresa } from '../../services/empresaService';


interface Permiso {
  id: number;
  fechaPermiso: string;
  colaboradorCubre: string;
  motivo: string;
  observacion: string;
  horario: string;
  autorizado: string;
  colaboradorID: number;
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

const AdminPermisosTemporal: React.FC = () => {
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [filteredPermisos, setFilteredPermisos] = useState<Permiso[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtroAutorizado, setFiltroAutorizado] = useState('');
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [areasDisponibles, setAreasDisponibles] = useState<string[]>([]);

  // Inyectar CSS para forzar estilos blancos
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .permisos-table thead {
        background-color: white !important;
      }
      .permisos-table thead th {
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
  const [currentUserArea, setCurrentUserArea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [areas, setAreas] = useState<string[]>([]);
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [managerAreas, setManagerAreas] = useState<{ [key: string]: string }>({});
  
  const estadosAutorizacion = ['Evaluando', 'Aprobado', 'Rechazado'];
  const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 segundos

  const fetchData = useCallback(async (retry = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const [permisosResponse, colaboradoresResponse] = await Promise.all([
        axios.get(`${API_URL}/permiso-temporal`, {headers: { 'x-empresa-id': empresaId }}),
        axios.get(`${API_URL}/usuarios-registrados`, {headers: { 'x-empresa-id': empresaId }})
      ]);

      const sortedPermisos = permisosResponse.data.sort((a: Permiso, b: Permiso) => b.id - a.id);
      setPermisos(sortedPermisos);

      if (colaboradoresResponse.data.ok === 1 && Array.isArray(colaboradoresResponse.data.data)) {
        setColaboradores(colaboradoresResponse.data.data);
        const uniqueAreas = Array.from(
          new Set<string>(
            colaboradoresResponse.data.data
              .map((c: Colaborador) => c.area)
              .filter(
                (a: unknown): a is string =>
                  typeof a === 'string' && a.trim() !== '' && areasQueCuentan.includes(a as (typeof areasQueCuentan)[number])
              )
          )
        );
        setAreasDisponibles(uniqueAreas);
      } else {
        throw new Error('La respuesta de colaboradores no es válida');
      }

      setRetryCount(0); // Resetear el contador de reintentos si la carga es exitosa
    } catch (error) {
      console.error('Error fetching data:', error);
      if (retry < MAX_RETRIES) {
        setError(`Error al cargar los datos. Reintentando en ${RETRY_DELAY / 1000} segundos...`);
        setTimeout(() => fetchData(retry + 1), RETRY_DELAY);
      } else {
        setError('Error al cargar los datos después de múltiples intentos. Por favor, recarga la página.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [API_URL,empresaId]);


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
      fetchData();
    }
  }, [fetchData, empresaId]);

  useEffect(() => {
    const userID = (
      (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null }
    )?.user_code;
    if (!userID) return;

    setCurrentUserID(userID);

    const userIDString = userID.toString();
    if (!managerIds.includes(userIDString)) return;

    const userArea = managerAreas[userIDString];
    if (!userArea) return;

    setCurrentUserArea(userArea);
    if (userArea !== 'Gerencia' && userArea !== 'GerenciaOP' && userArea !== 'Directorio') {
      setFiltroArea(userArea);
    }
  }, [managerIds, managerAreas]);


  useEffect(() => {
    aplicarFiltros();
  }, [filtroArea, filtroFechaDesde, filtroFechaHasta, filtroAutorizado, permisos, colaboradores, currentUserArea]);

  const aplicarFiltros = useCallback(() => {
    let permisosFiltered = permisos;

    if (currentUserArea && currentUserArea !== 'Gerencia' && currentUserArea !== 'GerenciaOP' && currentUserArea !== 'Directorio') {
      permisosFiltered = permisosFiltered.filter(permiso => 
        colaboradores.find(c => c.colaboradorID === permiso.colaboradorID)?.area === currentUserArea
      );
    } else if (filtroArea) {
      permisosFiltered = permisosFiltered.filter(permiso => 
        colaboradores.find(c => c.colaboradorID === permiso.colaboradorID)?.area === filtroArea
      );
    }

    permisosFiltered = permisosFiltered.filter(permiso => {
      const fechaPermiso = parseISO(permiso.fechaPermiso);
      return fechaPermiso >= parseISO(filtroFechaDesde) && fechaPermiso <= parseISO(filtroFechaHasta);
    });

    if (filtroAutorizado) {
      permisosFiltered = permisosFiltered.filter(permiso => permiso.autorizado === filtroAutorizado);
    }

    setFilteredPermisos(permisosFiltered);
  }, [permisos, colaboradores, currentUserArea, filtroArea, filtroFechaDesde, filtroFechaHasta, filtroAutorizado]);

  const handleApprove = async (id: number) => {
    try {
      await axios.put(`${API_URL}/permiso-temporal/${id}`, { autorizado: 'Aprobado' },   { headers: { 'x-empresa-id': empresaId } });
      fetchData();
    } catch (error) {
      setError('Error al aprobar el permiso');
      console.error(error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await axios.put(`${API_URL}/permiso-temporal/${id}`, { autorizado: 'Rechazado' },   { headers: { 'x-empresa-id': empresaId } });
      fetchData();
    } catch (error) {
      setError('Error al rechazar el permiso');
      console.error(error);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await axios.put(`${API_URL}/permiso-temporal/${id}`, { autorizado: 'Evaluando' },   { headers: { 'x-empresa-id': empresaId } });
      fetchData();
    } catch (error) {
      setError('Error al cancelar el permiso');
      console.error(error);
    }
  };

  const adjustDate = (dateString: string | null): Date | null => {
    if (!dateString) {
      console.warn('Fecha no proporcionada');
      return null;
    }
  
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        console.warn(`Fecha inválida: ${dateString}`);
        return null;
      }
      return addDays(date, 0);
    } catch (error) {
      console.error(`Error al procesar la fecha: ${dateString}`, error);
      return null;
    }
  };

  const canViewAllAreas =
    currentUserArea === 'Gerencia' || currentUserArea === 'GerenciaOP' || currentUserArea === 'Directorio';

  const colaboradorCuentaParaTotales = (c: Colaborador) =>
    areasQueCuentan.includes(c.area as (typeof areasQueCuentan)[number]);

  const totalColaboradores = colaboradores.filter(colaboradorCuentaParaTotales).length;
  const areaEfectiva =
    currentUserArea && !canViewAllAreas
      ? currentUserArea
      : (canViewAllAreas && filtroArea ? filtroArea : '');

  const totalColaboradoresArea = areaEfectiva
    ? colaboradores.filter((c) => c.area === areaEfectiva && colaboradorCuentaParaTotales(c)).length
    : null;

  const hoyStr = format(new Date(), 'yyyy-MM-dd');
  const colaboradoresEnPermisoHoySet = new Set<number>();
  permisos.forEach((p) => {
    if (p.autorizado !== 'Aprobado') return;
    const fecha = parseISO(p.fechaPermiso);
    if (!isValid(fecha)) return;
    if (format(fecha, 'yyyy-MM-dd') !== hoyStr) return;

    const colaborador = colaboradores.find((c) => c.colaboradorID === p.colaboradorID);
    if (!colaborador) return;
    if (!colaboradorCuentaParaTotales(colaborador)) return;

    if (areaEfectiva && colaborador.area !== areaEfectiva) return;
    colaboradoresEnPermisoHoySet.add(p.colaboradorID);
  });

  const totalEnPermisoHoy = colaboradoresEnPermisoHoySet.size;
  const totalBasePct = areaEfectiva ? (totalColaboradoresArea ?? 0) : totalColaboradores;
  const pctEnPermisoHoy = totalBasePct > 0 ? (totalEnPermisoHoy / totalBasePct) * 100 : 0;

  const permisosAgrupadosPorMotivo = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of filteredPermisos) {
      const key = (p.motivo ?? '').trim() || 'Sin motivo';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([motivo, cantidad]) => ({ motivo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.motivo.localeCompare(b.motivo));
  }, [filteredPermisos]);

  if (isLoading) {
    return <div className="container mx-auto p-6">Cargando datos...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-500">{error}</p>
        {retryCount < MAX_RETRIES && (
          <button
            onClick={() => fetchData(retryCount)}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Reintentar ahora
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Panel de Permisos</h1>

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
          <div className="text-xs uppercase tracking-wide text-gray-500">En permiso hoy</div>
          <div className="text-2xl font-bold text-gray-900">{totalEnPermisoHoy}</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">% en permiso hoy</div>
          <div className="text-2xl font-bold text-gray-900">{pctEnPermisoHoy.toFixed(1)}%</div>
        </div>
      </div>
      
      <div className="mb-6 flex flex-wrap gap-4">
        {canViewAllAreas && (
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todas las áreas</option>
            {areasDisponibles.map((area) => (
              <option key={area} value={area}>{area}</option>
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
          value={filtroAutorizado}
          onChange={(e) => setFiltroAutorizado(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {estadosAutorizacion.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 shadow-sm">
          <span className="font-semibold">
            Permisos {format(parseISO(filtroFechaDesde), 'dd/MM/yyyy')}–{format(parseISO(filtroFechaHasta), 'dd/MM/yyyy')}:
          </span>
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
            {filteredPermisos.length}
          </span>
          <span className="text-gray-500">|</span>
          {permisosAgrupadosPorMotivo.length === 0 ? (
            <span className="text-gray-500">Sin permisos en el rango</span>
          ) : (
            permisosAgrupadosPorMotivo.map(({ motivo, cantidad }) => (
              <span
                key={motivo}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-gray-700 ring-1 ring-gray-200"
                title={motivo}
              >
                <span className="max-w-[220px] truncate">{motivo}</span>
                <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {cantidad}
                </span>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto permisos-table">
          <thead className="bg-white border-b-2 border-gray-300" style={{ backgroundColor: 'white !important' }}>
            <tr>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Acciones</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Fecha</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Colaborador</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Motivo</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Observaciones</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Horario</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Cubre</th>
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Area</th>  
              <th className="px-4 py-2 text-left text-gray-600" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredPermisos.map((permiso) => {
              const colaborador = colaboradores.find(c => c.colaboradorID === permiso.colaboradorID);
              return (
                <tr key={permiso.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {permiso.autorizado === 'Evaluando' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(permiso.id)}
                          className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                        >
                          SI
                        </button>
                        <button
                          onClick={() => handleReject(permiso.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                        >
                          NO
                        </button>
                      </div>
                    )}
                    {(permiso.autorizado === 'Aprobado' || permiso.autorizado === 'Rechazado') && (
                      <button
                        onClick={() => handleCancel(permiso.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white py-1 px-3 rounded text-sm transition duration-300"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {permiso.fechaPermiso
                      ? (() => {
                          const adjustedDate = adjustDate(permiso.fechaPermiso);
                          return adjustedDate
                            ? format(adjustedDate, 'dd/MM/yyyy')
                            : 'Fecha inválida';
                        })()
                      : 'Sin fecha'}
                  </td>
                  <td className="px-4 py-2">{colaborador ? `${colaborador.nombre} ${colaborador.apellido}` : 'N/A'}</td>
                  <td className="px-4 py-2">{permiso.motivo}</td>
                  <td className="px-4 py-2">{permiso.observacion}</td>
                  <td className="px-4 py-2">{permiso.horario}</td>
                  <td className="px-4 py-2">{permiso.colaboradorCubre}</td>                  
                  <td className="px-4 py-2">{colaborador ? colaborador.area : 'N/A'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      permiso.autorizado === 'Aprobado' ? 'bg-green-200 text-green-800' :
                      permiso.autorizado === 'Rechazado' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {permiso.autorizado}
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
  
  export default AdminPermisosTemporal;