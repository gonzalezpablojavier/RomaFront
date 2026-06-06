import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/apiClient';
import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '../../session/sessionStore';
import {
    getManagerIdsForEmpresa,
    getManagerAreasForEmpresa,
} from '../../services/empresaService';
import {
    canManageTenantRoles,
    listTenantMembers,
} from '../../services/tenantRbacService';
import { sendBulkPushNotifications } from '../../services/pushNotificationService';
import { MemberRolesModal } from '../../components/tenant-admin/MemberRolesModal';
import { roleLabel } from '../../components/platform-admin/rbacLabels';
import type { TenantMember } from '../../types/tenantRbac';
import NotificationModal from './NotificationModal';
import * as XLSX from 'xlsx';  // <= IMPORTANTE

interface Colaborador {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    area: string;
    colaboradorID: number;
    sucursal: string;
    localidad: string;
    direccion: string;
    telefono?: string;
    codpostal?: string;
    fechaDomicilioActualizado?: string;
    fechaNacimiento?: string;
    hstrabajadas: number;
}

/**
 * ISO desde servidor (ej. ...T00:00:00.000Z): el día/mes del cumple hay que leerlo en UTC,
 * si no en UTC-3 se corre un día y "mañana" aparece como "hoy".
 */
function getBirthMonthDayUtc(fechaNacimiento: string | undefined | null): { month: number; day: number } | null {
    if (!fechaNacimiento) return null;
    const d = new Date(fechaNacimiento);
    if (Number.isNaN(d.getTime())) return null;
    return { month: d.getUTCMonth(), day: d.getUTCDate() };
}

/** Fecha de nacimiento para mostrar/exportar: mismo calendario que el filtro (UTC del ISO del server). */
function formatFechaNacimientoDisplay(fechaNacimiento: string | undefined | null): string {
    if (!fechaNacimiento) return '';
    const d = new Date(fechaNacimiento);
    if (Number.isNaN(d.getTime())) return '';
    const day = d.getUTCDate();
    const month = d.getUTCMonth() + 1;
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

function getLocalMonthDay(ref: Date): { month: number; day: number } {
    return { month: ref.getMonth(), day: ref.getDate() };
}

/** Mismo día y mes que `ref` en calendario local (año de nacimiento se ignora). */
function cumpleHoy(fechaNacimiento: string | undefined | null, ref: Date = new Date()): boolean {
    const b = getBirthMonthDayUtc(fechaNacimiento);
    if (!b) return false;
    const l = getLocalMonthDay(ref);
    return b.month === l.month && b.day === l.day;
}

function cumpleManana(fechaNacimiento: string | undefined | null, ref: Date = new Date()): boolean {
    const d = new Date(ref);
    d.setDate(d.getDate() + 1);
    return cumpleHoy(fechaNacimiento, d);
}

/** Cumpleaños que caen en alguno de los próximos 7 días desde hoy (inclusive), en calendario local. */
function cumpleEnProximos7Dias(fechaNacimiento: string | undefined | null, ref: Date = new Date()): boolean {
    const b = getBirthMonthDayUtc(fechaNacimiento);
    if (!b) return false;
    const start = new Date(ref);
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
        const check = new Date(start);
        check.setDate(start.getDate() + i);
        const l = getLocalMonthDay(check);
        if (l.month === b.month && l.day === b.day) return true;
    }
    return false;
}

/** Áreas que entran en el total de colaboradores (editar acá). */
const areas = [
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
];
const ColaboradoresList: React.FC = () => {
    // URL base
    
    // Estados
    const [empresaId, setEmpresaId] = useState('');
    const [managerIds, setManagerIds] = useState<number[]>([]);
    const [managerAreas, setManagerAreas] = useState<{ [key: string]: string }>({});
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [error, setError] = useState('');

  // Inyectar CSS para forzar estilos blancos
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .colaboradores-table thead {
        background-color: white !important;
      }
      .colaboradores-table thead th {
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


    // Listas para <option> en los selects
    const [areasDisponibles, setAreasDisponibles] = useState<string[]>([]);
    const [sucursalesDisponibles, setSucursalesDisponibles] = useState<string[]>([]);

    // Búsqueda
    const [searchTerm, setSearchTerm] = useState('');

    // Filtros por área y sucursal
    const [filterArea, setFilterArea] = useState('');      // String vacío = sin filtrar
    const [filterSucursal, setFilterSucursal] = useState('');
    /** Cumpleaños: sin filtro | hoy | mañana | próximos 7 días */
    const [filterCumple, setFilterCumple] = useState<'' | 'hoy' | 'manana' | 'semana'>('');

    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [canManageRoles, setCanManageRoles] = useState(false);
    const [membersById, setMembersById] = useState<Map<number, TenantMember>>(new Map());
    const [editingMember, setEditingMember] = useState<TenantMember | null>(null);

    useEffect(() => {
        const tenantId = getSessionEmpresaId();
        if (!tenantId || !canManageTenantRoles()) return;
        void listTenantMembers(tenantId)
            .then((list) => {
                setMembersById(new Map(list.map((m) => [m.colaboradorId, m])));
                setCanManageRoles(true);
            })
            .catch(() => setCanManageRoles(false));
    }, [empresaId]);

    // Selectores para horas trabajadas (mes/año actual por defecto)
    const [mesHoras, setMesHoras] = useState(new Date().getMonth() + 1); // 1-12
    const [anioHoras, setAnioHoras] = useState(new Date().getFullYear());


    // Convierte "H:M:S" a horas decimales (ej: "8:30:0" → 8.5)
    const parsearHorasMinutosSegundos = (valor: string): number => {
        const partes = valor.split(':').map(Number);
        if (partes.length !== 3 || partes.some(isNaN)) return 0;
        const [horas, minutos, segundos] = partes;
        return Math.round((horas + minutos / 60 + segundos / 3600) * 100) / 100;
    };

    // Llamada puntual para ver horas de un colaborador
    const handleVerHorasTrabajadas = async (colaborador: Colaborador) => {
        try {
            // Llamada al endpoint con mes/año seleccionados
            const response = await apiClient.get(
                `/presentismo/horastrabajadas?colaboradorID=${colaborador.colaboradorID}&anio=${anioHoras}&mes=${mesHoras}`
            );
            console.log('Respuesta completa horasTrabajadas:', response.data);
            
            // El endpoint puede retornar: número, string "H:M:S", u objeto
            let horasTrabajadas: number;
            if (typeof response.data === 'number') {
                horasTrabajadas = response.data;
            } else if (typeof response.data === 'string' && response.data.includes(':')) {
                horasTrabajadas = parsearHorasMinutosSegundos(response.data);
            } else {
                horasTrabajadas = response.data?.horasTrabajadas ?? 0;
            }

            // Actualiza el estado de `colaboradores` para que re-renderice la grilla
            setColaboradores((prev) =>
                prev.map((item) => {
                    if (item.colaboradorID === colaborador.colaboradorID) {
                        // Retornamos una copia con la nueva hstrabajadas
                        return { ...item, hstrabajadas: horasTrabajadas };
                    }
                    return item; // los demás sin cambios
                })
            );

        } catch (error) {
            console.error('Error al obtener horas trabajadas:', error);
            alert('No fue posible obtener las horas trabajadas');
        }
    };

    const handleExportExcel = () => {
        try {
            // 1) Preparamos los datos para un mejor “formato” de columnas
            const dataAExportar = filteredColaboradores.map((col) => ({
                Nombre: col.nombre,
                Apellido: col.apellido,
                Área: col.area,
                Sucursal: col.sucursal,
                Localidad: col.localidad,
                Dirección: col.direccion,
                Teléfono: col.telefono || '',
                'Cód. Postal': col.codpostal || '',
                'Fecha Nac.': col.fechaNacimiento ? formatFechaNacimientoDisplay(col.fechaNacimiento) : '',
                'Fecha Domicilio Actualizado': col.fechaDomicilioActualizado
                    ? new Date(col.fechaDomicilioActualizado).toLocaleString()
                    : '',
                'Hs Trabajadas': col.hstrabajadas !== undefined ? col.hstrabajadas : '',
            }));

            // 2) Convertimos a hoja de cálculo
            const hoja = XLSX.utils.json_to_sheet(dataAExportar);
            // 3) Creamos el libro de Excel
            const libro = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(libro, hoja, 'Colaboradores');

            // 4) Generamos y descargamos el archivo
            XLSX.writeFile(libro, 'colaboradores.xlsx');
        } catch (err) {
            console.error('Error al exportar a Excel:', err);
            alert('Ocurrió un error al exportar la lista a Excel.');
        }
    };

    // Efecto para cargar info basándonos en localStorage
    useEffect(() => {
        const storedEmpresaID = getSessionEmpresaId();
        if (!storedEmpresaID) {
            setError('No se ha especificado una empresa');
            return;
        }

        setEmpresaId(storedEmpresaID);
        // Obtener info adicional
        const empresaManagerIds = getManagerIdsForEmpresa(storedEmpresaID);
        const empresaManagerAreas = getManagerAreasForEmpresa(storedEmpresaID);

        // Supongamos que tu función getManagerIdsForEmpresa retorna un string[]:
        const idsComoString: string[] = getManagerIdsForEmpresa(storedEmpresaID);
        // Convertimos cada string a number
        const idsComoNumber: number[] = idsComoString.map((idStr) => parseInt(idStr, 10));
        // Ahora sí le pasamos number[] al estado
        setManagerIds(idsComoNumber);
        setManagerAreas(empresaManagerAreas);
        // Llamada para obtener colaboradores
        // 1) Obtener la lista de colaboradores
        apiClient
            .get(`/usuarios-registrados`)
            .then(async (res) => {
                if (res.data.ok !== 1 || !Array.isArray(res.data.data)) {
                    console.warn('La respuesta no es la esperada:', res.data);
                    setColaboradores([]);
                    return;
                }

                const listaBase: Colaborador[] = res.data.data; // Estos vienen sin teléfono ni codpostal



                // 2) Usar Promise.all para cada colaborador, trayendo auditoría y horas trabajadas
                const listaEnriquecida = await Promise.all(
                    listaBase.map(async (col) => {
                        try {
                            // Ajusta el año y mes que quieras filtrar (pueden ser dinámicos)
                            const anio = 2025;
                            const mes = 3;

                            // Llamas EN PARALELO a ambos endpoints
                            const [auditRes] = await Promise.all([
                                apiClient.get(`/colaborador-auditoria/ultima-actualizacion/${col.colaboradorID}`),
                                // apiClient.get(`/presentismo/horastrabajadas?colaboradorID=${col.colaboradorID}&anio=${anio}&mes=${mes}`),
                            ]);

                            const dataAuditoria = auditRes.data;  // Devuelve { telefono, codpostal, ... }

                            return {
                                ...col,
                                // Datos de auditoría
                                telefono: dataAuditoria.telefono,
                                codpostal: dataAuditoria.codpostal,
                                fechaDomicilioActualizado: dataAuditoria.fechaDomicilioActualizado,


                            };
                        } catch (err) {
                            console.error(`Error al cargar datos para colaboradorID=${col.colaboradorID}`, err);
                            // Retorna el colaborador tal cual, si algo falla
                            return { ...col };
                        }
                    })
                );

                // 3) Finalmente, seteamos la lista con los datos enriquecidos en el estado
                setColaboradores(listaEnriquecida);



                // 2) Extraer la lista de áreas y sucursales (si no las traes de otra parte)
                const uniqueAreas = Array.from(new Set(listaEnriquecida.map((c) => c.area).filter(Boolean)));
                const uniqueSucursales = Array.from(new Set(listaEnriquecida.map((c) => c.sucursal).filter(Boolean)));

                setAreasDisponibles(uniqueAreas);
                setSucursalesDisponibles(uniqueSucursales);
            })
            .catch((err) => {
                console.error('Error al obtener los colaboradores:', err);
                setError('Error al obtener los colaboradores');
            });
    }, []);


    // Manejo de error básico
    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    const filteredColaboradores = (colaboradores as Colaborador[]).filter((col) => {
        // 1) Filtra por nombre/apellido
        const matchesSearchTerm = `${col.nombre} ${col.apellido}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        // 0) Whitelist de áreas que cuentan
        const matchesAllowedAreas = areas.includes(col.area as (typeof areas)[number]);

        // 2) Filtra por área (si `filterArea` está vacío, mostramos todos)
        const matchesArea = filterArea === '' || col.area === filterArea;

        // 3) Filtra por sucursal
        const matchesSucursal = filterSucursal === '' || col.sucursal === filterSucursal;

        const matchesCumple =
            filterCumple === ''
                ? true
                : filterCumple === 'hoy'
                  ? cumpleHoy(col.fechaNacimiento)
                  : filterCumple === 'manana'
                    ? cumpleManana(col.fechaNacimiento)
                    : cumpleEnProximos7Dias(col.fechaNacimiento);

        return matchesAllowedAreas && matchesSearchTerm && matchesArea && matchesSucursal && matchesCumple;
    });

    const handleSendBulkNotifications = async (title: string, body: string, selectedIds: number[]) => {
        try {
            const { successCount, errorCount } = await sendBulkPushNotifications(
                title,
                body,
                selectedIds,
                empresaId || undefined,
            );
            alert(`Notificaciones enviadas:\n✅ Exitosas: ${successCount}\n❌ Fallidas: ${errorCount}`);
        } catch (e) {
            console.error('Error en el envío masivo:', e);
            alert('Error al enviar las notificaciones: ' + (e as Error).message);
        }
    };

    const colaboradorCuentaParaTotalesPorArea = (c: Colaborador) => areas.includes(c.area);

    const totalFiltrado = filteredColaboradores.length;
    const totalArea = filterArea === ''
        ? null
        : (colaboradores as Colaborador[]).filter(
              (c) => c.area === filterArea && colaboradorCuentaParaTotalesPorArea(c)
          ).length;
    const totalColaboradores = (colaboradores as Colaborador[]).filter(colaboradorCuentaParaTotalesPorArea).length;



    // Render principal
    return (
        <div className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Listado de Colaboradores</h2>

            {/* Búsqueda */}
            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-end space-x-4 mb-4">
                {/* Filtro por Área */}
                <div className="relative mb-4">
                    <label className="block mb-1">Filtrar por Área:</label>
                    <select
                        value={filterArea}
                        onChange={(e) => setFilterArea(e.target.value)}
                        className="p-2 border rounded focus:outline-none"
                    >
                        <option value="">-- Todas --</option>
                        {areasDisponibles.map((area) => (
                            <option key={area} value={area}>
                                {area}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtro por Sucursal */}
                <div className=" relative mb-4">
                    <label className="block mb-1">Filtrar por Sucursal:</label>
                    <select
                        value={filterSucursal}
                        onChange={(e) => setFilterSucursal(e.target.value)}
                        className="p-2 border rounded focus:outline-none"
                    >
                        <option value="">-- Todas --</option>
                        {sucursalesDisponibles.map((suc) => (
                            <option key={suc} value={suc}>
                                {suc}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="relative mb-4">
                    <label className="block mb-1">Cumpleaños:</label>
                    <select
                        value={filterCumple}
                        onChange={(e) =>
                            setFilterCumple(e.target.value as '' | 'hoy' | 'manana' | 'semana')
                        }
                        className="p-2 border rounded focus:outline-none"
                    >
                        <option value="">— Todos —</option>
                        <option value="hoy">Cumple hoy</option>
                        <option value="manana">Cumple mañana</option>
                        <option value="semana">Próximos 7 días</option>
                    </select>
                </div>

                {/* Selector de Mes para Horas Trabajadas */}
                <div className="relative mb-4">
                    <label className="block mb-1">Mes:</label>
                    <select
                        value={mesHoras}
                        onChange={(e) => setMesHoras(Number(e.target.value))}
                        className="p-2 border rounded focus:outline-none"
                    >
                        <option value={1}>Enero</option>
                        <option value={2}>Febrero</option>
                        <option value={3}>Marzo</option>
                        <option value={4}>Abril</option>
                        <option value={5}>Mayo</option>
                        <option value={6}>Junio</option>
                        <option value={7}>Julio</option>
                        <option value={8}>Agosto</option>
                        <option value={9}>Septiembre</option>
                        <option value={10}>Octubre</option>
                        <option value={11}>Noviembre</option>
                        <option value={12}>Diciembre</option>
                    </select>
                </div>

                {/* Selector de Año para Horas Trabajadas */}
                <div className="relative mb-4">
                    <label className="block mb-1">Año:</label>
                    <select
                        value={anioHoras}
                        onChange={(e) => setAnioHoras(Number(e.target.value))}
                        className="p-2 border rounded focus:outline-none"
                    >
                        {[2023, 2024, 2025, 2026].map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div className=" relative mb-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setIsNotificationModalOpen(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                    >
                        Enviar notificación push
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                        Exportar a Excel
                    </button>
                </div>
            </div>

            {/* Totales */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Colaboradores totales</div>
                    <div className="text-2xl font-bold text-gray-900">{totalColaboradores}</div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                        Total del área{filterArea !== '' ? ` (${filterArea})` : ''}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalArea ?? '—'}</div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Total filtrado</div>
                    <div className="text-2xl font-bold text-gray-900">{totalFiltrado}</div>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full bg-white colaboradores-table">
                    <thead className="bg-white border-b-2 border-gray-300" style={{ backgroundColor: 'white !important' }}>
                        <tr>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Nombre</th>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Área</th>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Sucursal</th>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Domicilio</th>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Localidad</th>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Telefono</th>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Cód. Postal</th>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Fecha Domicilio Actual.</th>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Nacimiento</th>
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Hs Trabajadas</th>
                            {canManageRoles && (
                                <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}>Roles RBAC</th>
                            )}
                            <th className="py-2 px-4 border-b" style={{ backgroundColor: 'white !important', color: 'black !important' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredColaboradores.length > 0 ? (
                            filteredColaboradores.map((col) => (
                                <tr key={col.colaboradorID}>
                                    <td className="py-2 px-4 border-b">{col.nombre} {col.apellido}</td>
                                    <td className="py-2 px-4 border-b">{col.area}</td>
                                    <td className="py-2 px-4 border-b">{col.sucursal}</td>
                                    <td className="py-2 px-4 border-b">{col.direccion}</td>
                                    <td className="py-2 px-4 border-b">{col.localidad}</td>
                                    <td className="py-2 px-4 border-b">{col.telefono}</td>
                                    <td className="py-2 px-4 border-b">{col.codpostal || '-'}</td>
                                    <td className="py-2 px-4 border-b">
                                        {col.fechaDomicilioActualizado
                                            ? new Date(col.fechaDomicilioActualizado).toLocaleString()
                                            : '-'}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {col.fechaNacimiento
                                            ? formatFechaNacimientoDisplay(col.fechaNacimiento)
                                            : '-'}
                                    </td>
                                    <td className="py-2 px-4 border-b">  {col.hstrabajadas !== undefined ? col.hstrabajadas : '-'}</td>
                                    {canManageRoles && (
                                        <td className="py-2 px-4 border-b">
                                            <div className="flex flex-wrap gap-1">
                                                {(membersById.get(col.colaboradorID)?.roles ?? [])
                                                    .filter((r) => r.roleCode !== 'platform_admin')
                                                    .map((r) => (
                                                        <span
                                                            key={r.roleCode}
                                                            className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700"
                                                        >
                                                            {roleLabel(r.roleCode)}
                                                        </span>
                                                    ))}
                                                {!(membersById.get(col.colaboradorID)?.roles.length) && (
                                                    <span className="text-xs text-slate-400">Sin rol</span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const m = membersById.get(col.colaboradorID);
                                                    if (m) setEditingMember(m);
                                                }}
                                                className="mt-1 text-xs font-semibold text-cyan-700 hover:underline"
                                            >
                                                Editar roles
                                            </button>
                                        </td>
                                    )}
                                    <td className="py-2 px-4 border-b">
                                        {/* Botones de acción */}
                                        <button
                                            onClick={() => handleVerHorasTrabajadas(col)}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded mr-2"
                                        >
                                            Ver Hs Mes
                                        </button>




                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={canManageRoles ? 12 : 11} className="py-2 px-4 border-b text-center">
                                    No hay colaboradores registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                colaboradores={colaboradores}
                filteredColaboradores={filteredColaboradores}
                onSendNotification={handleSendBulkNotifications}
            />

            {empresaId && (
                <MemberRolesModal
                    tenantId={empresaId}
                    member={editingMember}
                    open={!!editingMember}
                    onClose={() => setEditingMember(null)}
                    onSaved={(updated) => {
                        setMembersById((prev) => {
                            const next = new Map(prev);
                            next.set(updated.colaboradorId, updated);
                            return next;
                        });
                    }}
                />
            )}
        </div>
    );
};

export default ColaboradoresList;
