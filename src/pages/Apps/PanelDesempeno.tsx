import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { Route } from '../../config/permissions';
import { CRITERIOS_LIDER, CRITERIOS_POR_NIVEL, DESCRIPCION_LIDER, DESCRIPCION_NIVEL, getTrimestreActivoFromDate } from '../../config/desempenoConfig';
import {
  getAreasForEmpresa,
  getDepoSucursalLeaderIds,
  getManagerAreasForEmpresa,
  getManagerIdsForEmpresa,
} from '../../services/empresaService';
import {
  canDepoCoordinatorViewSucursalLeader,
  getDepoCoordinatorIds,
  getLeaderColaboradorIds,
  getSucursalCodeForColaborador,
} from '../../services/tenantRbacService';
import { desempenoService } from '../../services/desempenoService';
import { getApiBaseUrl } from '../../api/apiClient';
import type { CriterioConfig, CriterioPuntaje, Nivel } from '../../types/desempeno';

type TabId = 'resumen' | 'colaboradores' | 'ranking' | 'evolucion';

type RankingAudiencia = 'colab' | 'lideres' | 'ambos';

/** Drill-down desde Segmentación (resumen) → pestaña Área. */
type ColabDrillFilter = {
  perfil: 'operativo' | 'liderazgo';
  metric: 'evaluados' | 'todos' | 'top' | 'atencion';
};

const CHART_COLORS = ['#1e4d8c', '#2d9e6b', '#e8a020', '#d94040', '#8b5cf6', '#0891b2', '#e83e8c', '#20c997', '#fd7e14', '#6c757d'];

function extractTrimestreActivo(payload: any): string {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload?.trimestre === 'string') return payload.trimestre;
  if (typeof payload?.data === 'string') return payload.data;
  if (typeof payload?.data?.trimestre === 'string') return payload.data.trimestre;
  if (typeof payload?.payload === 'string') return payload.payload;
  return '';
}

function getScoreColors(score: number) {
  if (score >= 6) return { text: 'text-green-600', bg: 'bg-green-100', hex: '#2d9e6b', label: 'Evaluado' };
  return { text: 'text-red-600', bg: 'bg-red-100', hex: '#c0392b', label: 'Evaluado' };
}

function getNivelBadge(nivel: Nivel) {
  if (nivel === 'Jr') return 'bg-blue-100 text-blue-700';
  if (nivel === 'Ssr') return 'bg-amber-100 text-amber-700';
  return 'bg-purple-100 text-purple-700';
}

function getLeaderLabelByArea(area: any): 'Gerencia' | 'Líder' {
  const a = String(area ?? '').trim().toLowerCase();
  if (a === 'gerencia') return 'Gerencia';
  return 'Líder';
}

const EXCLUDED_AREAS = new Set(['Directorio']);

function kpiValue(v: any) {
  if (v == null) return '—';
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'object') return '—';
  return v;
}

function initials(nombreCompleto: string) {
  const parts = (nombreCompleto || '').trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts[1]?.[0] || '';
  return (a + b).toUpperCase() || '?';
}

function getColaboradorFotoUrl(foto: string | undefined | null) {
  const f = (foto || '').trim();
  if (!f || f === 'null') return null;
  if (f.startsWith('http')) return f;
  return `${getApiBaseUrl()}${f.startsWith('/') ? '' : '/'}${f}`;
}

function formatSucursalPanel(sucursal: any) {
  const value = String(sucursal ?? '').trim();
  return value === 'DIMES' ? 'BSAS' : value;
}

/** Misma convención que `desempenoService`: login guarda colaboradorID en `user_code`. */
function parseSessionColaboradorId(user: any): string {
  const fromCtx = user?.user_code ?? user?.colaboradorID ?? user?.userId ?? user?.id;
  if (fromCtx != null && String(fromCtx).trim() !== '') return String(fromCtx);
  try {
    const raw = localStorage.getItem('user');
    const parsed = raw ? JSON.parse(raw) : null;
    const v = parsed?.user_code ?? parsed?.colaboradorID ?? parsed?.userId ?? parsed?.id;
    if (v != null && String(v).trim() !== '') return String(v);
  } catch {
    /* ignore */
  }
  return '';
}

function rowScoreTotal(c: any): number | null {
  const raw = c?.evaluacion?.scoreTotal ?? c?.scoreTotal;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function rowColaboradorId(row: any): string {
  const v = row?.colaboradorID ?? row?.id;
  return v == null || String(v).trim() === '' ? '' : String(v);
}

/** Misma convención que el orden del ranking: bloque Sr / Ssr / Jr / líder / resto. */
function nivelBucketKeyForRankingMedal(c: any, isLeader: boolean): string {
  if (isLeader) return 'L';
  const n = String(c?.nivel ?? '').trim();
  if (n === 'Sr') return 'Sr';
  if (n === 'Ssr') return 'Ssr';
  if (n === 'Jr') return 'Jr';
  const up = n.toUpperCase();
  if (up === 'SR') return 'Sr';
  if (up === 'SSR') return 'Ssr';
  if (up === 'JR') return 'Jr';
  return 'X';
}

function clampScore(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(1, n));
}

function buildCriteriosFromConfig(config: CriterioConfig[], existing?: CriterioPuntaje[]) {
  const byName = new Map((existing || []).map((c) => [c.nombre, c.puntaje]));
  return (Array.isArray(config) ? config : []).map((c) => ({
    nombre: c.nombre,
    puntaje: clampScore(Number(byName.get(c.nombre) ?? 5)),
  }));
}

function calcScoreTotal(criterios: CriterioPuntaje[]) {
  if (!criterios.length) return 0;
  const sum = criterios.reduce((acc, c) => acc + (Number(c.puntaje) || 0), 0);
  return sum / criterios.length;
}

function buildPrintHtml(params: {
  nombreCompleto: string;
  area: string;
  sucursal: string;
  trimestre: string;
  nivel: string;
  scoreTotal: number;
  criterios: CriterioPuntaje[];
  observaciones?: string;
  objetivos?: string;
}) {
  const { nombreCompleto, area, sucursal, trimestre, nivel, scoreTotal, criterios, observaciones, objetivos } = params;
  const score = Math.round(scoreTotal * 10) / 10;
  const colors = getScoreColors(score);
  const rows = criterios
    .map((c) => {
      const width = Math.min(100, Math.max(0, (c.puntaje / 10) * 100));
      return `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:600;">${c.nombre}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;width:90px;">${c.puntaje}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;">
            <div style="height:8px;background:#f1f5f9;border-radius:999px;overflow:hidden;">
              <div style="height:8px;width:${width}%;background:${colors.hex};"></div>
            </div>
          </td>
        </tr>`;
    })
    .join('');

  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <title>Ficha de Feedback</title>
      <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 28px; color: #0f172a; }
        h1 { margin: 0 0 6px; font-size: 20px; }
        .muted { color:#64748b; font-size: 12px; }
        .row { display:flex; gap:12px; flex-wrap:wrap; margin-top: 10px; }
        .pill { display:inline-block; padding:4px 10px; border-radius:999px; background:#f1f5f9; font-size: 12px; font-weight: 700; }
        .score { background:${colors.hex}20; color:${colors.hex}; }
        table { width:100%; border-collapse:collapse; margin-top: 14px; }
        .box { background:#f8fafc; padding:12px; border-radius:12px; margin-top: 12px; white-space: pre-wrap; }
        footer { margin-top: 18px; font-size: 11px; color:#64748b; text-align:center; }
      </style>
    </head>
    <body>
      <h1>Ficha de Feedback</h1>
      <div class="muted">Confidencial · Uso interno</div>
      <div class="row">
        <span class="pill">${nombreCompleto}</span>
        <span class="pill">${area}</span>
        <span class="pill">${sucursal}</span>
        <span class="pill">${trimestre}</span>
        <span class="pill">${nivel}</span>
        <span class="pill score">${score}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0;">Criterio</th>
            <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #e2e8f0;">Puntaje</th>
            <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0;">Progreso</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <h2 style="margin:14px 0 6px;font-size:14px;">Observaciones del período</h2>
      <div class="box">${(observaciones || '—').replace(/</g, '&lt;')}</div>
      <h2 style="margin:14px 0 6px;font-size:14px;">Objetivos próximo trimestre</h2>
      <div class="box">${(objetivos || '—').replace(/</g, '&lt;')}</div>
      <footer>Confidencial · Uso interno</footer>
      <script>window.onload = () => window.print();</script>
    </body>
  </html>`;
}

function Tabs({
  activeTab,
  setActiveTab,
  tabBarHidden,
}: {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  /** Líderes Depósito por sucursal: solo ven pestaña Área; no mostrar conmutador. */
  tabBarHidden?: boolean;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'resumen', label: 'Resumen Ejecutivo' },
    { id: 'colaboradores', label: 'Área' },
    { id: 'ranking', label: 'Ranking' },
    { id: 'evolucion', label: 'Evolución' },
  ];

  if (tabBarHidden) return null;

  return (
    <div className="mb-4 flex border-b border-gray-200">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`px-4 py-2.5 text-sm font-medium ${
            activeTab === t.id ? 'border-b-2 border-blue-700 text-blue-700' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Modal({
  open,
  onClose,
  readOnly,
  isLeader,
  trimestre,
  nombreCompleto,
  area,
  sucursal,
  fotoUrl,
  hasEvaluacion,
  criteriosPorNivel,
  descripcionNivel,
  initialNivel,
  initialCriterios,
  initialObservaciones,
  initialObjetivos,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  readOnly: boolean;
  isLeader: boolean;
  trimestre: string;
  nombreCompleto: string;
  area: string;
  sucursal: string;
  fotoUrl?: string | null;
  hasEvaluacion: boolean;
  criteriosPorNivel: Partial<Record<Nivel, CriterioConfig[]>>;
  descripcionNivel: Partial<Record<Nivel, string>>;
  initialNivel: Nivel;
  initialCriterios: CriterioPuntaje[];
  initialObservaciones?: string;
  initialObjetivos?: string;
  onSave: (payload: { nivel: Nivel; criterios: CriterioPuntaje[]; observaciones?: string; objetivos?: string }) => void;
}) {
  const [nivel, setNivel] = useState<Nivel>(initialNivel);
  const [criterios, setCriterios] = useState<CriterioPuntaje[]>(initialCriterios);
  const [observaciones, setObservaciones] = useState(initialObservaciones || '');
  const [objetivos, setObjetivos] = useState(initialObjetivos || '');

  useEffect(() => {
    if (!open) return;
    setNivel(initialNivel);
    setCriterios(initialCriterios);
    setObservaciones(initialObservaciones || '');
    setObjetivos(initialObjetivos || '');
  }, [open, initialNivel, initialCriterios, initialObservaciones, initialObjetivos]);

  useEffect(() => {
    if (!open) return;
    const cfg = (isLeader ? criteriosPorNivel?.Sr : criteriosPorNivel?.[nivel]) || [];
    setCriterios((prev) => buildCriteriosFromConfig(cfg, prev));
  }, [open, isLeader, nivel, criteriosPorNivel]);

  const scoreTotal = useMemo(() => calcScoreTotal(criterios), [criterios]);
  const scoreColor = useMemo(() => getScoreColors(scoreTotal), [scoreTotal]);

  if (!open) return null;

  const safeCriteriosConfig = Array.isArray((isLeader ? criteriosPorNivel?.Sr : criteriosPorNivel?.[nivel]))
    ? ((isLeader ? criteriosPorNivel?.Sr : criteriosPorNivel?.[nivel]) as CriterioConfig[])
    : [];
  const configByName = new Map(safeCriteriosConfig.map((c) => [c.nombre, c.descripcion]));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-extrabold text-gray-900">{nombreCompleto}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {area} · {sucursal} · {trimestre}
            </p>
          </div>
          <button
            className="grid h-10 w-10 place-content-center rounded-full text-gray-500 hover:bg-gray-50"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-sm">
            <div className="flex items-center gap-4">
              {fotoUrl ? (
                <img src={fotoUrl} alt={nombreCompleto} className="h-12 w-12 rounded-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning text-sm font-extrabold text-black">
                  {initials(nombreCompleto)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{nombreCompleto}</p>
                <p className="mt-0.5 text-sm text-white/70">
                  {area} · {sucursal}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-white/70">{isLeader ? 'Perfil:' : 'Nivel:'}</span>
                  {isLeader ? (
                    <span className="group relative inline-flex">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-900">Líder</span>
                      {!!descripcionNivel.Sr && (
                        <span className="pointer-events-none absolute left-0 top-full z-[80] mt-2 hidden w-72 rounded-xl bg-white px-4 py-3 text-xs font-medium text-slate-900 shadow-xl ring-1 ring-black/10 group-hover:block">
                          {descripcionNivel.Sr}
                        </span>
                      )}
                    </span>
                  ) : (
                    (['Jr', 'Ssr', 'Sr'] as Nivel[]).map((n) => (
                      <span key={n} className="group relative inline-flex">
                        <button
                          disabled={readOnly}
                          onClick={() => setNivel(n)}
                          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                            nivel === n ? 'bg-white text-slate-900' : 'bg-white/10 text-white/80 hover:bg-white/15'
                          } ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          {n}
                        </button>
                        {!!descripcionNivel[n] && (
                          <span className="pointer-events-none absolute left-0 top-full z-[80] mt-2 hidden w-72 rounded-xl bg-white px-4 py-3 text-xs font-medium text-slate-900 shadow-xl ring-1 ring-black/10 group-hover:block">
                            {descripcionNivel[n]}
                          </span>
                        )}
                      </span>
                    ))
                  )}
                </div>
                {readOnly && <p className="mt-2 text-xs text-white/70">Trimestre pasado: modo solo lectura.</p>}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5 text-center">
            <p className="text-xs font-bold tracking-wide text-gray-400">SCORE TOTAL · {trimestre}</p>
            {!hasEvaluacion ? (
              <>
                <p className="mt-2 text-4xl font-extrabold text-gray-300">Sin evaluar</p>
                <p className="mt-1 text-sm text-gray-500">Completá los criterios para calcular el score</p>
              </>
            ) : (
              <div className="mt-2 flex flex-col items-center gap-2">
                <p className="text-4xl font-extrabold" style={{ color: scoreColor.hex }}>
                  {scoreTotal.toFixed(1)}
                </p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${scoreColor.bg} ${scoreColor.text}`}>{scoreColor.label}</span>
              </div>
            )}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-wide text-gray-400">CRITERIOS · {isLeader ? 'Líder' : nivel}</p>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${isLeader ? 'gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3' : 'gap-x-10 gap-y-5 md:grid-cols-2'}`}
            >
              {criterios.map((c) => {
                const desc = configByName.get(c.nombre);
                return (
                  <div key={c.nombre}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="group relative max-w-[75%]">
                        <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-900">
                          <span className={desc ? 'cursor-help underline decoration-dotted underline-offset-4' : ''}>
                            {c.nombre}
                          </span>
                        </p>
                        {!!desc && (
                          <div className="pointer-events-none absolute bottom-full left-0 z-[80] mb-2 hidden w-72 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl ring-1 ring-black/10 group-hover:block">
                            {desc}
                          </div>
                        )}
                      </div>
                      <span className="text-[13px] font-bold text-gray-700">{c.puntaje}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={c.puntaje}
                      disabled={readOnly}
                      onChange={(e) => {
                        const next = clampScore(Number(e.target.value));
                        setCriterios((prev) => prev.map((p) => (p.nombre === c.nombre ? { ...p, puntaje: next } : p)));
                      }}
                      className={`w-full ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-gray-400">
                  <span aria-hidden>📝</span> OBSERVACIONES DEL PERÍODO
                </p>
                <textarea
                  disabled={readOnly}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Describí el feedback del trimestre..."
                  className={`mt-2 h-28 w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:border-primary ${
                    readOnly ? 'cursor-not-allowed bg-gray-50 opacity-75' : ''
                  }`}
                />
              </div>
              <div>
                <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-gray-400">
                  <span aria-hidden>🎯</span> OBJETIVOS PRÓXIMO TRIMESTRE
                </p>
                <textarea
                  disabled={readOnly}
                  value={objetivos}
                  onChange={(e) => setObjetivos(e.target.value)}
                  placeholder="Objetivos acordados con el colaborador..."
                  className={`mt-2 h-28 w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:border-primary ${
                    readOnly ? 'cursor-not-allowed bg-gray-50 opacity-75' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-white p-4 md:px-5">
          <button className="btn btn-outline-dark" onClick={onClose}>Cancelar</button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={() => {
                const html = buildPrintHtml({
                  nombreCompleto,
                  area,
                  sucursal,
                  trimestre,
                  nivel,
                  scoreTotal,
                  criterios,
                  observaciones,
                  objetivos,
                });
                const w = window.open('', '_blank');
                if (!w) {
                  toast.error('No se pudo abrir la ventana de impresión (bloqueador de popups).');
                  return;
                }
                w.document.open();
                w.document.write(html);
                w.document.close();
              }}
            >
              🖨️ Imprimir
            </button>
            {!readOnly && (
              <button
                className="btn btn-warning"
                onClick={() => onSave({ nivel, criterios, observaciones: observaciones.trim() || undefined, objetivos: objetivos.trim() || undefined })}
              >
                💾 Guardar y sincronizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const PanelDesempeno = () => {
  const { user, empresaId, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const [loadingBase, setLoadingBase] = useState(true);
  const [criteriosPorNivel, setCriteriosPorNivel] = useState<Partial<Record<Nivel, CriterioConfig[]>>>({});
  const [descripcionNivel, setDescripcionNivel] = useState<Partial<Record<Nivel, string>>>({});
  const [trimestreActivo, setTrimestreActivo] = useState<string>('');
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState<string>('');

  const [resumenLoading, setResumenLoading] = useState(false);
  const [resumen, setResumen] = useState<any>(null);
  const [resumenSegLoading, setResumenSegLoading] = useState(false);
  const [resumenSeg, setResumenSeg] = useState<null | {
    leaders: {
      total: number;
      evaluados: number;
      scorePromedio: number | null;
      topPerformers: number;
      atencion: number;
    };
    operativos: {
      total: number;
      evaluados: number;
      scorePromedio: number | null;
      topPerformers: number;
      atencion: number;
    };
  }>(null);

  const [fArea, setFArea] = useState<string>('Todos');
  const [fSucursal, setFSucursal] = useState<string>('Todas');
  const [fNivel, setFNivel] = useState<string>('Todos');
  /** Ranking: operativos / líderes / mix (solo afecta pestaña Ranking). */
  const [rankingAudiencia, setRankingAudiencia] = useState<RankingAudiencia>('ambos');
  /** Filtro extra al listado Área (viene de KPIs en Segmentación del resumen). */
  const [colabDrillFilter, setColabDrillFilter] = useState<ColabDrillFilter | null>(null);
  const [q, setQ] = useState<string>('');

  const [colabsLoading, setColabsLoading] = useState(false);
  const [colabs, setColabs] = useState<any[]>([]);

  const [rankingLoading, setRankingLoading] = useState(false);
  const [ranking, setRanking] = useState<any[]>([]);

  const [evoLoading, setEvoLoading] = useState(false);
  const [evoGeneral, setEvoGeneral] = useState<{ trimestres: string[]; scores: number[] } | null>(null);
  const [evoPorArea, setEvoPorArea] = useState<{ trimestres: string[]; series: { area: string; data: number[] }[] } | null>(null);
  const [evoNiveles, setEvoNiveles] = useState<{ trimestres: string[]; Jr: number[]; Ssr: number[]; Sr: number[] } | null>(null);
  const [cambiosNivel, setCambiosNivel] = useState<any[]>([]);
  const [cambiosLoading, setCambiosLoading] = useState(false);
  const [fCambiosArea, setFCambiosArea] = useState<string>('Todas');
  const [fCambiosDir, setFCambiosDir] = useState<string>('all');
  const [allColabs, setAllColabs] = useState<any[]>([]);
  const [selectedComparisons, setSelectedComparisons] = useState<any[]>([]);
  const [evoIndividualSeries, setEvoIndividualSeries] = useState<{ categories: string[]; series: { name: string; data: number[] }[] } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedColab, setSelectedColab] = useState<any | null>(null);
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);

  const empresa = empresaId || localStorage.getItem('l_empresa_id') || 'default';
  const sessionColaboradorId = useMemo(() => parseSessionColaboradorId(user), [user]);
  const managerIds = useMemo(() => getManagerIdsForEmpresa(empresa), [empresa]);
  const managerAreas = useMemo(() => getManagerAreasForEmpresa(empresa), [empresa]);
  const depoSucursalLeaderIds = useMemo(
    () => getDepoSucursalLeaderIds(empresa),
    [empresa],
  );
  const depoCoordinatorIds = useMemo(() => getDepoCoordinatorIds(), []);
  const leaderColaboradorIds = useMemo(() => getLeaderColaboradorIds(), []);
  const isManager = managerIds.includes(sessionColaboradorId);
  const managerArea = managerAreas[sessionColaboradorId];
  const isGlobalManager = managerArea === 'GerenciaOP' || managerArea === 'Gerencia';

  const depoLeaderSucursal = getSucursalCodeForColaborador(sessionColaboradorId);
  const depoLeaderSucursalLabel = formatSucursalPanel(depoLeaderSucursal);
  const isDepoSucursalLeader = managerArea === 'Depósito' && !!depoLeaderSucursal && !isGlobalManager;

  useEffect(() => {
    if (isDepoSucursalLeader && activeTab !== 'colaboradores') {
      setActiveTab('colaboradores');
    }
  }, [isDepoSucursalLeader, activeTab]);

  const isLeaderProfile = useMemo(() => {
    return (colaboradorID: any) =>
      leaderColaboradorIds.has(String(colaboradorID));
  }, [leaderColaboradorIds]);

  const colabsFiltrados = useMemo(() => {
    if (!colabDrillFilter) return colabs;
    const { perfil, metric } = colabDrillFilter;
    let rows = colabs;
    if (perfil === 'operativo') rows = rows.filter((c) => !isLeaderProfile(c?.colaboradorID));
    else rows = rows.filter((c) => isLeaderProfile(c?.colaboradorID));
    if (metric === 'evaluados') {
      return rows.filter((c) => c?.evaluacion?.scoreTotal != null);
    }
    if (metric === 'todos') {
      return rows;
    }
    if (metric === 'top') {
      return rows.filter((c) => {
        const s = rowScoreTotal(c);
        return s != null && s >= 8;
      });
    }
    if (metric === 'atencion') {
      return rows.filter((c) => {
        const s = rowScoreTotal(c);
        return s != null && s < 6;
      });
    }
    return rows;
  }, [colabs, colabDrillFilter, isLeaderProfile]);

  const colabDrillSummary = useMemo(() => {
    if (!colabDrillFilter) return '';
    const seg = colabDrillFilter.perfil === 'operativo' ? 'Operativo' : 'Liderazgo';
    const lab =
      colabDrillFilter.metric === 'evaluados'
        ? 'con evaluación'
        : colabDrillFilter.metric === 'todos'
          ? 'todos'
          : colabDrillFilter.metric === 'top'
            ? 'top (≥ 8)'
            : 'atención (< 6)';
    return `${seg} · ${lab}`;
  }, [colabDrillFilter]);

  const openColabsFromSegmentacion = useCallback((perfil: 'operativo' | 'liderazgo', metric: ColabDrillFilter['metric']) => {
    setActiveTab('colaboradores');
    if (isGlobalManager) {
      setFArea('Todos');
      setFSucursal('Todas');
    }
    setFNivel(perfil === 'liderazgo' ? 'Líder' : 'Todos');
    setQ('');
    setColabDrillFilter({ perfil, metric });
  }, [isGlobalManager]);

  const filterLeaderProfiles = useMemo(() => {
    return (rows: any[]) => {
      const list = Array.isArray(rows) ? rows : [];
      const withoutExcluded = list.filter((c) => !EXCLUDED_AREAS.has(String(c?.area || '').trim()));
      if (isGlobalManager) return list;
      return withoutExcluded.filter((c) => {
        const colabId = rowColaboradorId(c);
        if (
          canDepoCoordinatorViewSucursalLeader(sessionColaboradorId, colabId)
        ) {
          return true;
        }
        return !isLeaderProfile(colabId);
      });
    };
  }, [isGlobalManager, isLeaderProfile, sessionColaboradorId]);

  const filterExcludedAreas = useMemo(() => {
    return (rows: any[]) => {
      const list = Array.isArray(rows) ? rows : [];
      return list.filter((c) => !EXCLUDED_AREAS.has(String(c?.area || '').trim()));
    };
  }, []);

  const applyNivelFilter = useMemo(() => {
    return (rows: any[]) => {
      const list = Array.isArray(rows) ? rows : [];
      if (fNivel === 'Líder') return list.filter((c) => isLeaderProfile(c?.colaboradorID));
      /** Jr/Ssr/Sr: solo operativos; los líderes van aparte (pestaña/filtro Líder). */
      if (fNivel === 'Jr' || fNivel === 'Ssr' || fNivel === 'Sr') {
        return list.filter((c) => !isLeaderProfile(c?.colaboradorID));
      }
      return list;
    };
  }, [fNivel, isLeaderProfile]);

  const applyRankingAudiencia = useMemo(() => {
    return (rows: any[]) => {
      const list = Array.isArray(rows) ? rows : [];
      if (rankingAudiencia === 'colab') return list.filter((c) => !isLeaderProfile(c?.colaboradorID));
      if (rankingAudiencia === 'lideres') return list.filter((c) => isLeaderProfile(c?.colaboradorID));
      return list;
    };
  }, [rankingAudiencia, isLeaderProfile]);

  /** Ranking: bloques Sr → Ssr → Jr, y dentro de cada bloque por score (desc). Líderes al final. */
  const sortRankingBySenioridad = useMemo(() => {
    const scoreOf = (c: any) => Number(c?.evaluacion?.scoreTotal ?? c?.scoreTotal ?? 0) || 0;
    const nivelOrder = (c: any) => {
      if (isLeaderProfile(c?.colaboradorID)) return 3;
      const n = String(c?.nivel ?? '').trim();
      if (n === 'Sr') return 0;
      if (n === 'Ssr') return 1;
      if (n === 'Jr') return 2;
      const up = n.toUpperCase();
      if (up === 'SR') return 0;
      if (up === 'SSR') return 1;
      if (up === 'JR') return 2;
      return 3;
    };
    return (rows: any[]) =>
      [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
        const da = nivelOrder(a);
        const db = nivelOrder(b);
        if (da !== db) return da - db;
        return scoreOf(b) - scoreOf(a);
      });
  }, [isLeaderProfile]);

  /** Posición 0-based dentro del bloque de senioridad (para 🥇🥈🥉 por nivel). */
  const rankingMedalPosInBucket = useMemo(() => {
    const map = new Map<string, number>();
    const nextByBucket = new Map<string, number>();
    for (const c of ranking) {
      const id = rowColaboradorId(c);
      if (!id) continue;
      const b = nivelBucketKeyForRankingMedal(c, isLeaderProfile(c?.colaboradorID));
      const pos = nextByBucket.get(b) ?? 0;
      map.set(id, pos);
      nextByBucket.set(b, pos + 1);
    }
    return map;
  }, [ranking, isLeaderProfile]);

  const allowedAreas = useMemo(() => {
    const all = getAreasForEmpresa(empresa);
    const filtered = all.filter((a) => !EXCLUDED_AREAS.has(String(a || '').trim()));
    if (isGlobalManager) return all;
    if (managerArea) return filtered.filter((a) => a === managerArea);
    return filtered;
  }, [empresa, isGlobalManager, managerArea]);

  const isPublicDesempeno = (() => {
    try {
      return typeof window !== 'undefined' && window.location?.pathname?.includes('/desempeno');
    } catch {
      return false;
    }
  })();

  const canAccess = isPublicDesempeno ? true : hasPermission(Route.PanelDesempeno);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingBase(true);
        if (!alive) return;
        setCriteriosPorNivel(CRITERIOS_POR_NIVEL);
        setDescripcionNivel(DESCRIPCION_NIVEL);
        const t = getTrimestreActivoFromDate(new Date());
        setTrimestreActivo(t);
        setTrimestreSeleccionado(t);
      } catch (e: any) {
        toast.error(e?.message || 'No se pudo inicializar el panel');
      } finally {
        if (!alive) return;
        setLoadingBase(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isReadOnlyTrimestre = useMemo(() => !!trimestreActivo && !!trimestreSeleccionado && trimestreSeleccionado !== trimestreActivo, [trimestreActivo, trimestreSeleccionado]);
  /** Modal con pack "Líder" (Gerencia). El 150 usa criterios Jr/Ssr/Sr al evaluar líderes de sucursal Depósito (mismo contrato que el backend). */
  const isLeaderEvalInModal = useMemo(() => {
    if (!selectedColab) return false;
    if (!isLeaderProfile(selectedColab.colaboradorID)) return false;
    if (
      depoCoordinatorIds.has(sessionColaboradorId) &&
      depoSucursalLeaderIds.has(String(selectedColab.colaboradorID))
    ) {
      return false;
    }
    return true;
  }, [selectedColab, isLeaderProfile, sessionColaboradorId, depoCoordinatorIds, depoSucursalLeaderIds]);

  const criteriosPorNivelModal = useMemo(() => {
    if (!isLeaderEvalInModal) return criteriosPorNivel;
    return { Jr: CRITERIOS_LIDER, Ssr: CRITERIOS_LIDER, Sr: CRITERIOS_LIDER } as Partial<Record<Nivel, CriterioConfig[]>>;
  }, [criteriosPorNivel, isLeaderEvalInModal]);

  const descripcionNivelModal = useMemo(() => {
    if (!isLeaderEvalInModal) return descripcionNivel;
    return { Jr: DESCRIPCION_LIDER, Ssr: DESCRIPCION_LIDER, Sr: DESCRIPCION_LIDER } as Partial<Record<Nivel, string>>;
  }, [descripcionNivel, isLeaderEvalInModal]);

  useEffect(() => {
    if (!canAccess || !trimestreSeleccionado) return;
    if (isDepoSucursalLeader) return;
    let alive = true;
    (async () => {
      try {
        setResumenLoading(true);
        const resp = await desempenoService.getResumen(trimestreSeleccionado);
        if (!alive) return;
        setResumen(resp.data?.data ?? null);
      } catch (e: any) {
        toast.error(e?.message || 'No se pudo cargar el resumen');
        if (!alive) return;
        setResumen(null);
      } finally {
        if (!alive) return;
        setResumenLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [canAccess, trimestreSeleccionado, isDepoSucursalLeader]);

  const calcSegment = useMemo(() => {
    return (rows: any[]) => {
      const list = Array.isArray(rows) ? rows : [];
      const total = list.length;
      const evaluadosRows = list.filter((c) => c?.evaluacion?.scoreTotal != null);
      const evaluados = evaluadosRows.length;
      const scores = evaluadosRows.map((c) => Number(c.evaluacion.scoreTotal) || 0);
      const scorePromedio = evaluados ? Number((scores.reduce((a, b) => a + b, 0) / evaluados).toFixed(1)) : null;
      const topPerformers = evaluadosRows.filter((c) => Number(c.evaluacion.scoreTotal) >= 8).length;
      const atencion = evaluadosRows.filter((c) => Number(c.evaluacion.scoreTotal) < 6).length;
      return { total, evaluados, scorePromedio, topPerformers, atencion };
    };
  }, []);

  useEffect(() => {
    if (!canAccess || !trimestreSeleccionado) return;
    // Solo segmentamos líderes vs operativos cuando la vista es global.
    if (!isGlobalManager) {
      setResumenSeg(null);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setResumenSegLoading(true);
        const resp = await desempenoService.getColaboradores({ trimestre: trimestreSeleccionado } as any);
        if (resp.data?.ok === 0) throw new Error(resp.data?.message || 'No autorizado');
        if (!alive) return;
        const rows = resp.data?.data || [];
        const leaders = rows.filter((c: any) => isLeaderProfile(c?.colaboradorID));
        const operativos = rows.filter((c: any) => !isLeaderProfile(c?.colaboradorID));
        setResumenSeg({
          leaders: calcSegment(leaders),
          operativos: calcSegment(operativos),
        });
      } catch {
        if (!alive) return;
        setResumenSeg(null);
      } finally {
        if (!alive) return;
        setResumenSegLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [canAccess, trimestreSeleccionado, isGlobalManager, isLeaderProfile, calcSegment]);

  const sucursalesDisponibles = useMemo(() => {
    const list = Array.from(new Set(colabs.map((c) => String(c.sucursal || '').trim()).filter(Boolean)));
    return list.sort((a, b) => a.localeCompare(b));
  }, [colabs]);

  useEffect(() => {
    if (!canAccess) return;
    if (activeTab !== 'colaboradores') return;
    let alive = true;
    (async () => {
      try {
        setColabsLoading(true);
        const params: any = {};
        if (isDepoSucursalLeader) {
          params.area = 'Depósito';
          params.sucursal = depoLeaderSucursal;
        } else {
          if (!isGlobalManager && managerArea) params.area = managerArea;
          if (isGlobalManager && fArea !== 'Todos') params.area = fArea;
          if (fSucursal !== 'Todas') params.sucursal = fSucursal;
        }
        if (fNivel !== 'Todos' && fNivel !== 'Líder') params.nivel = fNivel;
        if (q.trim()) params.q = q.trim();
        params.trimestre = trimestreSeleccionado || trimestreActivo;

        const resp = await desempenoService.getColaboradores(params);
        if (resp.data?.ok === 0) throw new Error(resp.data?.message || 'No autorizado');
        if (!alive) return;
        setColabs(applyNivelFilter(filterLeaderProfiles(filterExcludedAreas(resp.data?.data || []))));
      } catch (e: any) {
        toast.error(e?.message || 'No se pudo cargar colaboradores');
        if (!alive) return;
        setColabs([]);
      } finally {
        if (!alive) return;
        setColabsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeTab, canAccess, fArea, fSucursal, fNivel, isGlobalManager, isDepoSucursalLeader, managerArea, depoLeaderSucursal, q]);

  useEffect(() => {
    if (!canAccess) return;
    if (activeTab !== 'ranking') return;
    if (!trimestreSeleccionado) return;
    let alive = true;
    (async () => {
      try {
        setRankingLoading(true);
        const params: any = {};
        if (!isGlobalManager && managerArea) params.area = managerArea;
        if (isGlobalManager && fArea !== 'Todos') params.area = fArea;
        if (fSucursal !== 'Todas') params.sucursal = fSucursal;
        if (fNivel !== 'Todos' && fNivel !== 'Líder') params.nivel = fNivel;
        const resp = await desempenoService.getRanking(trimestreSeleccionado, params);
        if (resp.data?.ok === 0) throw new Error(resp.data?.message || 'No autorizado');
        if (!alive) return;
        setRanking(
          sortRankingBySenioridad(
            applyRankingAudiencia(applyNivelFilter(filterLeaderProfiles(filterExcludedAreas(resp.data?.data || [])))),
          ),
        );
      } catch (e: any) {
        toast.error(e?.message || 'No se pudo cargar ranking');
        if (!alive) return;
        setRanking([]);
      } finally {
        if (!alive) return;
        setRankingLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [
    activeTab,
    canAccess,
    fArea,
    fSucursal,
    fNivel,
    isGlobalManager,
    managerArea,
    trimestreSeleccionado,
    sortRankingBySenioridad,
    applyNivelFilter,
    applyRankingAudiencia,
    filterLeaderProfiles,
    filterExcludedAreas,
  ]);

  useEffect(() => {
    if (!canAccess) return;
    if (activeTab !== 'evolucion') return;
    let alive = true;
    (async () => {
      try {
        setEvoLoading(true);
        const [g, a, n] = await Promise.all([
          desempenoService.getEvolucionGeneral(),
          desempenoService.getEvolucionPorArea(),
          desempenoService.getEvolucionNiveles(),
        ]);
        if (!alive) return;
        const gRows = Array.isArray(g.data?.data) ? g.data.data : [];
        const gTris = gRows.map((r: any) => String(r.trimestre));
        const gScores = gRows.map((r: any) => Number(r.scorePromedio) || 0);
        setEvoGeneral({ trimestres: gTris, scores: gScores });

        const aRows = Array.isArray(a.data?.data) ? a.data.data : [];
        const aTris = Array.from(new Set(aRows.map((r: any) => String(r.trimestre)))).sort();
        const areas = Array.from(new Set(aRows.map((r: any) => String(r.area)))).sort();
        const series = areas.map((area: string) => ({
          area,
          data: aTris.map((t) => {
            const row = aRows.find((r: any) => String(r.trimestre) === t && String(r.area) === area);
            return row ? Number(row.scorePromedio) || 0 : 0;
          }),
        }));
        setEvoPorArea({ trimestres: aTris, series });

        const nRows = Array.isArray(n.data?.data) ? n.data.data : [];
        const nTris = Array.from(new Set(nRows.map((r: any) => String(r.trimestre)))).sort();
        const jr = nTris.map((t) => Number(nRows.find((r: any) => String(r.trimestre) === t && r.nivel === 'Jr')?.cantidad) || 0);
        const ssr = nTris.map((t) => Number(nRows.find((r: any) => String(r.trimestre) === t && r.nivel === 'Ssr')?.cantidad) || 0);
        const sr = nTris.map((t) => Number(nRows.find((r: any) => String(r.trimestre) === t && r.nivel === 'Sr')?.cantidad) || 0);
        setEvoNiveles({ trimestres: nTris, Jr: jr, Ssr: ssr, Sr: sr });
      } catch (e: any) {
        toast.error(e?.message || 'No se pudo cargar evolución');
        if (!alive) return;
        setEvoGeneral(null);
        setEvoPorArea(null);
        setEvoNiveles(null);
      } finally {
        if (!alive) return;
        setEvoLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeTab, canAccess]);

  useEffect(() => {
    if (!canAccess) return;
    if (activeTab !== 'evolucion') return;
    let alive = true;
    (async () => {
      try {
        setCambiosLoading(true);
        const params: any = {};
        if (fCambiosArea !== 'Todas') params.area = fCambiosArea;
        if (fCambiosDir !== 'all') params.direccion = fCambiosDir;
        const resp = await desempenoService.getCambiosNivel(params);
        if (resp.data?.ok === 0) throw new Error(resp.data?.message || 'No autorizado');
        if (!alive) return;
        setCambiosNivel(resp.data?.data || []);
      } catch (e: any) {
        toast.error((e as any)?.message || 'No se pudo cargar cambios de nivel');
        if (!alive) return;
        setCambiosNivel([]);
      } finally {
        if (!alive) return;
        setCambiosLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeTab, canAccess, fCambiosArea, fCambiosDir]);

  useEffect(() => {
    if (!canAccess) return;
    if (activeTab !== 'evolucion') return;
    let alive = true;
    (async () => {
      try {
        const params: any = {};
        if (!isGlobalManager && managerArea) params.area = managerArea;
        const resp = await desempenoService.getColaboradores(params);
        if (resp.data?.ok === 0) throw new Error(resp.data?.message || 'No autorizado');
        if (!alive) return;
        setAllColabs(filterLeaderProfiles(filterExcludedAreas(resp.data?.data || [])));
      } catch (e: any) {
        toast.error(e?.message || 'No se pudo cargar colaboradores para evolución');
        if (!alive) return;
        setAllColabs([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeTab, canAccess, isGlobalManager, managerArea]);

  useEffect(() => {
    if (!canAccess) return;
    if (activeTab !== 'evolucion') return;
    let alive = true;
    (async () => {
      try {
        if (!selectedComparisons.length) {
          setEvoIndividualSeries(null);
          return;
        }
        const ids = selectedComparisons.slice(0, 6).map((c) => Number(c.colaboradorID));
        const responses = await Promise.all(ids.map((id) => desempenoService.getEvolucionIndividual(id)));
        if (!alive) return;
        const rowsById = responses.map((r) => (Array.isArray(r.data?.data) ? r.data.data : []));
        const categories = Array.from(new Set(rowsById.flatMap((rows: any[]) => rows.map((x: any) => String(x.trimestre))))).sort();
        const series = rowsById.map((rows: any[], idx) => {
          const c = selectedComparisons[idx];
          const name = `${c.nombre} ${c.apellido}`.trim();
          const data = categories.map((t) => {
            const row = rows.find((x: any) => String(x.trimestre) === t);
            return row ? Number(row.scoreTotal) || 0 : 0;
          });
          return { name, data };
        });
        setEvoIndividualSeries({ categories, series });
      } catch {
        if (!alive) return;
        setEvoIndividualSeries(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeTab, canAccess, selectedComparisons]);

  const openEvaluacion = async (colab: any, opts?: { readOnly?: boolean }) => {
    try {
      const colabId = String(colab?.colaboradorID ?? '');
      const depo150puedeAbrirLiderSucursal =
        canDepoCoordinatorViewSucursalLeader(sessionColaboradorId, colabId);
      if (!isGlobalManager && isLeaderProfile(colab?.colaboradorID) && !depo150puedeAbrirLiderSucursal) {
        toast.error('Solo Gerencia puede ver perfiles de líderes.');
        return;
      }
      setForceReadOnly(!!opts?.readOnly);
      setSelectedColab(colab);
      setSelectedEval(null);
      setModalOpen(true);
      setModalLoading(true);
      const resp = await desempenoService.getEvaluacion(Number(colab.colaboradorID), trimestreSeleccionado || trimestreActivo);
      setSelectedEval(resp.data?.data ?? null);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo cargar la evaluación');
      setSelectedEval(null);
    } finally {
      setModalLoading(false);
    }
  };

  const defaultCriterios = useMemo(() => {
    return (nivel: Nivel, existing?: CriterioPuntaje[]) => buildCriteriosFromConfig(criteriosPorNivel[nivel] || [], existing);
  }, [criteriosPorNivel]);

  if (!canAccess) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          No tenés permisos para ver el Panel de Feedback.
        </div>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-800">
          Este panel es solo para managers. Si necesitás acceso, hablá con alguien que sí tenga permisos (o con IT, si disfrutan el sufrimiento).
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Panel Feedback</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isGlobalManager ? 'Vista global (Gerencia)' : managerArea ? `Área: ${managerArea}` : 'Vista por áreas'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">Activo: {trimestreActivo || '—'}</span>
          <select
            className="form-select w-[160px] text-sm"
            value={trimestreSeleccionado}
            onChange={(e) => setTrimestreSeleccionado(e.target.value)}
            disabled={loadingBase || !trimestreActivo}
            title="Selector de trimestre (por ahora: activo)."
          >
            <option value={trimestreActivo}>{trimestreActivo || '—'}</option>
          </select>
        </div>
      </div>

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabBarHidden={isDepoSucursalLeader} />

      {activeTab === 'resumen' && (
        <div className="space-y-4">
          {(loadingBase || resumenLoading) && (
            <div className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">Cargando resumen…</div>
          )}

          {!loadingBase && !resumenLoading && resumen && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: 'Total colaboradores', value: resumen.totalColaboradores },
                  { label: 'Evaluados', value: resumen.evaluados },
                  { label: 'Score promedio', value: resumen.scorePromedio == null ? '—' : Number(resumen.scorePromedio).toFixed(1) },
                  { label: 'Top performers (≥ 8)', value: kpiValue(resumen.topPerformers) },
                  { label: 'Bajo score (< 6)', value: kpiValue(resumen.atencion) },
                  { label: 'Áreas / sucursales', value: resumen.areas != null && resumen.sucursales != null ? `${resumen.areas} / ${resumen.sucursales}` : '—' },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500">{k.label}</p>
                    <p className="mt-1 text-2xl font-extrabold text-gray-900">{k.value}</p>
                  </div>
                ))}
              </div>

              {isGlobalManager && (
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-gray-900">Segmentación</h2>
                    <p className="text-xs text-gray-500">Operativo vs Liderazgo. Tocá un indicador para ver esas personas en Área.</p>
                  </div>

                  {resumenSegLoading ? (
                    <div className="text-sm text-gray-500">Calculando…</div>
                  ) : !resumenSeg ? (
                    <div className="text-sm text-gray-500">Sin datos para segmentar.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[
                        { title: 'Operativo', data: resumenSeg.operativos, tone: 'bg-sky-50 text-sky-700' },
                        { title: 'Liderazgo', data: resumenSeg.leaders, tone: 'bg-slate-900 text-white' },
                      ].map((seg) => (
                        <div key={seg.title} className="rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-extrabold text-gray-900">{seg.title}</p>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${seg.tone}`}>
                              {seg.data.total} personas
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <button
                              type="button"
                              className="rounded-lg bg-gray-50 p-3 text-left transition hover:bg-sky-50 hover:ring-2 hover:ring-sky-300/60"
                              onClick={() => openColabsFromSegmentacion(seg.title === 'Operativo' ? 'operativo' : 'liderazgo', 'evaluados')}
                              title="Ver lista en Área"
                            >
                              <p className="text-[11px] font-bold tracking-wide text-gray-400">EVALUADOS</p>
                              <p className="mt-1 text-lg font-extrabold text-gray-900">{seg.data.evaluados}</p>
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-gray-50 p-3 text-left transition hover:bg-sky-50 hover:ring-2 hover:ring-sky-300/60"
                              onClick={() => openColabsFromSegmentacion(seg.title === 'Operativo' ? 'operativo' : 'liderazgo', 'todos')}
                              title="Ver todos en el segmento (Área)"
                            >
                              <p className="text-[11px] font-bold tracking-wide text-gray-400">SCORE PROM.</p>
                              <p className="mt-1 text-lg font-extrabold text-gray-900">
                                {seg.data.scorePromedio == null ? '—' : seg.data.scorePromedio.toFixed(1)}
                              </p>
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-gray-50 p-3 text-left transition hover:bg-sky-50 hover:ring-2 hover:ring-sky-300/60"
                              onClick={() => openColabsFromSegmentacion(seg.title === 'Operativo' ? 'operativo' : 'liderazgo', 'top')}
                              title="Ver con score ≥ 8 en Área"
                            >
                              <p className="text-[11px] font-bold tracking-wide text-gray-400">TOP (≥ 8)</p>
                              <p className="mt-1 text-lg font-extrabold text-gray-900">{seg.data.topPerformers}</p>
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-gray-50 p-3 text-left transition hover:bg-sky-50 hover:ring-2 hover:ring-sky-300/60"
                              onClick={() => openColabsFromSegmentacion(seg.title === 'Operativo' ? 'operativo' : 'liderazgo', 'atencion')}
                              title="Ver colaboradores con score menor a 6 (Área)"
                            >
                              <p className="text-[11px] font-bold tracking-wide text-gray-400">ATENCIÓN (&lt; 6)</p>
                              <p className="mt-1 text-lg font-extrabold text-gray-900">{seg.data.atencion}</p>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-gray-900">Por área</h2>
                  <p className="text-xs text-gray-500">Click en un área para ir a Colaboradores filtrado.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(resumen.porArea || []).filter((a: any) => !EXCLUDED_AREAS.has(String(a?.area || '').trim())).map((a: any) => (
                    <button
                      key={a.area}
                      className="rounded-xl border border-gray-100 p-4 text-left hover:border-sky-200 hover:bg-sky-50/30"
                      onClick={() => {
                        setActiveTab('colaboradores');
                        setColabDrillFilter(null);
                        if (isGlobalManager) setFArea(a.area);
                      }}
                      disabled={!isGlobalManager}
                      title={!isGlobalManager ? 'Ya estás limitado a tu área.' : ''}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-gray-900">{a.area}</p>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                          {a.scorePromedio == null ? '—' : Number(a.scorePromedio).toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {a.totalPersonas != null || a.evaluados != null
                          ? `Personas: ${a.totalPersonas ?? '—'} · Evaluados: ${a.evaluados ?? '—'}`
                          : `Evaluados: ${a.cantidad ?? '—'}`}
                      </p>
                      {a.distribucion && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">Jr {a.distribucion?.Jr ?? 0}</span>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">Ssr {a.distribucion?.Ssr ?? 0}</span>
                          <span className="rounded-full bg-purple-50 px-2.5 py-1 font-semibold text-purple-700">Sr {a.distribucion?.Sr ?? 0}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'colaboradores' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {colabDrillFilter && (
                  <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs text-indigo-900 md:w-auto">
                    <span className="font-semibold">Filtro resumen: {colabDrillSummary}</span>
                    <button
                      type="button"
                      className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-800 shadow-sm hover:bg-indigo-100"
                      onClick={() => setColabDrillFilter(null)}
                    >
                      Quitar
                    </button>
                  </div>
                )}
                <span className="text-xs font-semibold text-gray-500">Área</span>
                <div className="flex flex-wrap gap-2">
                  {isGlobalManager ? (
                    <>
                      <button
                        className={`rounded-full px-3 py-1 text-xs font-bold ${fArea === 'Todos' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => {
                          setFArea('Todos');
                          setColabDrillFilter(null);
                        }}
                      >
                        Todos
                      </button>
                      {allowedAreas.map((a) => (
                        <button
                          key={a}
                          className={`rounded-full px-3 py-1 text-xs font-bold ${fArea === a ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                          onClick={() => {
                            setFArea(a);
                            setColabDrillFilter(null);
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{managerArea || '—'}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="form-input w-full text-sm md:w-[220px]"
                  placeholder="Buscar por nombre…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  className="form-select text-sm"
                  value={fNivel}
                  onChange={(e) => {
                    setFNivel(e.target.value);
                    setColabDrillFilter(null);
                  }}
                >
                  <option value="Todos">Todos</option>
                  <option value="Jr">Jr</option>
                  <option value="Ssr">Ssr</option>
                  <option value="Sr">Sr</option>
                  {isGlobalManager && <option value="Líder">Líder</option>}
                </select>
                <select
                  className="form-select text-sm"
                  value={isDepoSucursalLeader ? depoLeaderSucursal : fSucursal}
                  onChange={(e) => {
                    setFSucursal(e.target.value);
                    setColabDrillFilter(null);
                  }}
                  disabled={isDepoSucursalLeader}
                  title={isDepoSucursalLeader ? `Sucursal fija: ${depoLeaderSucursalLabel}` : ''}
                >
                  {!isDepoSucursalLeader && <option value="Todas">Todas</option>}
                  {(isDepoSucursalLeader ? [depoLeaderSucursal] : sucursalesDisponibles).map((s) => (
                    <option key={s} value={s}>
                      {formatSucursalPanel(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            {colabsLoading ? (
              <div className="p-6 text-sm text-gray-500">Cargando colaboradores…</div>
            ) : !colabs.length ? (
              <div className="p-6 text-sm text-gray-600">Sin resultados.</div>
            ) : !colabsFiltrados.length ? (
              <div className="p-6 text-sm text-gray-600">
                <p>Nadie coincide con el filtro del resumen.</p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary mt-3"
                  onClick={() => setColabDrillFilter(null)}
                >
                  Quitar filtro del resumen
                </button>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-[900px] w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-600">
                      <th className="p-3">Colaborador</th>
                      <th className="p-3">Área</th>
                      <th className="p-3">Sucursal</th>
                      <th className="p-3">Nivel</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {colabsFiltrados.map((c) => {
                      const nombre = `${c.nombre} ${c.apellido}`.trim();
                      const score = c.evaluacion?.scoreTotal ?? null;
                      const colors = score == null ? null : getScoreColors(score);
                      const isLeader = isLeaderProfile(c.colaboradorID);
                      const depoSucursal = getSucursalCodeForColaborador(
                        String(c.colaboradorID),
                      );
                      const nivelLabel = isLeader ? (depoSucursal ? `Lider Depo ${formatSucursalPanel(depoSucursal)}` : getLeaderLabelByArea(c.area)) : c.nivel;
                      const nivelBadge = isLeader ? 'bg-slate-900 text-white' : getNivelBadge(c.nivel);
                      return (
                        <tr key={c.colaboradorID} className="border-b border-gray-100 text-sm hover:bg-gray-50/60">
                          <td className="p-3 font-semibold text-gray-900">
                            <button
                              type="button"
                              className="text-left hover:underline"
                              onClick={() => openEvaluacion(c, { readOnly: true })}
                              title="Ver evaluación (solo lectura)"
                            >
                              {nombre}
                            </button>
                          </td>
                          <td className="p-3 text-gray-700">{c.area}</td>
                          <td className="p-3 text-gray-700">{formatSucursalPanel(c.sucursal)}</td>
                          <td className="p-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${nivelBadge}`}>{nivelLabel}</span>
                          </td>
                          <td className="p-3">{score == null ? '—' : score.toFixed(1)}</td>
                          <td className="p-3">
                            {score == null ? (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">Sin eval</span>
                            ) : (
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors?.bg} ${colors?.text}`}>{colors?.label}</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => openEvaluacion(c, { readOnly: false })}>
                              {score == null ? 'Evaluar →' : 'Editar →'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ranking' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <span className="text-xs font-semibold text-gray-500">Ranking</span>
            <select
              className="form-select text-sm"
              value={rankingAudiencia}
              onChange={(e) => setRankingAudiencia(e.target.value as RankingAudiencia)}
              title="Quiénes entran en el ranking"
            >
              <option value="colab">Colaboradores</option>
              <option value="lideres">Líderes</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          {rankingLoading ? (
            <div className="p-6 text-sm text-gray-500">Cargando ranking…</div>
          ) : !ranking.length ? (
            <div className="p-6 text-sm text-gray-600">Sin datos.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {ranking.map((c) => {
                const nombre = `${c.nombre} ${c.apellido}`.trim();
                const rawScore = c.evaluacion?.scoreTotal ?? c.scoreTotal ?? 0;
                const score = Number(rawScore) || 0;
                const colors = getScoreColors(score);
                const posEnBucket = rankingMedalPosInBucket.get(rowColaboradorId(c)) ?? 0;
                const medal =
                  posEnBucket === 0 ? '🥇' : posEnBucket === 1 ? '🥈' : posEnBucket === 2 ? '🥉' : `${posEnBucket + 1}.`;
                const nivelLabel = isLeaderProfile(c.colaboradorID) ? getLeaderLabelByArea(c.area) : c.nivel;
                return (
                  <button
                    key={c.colaboradorID}
                    className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50"
                    onClick={() => openEvaluacion(c, { readOnly: false })}
                  >
                    <span className="w-9 text-center text-sm font-bold text-gray-700">{medal}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                      {initials(nombre)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{nombre}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {c.area} · {formatSucursalPanel(c.sucursal)} · {nivelLabel}
                      </p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (score / 10) * 100))}%`, background: colors.hex }} />
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors.bg} ${colors.text}`}>{score.toFixed(1)}</span>
                  </button>
                );
              })}
            </div>
          )}
          </div>
        </div>
      )}

      {activeTab === 'evolucion' && (
        <div className="space-y-4">
          {evoLoading && <div className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">Cargando evolución…</div>}

          {!evoLoading && (
            <div className="space-y-4">
              <div className="mb-1">
                <p className="text-lg font-extrabold text-gray-900">Evolución trimestral</p>
                <p className="mt-1 text-sm text-gray-500">Feedback y cambios de nivel a lo largo del tiempo.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Score promedio general</p>
                {evoGeneral ? (
                  <ReactApexChart
                    type="line"
                    height={250}
                    options={{
                      chart: { toolbar: { show: false } },
                      stroke: { curve: 'smooth', width: 2.5 },
                      xaxis: { categories: evoGeneral.trimestres },
                      yaxis: { min: 0, max: 10 },
                      colors: [CHART_COLORS[0]],
                    }}
                    series={[{ name: 'Score', data: evoGeneral.scores }]}
                  />
                ) : (
                  <div className="mt-3 text-sm text-gray-600">Sin datos.</div>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Comparativa por área</p>
                {evoPorArea ? (
                  <ReactApexChart
                    type="line"
                    height={250}
                    options={{
                      chart: { toolbar: { show: false } },
                      stroke: { curve: 'smooth', width: 2.5 },
                      xaxis: { categories: Array.isArray(evoPorArea.trimestres) ? evoPorArea.trimestres : [] },
                      yaxis: { min: 0, max: 10 },
                      colors: CHART_COLORS,
                    }}
                    series={(Array.isArray(evoPorArea.series) ? evoPorArea.series : []).map((s, i) => ({
                      name: s.area,
                      data: Array.isArray(s.data) ? s.data : [],
                      color: CHART_COLORS[i % CHART_COLORS.length],
                    }))}
                  />
                ) : (
                  <div className="mt-3 text-sm text-gray-600">Sin datos.</div>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Distribución de niveles</p>
                {evoNiveles ? (
                  <ReactApexChart
                    type="bar"
                    height={250}
                    options={{
                      chart: { stacked: true, toolbar: { show: false } },
                      xaxis: { categories: evoNiveles.trimestres },
                      yaxis: { min: 0 },
                      colors: ['#3b82f6', '#f59e0b', '#8b5cf6'],
                      plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
                    }}
                    series={[
                      { name: 'Jr', data: evoNiveles.Jr },
                      { name: 'Ssr', data: evoNiveles.Ssr },
                      { name: 'Sr', data: evoNiveles.Sr },
                    ]}
                  />
                ) : (
                  <div className="mt-3 text-sm text-gray-600">Sin datos.</div>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-2">
                <p className="text-sm font-semibold text-gray-900">Evolución individual</p>
                <p className="mt-1 text-xs text-gray-500">Seleccioná colaboradores para comparar su trayectoria (hasta 6).</p>

                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                  <select
                    className="form-select text-sm md:w-[320px]"
                    value=""
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (!id) return;
                      const c = allColabs.find((x) => Number(x.colaboradorID) === id);
                      if (!c) return;
                      setSelectedComparisons((prev) => {
                        if (prev.some((p) => Number(p.colaboradorID) === id)) return prev;
                        if (prev.length >= 6) return prev;
                        return [...prev, c];
                      });
                    }}
                  >
                    <option value="">Agregar colaborador…</option>
                    {allColabs.map((c) => (
                      <option key={c.colaboradorID} value={c.colaboradorID}>
                        {`${c.apellido} ${c.nombre}`.trim()} · {c.area} · {formatSucursalPanel(c.sucursal)}
                      </option>
                    ))}
                  </select>

                  <button className="btn btn-outline-dark btn-sm md:ml-auto" onClick={() => setSelectedComparisons([])} disabled={!selectedComparisons.length}>
                    Limpiar
                  </button>
                </div>

                {!!selectedComparisons.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedComparisons.map((c) => (
                      <button
                        key={c.colaboradorID}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-200"
                        onClick={() => setSelectedComparisons((prev) => prev.filter((p) => p.colaboradorID !== c.colaboradorID))}
                        title="Quitar"
                      >
                        {`${c.nombre} ${c.apellido}`.trim()} ✕
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  {evoIndividualSeries ? (
                    <ReactApexChart
                      type="line"
                      height={260}
                      options={{
                        chart: { toolbar: { show: false } },
                        stroke: { curve: 'smooth', width: 2.5 },
                        xaxis: { categories: evoIndividualSeries.categories },
                        yaxis: { min: 0, max: 10 },
                        colors: CHART_COLORS,
                        legend: { show: true, position: 'top' },
                      }}
                      series={evoIndividualSeries.series}
                    />
                  ) : (
                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">Elegí al menos un colaborador para ver el gráfico.</div>
                  )}
                </div>
              </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-900">Historial de cambios de nivel</p>
                  <p className="mt-1 text-xs text-gray-500">Ascensos y reclasificaciones registradas.</p>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <select className="form-select text-sm md:w-[220px]" value={fCambiosArea} onChange={(e) => setFCambiosArea(e.target.value)}>
                    <option value="Todas">Todas las áreas</option>
                    {allowedAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <select className="form-select text-sm md:w-[220px]" value={fCambiosDir} onChange={(e) => setFCambiosDir(e.target.value)}>
                    <option value="all">Ascensos y descensos</option>
                    <option value="up">Ascensos</option>
                    <option value="dn">Descensos</option>
                  </select>
                </div>

                <div className="mt-3">
                  {cambiosLoading ? (
                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">Cargando cambios…</div>
                  ) : !cambiosNivel.length ? (
                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">Sin cambios de nivel en el período.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {cambiosNivel.map((c: any) => {
                        const nombre = `${c.nombre} ${c.apellido}`.trim();
                        const esAscenso = !!c.esAscenso || (c.nivelAnterior === 'Jr' && c.nivelNuevo !== 'Jr') || (c.nivelAnterior === 'Ssr' && c.nivelNuevo === 'Sr');
                        return (
                          <div key={c.id} className="rounded-xl border border-gray-100 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-gray-900">{nombre}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {c.area} · {formatSucursalPanel(c.sucursal)} · {c.trimestre}
                                </p>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${esAscenso ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {c.nivelAnterior} → {c.nivelNuevo}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedColab(null);
          setSelectedEval(null);
          setForceReadOnly(false);
        }}
        readOnly={isReadOnlyTrimestre || forceReadOnly}
        isLeader={isLeaderEvalInModal}
        trimestre={trimestreSeleccionado || trimestreActivo}
        nombreCompleto={selectedColab ? `${selectedColab.nombre} ${selectedColab.apellido}`.trim() : '—'}
        area={selectedColab?.area || '—'}
        sucursal={formatSucursalPanel(selectedColab?.sucursal) || '—'}
        fotoUrl={getColaboradorFotoUrl(selectedColab?.foto)}
        hasEvaluacion={!!selectedEval}
        criteriosPorNivel={criteriosPorNivelModal}
        descripcionNivel={descripcionNivelModal}
        initialNivel={isLeaderEvalInModal ? 'Sr' : (selectedEval?.nivel as Nivel) || (selectedColab?.nivel as Nivel) || 'Jr'}
        initialCriterios={
          (selectedEval?.criterios as CriterioPuntaje[]) ||
          (isLeaderEvalInModal
            ? buildCriteriosFromConfig(CRITERIOS_LIDER, selectedEval?.criterios as CriterioPuntaje[] | undefined)
            : defaultCriterios(((selectedColab?.nivel as Nivel) || 'Jr') as Nivel))
        }
        initialObservaciones={selectedEval?.observaciones}
        initialObjetivos={selectedEval?.objetivos}
        onSave={async ({ nivel, criterios, observaciones, objetivos }) => {
          if (!selectedColab) return;
          const token = localStorage.getItem('authToken') || localStorage.getItem('token');
          if (!token) {
            await Swal.fire({
              icon: 'warning',
              title: 'Sesión expirada',
              text: 'No hay token de acceso para Desempeño. Reingresá para renovar la sesión y volver a guardar.',
              confirmButtonText: 'OK',
            });
            return;
          }
          if (!trimestreActivo || (trimestreSeleccionado || trimestreActivo) !== trimestreActivo) {
            toast.error('Solo se puede guardar en el trimestre activo.');
            return;
          }
          try {
            setModalLoading(true);
            const resp = await desempenoService.guardarEvaluacion({
              colaboradorID: Number(selectedColab.colaboradorID),
              trimestre: trimestreActivo,
              nivel: isLeaderEvalInModal ? 'Sr' : nivel,
              criterios,
              observaciones,
              objetivos,
            });

            // El backend de este proyecto suele devolver 200 con { ok: 0 } cuando falla.
            // Si no validamos esto, la UI "dice" que guardó aunque no haya guardado nada.
            if (resp?.data?.ok !== 1) {
              const msg = resp?.data?.message || 'No se pudo guardar la evaluación';
              toast.error(msg);
              await Swal.fire({
                icon: 'error',
                title: 'No se pudo guardar',
                text: msg,
                confirmButtonText: 'OK',
              });
              return;
            }

            toast.success(resp?.data?.message || 'Evaluación guardada.');
            await openEvaluacion(selectedColab, { readOnly: false });
          } catch (e: any) {
            const apiMsg = e?.response?.data?.message || e?.response?.data?.error || e?.response?.data?.message?.[0];
            const msg = apiMsg || e?.message || 'No se pudo guardar la evaluación';
            toast.error(msg);
            await Swal.fire({
              icon: 'error',
              title: 'No se pudo guardar',
              text: msg,
              confirmButtonText: 'OK',
            });
          } finally {
            setModalLoading(false);
          }
        }}
      />

      {modalOpen && modalLoading && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30">
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow">Cargando evaluación…</div>
        </div>
      )}
    </div>
  );
};

export default PanelDesempeno;

