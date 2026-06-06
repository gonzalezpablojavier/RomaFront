import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { desempenoService } from '../../services/desempenoService';
import { CRITERIOS_LIDER, getTrimestreActivoFromDate } from '../../config/desempenoConfig';
import { useAuth } from '../../context/AuthContext';
import { getManagerIdsForEmpresa } from '../../services/empresaService';
import { getSessionEmpresaId, getSessionUserId, getSessionUser } from '../../session/sessionStore';

type EstadoScore = 'En camino' | 'Atención';

function getEstado(score: number): EstadoScore {
  if (score >= 6) return 'En camino';
  return 'Atención';
}

function getScoreColors(score: number) {
  if (score >= 6) return { text: 'text-green-600', bg: 'bg-green-100', hex: '#2d9e6b' };
  return { text: 'text-red-600', bg: 'bg-red-100', hex: '#c0392b' };
}

function buildCriteriosFromConfig(config: { nombre: string }[], existing?: { nombre: string; puntaje: number }[]) {
  const norm = (s: any) =>
    String(s ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

  const byName = new Map((existing || []).map((c) => [norm(c.nombre), Number(c.puntaje) || 0]));
  return (Array.isArray(config) ? config : []).map((c) => ({
    nombre: c.nombre,
    puntaje: byName.has(norm(c.nombre)) ? (Number(byName.get(norm(c.nombre))) || 0) : 5,
  }));
}

const MiDesempeno = () => {
  const { user, empresaId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<null | {
    colaboradorID: number;
    nombre: string;
    apellido: string;
    nivel: string;
    scoreActual: number | null;
    evaluaciones: Array<{ trimestre: string; scoreTotal: number; nivel: string }>;
  }>(null);
  const [detalle, setDetalle] = useState<null | {
    criterios: { nombre: string; puntaje: number }[];
    observaciones?: string | null;
    objetivos?: string | null;
  }>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await desempenoService.getMiDesempeno();
        if (!alive) return;
        const d = resp.data?.data ?? null;
        setData(d);
        setDetalle(null);

        const trimestreActivo = getTrimestreActivoFromDate(new Date());
        if (d?.colaboradorID) {
          try {
            const evalResp = await desempenoService.getEvaluacion(Number(d.colaboradorID), trimestreActivo);
            const ev = evalResp.data?.data;
            if (!alive) return;
            setDetalle(
              ev
                ? {
                    criterios: Array.isArray(ev.criterios) ? ev.criterios : [],
                    observaciones: ev.observaciones ?? null,
                    objetivos: ev.objetivos ?? null,
                  }
                : null,
            );
          } catch (e: any) {
            if (!alive) return;
            setDetalle(null);
          }
        }
      } catch (e: any) {
        toast.error(e?.message || 'No se pudo cargar tu desempeño');
        if (!alive) return;
        setData(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const trimestreActivo = useMemo(() => getTrimestreActivoFromDate(new Date()), []);
  const scoreActualNumber = useMemo(() => {
    const v: any = data?.scoreActual;
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [data]);
  const estadoActual = useMemo(() => (scoreActualNumber == null ? null : getEstado(scoreActualNumber)), [scoreActualNumber]);
  const scoreColors = useMemo(() => (scoreActualNumber == null ? null : getScoreColors(scoreActualNumber)), [scoreActualNumber]);
  const historial = useMemo(() => {
    const rows = data?.evaluaciones || [];
    return rows.map((e) => ({
      trimestre: e.trimestre,
      scoreTotal: Number(e.scoreTotal) || 0,
    }));
  }, [data]);

  const empresa = empresaId || getSessionEmpresaId() || 'default';
  const managerIds = useMemo(() => getManagerIdsForEmpresa(empresa), [empresa]);
  const isLeader = useMemo(() => {
    const id = data?.colaboradorID ?? user?.user_code;
    return managerIds.includes(String(id));
  }, [data?.colaboradorID, managerIds, user?.user_code]);

  const criteriosDetalle = useMemo(() => {
    const list = detalle?.criterios || [];
    if (!isLeader) return list;
    // Alinear el orden y completar faltantes con default.
    return buildCriteriosFromConfig(CRITERIOS_LIDER, list);
  }, [detalle?.criterios, isLeader]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mi Feedback</h1>
          <p className="mt-1 text-sm text-gray-500">Solo lectura. Tus evaluaciones y tu evolución.</p>
        </div>
        {data && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            Trimestre activo: {trimestreActivo}
          </span>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">Cargando…</div>
      )}

      {!loading && !data && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          No pude cargar tu información. Probá de nuevo más tarde.
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-700">Score trimestre</span>
                {scoreActualNumber == null ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Sin evaluación</span>
                ) : (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${scoreColors?.bg} ${scoreColors?.text}`}>
                    {estadoActual} · {scoreActualNumber.toFixed(1)}
                  </span>
                )}
              </div>

              {scoreActualNumber != null && (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (scoreActualNumber / 10) * 100))}%`, background: scoreColors?.hex }} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Escala 1 a 10.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-800">Detalle por criterio</h2>

            {!criteriosDetalle?.length && (
              <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No hay criterios para mostrar.</div>
            )}

            {!!criteriosDetalle?.length && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {criteriosDetalle.map((c) => {
                  const colors = getScoreColors(c.puntaje);
                  return (
                    <div key={c.nombre} className="rounded-lg border border-gray-100 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-gray-800">{c.nombre}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors.bg} ${colors.text}`}>{c.puntaje}</span>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (c.puntaje / 10) * 100))}%`, background: colors.hex }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-800">Observaciones</h2>
            <div className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              {detalle?.observaciones?.trim() || '—'}
            </div>

            <h2 className="mt-5 text-sm font-semibold text-gray-800">Objetivos próximo trimestre</h2>
            <div className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{detalle?.objetivos?.trim() || '—'}</div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">Historial</h2>
            {!historial.length ? (
              <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Sin historial.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {historial.map((h) => {
                  const colors = getScoreColors(h.scoreTotal);
                  return (
                    <div key={h.trimestre} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{h.trimestre}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors.bg} ${colors.text}`}>{h.scoreTotal.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiDesempeno;

