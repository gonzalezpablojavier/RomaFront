import { useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Settings,
  Shield,
  XCircle,
} from 'lucide-react';
import type { PlatformTenant } from '../../services/platformAdminService';

export type TenantSummary = {
  colaboradores: number;
  roleAssignments: number;
  mfaRequired: boolean;
};

type PlatformTenantListProps = {
  tenants: PlatformTenant[];
  summaries: Record<string, TenantSummary>;
  loading: boolean;
  onToggleActive: (tenantId: string, isActive: boolean) => void;
  onConfigure: (tenantId: string) => void;
  onStartOnboarding: () => void;
};

export function PlatformTenantList({
  tenants,
  summaries,
  loading,
  onToggleActive,
  onConfigure,
  onStartOnboarding,
}: PlatformTenantListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.displayName.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    );
  }, [tenants, searchTerm]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/30 p-4 md:flex-row">
        <div className="relative w-full max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o tenant ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <button
          type="button"
          onClick={onStartOnboarding}
          className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 md:w-auto"
        >
          <Plus className="h-[18px] w-[18px]" />
          Onboarding Nueva Empresa
        </button>
      </div>

      {loading && !tenants.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-cyan-600" />
          <span className="font-medium text-slate-500">Cargando empresas...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Building2 className="mb-4 h-16 w-16 opacity-10" />
          <p className="font-medium">No se encontraron empresas</p>
          <p className="text-sm text-slate-400">
            Ajustá la búsqueda o iniciá un onboarding nuevo.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Empresa
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Seguridad
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tenant ID
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Colaboradores / Alta
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tenant) => {
                const summary = summaries[tenant.id];
                return (
                  <tr
                    key={tenant.id}
                    className="group transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 transition-colors group-hover:text-cyan-700">
                        {tenant.displayName}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-tighter text-slate-400">
                        {tenant.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {summary?.mfaRequired ? (
                        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-800">
                          <Shield className="mr-1 h-3 w-3" />
                          MFA ON
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          MFA off
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleActive(tenant.id, tenant.isActive)}
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold transition-all ${
                          tenant.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                      >
                        {tenant.isActive ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            ACTIVO
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            INACTIVO
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-500">{tenant.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className="inline-flex w-fit items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {summary ? `${summary.colaboradores} colaboradores` : '—'}
                        </span>
                        <span className="flex items-center text-[9px] font-medium text-slate-400">
                          <Calendar className="mr-1 h-3 w-3" />
                          Reg: {new Date(tenant.createdAt).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onConfigure(tenant.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
                        title="Configurar empresa"
                      >
                        <Settings className="h-[18px] w-[18px]" />
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
  );
}
