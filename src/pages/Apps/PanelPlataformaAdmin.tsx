import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  LayoutDashboard,
  Shield,
  Users,
  UserCog,
  MapPin,
  GitBranch,
} from 'lucide-react';
import {
  platformAdminService,
  type CreateColaboradorResult,
  type PlatformGlobalUser,
  type PlatformTenant,
  type TenantDetail,
} from '../../services/platformAdminService';
import { TenantCatalog } from '../../types/tenantRbac';
import { clearTenantConfigCache } from '../../services/tenantConfigService';
import { PlatformAdminShell } from '../../components/platform-admin/PlatformAdminShell';
import { PlatformStatCard } from '../../components/platform-admin/PlatformStatCard';
import {
  PlatformTenantList,
  type TenantSummary,
} from '../../components/platform-admin/PlatformTenantList';
import { PlatformUserList } from '../../components/platform-admin/PlatformUserList';
import { EditPlatformUserDialog } from '../../components/platform-admin/EditPlatformUserDialog';
import { TenantControlConsole } from '../../components/platform-admin/TenantControlConsole';
import { ROMA_ROLE_OPTIONS, roleLabel } from '../../components/platform-admin/rbacLabels';
import TenantOnboardingWizard, {
  type WizardFormState,
  type WizardSubmitResult,
} from './TenantOnboardingWizard';

type MainTab =
  | 'dashboard'
  | 'empresas'
  | 'usuarios'
  | 'onboarding'
  | 'nuevo-colaborador';

const MAIN_TABS: {
  id: MainTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'empresas', label: 'Empresas', icon: Building2 },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
];

function Alert({
  type,
  children,
}: {
  type: 'error' | 'success';
  children: React.ReactNode;
}) {
  const styles =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-green-200 bg-green-50 text-green-800';
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>
  );
}

const PanelPlataformaAdmin: React.FC = () => {
  const [tab, setTab] = useState<MainTab>('empresas');
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('default');
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [catalog, setCatalog] = useState<TenantCatalog | null>(null);
  const [summaries, setSummaries] = useState<Record<string, TenantSummary>>({});
  const [globalUsers, setGlobalUsers] = useState<PlatformGlobalUser[]>([]);
  const [editingUser, setEditingUser] = useState<PlatformGlobalUser | null>(null);
  const [consoleTenantId, setConsoleTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [colabForm, setColabForm] = useState({
    nombreUsuario: '',
    password: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    area: '',
    sucursal: '',
    roleCode: 'colaborador',
    sendWhatsApp: true,
  });
  const [lastCreated, setLastCreated] = useState<CreateColaboradorResult | null>(null);

  const loadSummaries = useCallback(async (list: PlatformTenant[]) => {
    if (!list.length) {
      setSummaries({});
      return;
    }
    const details = await Promise.all(
      list.map((t) => platformAdminService.getTenantDetail(t.id)),
    );
    const map: Record<string, TenantSummary> = {};
    for (const d of details) {
      map[d.id] = {
        colaboradores: d.stats.colaboradores,
        roleAssignments: d.stats.roleAssignments,
        mfaRequired: d.config.security?.mfaRequired === true,
      };
    }
    setSummaries(map);
  }, []);

  const loadTenants = useCallback(async () => {
    const list = await platformAdminService.listTenants();
    setTenants(list);
    if (list.length && !list.find((t) => t.id === selectedTenant)) {
      setSelectedTenant(list[0].id);
    }
    await loadSummaries(list);
    return list;
  }, [selectedTenant, loadSummaries]);

  const loadDetail = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    const d = await platformAdminService.getTenantDetail(tenantId);
    setDetail(d);
  }, []);

  const loadCatalog = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    const data = await platformAdminService.getTenantCatalog(tenantId);
    setCatalog(data);
    setColabForm((f) => ({
      ...f,
      area: f.area || data.areas[0]?.name || '',
      sucursal: f.sucursal || data.sucursales[0]?.code || '',
    }));
  }, []);

  const loadGlobalUsers = useCallback(async () => {
    const users = await platformAdminService.listGlobalUsers();
    setGlobalUsers(users);
    return users;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadTenants();
      if (selectedTenant) {
        await Promise.all([loadDetail(selectedTenant), loadCatalog(selectedTenant)]);
      }
      if (tab === 'usuarios' || tab === 'dashboard') {
        await loadGlobalUsers();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [loadTenants, loadDetail, loadCatalog, selectedTenant, tab, loadGlobalUsers]);

  useEffect(() => {
    void refresh();
  }, [selectedTenant]);

  useEffect(() => {
    if (tab !== 'usuarios') return;
    void (async () => {
      try {
        await loadGlobalUsers();
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? 'Error cargando usuarios');
      }
    })();
  }, [tab, loadGlobalUsers]);

  const handleWizardSubmit = async (form: WizardFormState): Promise<WizardSubmitResult> => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const areas = form.areasText.split(',').map((s) => s.trim()).filter(Boolean);
      const sucursales = form.sucursalesText.split(',').map((s) => s.trim()).filter(Boolean);
      const tenantId = form.tenantId.trim().toLowerCase();

      await platformAdminService.createTenant({
        tenantId,
        displayName: form.displayName.trim(),
        areas,
        sucursales,
        seedDefaultRoles: true,
        logoUrl: form.logoUrl.trim(),
        accentColor: form.accentColor.trim(),
        mundialHome: form.mundialHome,
        miDesempenoHomeTile: form.miDesempenoHomeTile,
        commercialGeoCheckIn: form.commercialGeoCheckIn,
      });

      let admin: WizardSubmitResult['admin'];
      if (form.createAdmin) {
        const adminResult = await platformAdminService.createColaborador(tenantId, {
          nombreUsuario: form.adminUsuario.trim(),
          password: form.adminPassword.trim() || undefined,
          nombre: form.adminNombre.trim(),
          apellido: form.adminApellido.trim(),
          email: form.adminEmail.trim() || undefined,
          telefono: form.adminTelefono.trim() || undefined,
          area: areas[0],
          sucursal: sucursales[0].toUpperCase(),
          roleCode: form.adminRoleCode,
          sendWhatsApp: form.adminSendWhatsApp && !!form.adminTelefono.trim(),
        });
        admin = {
          colaboradorId: adminResult.colaboradorId,
          nombreUsuario: adminResult.nombreUsuario,
          temporaryPassword: adminResult.temporaryPassword,
          whatsAppSent: adminResult.whatsAppSent,
          whatsAppError: adminResult.whatsAppError,
        };
      }

      setSelectedTenant(tenantId);
      await refresh();
      return { tenantId, displayName: form.displayName.trim(), admin };
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Error creando tenant';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleWizardDone = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setTab('empresas');
    setSuccess(`Empresa "${tenantId}" creada.`);
  };

  const handleToggleActive = async (tenantId: string, isActive: boolean) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    const name = tenant?.displayName ?? tenantId;
    if (
      !window.confirm(
        `¿${isActive ? 'Desactivar' : 'Activar'} la empresa "${name}"?`,
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await platformAdminService.setTenantActive(tenantId, !isActive);
      setSuccess(isActive ? 'Empresa desactivada.' : 'Empresa activada.');
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLastCreated(null);
    setLoading(true);
    try {
      const result = await platformAdminService.createColaborador(selectedTenant, {
        nombreUsuario: colabForm.nombreUsuario.trim(),
        password: colabForm.password.trim() || undefined,
        nombre: colabForm.nombre.trim(),
        apellido: colabForm.apellido.trim(),
        email: colabForm.email.trim() || undefined,
        telefono: colabForm.telefono.trim() || undefined,
        area: colabForm.area,
        sucursal: colabForm.sucursal,
        roleCode: colabForm.roleCode,
        sendWhatsApp: colabForm.sendWhatsApp && !!colabForm.telefono.trim(),
      });
      setLastCreated(result);
      setSuccess(`Colaborador #${result.colaboradorId} creado.`);
      await refresh();
      await loadGlobalUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error creando colaborador');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureTenant = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setConsoleTenantId(tenantId);
  };

  const handleConsoleSaved = () => {
    clearTenantConfigCache(consoleTenantId ?? selectedTenant);
    setSuccess('Configuración de empresa guardada.');
    void refresh();
  };

  const handleTogglePlatformAdmin = async (user: PlatformGlobalUser) => {
    const action = user.isPlatformAdmin ? 'quitar' : 'otorgar';
    const name = `${user.nombre} ${user.apellido}`.trim() || user.nombreUsuario;
    if (
      !window.confirm(
        `¿${action === 'otorgar' ? 'Otorgar' : 'Quitar'} rol Admin plataforma a "${name}"?`,
      )
    ) {
      return;
    }
    setUserActionLoading(true);
    setError(null);
    try {
      await platformAdminService.setPlatformAdmin(
        user.tenantId,
        user.colaboradorId,
        !user.isPlatformAdmin,
      );
      setSuccess(
        user.isPlatformAdmin
          ? 'Admin plataforma removido.'
          : 'Admin plataforma asignado.',
      );
      await loadGlobalUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error actualizando rol');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleResetPassword = async (user: PlatformGlobalUser) => {
    const name = `${user.nombre} ${user.apellido}`.trim() || user.nombreUsuario;
    if (!window.confirm(`¿Generar nueva contraseña para "${name}"?`)) return;
    setUserActionLoading(true);
    setError(null);
    try {
      const result = await platformAdminService.resetUserPassword(
        user.tenantId,
        user.colaboradorId,
      );
      setSuccess(
        `Nueva contraseña para ${result.nombreUsuario}: ${result.temporaryPassword}`,
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error restableciendo contraseña');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleSendCredentials = async (user: PlatformGlobalUser) => {
    setUserActionLoading(true);
    setError(null);
    try {
      const result = await platformAdminService.sendCredentials(
        user.tenantId,
        user.colaboradorId,
      );
      setSuccess(`Credenciales enviadas por WhatsApp a ${result.telefono}.`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error enviando credenciales');
    } finally {
      setUserActionLoading(false);
    }
  };

  const activeTenants = useMemo(
    () => tenants.filter((t) => t.isActive).length,
    [tenants],
  );

  const globalStats = useMemo(() => {
    const values = Object.values(summaries);
    return {
      colaboradores: values.reduce((n, s) => n + s.colaboradores, 0),
      roleAssignments: values.reduce((n, s) => n + s.roleAssignments, 0),
      mfaTenants: values.filter((s) => s.mfaRequired).length,
    };
  }, [summaries]);

  const selectedTenantLabel =
    tenants.find((t) => t.id === selectedTenant)?.displayName ?? selectedTenant;

  const showMainTabs =
    tab === 'dashboard' || tab === 'empresas' || tab === 'usuarios';

  const tabBar = showMainTabs ? (
    <div className="grid w-full max-w-xl grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 md:w-[600px]">
      {MAIN_TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTab(id)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            tab === id
              ? 'bg-white text-cyan-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  ) : null;

  const alerts = (
    <>
      {error && (
        <Alert type="error">{typeof error === 'string' ? error : JSON.stringify(error)}</Alert>
      )}
      {success && <Alert type="success">{success}</Alert>}
    </>
  );

  const backToEmpresas = (
    <button
      type="button"
      onClick={() => setTab('empresas')}
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-700"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a empresas
    </button>
  );

  return (
    <PlatformAdminShell
      onRefresh={() => void refresh()}
      loading={loading}
      alerts={alerts}
      tabs={tabBar}
    >
      {tab === 'dashboard' && (
        <div className="animate-in fade-in space-y-6 duration-300">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PlatformStatCard
              title="Empresas totales"
              value={tenants.length}
              icon={Building2}
              colorClass="bg-blue-50 text-blue-600"
            />
            <PlatformStatCard
              title="Empresas activas"
              value={activeTenants}
              icon={CheckCircle2}
              colorClass="bg-emerald-50 text-emerald-600"
            />
            <PlatformStatCard
              title="Colaboradores (global)"
              value={globalStats.colaboradores}
              icon={Users}
              colorClass="bg-violet-50 text-violet-600"
            />
            <PlatformStatCard
              title="Asignaciones RBAC"
              value={globalStats.roleAssignments}
              icon={UserCog}
              colorClass="bg-amber-50 text-amber-600"
            />
          </div>

          {detail && (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <PlatformStatCard
                  title="Tenants con MFA"
                  value={globalStats.mfaTenants}
                  icon={Shield}
                  colorClass="bg-slate-100 text-slate-600"
                />
                <PlatformStatCard
                  title="Áreas (último tenant)"
                  value={detail.stats.areas}
                  icon={GitBranch}
                  colorClass="bg-cyan-50 text-cyan-600"
                />
                <PlatformStatCard
                  title="Sucursales (último tenant)"
                  value={detail.stats.sucursales}
                  icon={MapPin}
                  colorClass="bg-rose-50 text-rose-600"
                />
              </div>

              {catalog?.assignments && catalog.assignments.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <h3 className="font-bold text-slate-900">
                      Roles RBAC — {selectedTenantLabel}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Permisos definidos en tenant-rbac del backend.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-6 py-3 font-semibold">Colaborador</th>
                          <th className="px-6 py-3 font-semibold">Rol</th>
                          <th className="px-6 py-3 font-semibold">Código</th>
                          <th className="px-6 py-3 font-semibold">Área</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalog.assignments.map((a, i) => (
                          <tr
                            key={`${a.colaboradorId}-${a.roleCode}-${i}`}
                            className="border-b border-slate-50 hover:bg-slate-50/80"
                          >
                            <td className="px-6 py-3 font-mono text-xs">#{a.colaboradorId}</td>
                            <td className="px-6 py-3 font-medium">{roleLabel(a.roleCode)}</td>
                            <td className="px-6 py-3">
                              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                                {a.roleCode}
                              </code>
                            </td>
                            <td className="px-6 py-3 text-slate-600">{a.areaName ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'empresas' && (
        <PlatformTenantList
          tenants={tenants}
          summaries={summaries}
          loading={loading}
          onToggleActive={handleToggleActive}
          onConfigure={handleConfigureTenant}
          onStartOnboarding={() => setTab('onboarding')}
        />
      )}

      {tab === 'usuarios' && (
        <>
          <PlatformUserList
            users={globalUsers}
            loading={loading}
            actionLoading={userActionLoading}
            onTogglePlatformAdmin={handleTogglePlatformAdmin}
            onResetPassword={handleResetPassword}
            onSendCredentials={handleSendCredentials}
            onEditUser={setEditingUser}
            onCreateUser={() => setTab('nuevo-colaborador')}
          />
          <EditPlatformUserDialog
            user={editingUser}
            open={!!editingUser}
            onClose={() => setEditingUser(null)}
            onSaved={(updated) => {
              setGlobalUsers((prev) =>
                prev.map((u) =>
                  u.tenantId === updated.tenantId &&
                  u.colaboradorId === updated.colaboradorId
                    ? updated
                    : u,
                ),
              );
              setSuccess('Usuario actualizado.');
            }}
          />
        </>
      )}

      {tab === 'nuevo-colaborador' && (
        <div>
          <button
            type="button"
            onClick={() => setTab('usuarios')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a usuarios
          </button>

          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-slate-500">Empresa</label>
            <select
              className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:min-w-[320px]"
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName} ({t.id})
                </option>
              ))}
            </select>
          </div>

          <form
            onSubmit={handleCreateColaborador}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">Alta colaborador — {selectedTenantLabel}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                Usuario login
                <input
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={colabForm.nombreUsuario}
                  onChange={(e) =>
                    setColabForm({ ...colabForm, nombreUsuario: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm">
                Contraseña (vacío = auto)
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={colabForm.password}
                  onChange={(e) => setColabForm({ ...colabForm, password: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Nombre
                <input
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={colabForm.nombre}
                  onChange={(e) => setColabForm({ ...colabForm, nombre: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Apellido
                <input
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={colabForm.apellido}
                  onChange={(e) => setColabForm({ ...colabForm, apellido: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={colabForm.email}
                  onChange={(e) => setColabForm({ ...colabForm, email: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Teléfono WhatsApp
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={colabForm.telefono}
                  onChange={(e) => setColabForm({ ...colabForm, telefono: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Área
                <select
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={colabForm.area}
                  onChange={(e) => setColabForm({ ...colabForm, area: e.target.value })}
                >
                  {(catalog?.areas ?? []).map((a) => (
                    <option key={a.code} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Sucursal
                <select
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={colabForm.sucursal}
                  onChange={(e) => setColabForm({ ...colabForm, sucursal: e.target.value })}
                >
                  {(catalog?.sucursales ?? []).map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Rol RBAC
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={colabForm.roleCode}
                  onChange={(e) => setColabForm({ ...colabForm, roleCode: e.target.value })}
                >
                  {ROMA_ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={colabForm.sendWhatsApp}
                onChange={(e) => setColabForm({ ...colabForm, sendWhatsApp: e.target.checked })}
              />
              Enviar credenciales por WhatsApp
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-600 px-6 py-2.5 font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              Crear colaborador
            </button>
            {lastCreated && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                <p className="font-medium">Credenciales</p>
                <p>
                  Usuario: <code>{lastCreated.nombreUsuario}</code>
                </p>
                <p>
                  Contraseña: <code>{lastCreated.temporaryPassword}</code>
                </p>
              </div>
            )}
          </form>
        </div>
      )}

      {tab === 'onboarding' && (
        <div>
          {backToEmpresas}
          <TenantOnboardingWizard
            loading={loading}
            onSubmit={handleWizardSubmit}
            onDone={handleWizardDone}
          />
        </div>
      )}

      <TenantControlConsole
        tenantId={consoleTenantId}
        open={!!consoleTenantId}
        onClose={() => setConsoleTenantId(null)}
        onSaved={handleConsoleSaved}
      />
    </PlatformAdminShell>
  );
};

export default PanelPlataformaAdmin;
