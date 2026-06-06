import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Key,
  Loader2,
  Mail,
  Save,
  Shield,
  User,
  UserCog,
  X,
} from 'lucide-react';
import {
  platformAdminService,
  type PlatformGlobalUser,
} from '../../services/platformAdminService';
import { ROMA_ROLE_OPTIONS, roleLabel } from './rbacLabels';

type EditPlatformUserDialogProps = {
  user: PlatformGlobalUser | null;
  open: boolean;
  onClose: () => void;
  onSaved: (user: PlatformGlobalUser) => void;
};

function splitFullName(fullName: string): { nombre: string; apellido: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { nombre: '', apellido: '' };
  if (parts.length === 1) return { nombre: parts[0], apellido: '' };
  return { nombre: parts[0], apellido: parts.slice(1).join(' ') };
}

export function EditPlatformUserDialog({
  user,
  open,
  onClose,
  onSaved,
}: EditPlatformUserDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState('colaborador');
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => ROMA_ROLE_OPTIONS.filter((r) => r.value !== 'platform_admin'),
    [],
  );

  useEffect(() => {
    if (!user || !open) return;
    setFullName(`${user.nombre} ${user.apellido}`.trim());
    setEmail(user.email);
    setRoleCode(
      user.primaryRoleCode && user.primaryRoleCode !== 'platform_admin'
        ? user.primaryRoleCode
        : user.roleCodes.find((c) => c !== 'platform_admin') ?? 'colaborador',
    );
    setIsPlatformAdmin(user.isPlatformAdmin);
    setNewPassword('');
    setError(null);
    setResetMessage(null);
  }, [user, open]);

  const handleResetPassword = useCallback(async () => {
    if (!user) return;
    setResetting(true);
    setError(null);
    setResetMessage(null);
    try {
      const result = await platformAdminService.resetUserPassword(
        user.tenantId,
        user.colaboradorId,
        newPassword.trim() || undefined,
      );
      setResetMessage(
        newPassword.trim()
          ? 'Contraseña actualizada.'
          : `Contraseña generada: ${result.temporaryPassword}`,
      );
      setNewPassword('');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Error restableciendo contraseña',
      );
    } finally {
      setResetting(false);
    }
  }, [user, newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { nombre, apellido } = splitFullName(fullName);
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email son obligatorios.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await platformAdminService.updateGlobalUser(
        user.tenantId,
        user.colaboradorId,
        {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          roleCode,
          isPlatformAdmin,
        },
      );
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? err?.message ?? 'Error guardando usuario',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-hidden overflow-y-auto rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
      >
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 id="edit-user-title" className="flex items-center gap-2 text-2xl font-bold">
              <UserCog className="h-6 w-6" />
              Editar Usuario
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-sm text-white/80">
            Modifica los datos del colaborador y su rol RBAC
          </p>
          <p className="mt-1 text-xs text-white/60">
            @{user.nombreUsuario} · {user.tenantDisplayName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
              <User className="h-4 w-4 text-cyan-600" />
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Mail className="h-4 w-4 text-cyan-600" />
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Shield className="h-4 w-4 text-cyan-600" />
              Rol dentro de la empresa
            </label>
            <select
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-cyan-500"
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Código RBAC: <code>{roleCode}</code> ({roleLabel(roleCode)})
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 transition hover:bg-amber-100/50">
            <input
              type="checkbox"
              checked={isPlatformAdmin}
              onChange={(e) => setIsPlatformAdmin(e.target.checked)}
              className="h-5 w-5 cursor-pointer rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <div className="flex-1">
              <div className="text-sm font-bold leading-none text-amber-900">
                Admin plataforma
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Rol platform_admin · acceso administración global
              </p>
            </div>
          </label>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Key className="h-4 w-4 text-cyan-600" />
              Restablecer contraseña
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva (mín. 8) o vacío = auto"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                disabled={resetting || (newPassword.length > 0 && newPassword.length < 8)}
                onClick={() => void handleResetPassword()}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Restablecer'}
              </button>
            </div>
            {resetMessage && (
              <p className="text-xs font-medium text-emerald-700">{resetMessage}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
