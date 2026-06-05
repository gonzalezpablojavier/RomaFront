import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/apiClient';
import { format, parseISO, startOfMonth, endOfMonth, isValid, addDays } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import { getAreasForEmpresa, getManagerIdsForEmpresa, getManagerAreasForEmpresa } from '../../services/empresaService';
import esLocale from '@fullcalendar/core/locales/es';

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
  tipo: 'vacaciones';
}

interface Presente {
  id: number;
  fecha: string;
  colaboradorID: number;
  tipo: 'presente';
}


interface Permiso {
  id: number;
  fechaPermiso: string;
  colaboradorCubre: string;
  motivo: string;
  observacion: string;
  horario: string;
  autorizado: string;
  colaboradorID: number;
  tipo: 'permisos';
}

interface Ausente {
  id: number;
  fecha: string;
  colaboradorID: number;
  tipo: 'ausente';
}

interface Colaborador {
  id: string;
  nombre: string;
  apellido: string;
  area: string;
  colaboradorID: number;
}

interface Registro {
  id: number;
  horaRegistro: string;
  presente: boolean;

  colaboradorID: number;
}

interface Estadisticas {
  vacaciones: number;
  permisos: number;
  ausentes: number;
}


interface AusenciaColaborador {
  colaborador: Colaborador;
  diasAusente: string[];
}
type EventoCalendario = Vacaciones | Permiso | Ausente;


const VacationCalendar: React.FC = () => {
    const estados = ['Evaluando', 'Aprobado', 'Rechazado'];

  const [vacaciones, setVacaciones] = useState<Vacaciones[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  
  const [filteredEvents, setFilteredEvents] = useState<EventoCalendario[]>([]);

  const [areas, setAreas] = useState<string[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [ausentes, setAusentes] = useState<Ausente[]>([]);

  const [filtroArea, setFiltroArea] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtroEstado, setFiltroEstado] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [currentUserArea, setCurrentUserArea] = useState<string | null>(null);
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [managerAreas, setManagerAreas] = useState<{ [key: string]: string }>({});
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({ vacaciones: 0, permisos: 0, ausentes: 0 });
  // Modificar el estado inicial de filtroTipoEvento
  const [filtroTipoEvento, setFiltroTipoEvento] = useState('vacaciones-permisos');
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const getEventColor = (tipo: string): string => {
    switch (tipo) {
      case 'vacaciones': return '#90CAF9';
      case 'permisos': return '#A5D6A7';
      case 'ausente': return '#FF8A65';
      default: return '#90CAF9';
    }
  };

    // Función auxiliar para comparar fechas
    const isSameDay = (date1: Date, date2: Date): boolean => {
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    };


    // Función auxiliar para obtener todas las fechas en un rango
  const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  };

    // Función para obtener la fecha actual en formato ISO sin la hora
    const getCurrentDateISO = (): string => {
      const today = new Date();
      return format(today, 'yyyy-MM-dd');
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
      fetchData();
      const userID = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;
      if (userID) {
        setCurrentUserID(userID);
        const userIDString = userID.toString();
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
    }
  }, [empresaId, managerIds, managerAreas]);

  const fetchData = async () => {
    try {
      const [vacacionesResponse, permisosResponse, registrosResponse, colaboradoresResponse] = await Promise.all([
        apiClient.get<Vacaciones[]>(`/vacaciones`),
        apiClient.get<Permiso[]>(`/permiso-temporal`),
        apiClient.get<Registro[]>(`/presentismo`, {
          params: {
            fechaDesde: filtroFechaDesde,
            fechaHasta: filtroFechaHasta,
          },
          headers: { 'x-empresa-id': empresaId }
        }),
        apiClient.get<{ ok: number; data: Colaborador[] }>(`/usuarios-registrados`)
      ]);

      const vacacionesConTipo = vacacionesResponse.data.map(v => ({ ...v, tipo: 'vacaciones' as const }));
      const permisosConTipo = permisosResponse.data.map(p => ({ ...p, tipo: 'permisos' as const }));
      
      setVacaciones(vacacionesConTipo);
      setPermisos(permisosConTipo);
      setRegistros(registrosResponse.data);

      if (colaboradoresResponse.data.ok === 1 && Array.isArray(colaboradoresResponse.data.data)) {
        const todosColaboradores = colaboradoresResponse.data.data;
        setColaboradores(todosColaboradores);

        // Obtener el rango de fechas seleccionado
        const fechaInicio = parseISO(filtroFechaDesde);
        const fechaFin = parseISO(filtroFechaHasta);
        const todasLasFechas = getDatesBetween(fechaInicio, fechaFin);

        // Crear un mapa de presencia por día y colaborador
        const presenciaPorDia = new Map<string, Set<number>>();
        
        // Inicializar el mapa con todas las fechas
        todasLasFechas.forEach(fecha => {
          presenciaPorDia.set(format(fecha, 'yyyy-MM-dd'), new Set());
        });

        // Registrar presencias
        registrosResponse.data.forEach(registro => {
          const fechaRegistro = format(parseISO(registro.horaRegistro), 'yyyy-MM-dd');
          if (presenciaPorDia.has(fechaRegistro)) {
            presenciaPorDia.get(fechaRegistro)?.add(registro.colaboradorID);
          }
        });

        // Obtener colaboradores según el filtro de área
        const colaboradoresFiltrados = filtroArea 
          ? todosColaboradores.filter(col => col.area === filtroArea)
          : todosColaboradores;

        // Generar ausencias para cada colaborador en cada día del rango
        const ausentesArray: Ausente[] = [];

        // Verificar ausencias para cada colaborador en cada día
        colaboradoresFiltrados.forEach(colaborador => {
          // Verificar si el colaborador está de vacaciones o permiso en cada fecha
          todasLasFechas.forEach(fecha => {
            const fechaStr = format(fecha, 'yyyy-MM-dd');
            const estaPresente = presenciaPorDia.get(fechaStr)?.has(colaborador.colaboradorID) || false;
            
            // Verificar si tiene vacaciones aprobadas para esta fecha
            const tieneVacaciones = vacacionesConTipo.some(v => 
              v.colaboradorID === colaborador.colaboradorID &&
              v.autorizado === 'Aprobado' &&
              fecha >= parseISO(v.fechaPermisoDesde) &&
              fecha <= parseISO(v.fechaPermisoHasta)
            );

            // Verificar si tiene permiso aprobado para esta fecha
            const tienePermiso = permisosConTipo.some(p => 
              p.colaboradorID === colaborador.colaboradorID &&
              p.autorizado === 'Aprobado' &&
              format(parseISO(p.fechaPermiso), 'yyyy-MM-dd') === fechaStr
            );

            // Si no está presente y no tiene vacaciones ni permiso aprobados, se considera ausente
            if (!estaPresente && !tieneVacaciones && !tienePermiso) {
              ausentesArray.push({
                id: parseInt(`${colaborador.colaboradorID}${fechaStr.replace(/-/g, '')}`),
                fecha: fechaStr,
                colaboradorID: colaborador.colaboradorID,
                tipo: 'ausente'
              });
            }
          });
        });

        setAusentes(ausentesArray);
      } else {
        throw new Error('La respuesta de colaboradores no es válida');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    }
  };

  useEffect(() => {
    aplicarFiltros();
  }, [filtroArea, filtroFechaDesde, filtroFechaHasta, filtroEstado, filtroTipoEvento, vacaciones, permisos, ausentes]);
 
 
 
  // Modificar la función aplicarFiltros para manejar múltiples ausencias
  const aplicarFiltros = useCallback(() => {
    let eventosFiltered: EventoCalendario[] = [];
    
    const colaboradoresFiltrados = filtroArea 
      ? colaboradores.filter(col => col.area === filtroArea)
      : colaboradores;

    const colaboradoresIDs = new Set(colaboradoresFiltrados.map(col => col.colaboradorID));

    switch (filtroTipoEvento) {
      case 'todos':
      case 'vacaciones-permisos':
        eventosFiltered = [
          ...vacaciones.filter(v => v.autorizado === 'Aprobado' && colaboradoresIDs.has(v.colaboradorID)),
          ...permisos.filter(p => p.autorizado === 'Aprobado' && colaboradoresIDs.has(p.colaboradorID))
        ];
        break;

      case 'vacaciones':
        eventosFiltered = vacaciones
          .filter(v => v.autorizado === 'Aprobado' && colaboradoresIDs.has(v.colaboradorID));
        break;

      case 'permisos':
        eventosFiltered = permisos
          .filter(p => p.autorizado === 'Aprobado' && colaboradoresIDs.has(p.colaboradorID));
        break;

      case 'ausentes':
        eventosFiltered = ausentes
          .filter(a => colaboradoresIDs.has(a.colaboradorID));
        break;
    }

    const fechaDesde = parseISO(filtroFechaDesde);
    const fechaHasta = parseISO(filtroFechaHasta);

    eventosFiltered = eventosFiltered.filter(evento => {
      let fechaEvento;
      if (evento.tipo === 'vacaciones') {
        fechaEvento = parseISO(evento.fechaPermisoDesde);
      } else if (evento.tipo === 'permisos') {
        fechaEvento = parseISO(evento.fechaPermiso);
      } else {
        fechaEvento = parseISO(evento.fecha);
      }
      return fechaEvento >= fechaDesde && fechaEvento <= fechaHasta;
    });

    setFilteredEvents(eventosFiltered);

    // Actualizar estadísticas
    const stats = {
      vacaciones: eventosFiltered.filter(e => e.tipo === 'vacaciones').length,
      permisos: eventosFiltered.filter(e => e.tipo === 'permisos').length,
      ausentes: eventosFiltered.filter(e => e.tipo === 'ausente').length
    };
    setEstadisticas(stats);
  }, [vacaciones, permisos, ausentes, colaboradores, filtroArea, filtroFechaDesde, filtroFechaHasta, filtroEstado, filtroTipoEvento]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const evento = clickInfo.event.extendedProps.evento;
    const colaborador = colaboradores.find(c => c.colaboradorID === evento.colaboradorID);
    
    let mensaje = '';
    if (evento.tipo === 'ausente') {
      mensaje = `Ausente: ${colaborador?.nombre} ${colaborador?.apellido}\n`;
      mensaje += `Área: ${colaborador?.area}\n`;
      mensaje += `Fecha: ${format(new Date(), 'dd/MM/yyyy')}`;
    } else {
      const tipoEvento = 'fechaPermisoDesde' in evento ? 'Vacaciones' : 'Permiso';
      mensaje = `${tipoEvento} de ${colaborador?.nombre} ${colaborador?.apellido}\n`;
      mensaje += `Estado: ${evento.autorizado}\n`;
      mensaje += `Área: ${colaborador?.area}\n`;
      
      if ('fechaPermisoDesde' in evento) {
        mensaje += `Desde: ${format(parseISO(evento.fechaPermisoDesde), 'dd/MM/yyyy')}\n`;
        mensaje += `Hasta: ${format(parseISO(evento.fechaPermisoHasta), 'dd/MM/yyyy')}\n`;
        mensaje += `Días totales: ${evento.diasTotales}\n`;
        mensaje += `Cubre: ${evento.colaboradorCubre}`;
      } else {
        mensaje += `Fecha: ${format(parseISO(evento.fechaPermiso), 'dd/MM/yyyy')}\n`;
        mensaje += `Motivo: ${evento.motivo}\n`;
        mensaje += `Horario: ${evento.horario}\n`;
        mensaje += `Nota: ${evento.observacion}`;
      }
    }

    alert(mensaje);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    alert(`Seleccionó desde ${format(selectInfo.start, 'dd/MM/yyyy')} hasta ${format(selectInfo.end, 'dd/MM/yyyy')}`);
  };
  const events: EventInput[] = filteredEvents.map(evento => {
    const colaborador = colaboradores.find(c => c.colaboradorID === evento.colaboradorID);
    let title, start, end, backgroundColor;

    if ('tipo' in evento && evento.tipo === 'ausente') {
      title = `${colaborador?.nombre} ${colaborador?.apellido} - Ausente`;
      // Usar la fecha específica del registro de ausencia
      start = evento.fecha;
      // La fecha final será el día siguiente para que el evento ocupe solo un día
      end = addDays(parseISO(evento.fecha), 1).toISOString().split('T')[0];
      backgroundColor = getEventColor('ausente');
    } else {
      const esVacacion = 'fechaPermisoDesde' in evento;
      title = `${colaborador?.nombre} ${colaborador?.apellido} - ${esVacacion ? 'Vacaciones' : 'Permiso'}`;
      start = esVacacion ? evento.fechaPermisoDesde : evento.fechaPermiso;
      end = esVacacion ? evento.fechaPermisoHasta : addDays(parseISO(evento.fechaPermiso), 1).toISOString();
      backgroundColor = getEventColor(esVacacion ? 'vacaciones' : 'permisos');
    }

    return {
      id: evento.id.toString(),
      title,
      start,
      end,
      backgroundColor,
      borderColor: backgroundColor,
      extendedProps: { evento },
      allDay: true // Asegura que los eventos se muestren como eventos de día completo
    };
  });

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Calendario de Vacaciones, Permisos y Ausencias</h1>
      
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
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
     
        <select
          value={filtroTipoEvento}
          onChange={(e) => setFiltroTipoEvento(e.target.value)}
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="todos">Todos los eventos</option>
          <option value="vacaciones">Solo Vacaciones</option>
          <option value="permisos">Solo Permisos</option>
          <option value="ausentes">Solo Ausentes</option>
        </select>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 flex justify-center space-x-8">
        <div className="bg-blue-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-blue-800">Vacaciones Aprobadas</h3>
          <p className="text-3xl font-bold text-blue-600">{estadisticas.vacaciones}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-green-800">Permisos Aprobados</h3>
          <p className="text-3xl font-bold text-green-600">{estadisticas.permisos}</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-orange-800">Ausentes Hoy</h3>
          <p className="text-3xl font-bold text-orange-600">{estadisticas.ausentes}</p>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mb-4 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-300 rounded mr-2"></div>
          <span>Vacaciones</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-300 rounded mr-2"></div>
          <span>Permisos</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-300 rounded mr-2"></div>
          <span>Ausentes</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
          }}
          events={events}
          eventClick={handleEventClick}
          selectable={true}
          select={handleDateSelect}
          height="auto"
          firstDay={1}
          views={{
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'long' }
            },
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
            },
            timeGridDay: {
              titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
            }
          }}
        />
      </div>
    </div>
  );
};

export default VacationCalendar;