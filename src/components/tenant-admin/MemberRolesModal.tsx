import { useEffect, useState } from 'react';
import { Loader2, Save, Shield, UserCog, X } from 'lucide-react';
import type { TenantMember } from '../../types/tenantRbac';
import {
  setTenantMemberRoles as defaultSetMemberRoles,
  loadTenantCatalog,
} from '../../services/tenantRbacService';
import {
  TENANT_ASSIGNABLE_ROLE_OPTIONS,
  roleLabel,
} from '../platform-admin/rbacLabels';

type MemberRolesModalProps = {
  tenantId: string;
  member: TenantMember | null;
  open: boolean;
  onClose: () => void;
  onSaved: (member: TenantMember) => void;
  setMemberRoles?: (
    tenantId: string,
    colaboradorId: number,
    payload: { roleCodes: string[]; areaName?: string; sucursalCode?: string },
  ) => Promise<TenantMember>;
};

export function MemberRolesModal({
  tenantId,
  member,
  open,
  onClose,
  onSaved,
  setMemberRoles = defaultSetMemberRoles,
}: MemberRolesModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['colaborador']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!member || !open) return;
    const codes = member.roles
      .map((r) => r.roleCode)
      .filter((c) => c !== 'platform_admin');
    setSelectedRoles(codes.length ? codes : ['colaborador']);
    setError(null);
  }, [member, open]);

  const toggleRole = (code: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(code)) {
        const next = prev.filter((c) => c !== code);
        return next.length ? next : ['colaborador'];
      }
      return [...prev, code];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await setMemberRoles(tenantId, member.colaboradorId, {
        roleCodes: selectedRoles,
        areaName: member.area || undefined,
        sucursalCode: member.sucursal || undefined,
      });
      await loadTenantCatalog(tenantId);
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? err?.message ?? 'Error guardando roles',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open || !member) return null;

  const fullName =
    `${member.nombre} ${member.apellido}`.trim() || member.nombreUsuario;
  const hasPlatformAdmin = member.roles.some((r) => r.roleCode === 'platform_admin');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <UserCog className="h-5 w-5" />
                Roles RBAC
              </h2>
              <p className="mt-1 text-sm text-white/85">{fullName}</p>
              <p className="text-xs text-white/65">@{member.nombreUsuario}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          {hasPlatformAdmin && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <Shield className="mt-0.5 h-4 w-4 shrink-0" />
              Este usuario tiene admin plataforma (solo Roma puede cambiarlo).
            </div>
          )}

          <p className="text-sm text-slate-600">
            Elegí uno o más roles. Los permisos del menú se calculan automáticamente.
          </p>

          <div className="space-y-2">
            {TENANT_ASSIGNABLE_ROLE_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                  selectedRoles.includes(value)
                    ? 'border-cyan-400 bg-cyan-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(value)}
                  onChange={() => toggleRole(value)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{label}</span>
                  <span className="text-xs text-slate-500">{value}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Área: <strong>{member.area || '—'}</strong> · Sucursal:{' '}
            <strong>{member.sucursal || '—'}</strong>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar roles
            </button>
          </div>

          {selectedRoles.length > 0 && (
            <p className="text-center text-xs text-slate-400">
              {selectedRoles.map((c) => roleLabel(c)).join(' · ')}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
