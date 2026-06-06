import { useCallback, useEffect, useState, type ComponentType } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  GitBranch,
  Loader2,
  MapPin,
  Save,
  Shield,
  TrendingUp,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import {
  platformAdminService,
  type TenantDetail,
} from '../../services/platformAdminService';

type TenantControlConsoleProps = {
  tenantId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type FeatureKey = 'mundialHome' | 'miDesempenoHomeTile' | 'commercialGeoCheckIn';

const MODULE_OPTIONS: {
  key: FeatureKey;
  title: string;
  subtitle: string;
  accent: string;
}[] = [
  {
    key: 'mundialHome',
    title: 'Mundial',
    subtitle: 'CTA en Home',
    accent: 'border-violet-300 bg-violet-50',
  },
  {
    key: 'miDesempenoHomeTile',
    title: 'Mi Desempeño',
    subtitle: 'Tile en Home',
    accent: 'border-cyan-300 bg-cyan-50',
  },
  {
    key: 'commercialGeoCheckIn',
    title: 'Geo Comercial',
    subtitle: 'Marcar posición',
    accent: 'border-emerald-300 bg-emerald-50',
  },
];

function MetricBar({
  label,
  value,
  max,
  colorClass,
  icon: Icon,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
  icon: ComponentType<{ className?: string }>;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 opacity-50" />
          {label}
        </span>
        <span>
          {value} {max > 0 && <span className="text-slate-400">/ {max}</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TenantControlConsole({
  tenantId,
  open,
  onClose,
  onSaved,
}: TenantControlConsoleProps) {
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    displayName: '',
    logoUrl: '',
    accentColor: '#FDD05B',
    areasText: '',
    isActive: true,
    mundialHome: false,
    miDesempenoHomeTile: true,
    commercialGeoCheckIn: false,
    mfaRequired: false,
    internalNotes: '',
  });

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const d = await platformAdminService.getTenantDetail(id);
      setDetail(d);
      setForm({
        displayName: d.config.branding?.displayName ?? d.displayName,
        logoUrl: d.config.branding?.logoUrl ?? '/assets/images/roma.jpeg',
        accentColor: d.config.branding?.accentColor ?? '#FDD05B',
        areasText: (d.config.areas ?? []).join(', '),
        isActive: d.isActive,
        mundialHome: d.config.features?.mundialHome === true,
        miDesempenoHomeTile: d.config.features?.miDesempenoHomeTile !== false,
        commercialGeoCheckIn: d.config.features?.commercialGeoCheckIn === true,
        mfaRequired: d.config.security?.mfaRequired === true,
        internalNotes: d.config.admin?.internalNotes ?? '',
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error cargando empresa');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && tenantId) {
      void loadDetail(tenantId);
    }
  }, [open, tenantId, loadDetail]);

  const toggleModule = (key: FeatureKey) => {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !detail) return;

    setSaving(true);
    setError(null);
    try {
      const areas = form.areasText.split(',').map((s) => s.trim()).filter(Boolean);
      await platformAdminService.updateTenantConfig(tenantId, {
        displayName: form.displayName.trim(),
        logoUrl: form.logoUrl.trim(),
        accentColor: form.accentColor.trim(),
        areas,
        mundialHome: form.mundialHome,
        miDesempenoHomeTile: form.miDesempenoHomeTile,
        commercialGeoCheckIn: form.commercialGeoCheckIn,
        mfaRequired: form.mfaRequired,
        internalNotes: form.internalNotes,
      });

      if (form.isActive !== detail.isActive) {
        await platformAdminService.setTenantActive(tenantId, form.isActive);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !tenantId) return null;

  const stats = detail?.stats;
  const colMax = Math.max(stats?.colaboradores ?? 0, 50);
  const areaMax = Math.max(stats?.areas ?? 0, 10);
  const sucMax = Math.max(stats?.sucursales ?? 0, 10);
  const rbacMax = Math.max(stats?.roleAssignments ?? 0, 20);

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/55 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
                <Building2 className="h-6 w-6" />
                Consola de Control — {form.displayName || tenantId}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Configuración del tenant, módulos habilitados y métricas operativas.
              </p>
              <p className="mt-0.5 font-mono text-xs text-white/60">{tenantId}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Nombre de la empresa
                      <input
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500"
                        value={form.displayName}
                        onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tenant ID
                      <input
                        readOnly
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 font-mono text-sm font-normal normal-case tracking-normal text-slate-600"
                        value={tenantId}
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                      <Calendar className="mb-1 inline h-3.5 w-3.5" /> Alta
                      <input
                        readOnly
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-600"
                        value={
                          detail
                            ? new Date(detail.createdAt).toLocaleDateString('es-AR')
                            : '—'
                        }
                      />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Estado
                      <select
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal outline-none focus:ring-2 focus:ring-cyan-500"
                        value={form.isActive ? 'active' : 'inactive'}
                        onChange={(e) =>
                          setForm({ ...form, isActive: e.target.value === 'active' })
                        }
                      >
                        <option value="active">ACTIVO</option>
                        <option value="inactive">INACTIVO</option>
                      </select>
                    </label>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Módulos habilitados
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {MODULE_OPTIONS.map(({ key, title, subtitle, accent }) => {
                        const on = form[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleModule(key)}
                            className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                              on
                                ? `${accent} border-cyan-500 ring-1 ring-cyan-500/30`
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            {on && (
                              <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-cyan-600" />
                            )}
                            <div className="text-sm font-bold text-slate-900">{title}</div>
                            <div className="text-[10px] text-slate-500">{subtitle}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 rounded border-amber-300 text-amber-600"
                      checked={form.mfaRequired}
                      onChange={(e) => setForm({ ...form, mfaRequired: e.target.checked })}
                    />
                    <span>
                      <span className="flex items-center gap-1 text-sm font-bold text-amber-900">
                        <Shield className="h-4 w-4" />
                        MFA obligatorio (managers/admins)
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Requiere MFA_ENFORCE_* en servidor
                      </span>
                    </span>
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-bold uppercase text-slate-500">
                      Color acento
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case"
                        value={form.accentColor}
                        onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-bold uppercase text-slate-500">
                      Logo URL
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case"
                        value={form.logoUrl}
                        onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-bold uppercase text-slate-500">
                    Áreas (coma)
                    <input
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case"
                      value={form.areasText}
                      onChange={(e) => setForm({ ...form, areasText: e.target.value })}
                    />
                  </label>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                      <TrendingUp className="h-4 w-4 text-cyan-600" />
                      Consumo operativo
                    </h3>
                    <div className="space-y-4">
                      <MetricBar
                        label="Colaboradores"
                        value={stats?.colaboradores ?? 0}
                        max={colMax}
                        colorClass="bg-amber-500"
                        icon={Users}
                      />
                      <MetricBar
                        label="Áreas"
                        value={stats?.areas ?? 0}
                        max={areaMax}
                        colorClass="bg-cyan-500"
                        icon={GitBranch}
                      />
                      <MetricBar
                        label="Sucursales"
                        value={stats?.sucursales ?? 0}
                        max={sucMax}
                        colorClass="bg-violet-500"
                        icon={MapPin}
                      />
                      <MetricBar
                        label="Asignaciones RBAC"
                        value={stats?.roleAssignments ?? 0}
                        max={rbacMax}
                        colorClass="bg-emerald-500"
                        icon={UserCog}
                      />
                    </div>
                    <p className="mt-4 text-[10px] text-slate-400">
                      Barras relativas al uso actual del tenant — no son límites de plan.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <FileText className="h-4 w-4 text-cyan-600" />
                      Notas de seguimiento internas
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Solo visible para admins de plataforma..."
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                      value={form.internalNotes}
                      onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar configuración
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
