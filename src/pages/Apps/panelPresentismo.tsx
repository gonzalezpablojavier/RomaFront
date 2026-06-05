import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ButtonBase,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  Grid,
  Typography,
  Button,
  Menu,
  TextField,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  getAreasForEmpresa,
  getManagerIdsForEmpresa,
  getManagerAreasForEmpresa
} from '../../services/empresaService';
import { SelectChangeEvent } from '@mui/material';
import * as XLSX from 'xlsx';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

const API_URL = import.meta.env.VITE_API_DISTRI_API;

/** Días laborales fijos por mes para volumen y tasa de ausentismo (regla de negocio). */
const DIAS_LABORALES_MES_KPI = 24;

interface Registro {
  id: number;
  colaboradorID: string;
  tipo: 'entrada' | 'salida';
  tipoPresencial: 'Ofi' | 'Home' | 'Calle';
  horaRegistro: string;
  area: string;
}

interface Colaborador {
  colaboradorID: string;
  nombre: string;
  apellido: string;
  area: string;
  sucursal: string;
}

interface Filtros {
  area: string;
  tipo: string;
  tipoPresencial: string;
  fechaDesde: dayjs.Dayjs | null;
  fechaHasta: dayjs.Dayjs | null;
  sucursal: string;
  ausentes: boolean;
}

interface Permiso {
  colaboradorID: string;
  fechaPermiso: string;
  autorizado: string;
}

interface Vacacion {
  colaboradorID: string;
  fechaPermisoDesde: string;
  fechaPermisoHasta: string;
  autorizado: string;
}

interface EstadoAsistencia {
  id?: number;
  colaboradorID: string;
  fecha: string;
  estadoManual: 'presente' | 'ausente_justificado' | 'ausente_injustificado' | 'sin_evaluar';
  modificadoPor?: string;
  observaciones?: string;
}

type EstadoCalculado =
  | 'presente'
  | 'ausente_justificado'
  | 'ausente_injustificado'
  | 'sin_evaluar'
  | 'vacaciones';

/** Valores que acepta y persiste el API estado-asistencia (vacaciones es solo derivado). */
type EstadoAsistenciaPersistible = Exclude<EstadoCalculado, 'vacaciones'>;

const AdminPresentismoPanel: React.FC = () => {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [areas, setAreas] = useState<string[]>([]);
  const [sucursales] = useState<string[]>(['PICO', 'MDP', 'DIMES','ROSARIO']); 
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [managerAreas, setManagerAreas] = useState<{ [key: string]: string }>({});
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [currentUserArea, setCurrentUserArea] = useState<string | null>(null);
  const [condicionSeleccionada, setCondicionSeleccionada] = useState<string>('hanFichado'); // Estado inicial
  const [estadoAsistenciaFiltro, setEstadoAsistenciaFiltro] = useState<EstadoCalculado | ''>('');

  const [filtrosDetalles, setFiltrosDetalles] = useState<Filtros>({
    area: '',
    tipo: '',
    tipoPresencial: '',
    fechaDesde: dayjs(),
    fechaHasta: dayjs(),
    sucursal: '',
    ausentes: false,
  });

  const [error, setError] = useState<string | null>(null);

  /** Cambia al virar el mes (para refrescar KPI y presentismo mensual). */
  const mesCorrienteKey = dayjs().format('YYYY-MM');

  // Vacaciones y permisos
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);

  // Estados de asistencia
  const [estadosAsistencia, setEstadosAsistencia] = useState<EstadoAsistencia[]>([]);
  /** Fichajes y estados del mes calendario en curso (presentismo mensual y KPI). */
  const [registrosMesCorriente, setRegistrosMesCorriente] = useState<Registro[]>([]);
  const [estadosAsistenciaMes, setEstadosAsistenciaMes] = useState<EstadoAsistencia[]>([]);
  const [editandoEstado, setEditandoEstado] = useState<{colaboradorID: string, fecha: string} | null>(null);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  // -------------------------------------------------------------------------
  // 1) Cálculos de vacaciones y permisos (rango del filtro)
  // -------------------------------------------------------------------------
  const vacacionesEnRango = useMemo(() => {
    if (!filtrosDetalles.fechaDesde || !filtrosDetalles.fechaHasta) return [];
    const desde = filtrosDetalles.fechaDesde.startOf('day');
    const hasta = filtrosDetalles.fechaHasta.endOf('day');

    return vacaciones.filter((v) => {
      if (v.autorizado !== 'Aprobado') return false;
      const start = dayjs(v.fechaPermisoDesde).startOf('day');
      const end = dayjs(v.fechaPermisoHasta).endOf('day');
      return start.isSameOrBefore(hasta) && end.isSameOrAfter(desde);
    });
  }, [vacaciones, filtrosDetalles.fechaDesde, filtrosDetalles.fechaHasta]);

  const permisosEnRango = useMemo(() => {
    if (!filtrosDetalles.fechaDesde || !filtrosDetalles.fechaHasta) return [];
    const desde = filtrosDetalles.fechaDesde.startOf('day');
    const hasta = filtrosDetalles.fechaHasta.endOf('day');

    return permisos.filter((p) => {
      if (p.autorizado !== 'Aprobado') return false;
      const fecha = dayjs(p.fechaPermiso).startOf('day');
      return fecha.isSameOrAfter(desde) && fecha.isSameOrBefore(hasta);
    });
  }, [permisos, filtrosDetalles.fechaDesde, filtrosDetalles.fechaHasta]);

  const colaboradoresEnVacacionesEnRangoSet = useMemo(() => {
    return new Set<string>(vacacionesEnRango.map((v) => String(v.colaboradorID)));
  }, [vacacionesEnRango]);

  const colaboradoresConPermisosEnRangoSet = useMemo(() => {
    return new Set<string>(permisosEnRango.map((p) => String(p.colaboradorID)));
  }, [permisosEnRango]);

  const vacacionesEnMesCorriente = useMemo(() => {
    const desde = dayjs().startOf('month');
    const hasta = dayjs().endOf('month');
    return vacaciones.filter((v) => {
      if (v.autorizado !== 'Aprobado') return false;
      const start = dayjs(v.fechaPermisoDesde).startOf('day');
      const end = dayjs(v.fechaPermisoHasta).endOf('day');
      return start.isSameOrBefore(hasta) && end.isSameOrAfter(desde);
    });
  }, [vacaciones, mesCorrienteKey]);

  // -------------------------------------------------------------------------
  // 2) Totalizadores (globales) - independientes de la grilla
  // -------------------------------------------------------------------------
  // Se calculan más abajo, una vez que existe `registrosPorColaborador` (ya filtrado
  // por fecha/tipo/modalidad), para que todo sea consistente.

  // -------------------------------------------------------------------------
  // 4) Efectos para obtener datos
  // -------------------------------------------------------------------------
  // Fetch vacaciones y permisos
  useEffect(() => {
    const fetchVacacionesYPermisos = async () => {
      try {
        const [vacacionesResponse, permisosResponse] = await Promise.all([
          axios.get(`${API_URL}/vacaciones`, { headers: { 'x-empresa-id': empresaId } }),
          axios.get(`${API_URL}/permiso-temporal`, { headers: { 'x-empresa-id': empresaId } }),
        ]);
        setVacaciones(vacacionesResponse.data);
        setPermisos(permisosResponse.data);
      } catch (err) {
        console.error('Error al obtener vacaciones y permisos:', err);
        setError('Error al cargar los datos de vacaciones y permisos.');
      }
    };

    if (empresaId) {
      fetchVacacionesYPermisos();
    }
  }, [empresaId]);

  // Recuperar empresa desde localStorage
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

  // Fetch presentismo y colaboradores cuando cambia empresa o fechas
  useEffect(() => {
    if (empresaId) {
      fetchRegistros();
      fetchColaboradores();
    }
  }, [empresaId, filtrosDetalles.fechaDesde, filtrosDetalles.fechaHasta]);

  // Fetch estados de asistencia
  useEffect(() => {
    if (empresaId && filtrosDetalles.fechaDesde && filtrosDetalles.fechaHasta) {
      fetchEstadosAsistencia();
    }
  }, [empresaId, filtrosDetalles.fechaDesde, filtrosDetalles.fechaHasta]);

  const fetchRegistros = async () => {
    try {
      const params = {
        fechaDesde: filtrosDetalles.fechaDesde?.format('DD/MM/YYYY'),
        fechaHasta: filtrosDetalles.fechaHasta?.format('DD/MM/YYYY'),
      };
      const response = await axios.get(`${API_URL}/presentismo`, {
        params,
        headers: { 'x-empresa-id': empresaId },
      });
      setRegistros(response.data);
    } catch (err) {
      console.error('Error al obtener los registros:', err);
      setError('Error al cargar los datos de presentismo. Por favor, intente de nuevo más tarde.');
    }
  };

  const fetchColaboradores = async () => {
    try {
      const response = await axios.get(`${API_URL}/usuarios-registrados`, {
        headers: { 'x-empresa-id': empresaId },
      });
      // Obtenemos el array de colaboradores
      const data = response.data.data || [];
    

       // IDs de los colaboradores a excluir
       const colaboradoresExcluidos = ['16', '111', '115', '116','297','300','299','298'];

       // Filtramos a los que NO estén en la lista de excluidos Y que NO sean del área Comercial
       const colaboradoresFiltrados = data.filter((colaborador: Colaborador) =>
        !colaboradoresExcluidos.includes(String(colaborador.colaboradorID)) &&
        colaborador.area !== 'Comercial'
      );



      setColaboradores(colaboradoresFiltrados);
    } catch (err) {
      console.error('Error al obtener los colaboradores:', err);
      setError('Error al cargar los datos de colaboradores. Por favor, intente de nuevo más tarde.');
    }
  };

  const fetchEstadosAsistencia = async () => {
    try {
      const params = {
        fechaDesde: filtrosDetalles.fechaDesde?.format('YYYY-MM-DD'),
        fechaHasta: filtrosDetalles.fechaHasta?.format('YYYY-MM-DD'),
      };
      const response = await axios.get(`${API_URL}/estado-asistencia`, {
        params,
        headers: { 'x-empresa-id': empresaId },
      });
      // Asegurar que siempre sea un array
      const estadosArray = Array.isArray(response.data) ? response.data : [];
      setEstadosAsistencia(estadosArray);
    } catch (err) {
      console.error('Error al obtener estados de asistencia:', err);
      // En caso de error, setear array vacío
      setEstadosAsistencia([]);
    }
  };

  const fetchDatosMesCorriente = async () => {
    if (!empresaId) return;
    try {
      const desde = dayjs().startOf('month');
      const hasta = dayjs().endOf('month');
      const [pres, est] = await Promise.all([
        axios.get(`${API_URL}/presentismo`, {
          params: {
            fechaDesde: desde.format('DD/MM/YYYY'),
            fechaHasta: hasta.format('DD/MM/YYYY'),
          },
          headers: { 'x-empresa-id': empresaId },
        }),
        axios.get(`${API_URL}/estado-asistencia`, {
          params: {
            fechaDesde: desde.format('YYYY-MM-DD'),
            fechaHasta: hasta.format('YYYY-MM-DD'),
          },
          headers: { 'x-empresa-id': empresaId },
        }),
      ]);
      setRegistrosMesCorriente(pres.data);
      setEstadosAsistenciaMes(Array.isArray(est.data) ? est.data : []);
    } catch (err) {
      console.error('Error al cargar datos del mes en curso:', err);
      setRegistrosMesCorriente([]);
      setEstadosAsistenciaMes([]);
    }
  };

  useEffect(() => {
    if (empresaId) {
      void fetchDatosMesCorriente();
    }
  }, [empresaId, mesCorrienteKey]);

  // -------------------------------------------------------------------------
  // 5) Filtrar registros globalmente (para optimizar)
  // -------------------------------------------------------------------------
  // Filtrar por fecha, tipo (entrada/salida), modalidad (Ofi/Home) UNA sola vez
  const registrosFiltradosGlobalmente = useMemo(() => {
    return registros.filter((r) => {
      const inRangeDesde = !filtrosDetalles.fechaDesde ||
        dayjs(r.horaRegistro).isSameOrAfter(filtrosDetalles.fechaDesde, 'day');
      const inRangeHasta = !filtrosDetalles.fechaHasta ||
        dayjs(r.horaRegistro).isSameOrBefore(filtrosDetalles.fechaHasta, 'day');
      const tipoCumple = !filtrosDetalles.tipo || r.tipo === filtrosDetalles.tipo;
      const modalidadCumple =
        !filtrosDetalles.tipoPresencial || r.tipoPresencial === filtrosDetalles.tipoPresencial;

      return inRangeDesde && inRangeHasta && tipoCumple && modalidadCumple;
    });
  }, [registros, filtrosDetalles]);

  // Agrupar estos registros prefiltrados por colaboradorID
  const registrosPorColaborador = useMemo(() => {
    const map: { [colabID: string]: Registro[] } = {};
    registrosFiltradosGlobalmente.forEach((reg) => {
      if (!map[reg.colaboradorID]) {
        map[reg.colaboradorID] = [];
      }
      map[reg.colaboradorID].push(reg);
    });
    return map;
  }, [registrosFiltradosGlobalmente]);

  const registrosFiltradosMesCorriente = useMemo(() => {
    const desde = dayjs().startOf('month');
    const hasta = dayjs().endOf('month');
    return registrosMesCorriente.filter((r) => {
      const okFecha =
        dayjs(r.horaRegistro).isSameOrAfter(desde, 'day') &&
        dayjs(r.horaRegistro).isSameOrBefore(hasta, 'day');
      const tipoCumple = !filtrosDetalles.tipo || r.tipo === filtrosDetalles.tipo;
      const modalidadCumple =
        !filtrosDetalles.tipoPresencial || r.tipoPresencial === filtrosDetalles.tipoPresencial;
      return okFecha && tipoCumple && modalidadCumple;
    });
  }, [
    registrosMesCorriente,
    filtrosDetalles.tipo,
    filtrosDetalles.tipoPresencial,
    mesCorrienteKey,
  ]);

  const registrosPorColaboradorMesCorriente = useMemo(() => {
    const map: { [colabID: string]: Registro[] } = {};
    registrosFiltradosMesCorriente.forEach((reg) => {
      if (!map[reg.colaboradorID]) {
        map[reg.colaboradorID] = [];
      }
      map[reg.colaboradorID].push(reg);
    });
    return map;
  }, [registrosFiltradosMesCorriente]);

  const fechaLocalISO = (horaRegistro: string) =>
    dayjs(horaRegistro).add(3, 'hour').format('YYYY-MM-DD');

  const colaboradoresBaseGlobal = useMemo(() => {
    return colaboradores.filter((c) => {
      const areaMatch = !filtrosDetalles.area || c.area === filtrosDetalles.area;
      const sucursalMatch = !filtrosDetalles.sucursal || c.sucursal === filtrosDetalles.sucursal;
      return areaMatch && sucursalMatch;
    });
  }, [colaboradores, filtrosDetalles.area, filtrosDetalles.sucursal]);

  const colaboradoresQueHanFichado = useMemo(() => {
    const conRegistroSet = new Set<string>();
    for (const c of colaboradoresBaseGlobal) {
      const regs = registrosPorColaborador[c.colaboradorID] || [];
      if (regs.length > 0) conRegistroSet.add(c.colaboradorID);
    }
    return colaboradoresBaseGlobal.filter((c) => conRegistroSet.has(c.colaboradorID));
  }, [colaboradoresBaseGlobal, registrosPorColaborador]);

  const colaboradoresQueNoHanFichado = useMemo(() => {
    const conRegistroSet = new Set<string>(colaboradoresQueHanFichado.map((c) => c.colaboradorID));
    return colaboradoresBaseGlobal.filter((c) => !conRegistroSet.has(c.colaboradorID));
  }, [colaboradoresBaseGlobal, colaboradoresQueHanFichado]);

  const totalizadoresGlobales = useMemo(() => {
    const totalEmpleados = colaboradoresBaseGlobal.length;
    const hanFichado = colaboradoresQueHanFichado.length;
    const noHanFichado = colaboradoresQueNoHanFichado.length;

    const enVacaciones = colaboradoresBaseGlobal.reduce(
      (acc, c) => acc + (colaboradoresEnVacacionesEnRangoSet.has(String(c.colaboradorID)) ? 1 : 0),
      0
    );
    const conPermisos = colaboradoresBaseGlobal.reduce(
      (acc, c) => acc + (colaboradoresConPermisosEnRangoSet.has(String(c.colaboradorID)) ? 1 : 0),
      0
    );

    const empleadosDisponiblesRango = totalEmpleados - enVacaciones - conPermisos;
    const porcentajePresentismo =
      empleadosDisponiblesRango > 0 ? ((hanFichado / empleadosDisponiblesRango) * 100).toFixed(2) : '0.00';

    return {
      totalEmpleados,
      hanFichado,
      noHanFichado,
      enVacaciones,
      conPermisos,
      porcentajePresentismo,
    };
  }, [
    colaboradoresBaseGlobal,
    colaboradoresQueHanFichado,
    colaboradoresQueNoHanFichado,
    colaboradoresEnVacacionesEnRangoSet,
    colaboradoresConPermisosEnRangoSet,
  ]);

  // Estado por colaborador y día (usa registros filtrados por tipo/modalidad/rango)
  const calcularEstadoAsistencia = (colaborador: Colaborador, fechaISO: string): EstadoCalculado => {
    const estadoManual = (estadosAsistencia || []).find(
      (e) =>
        e.colaboradorID === colaborador.colaboradorID &&
        dayjs(e.fecha).format('YYYY-MM-DD') === fechaISO
    );
    if (estadoManual) return estadoManual.estadoManual;

    const regsColaborador = registrosPorColaborador[colaborador.colaboradorID] || [];
    const tieneRegistroEseDia = regsColaborador.some((r) => fechaLocalISO(r.horaRegistro) === fechaISO);
    if (tieneRegistroEseDia) return 'presente';

    // Misma fuente que el totalizador "En vacaciones" (vacacionesEnRango), no el listado completo:
    // evita contar "Vacaciones" en estados de asistencia para registros fuera del rango filtrado.
    const enVacaciones = vacacionesEnRango.some((v) =>
      String(v.colaboradorID) === String(colaborador.colaboradorID) &&
      dayjs(fechaISO).isBetween(dayjs(v.fechaPermisoDesde), dayjs(v.fechaPermisoHasta), 'day', '[]')
    );
    if (enVacaciones) return 'vacaciones';

    const tienePermiso = (permisos || []).some((p) =>
      String(p.colaboradorID) === String(colaborador.colaboradorID) &&
      p.autorizado === 'Aprobado' &&
      dayjs(p.fechaPermiso).format('YYYY-MM-DD') === fechaISO
    );
    if (tienePermiso) return 'ausente_justificado';

    return 'sin_evaluar';
  };

  /** Misma lógica que calcularEstadoAsistencia pero con datos del mes calendario en curso. */
  const calcularEstadoAsistenciaMesCorriente = (
    colaborador: Colaborador,
    fechaISO: string
  ): EstadoCalculado => {
    const estadoManual = (estadosAsistenciaMes || []).find(
      (e) =>
        e.colaboradorID === colaborador.colaboradorID &&
        dayjs(e.fecha).format('YYYY-MM-DD') === fechaISO
    );
    if (estadoManual) return estadoManual.estadoManual;

    const regsColaborador = registrosPorColaboradorMesCorriente[colaborador.colaboradorID] || [];
    const tieneRegistroEseDia = regsColaborador.some((r) => fechaLocalISO(r.horaRegistro) === fechaISO);
    if (tieneRegistroEseDia) return 'presente';

    const enVacaciones = vacacionesEnMesCorriente.some(
      (v) =>
        String(v.colaboradorID) === String(colaborador.colaboradorID) &&
        dayjs(fechaISO).isBetween(dayjs(v.fechaPermisoDesde), dayjs(v.fechaPermisoHasta), 'day', '[]')
    );
    if (enVacaciones) return 'vacaciones';

    const tienePermiso = (permisos || []).some(
      (p) =>
        String(p.colaboradorID) === String(colaborador.colaboradorID) &&
        p.autorizado === 'Aprobado' &&
        dayjs(p.fechaPermiso).format('YYYY-MM-DD') === fechaISO
    );
    if (tienePermiso) return 'ausente_justificado';

    return 'sin_evaluar';
  };

  // -------------------------------------------------------------------------
  // 6) Función para aplicar filtros adicionales
  // -------------------------------------------------------------------------
  const aplicarFiltrosAdicionales = (colabs: Colaborador[]): Colaborador[] => {
    return colabs.filter((colaborador) => {
      // Tomamos SOLO los registros ya filtrados (por fecha, tipo, modalidad)
      const regsColaborador = registrosPorColaborador[colaborador.colaboradorID] || [];

      // Filtro por área
      const areaMatch = !filtrosDetalles.area || colaborador.area === filtrosDetalles.area;
      // Filtro por sucursal
      const sucursalMatch =
        !filtrosDetalles.sucursal || colaborador.sucursal === filtrosDetalles.sucursal;

      // Lógica de "hanFichado" y "noHanFichado"
      if (condicionSeleccionada === 'hanFichado' && regsColaborador.length === 0) {
        return false;
      }
      if (condicionSeleccionada === 'noHanFichado' && regsColaborador.length > 0) {
        return false;
      }

      // Si pasa estos filtros, lo mantenemos
      return areaMatch && sucursalMatch;
    });
  };

  // -------------------------------------------------------------------------
  // 7) useEffect para combinar la lógica y setear colaboradoresFiltrados
  // -------------------------------------------------------------------------
  const colaboradoresFiltrados = useMemo(() => {
    let base: Colaborador[] = [];

    switch (condicionSeleccionada) {
      case 'noHanFichado':
        base = colaboradoresQueNoHanFichado;
        break;
      case 'hanFichado':
        base = colaboradoresQueHanFichado;
        break;
      case 'enVacaciones':
        base = colaboradores.filter((colab) =>
          colaboradoresEnVacacionesEnRangoSet.has(String(colab.colaboradorID))
        );
        break;
      case 'conPermisosHoy':
        base = colaboradores.filter((colab) =>
          colaboradoresConPermisosEnRangoSet.has(String(colab.colaboradorID))
        );
        break;
      default:
        base = colaboradoresQueHanFichado;
    }

    const filtrados = aplicarFiltrosAdicionales(base);

    return [...filtrados].sort((a, b) => {
      const registroA = registrosPorColaborador[a.colaboradorID]?.[0];
      const registroB = registrosPorColaborador[b.colaboradorID]?.[0];
      if (!registroA && !registroB) return 0;
      if (!registroA) return 1;
      if (!registroB) return -1;
      return dayjs(registroB.horaRegistro).diff(dayjs(registroA.horaRegistro));
    });
  }, [
    colaboradores,
    condicionSeleccionada,
    colaboradoresQueHanFichado,
    colaboradoresQueNoHanFichado,
    colaboradoresEnVacacionesEnRangoSet,
    colaboradoresConPermisosEnRangoSet,
    registrosPorColaborador,
    aplicarFiltrosAdicionales,
  ]);

  const fechasRango = useMemo(() => {
    if (!filtrosDetalles.fechaDesde || !filtrosDetalles.fechaHasta) return [];
    const fechas: string[] = [];
    let d = filtrosDetalles.fechaDesde.startOf('day');
    const hasta = filtrosDetalles.fechaHasta.startOf('day');
    while (d.isSameOrBefore(hasta, 'day')) {
      fechas.push(d.format('YYYY-MM-DD'));
      d = d.add(1, 'day');
    }
    return fechas;
  }, [filtrosDetalles.fechaDesde, filtrosDetalles.fechaHasta]);

  const colaboradoresParaTotalesEstados = useMemo(() => {
    return colaboradores.filter((c) => {
      const areaMatch = !filtrosDetalles.area || c.area === filtrosDetalles.area;
      const sucursalMatch = !filtrosDetalles.sucursal || c.sucursal === filtrosDetalles.sucursal;
      return areaMatch && sucursalMatch;
    });
  }, [colaboradores, filtrosDetalles.area, filtrosDetalles.sucursal]);

  // Totalizadores de estados de asistencia (para el rango) - calculados una sola vez
  const totalizadoresEstados = useMemo(() => {
    let presentes = 0;
    let ausentesJustificados = 0;
    let ausentesInjustificados = 0;
    let sinEvaluar = 0;
    let vacacionesCount = 0;

    if (fechasRango.length === 0) {
      return { presentes, ausentesJustificados, ausentesInjustificados, sinEvaluar, vacaciones: vacacionesCount };
    }

    // IMPORTANTE: los totalizadores son independientes de lo que muestre la grilla.
    // Respetan solo filtros globales (fecha/área/sucursal/tipo/modalidad).
    for (const c of colaboradoresParaTotalesEstados) {
      for (const fecha of fechasRango) {
        const estado = calcularEstadoAsistencia(c, fecha);
        switch (estado) {
          case 'presente':
            presentes++;
            break;
          case 'ausente_justificado':
            ausentesJustificados++;
            break;
          case 'ausente_injustificado':
            ausentesInjustificados++;
            break;
          case 'sin_evaluar':
            sinEvaluar++;
            break;
          case 'vacaciones':
            vacacionesCount++;
            break;
        }
      }
    }

    return {
      presentes,
      ausentesJustificados,
      ausentesInjustificados,
      sinEvaluar,
      vacaciones: vacacionesCount,
    };
  }, [
    colaboradoresParaTotalesEstados,
    fechasRango,
    estadosAsistencia,
    registrosPorColaborador,
    vacacionesEnRango,
    permisos,
  ]);

  const totalPresentes = totalizadoresEstados.presentes;
  const totalAusentesJustificados = totalizadoresEstados.ausentesJustificados;
  const totalAusentesInjustificados = totalizadoresEstados.ausentesInjustificados;
  const totalSinEvaluar = totalizadoresEstados.sinEvaluar;
  const totalVacaciones = totalizadoresEstados.vacaciones;

  /** Lun–vie del mes calendario en curso (para sumar faltas en KPI). */
  const fechasHabilesMesCorriente = useMemo(() => {
    const start = dayjs().startOf('month');
    const end = dayjs().endOf('month');
    const fechas: string[] = [];
    let d = start;
    while (d.isSameOrBefore(end, 'day')) {
      if (d.day() !== 0 && d.day() !== 6) fechas.push(d.format('YYYY-MM-DD'));
      d = d.add(1, 'day');
    }
    return fechas;
  }, [mesCorrienteKey]);

  const kpiAusentismo = useMemo(() => {
    const nColab = colaboradoresParaTotalesEstados.length;
    const volumenLaboralTotal = nColab * DIAS_LABORALES_MES_KPI;
    let faltasInjustificadas = 0;
    let faltasJustificadas = 0;
    for (const c of colaboradoresParaTotalesEstados) {
      for (const fecha of fechasHabilesMesCorriente) {
        const estado = calcularEstadoAsistenciaMesCorriente(c, fecha);
        if (estado === 'ausente_injustificado') faltasInjustificadas++;
        else if (estado === 'ausente_justificado') faltasJustificadas++;
      }
    }
    const contadorFaltasMensual = faltasInjustificadas + faltasJustificadas;
    const tasaAusentismoInjustificadoPct =
      volumenLaboralTotal > 0
        ? ((faltasInjustificadas / volumenLaboralTotal) * 100).toFixed(2)
        : '0.00';
    return {
      volumenLaboralTotal,
      contadorFaltasMensual,
      tasaAusentismoInjustificadoPct,
      faltasInjustificadas,
      faltasJustificadas,
    };
  }, [
    colaboradoresParaTotalesEstados,
    fechasHabilesMesCorriente,
    estadosAsistenciaMes,
    registrosPorColaboradorMesCorriente,
    vacacionesEnMesCorriente,
    permisos,
  ]);

  // -------------------------------------------------------------------------
  // 8) Handlers
  // -------------------------------------------------------------------------
  const handleTotalizadorClick = (condicion: string) => {
    setCondicionSeleccionada(condicion);
    // Si el usuario cambia la condición principal, limpiamos filtro secundario de estado
    // para evitar "no veo nada" por un filtro viejo.
    setEstadoAsistenciaFiltro('');
  };

  const handleEstadoAsistenciaClick = (estado: EstadoCalculado) => {
    // Estados de ausencia: siempre se navegan desde "No ficharon"
    // (porque la grilla de detalle relevante es la de ausencias).
    if (estado === 'presente') {
      setCondicionSeleccionada('hanFichado');
    } else {
      setCondicionSeleccionada('noHanFichado');
    }

    setEstadoAsistenciaFiltro((prev) => (prev === estado ? '' : estado));
  };

  const handleFiltroChange =
    (setFiltros: React.Dispatch<React.SetStateAction<Filtros>>) =>
    (event: SelectChangeEvent<string>) => {
      const { name, value } = event.target;
      setFiltros((prev) => ({
        ...prev,
        [name as keyof Filtros]: value,
      }));
    };

  const handleDateChange =
    (field: 'fechaDesde' | 'fechaHasta') =>
    (date: dayjs.Dayjs | null) => {
      setFiltrosDetalles((prev) => ({ ...prev, [field]: date }));
    };

  const formatHoraRegistro = (horaRegistro: string) => {
    return dayjs(horaRegistro).add(3, 'hour').format('DD/MM/YYYY HH:mm:ss');
  };

  const handleCambiarEstado = async (
    colaboradorID: string,
    fecha: string,
    nuevoEstado: EstadoAsistenciaPersistible,
    observaciones?: string,
    fechaHasta?: string
  ) => {
    console.log('🔄 Cambiando estado:', { colaboradorID, fecha, nuevoEstado, observaciones, fechaHasta });
    setActualizandoEstado(true);
    try {
      // Si hay fechaHasta, generar array de fechas del rango
      const fechasParaProcesar: string[] = [];
      if (fechaHasta && fechaHasta !== fecha) {
        let currentDate = dayjs(fecha);
        const fechaHastaObj = dayjs(fechaHasta);
        while (currentDate.isSameOrBefore(fechaHastaObj, 'day')) {
          fechasParaProcesar.push(currentDate.format('YYYY-MM-DD'));
          currentDate = currentDate.add(1, 'day');
        }
      } else {
        fechasParaProcesar.push(fecha);
      }

      console.log('📅 Fechas a procesar:', fechasParaProcesar);

      // Procesar cada fecha del rango
      const promesas = fechasParaProcesar.map(async (fechaProcesar) => {
        const estadoExistente = estadosAsistencia.find(
          e => e.colaboradorID === colaboradorID && 
               dayjs(e.fecha).format('YYYY-MM-DD') === fechaProcesar
        );

        console.log(`📋 Estado existente para ${fechaProcesar}:`, estadoExistente);

        const payload = {
          colaboradorID,
          fecha: fechaProcesar,
          estadoManual: nuevoEstado,
          modificadoPor: currentUserID || empresaId,
          observaciones: observaciones || ''
        };

        console.log(`📤 Enviando payload para ${fechaProcesar}:`, payload);

        let response;
        if (estadoExistente) {
          console.log(`🔄 Actualizando estado existente para ${fechaProcesar}...`);
          response = await axios.put(
            `${API_URL}/estado-asistencia/${estadoExistente.id}`,
            payload,
            { headers: { 'x-empresa-id': empresaId } }
          );
        } else {
          console.log(`➕ Creando nuevo estado para ${fechaProcesar}...`);
          response = await axios.post(
            `${API_URL}/estado-asistencia`,
            payload,
            { headers: { 'x-empresa-id': empresaId } }
          );
        }

        console.log(`✅ Respuesta del servidor para ${fechaProcesar}:`, response.data);

        // Actualizar el estado local inmediatamente
        if (response.data && response.data.data) {
          const nuevoEstado = response.data.data;
          console.log(`🔄 Actualizando estado local con:`, nuevoEstado);
          
          setEstadosAsistencia(prev => {
            const existenteIndex = prev.findIndex(e => 
              e.colaboradorID === nuevoEstado.colaboradorID && 
              dayjs(e.fecha).format('YYYY-MM-DD') === dayjs(nuevoEstado.fecha).format('YYYY-MM-DD')
            );
            
            if (existenteIndex >= 0) {
              // Actualizar existente
              const nuevosEstados = [...prev];
              nuevosEstados[existenteIndex] = nuevoEstado;
              return nuevosEstados;
            } else {
              // Agregar nuevo
              return [...prev, nuevoEstado];
            }
          });
        }

        return response;
      });

      // Esperar a que todas las fechas se procesen
      await Promise.all(promesas);

      // Refrescar todos los datos que afectan el cálculo del estado
      await Promise.all([
        fetchEstadosAsistencia(),
        fetchRegistros(),
        fetchColaboradores(),
        fetchDatosMesCorriente(),
      ]);
      
      // También refrescar vacaciones y permisos si están disponibles
      if (empresaId) {
        try {
          const [vacacionesResponse, permisosResponse] = await Promise.all([
            axios.get(`${API_URL}/vacaciones`, { headers: { 'x-empresa-id': empresaId } }),
            axios.get(`${API_URL}/permiso-temporal`, { headers: { 'x-empresa-id': empresaId } }),
          ]);
          setVacaciones(vacacionesResponse.data);
          setPermisos(permisosResponse.data);
        } catch (err) {
          console.error('Error al refrescar vacaciones y permisos:', err);
        }
      }
      
      setEditandoEstado(null);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError('Error al actualizar el estado de asistencia');
    } finally {
      setActualizandoEstado(false);
    }
  };

  const handleExportAusencias = () => {
    try {
      if (!filtrosDetalles.fechaDesde || !filtrosDetalles.fechaHasta) {
        alert('Definí el rango de fechas antes de exportar.');
        return;
      }

      const filasJustificados: any[] = [];
      const filasInjustificados: any[] = [];
      const filasNoFicharon: any[] = [];

      colaboradoresFiltrados.forEach((colaborador) => {
        let currentDate = filtrosDetalles.fechaDesde?.clone();
        while (currentDate && currentDate.isSameOrBefore(filtrosDetalles.fechaHasta, 'day')) {
          const fechaISO = currentDate.format('YYYY-MM-DD');
          const regsDelDia = (registrosPorColaborador[colaborador.colaboradorID] || [])
            .filter(r => dayjs(r.horaRegistro).add(3, 'hour').format('YYYY-MM-DD') === fechaISO);

          const estado = calcularEstadoAsistencia(colaborador, fechaISO);
          const ultimoRegistro = regsDelDia[regsDelDia.length - 1];

          // Buscar observaciones del estado de asistencia
          const estadoAsistencia = estadosAsistencia.find(
            e => e.colaboradorID === colaborador.colaboradorID && 
                 dayjs(e.fecha).format('YYYY-MM-DD') === fechaISO
          );
          const observaciones = estadoAsistencia?.observaciones || '';

          const filaComun = {
            Nombre: `${colaborador.nombre} ${colaborador.apellido}`,
            Area: colaborador.area,
            Sucursal: colaborador.sucursal,
            Fecha: dayjs(fechaISO).format('DD/MM/YYYY'),
            Tipo: ultimoRegistro ? ultimoRegistro.tipo : 'Sin ficha',
            Modalidad: ultimoRegistro ? ultimoRegistro.tipoPresencial : 'Sin ficha',
            HoraRegistro: ultimoRegistro ? formatHoraRegistro(ultimoRegistro.horaRegistro) : '-',
            Estado:
              estado === 'ausente_justificado'
                ? 'Ausente Justificado'
                : estado === 'ausente_injustificado'
                ? 'Ausente Injustificado'
                : estado === 'presente'
                ? 'Presente'
                : estado === 'vacaciones'
                ? 'Vacaciones'
                : 'Sin Evaluar',
            Observaciones: observaciones,
          };

          if (condicionSeleccionada === 'noHanFichado') {
            if (regsDelDia.length === 0) {
              filasNoFicharon.push(filaComun);
            }
          } else {
            if (estado === 'ausente_justificado' || estado === 'vacaciones') filasJustificados.push(filaComun);
            if (estado === 'ausente_injustificado') filasInjustificados.push(filaComun);
          }

          currentDate = currentDate.add(1, 'day');
        }
      });

      const wb = XLSX.utils.book_new();
      const desdeStr = filtrosDetalles.fechaDesde.format('YYYYMMDD');
      const hastaStr = filtrosDetalles.fechaHasta.format('YYYYMMDD');

      if (condicionSeleccionada === 'noHanFichado') {
        const wsNo = XLSX.utils.json_to_sheet(filasNoFicharon);
        XLSX.utils.book_append_sheet(wb, wsNo, 'No ficharon');
        const fileName = `no_ficharon_${desdeStr}-${hastaStr}.xlsx`;
        XLSX.writeFile(wb, fileName);
      } else {
        const wsJust = XLSX.utils.json_to_sheet(filasJustificados);
        const wsInjust = XLSX.utils.json_to_sheet(filasInjustificados);
        XLSX.utils.book_append_sheet(wb, wsJust, 'Justificados');
        XLSX.utils.book_append_sheet(wb, wsInjust, 'Injustificados');
        const fileName = `ausencias_${desdeStr}-${hastaStr}.xlsx`;
        XLSX.writeFile(wb, fileName);
      }
    } catch (err) {
      console.error('Error al exportar ausencias a Excel:', err);
      alert('Ocurrió un error al exportar ausencias.');
    }
  };

  // -------------------------------------------------------------------------
  // 9) Render
  // -------------------------------------------------------------------------
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="container mx-auto p-4">
        {error && (
          <Alert severity="error" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Totalizadores (mismo estilo que Permisos Temporales) */}
        <div className="mb-4">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold">
              Presentismo{' '}
              {filtrosDetalles.fechaDesde ? filtrosDetalles.fechaDesde.format('DD/MM/YYYY') : '—'}–{filtrosDetalles.fechaHasta ? filtrosDetalles.fechaHasta.format('DD/MM/YYYY') : '—'}:
            </span>
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              {totalizadoresGlobales.totalEmpleados}
            </span>
            <span className="text-gray-500">|</span>

            {[
              { key: 'noHanFichado', label: 'No ficharon', value: totalizadoresGlobales.noHanFichado, clickable: true },
              { key: 'hanFichado', label: 'Ficharon', value: totalizadoresGlobales.hanFichado, clickable: true },
              { key: 'enVacaciones', label: 'En vacaciones', value: totalizadoresGlobales.enVacaciones, clickable: true },
              { key: 'conPermisosHoy', label: 'Con permisos', value: totalizadoresGlobales.conPermisos, clickable: true },
              {
                key: 'pct',
                label: 'Presentismo',
                value: `${totalizadoresGlobales.porcentajePresentismo}%`,
                clickable: false,
                pillTitle:
                  'Sobre las fechas del encabezado: ficharon en el rango vs empleados disponibles (sin vacaciones/permiso en ese rango). Un solo día = indicador del día.',
              },
            ].map((t) => {
              const selected = t.clickable && condicionSeleccionada === t.key;
              const pillTitle = 'pillTitle' in t && t.pillTitle ? t.pillTitle : t.label;
              return (
                <span
                  key={t.key}
                  onClick={t.clickable ? () => handleTotalizadorClick(t.key) : undefined}
                  role={t.clickable ? 'button' : undefined}
                  tabIndex={t.clickable ? 0 : -1}
                  onKeyDown={
                    t.clickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleTotalizadorClick(t.key);
                        }
                      : undefined
                  }
                  className={[
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ring-gray-200',
                    t.clickable ? 'cursor-pointer select-none' : '',
                    selected ? 'bg-blue-50 text-blue-800 ring-blue-200' : 'bg-white text-gray-700',
                  ].join(' ')}
                  title={pillTitle}
                >
                  <span className="max-w-[220px] truncate">{t.label}</span>
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      selected ? 'bg-blue-700 text-white' : 'bg-gray-900 text-white',
                    ].join(' ')}
                  >
                    {t.value}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold">Estados asistencia (rango):</span>
            <span className="text-gray-500">|</span>

            {[
              { key: 'presente' as const, label: 'Presentes', value: totalPresentes, badgeClass: 'bg-green-600' },
              { key: 'vacaciones' as const, label: 'Vacaciones', value: totalVacaciones, badgeClass: 'bg-teal-600' },
              { key: 'ausente_justificado' as const, label: 'Aus. justificados', value: totalAusentesJustificados, badgeClass: 'bg-orange-600' },
              { key: 'ausente_injustificado' as const, label: 'Aus. injustificados', value: totalAusentesInjustificados, badgeClass: 'bg-red-600' },
              { key: 'sin_evaluar' as const, label: 'Sin evaluar', value: totalSinEvaluar, badgeClass: 'bg-gray-700' },
            ].map((t) => {
              const selected = estadoAsistenciaFiltro === t.key;
              return (
                <span
                  key={t.key}
                  onClick={() => handleEstadoAsistenciaClick(t.key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleEstadoAsistenciaClick(t.key);
                  }}
                  className={[
                    'inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-gray-700 ring-1 ring-gray-200 cursor-pointer select-none',
                    selected ? 'bg-gray-100 ring-gray-300' : '',
                  ].join(' ')}
                  title={t.label}
                >
                  <span className="max-w-[220px] truncate">{t.label}</span>
                  <span className={`rounded-full ${t.badgeClass} px-2 py-0.5 text-[11px] font-semibold text-white`}>
                    {t.value}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm text-indigo-950 shadow-sm">
            <span className="font-semibold text-indigo-900">
              KPI ausentismo (mes en curso {dayjs().format('MM/YYYY')}):
            </span>
            <span className="text-indigo-400">|</span>
            <span
              className="inline-flex max-w-[280px] flex-col gap-0.5 rounded-lg bg-white px-3 py-1.5 text-xs ring-1 ring-indigo-100"
              title="Colaboradores (área/sucursal) × 24 días laborales fijos. Vacaciones no cuentan como falta justificada."
            >
              <span className="font-medium text-indigo-900">Volumen laboral total</span>
              <span className="text-[11px] text-indigo-700">
                {colaboradoresParaTotalesEstados.length} colab. × {DIAS_LABORALES_MES_KPI} días laborales
              </span>
              <span className="font-mono text-sm font-semibold text-indigo-950">
                {kpiAusentismo.volumenLaboralTotal.toLocaleString('es-AR')}
              </span>
            </span>
            <span
              className="inline-flex max-w-[260px] flex-col gap-0.5 rounded-lg bg-white px-3 py-1.5 text-xs ring-1 ring-indigo-100"
              title="Suma de injustificadas + justificadas en lun–vie del mes calendario actual (sin vacaciones)."
            >
              <span className="font-medium text-indigo-900">Faltas acumuladas</span>
              <span className="text-[11px] text-indigo-700">
                Injust. {kpiAusentismo.faltasInjustificadas} + Just. {kpiAusentismo.faltasJustificadas}
              </span>
              <span className="font-mono text-sm font-semibold text-indigo-950">
                {kpiAusentismo.contadorFaltasMensual.toLocaleString('es-AR')}
              </span>
            </span>
            <span
              className="inline-flex max-w-[240px] flex-col gap-0.5 rounded-lg bg-white px-3 py-1.5 text-xs ring-1 ring-indigo-100"
              title="Faltas injustificadas ÷ volumen laboral (colab × 24) × 100."
            >
              <span className="font-medium text-indigo-900">Tasa ausentismo</span>
              <span className="font-mono text-base font-semibold text-indigo-950">
                {kpiAusentismo.tasaAusentismoInjustificadoPct}%
              </span>
            </span>
          </div>
        </div>

        {/* Filtros */}
        <Paper className="p-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <FormControl fullWidth>
              <InputLabel>Área</InputLabel>
              <Select
                name="area"
                value={filtrosDetalles.area}
                onChange={handleFiltroChange(setFiltrosDetalles)}
                label="Área"
              >
                <MenuItem value="">Todas</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Sucursal</InputLabel>
              <Select
                name="sucursal"
                value={filtrosDetalles.sucursal}
                onChange={handleFiltroChange(setFiltrosDetalles)}
                label="Sucursal"
              >
                <MenuItem value="">Todas</MenuItem>
                {sucursales.map((suc) => (
                  <MenuItem key={suc} value={suc}>
                    {suc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                name="tipo"
                value={filtrosDetalles.tipo}
                onChange={handleFiltroChange(setFiltrosDetalles)}
                label="Tipo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="salida">Salida</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Modalidad</InputLabel>
              <Select
                name="tipoPresencial"
                value={filtrosDetalles.tipoPresencial}
                onChange={handleFiltroChange(setFiltrosDetalles)}
                label="Modalidad"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="Ofi">Oficina</MenuItem>
                <MenuItem value="Home">Home Office</MenuItem>
                <MenuItem value="Calle">Calle</MenuItem>
              </Select>
            </FormControl>

            <DatePicker
              label="Fecha Desde"
              value={filtrosDetalles.fechaDesde}
              onChange={handleDateChange('fechaDesde')}
              format="DD/MM/YYYY"
            />
            <DatePicker
              label="Fecha Hasta"
              value={filtrosDetalles.fechaHasta}
              onChange={handleDateChange('fechaHasta')}
              format="DD/MM/YYYY"
            />
          </div>

          {condicionSeleccionada === 'noHanFichado' && (
            <div className="flex justify-end">
              <Button variant="contained" color="success" onClick={handleExportAusencias}>
                Exportar Ausencias
              </Button>
            </div>
          )}

          {/* Tabla */}
          <TableContainer sx={{ backgroundColor: 'white' }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'white' }}>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Área</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Sucursal</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Tipo</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Modalidad</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Hora de Registro</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Estado Asistencia</TableCell>
                  <TableCell sx={{ backgroundColor: 'white', color: 'black', fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {colaboradoresFiltrados.flatMap((colaborador) => {
                  // Generar array de fechas del rango
                  const dias: string[] = [];
                  let currentDate = filtrosDetalles.fechaDesde?.clone();
                  while (currentDate && currentDate.isSameOrBefore(filtrosDetalles.fechaHasta, 'day')) {
                    dias.push(currentDate.format('YYYY-MM-DD'));
                    currentDate = currentDate.add(1, 'day');
                  }

                  return dias.flatMap((fecha) => {
                    const regsDelDia = (registrosPorColaborador[colaborador.colaboradorID] || [])
                      .filter(
                        (r) =>
                          dayjs(r.horaRegistro).add(3, 'hour').format('YYYY-MM-DD') === fecha
                      )
                      .sort((a, b) => dayjs(a.horaRegistro).diff(dayjs(b.horaRegistro)));

                    const estado = calcularEstadoAsistencia(colaborador, fecha);

                    if (estadoAsistenciaFiltro && estado !== estadoAsistenciaFiltro) {
                      return [];
                    }

                    if (regsDelDia.length === 0) {
                      return [
                        <TableRow
                          key={`${colaborador.colaboradorID}-${fecha}-sin`}
                          sx={{ backgroundColor: 'white' }}
                        >
                          <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{`${colaborador.nombre} ${colaborador.apellido}`}</TableCell>
                          <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                            {colaborador.area}
                          </TableCell>
                          <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                            {colaborador.sucursal}
                          </TableCell>
                          <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                            {dayjs(fecha).format('DD/MM/YYYY')}
                          </TableCell>
                          <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                            Sin ficha
                          </TableCell>
                          <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                            Sin ficha
                          </TableCell>
                          <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>-</TableCell>
                          <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                            <EstadoChip estado={estado} />
                          </TableCell>
                          <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                            <MenuEstadoAsistencia
                              estadoActual={estado}
                              actualizando={actualizandoEstado}
                              fechaActual={fecha}
                              fechaDesdeFiltro={filtrosDetalles.fechaDesde}
                              fechaHastaFiltro={filtrosDetalles.fechaHasta}
                              onCambiarEstado={(nuevoEstado, obs, fechaHasta) =>
                                handleCambiarEstado(
                                  colaborador.colaboradorID,
                                  fecha,
                                  nuevoEstado,
                                  obs,
                                  fechaHasta
                                )
                              }
                            />
                          </TableCell>
                        </TableRow>,
                      ];
                    }

                    return regsDelDia.map((reg) => (
                      <TableRow
                        key={`${colaborador.colaboradorID}-${fecha}-${reg.id}`}
                        sx={{ backgroundColor: 'white' }}
                      >
                        <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{`${colaborador.nombre} ${colaborador.apellido}`}</TableCell>
                        <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{colaborador.area}</TableCell>
                        <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{colaborador.sucursal}</TableCell>
                        <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{dayjs(fecha).format('DD/MM/YYYY')}</TableCell>
                        <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{reg.tipo}</TableCell>
                        <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>{reg.tipoPresencial}</TableCell>
                        <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                          {formatHoraRegistro(reg.horaRegistro)}
                        </TableCell>
                        <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                          <EstadoChip estado={estado} />
                        </TableCell>
                        <TableCell sx={{ backgroundColor: 'white', color: 'black' }}>
                          <MenuEstadoAsistencia
                            estadoActual={estado}
                            actualizando={actualizandoEstado}
                            fechaActual={fecha}
                            fechaDesdeFiltro={filtrosDetalles.fechaDesde}
                            fechaHastaFiltro={filtrosDetalles.fechaHasta}
                            onCambiarEstado={(nuevoEstado, obs, fechaHasta) =>
                              handleCambiarEstado(
                                colaborador.colaboradorID,
                                fecha,
                                nuevoEstado,
                                obs,
                                fechaHasta
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ));
                  });
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    </LocalizationProvider>
  );
};

// Chip visual para mostrar el estado
const EstadoChip: React.FC<{ estado: EstadoCalculado }> = ({ estado }) => {
  const config = {
    presente: { label: 'Presente', color: '#4caf50' },
    ausente_justificado: { label: 'Ausente Justificado', color: '#ff9800' },
    ausente_injustificado: { label: 'Ausente Injustificado', color: '#f44336' },
    sin_evaluar: { label: 'Sin Evaluar', color: '#9e9e9e' },
    vacaciones: { label: 'Vacaciones', color: '#009688' },
  };

  const { label, color } = config[estado];

  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: '12px',
      backgroundColor: color,
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
      {label}
    </span>
  );
};

// Menú para cambiar el estado
const MenuEstadoAsistencia: React.FC<{
  estadoActual: EstadoCalculado;
  actualizando?: boolean;
  fechaActual: string;
  fechaDesdeFiltro?: dayjs.Dayjs | null;
  fechaHastaFiltro?: dayjs.Dayjs | null;
  onCambiarEstado: (estado: EstadoAsistenciaPersistible, observaciones?: string, fechaHasta?: string) => void;
}> = ({ estadoActual, actualizando = false, fechaActual, fechaDesdeFiltro, fechaHastaFiltro, onCambiarEstado }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showObservaciones, setShowObservaciones] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoAsistenciaPersistible | null>(null);
  const [aplicarRango, setAplicarRango] = useState(false);
  const [fechaDesde, setFechaDesde] = useState<dayjs.Dayjs | null>(dayjs(fechaActual));
  const [fechaHasta, setFechaHasta] = useState<dayjs.Dayjs | null>(dayjs(fechaActual));

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    // Resetear valores al abrir el menú
    setFechaDesde(dayjs(fechaActual));
    setFechaHasta(dayjs(fechaActual));
    setAplicarRango(false);
    setObservaciones('');
    setEstadoSeleccionado(null);
    setShowObservaciones(false);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShowObservaciones(false);
    setObservaciones('');
    setAplicarRango(false);
    setEstadoSeleccionado(null);
  };

  const handleEstadoClick = (estado: EstadoAsistenciaPersistible, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setEstadoSeleccionado(estado);
    setShowObservaciones(true);
  };

  const handleConfirmar = () => {
    if (estadoSeleccionado) {
      const fechaDesdeStr = fechaDesde?.format('YYYY-MM-DD') || fechaActual;
      const fechaHastaStr = aplicarRango && fechaHasta 
        ? fechaHasta.format('YYYY-MM-DD') 
        : fechaDesdeStr;
      
      // Validar que fechaHasta no sea anterior a fechaDesde
      if (aplicarRango && fechaHasta && fechaDesde && fechaHasta.isBefore(fechaDesde, 'day')) {
        alert('La fecha "hasta" no puede ser anterior a la fecha "desde"');
        return;
      }

      onCambiarEstado(estadoSeleccionado, observaciones, fechaHastaStr !== fechaDesdeStr ? fechaHastaStr : undefined);
      handleClose();
    }
  };

  // Solo mostrar rango de fechas si el estado seleccionado es "ausente_justificado"
  const mostrarRangoFechas = estadoSeleccionado === 'ausente_justificado';

  return (
    <div>
      <Button size="small" onClick={handleClick} disabled={actualizando}>
        {actualizando ? 'Actualizando...' : 'Cambiar'}
      </Button>
      <Menu 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)} 
        onClose={handleClose}
        keepMounted={false}
        PaperProps={{
          style: {
            maxHeight: '80vh',
            overflow: 'visible'
          }
        }}
        MenuListProps={{
          style: {
            padding: 0
          }
        }}
      >
        {!showObservaciones ? (
          <div>
            <div
              onClick={(e) => handleEstadoClick('presente', e)}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Marcar Presente
            </div>
            <div
              onClick={(e) => handleEstadoClick('ausente_justificado', e)}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Ausente Justificado
            </div>
            <div
              onClick={(e) => handleEstadoClick('ausente_injustificado', e)}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Ausente Injustificado
            </div>
            <div
              onClick={(e) => handleEstadoClick('sin_evaluar', e)}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Sin Evaluar
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px', minWidth: '350px', maxWidth: '400px' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {mostrarRangoFechas && (
                <div style={{ marginBottom: '16px' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={aplicarRango}
                        onChange={(e) => {
                          setAplicarRango(e.target.checked);
                        }}
                      />
                    }
                    label="Aplicar a rango de fechas"
                    style={{ marginBottom: '12px', display: 'block' }}
                  />

                  {aplicarRango && (
                    <div style={{ 
                      marginBottom: '16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px', 
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px'
                    }}>
                      <DatePicker
                        label="Fecha Desde"
                        value={fechaDesde}
                        onChange={(date) => {
                          setFechaDesde(date);
                        }}
                        format="DD/MM/YYYY"
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true
                          }
                        }}
                      />
                      <DatePicker
                        label="Fecha Hasta"
                        value={fechaHasta}
                        onChange={(date) => {
                          setFechaHasta(date);
                        }}
                        format="DD/MM/YYYY"
                        minDate={fechaDesde || undefined}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </LocalizationProvider>

            <Typography variant="subtitle2" gutterBottom style={{ marginTop: mostrarRangoFechas && aplicarRango ? '0' : '0' }}>
              Observaciones (opcional):
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: No pudo fichar por problemas técnicos"
              size="small"
            />
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <Button size="small" onClick={handleClose}>
                Cancelar
              </Button>
              <Button size="small" variant="contained" onClick={handleConfirmar}>
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Menu>
    </div>
  );
};

export default AdminPresentismoPanel;
