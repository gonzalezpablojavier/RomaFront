import { useMemo, useState } from 'react';
import {
  Building2,
  Key,
  Loader2,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import type { PlatformGlobalUser } from '../../services/platformAdminService';
import { roleLabel } from './rbacLabels';

type PlatformUserListProps = {
  users: PlatformGlobalUser[];
  loading: boolean;
  actionLoading: boolean;
  onTogglePlatformAdmin: (user: PlatformGlobalUser) => void;
  onResetPassword: (user: PlatformGlobalUser) => void;
  onSendCredentials: (user: PlatformGlobalUser) => void;
  onEditUser: (user: PlatformGlobalUser) => void;
  onCreateUser: () => void;
};

function userInitials(user: PlatformGlobalUser): string {
  const fromName = `${user.nombre} ${user.apellido}`.trim();
  if (fromName.length >= 2) {
    return fromName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
  return user.nombreUsuario.slice(0, 2).toUpperCase();
}

export function PlatformUserList({
  users,
  loading,
  actionLoading,
  onTogglePlatformAdmin,
  onResetPassword,
  onSendCredentials,
  onEditUser,
  onCreateUser,
}: PlatformUserListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
      return (
        fullName.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.nombreUsuario.toLowerCase().includes(q) ||
        u.tenantId.toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 p-4 md:flex-row">
        <div className="relative w-full max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-none bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center md:w-auto">
          <div className="flex items-center justify-center space-x-2 text-xs font-medium text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>Admins plataforma resaltados</span>
          </div>
          <button
            type="button"
            onClick={onCreateUser}
            className="whitespace-nowrap rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700"
          >
            + Alta colaborador
          </button>
        </div>
      </div>

      {loading && !users.length ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          <span className="ml-3 text-slate-600">Cargando usuarios...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Users className="mb-4 h-12 w-12 opacity-20" />
          <p>No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">
                  Usuario
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">
                  Empresa / Sucursal
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">
                  Rol RBAC
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">
                  Admin plataforma
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => {
                const fullName =
                  `${user.nombre} ${user.apellido}`.trim() || user.nombreUsuario;
                const roleText = user.primaryRoleCode
                  ? roleLabel(user.primaryRoleCode)
                  : 'Sin rol';

                return (
                  <tr
                    key={`${user.tenantId}:${user.colaboradorId}`}
                    className={`transition-colors hover:bg-slate-50/50 ${
                      user.isPlatformAdmin ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className={`mr-3 flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                            user.isPlatformAdmin
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {userInitials(user)}
                        </div>
                        <div>
                          <div className="flex items-center font-bold text-slate-900">
                            {fullName}
                            {user.isPlatformAdmin && (
                              <Shield
                                className="ml-1.5 h-3.5 w-3.5 text-amber-500"
                                fill="currentColor"
                              />
                            )}
                          </div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                          <div className="text-xs text-slate-400">
                            @{user.nombreUsuario}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs font-medium text-slate-700">
                          <Building2 className="mr-1.5 h-3 w-3 opacity-40" />
                          {user.tenantDisplayName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {user.tenantId}
                        </div>
                        <div className="flex items-center text-xs text-slate-400">
                          <Store className="mr-1.5 h-3 w-3 opacity-40" />
                          {user.sucursal || '—'} · {user.area || '—'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {roleText}
                      </span>
                      {user.roleCodes.length > 1 && (
                        <div className="mt-1 text-[10px] text-slate-400">
                          +{user.roleCodes.length - 1} rol(es) más
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onTogglePlatformAdmin(user)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 ${
                            user.isPlatformAdmin ? 'bg-amber-500' : 'bg-slate-200'
                          }`}
                        >
                          <span className="sr-only">Toggle admin plataforma</span>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.isPlatformAdmin ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onEditUser(user)}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-violet-100 hover:text-violet-600 disabled:opacity-50"
                          title="Editar usuario"
                        >
                          <Settings className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onResetPassword(user)}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-600 disabled:opacity-50"
                          title="Restablecer contraseña"
                        >
                          <Key className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onSendCredentials(user)}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-cyan-100 hover:text-cyan-700 disabled:opacity-50"
                          title="Enviar credenciales por WhatsApp"
                        >
                          <Send className="h-[18px] w-[18px]" />
                        </button>
                      </div>
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
