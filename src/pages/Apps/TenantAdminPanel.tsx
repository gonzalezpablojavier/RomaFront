import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  GitBranch,
  KeyRound,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PlatformAdminShell } from '../../components/platform-admin/PlatformAdminShell';
import { PlatformStatCard } from '../../components/platform-admin/PlatformStatCard';
import { MemberRolesModal } from '../../components/tenant-admin/MemberRolesModal';
import {
  TENANT_ASSIGNABLE_ROLE_OPTIONS,
  roleLabel,
} from '../../components/platform-admin/rbacLabels';
import {
  createTenantArea,
  createTenantAdminMember,
  createTenantSucursal,
  deleteTenantArea,
  deleteTenantAdminMember,
  deleteTenantSucursal,
  fetchTenantAdminOverview,
  listTenantAdminAreas,
  listTenantAdminMembers,
  listTenantAdminRoles,
  listTenantAdminSucursales,
  setTenantAdminMemberRoles,
  updateTenantArea,
  updateTenantAdminMember,
  updateTenantSucursal,
  type TenantAdminArea,
  type TenantAdminOverview,
  type TenantAdminRole,
  type TenantAdminSucursal,
} from '../../services/tenantAdminService';
import { loadTenantCatalog } from '../../services/tenantRbacService';
import type { TenantMember } from '../../types/tenantRbac';

type TabId = 'areas' | 'sucursales' | 'roles' | 'colaboradores' | 'accesos';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'areas', label: 'Áreas', icon: GitBranch },
  { id: 'sucursales', label: 'Sucursales', icon: MapPin },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'colaboradores', label: 'Colaboradores', icon: Users },
  { id: 'accesos', label: 'Accesos', icon: KeyRound },
];

const PERMISSION_LABELS: Record<string, string> = {
  'route.home': 'Home',
  'route.permiso_temporal': 'Permiso temporal',
  'route.how_are_you': '¿Cómo estás?',
  'route.presentismo': 'Presentismo',
  'route.vacaciones': 'Vacaciones',
  'route.registro': 'Registro',
  'route.mis_datos': 'Mis datos',
  'route.certificados': 'Certificados',
  'route.feedback_colaborador': 'Feedback colaborador',
  'route.reconocemos': 'Reconocemos',
  'route.panel.permisos_temporales': 'Panel permisos temporales',
  'route.panel.admin_vacaciones': 'Panel vacaciones',
  'route.panel.feedback': 'Panel feedback',
  'route.panel.presentismo': 'Panel presentismo',
  'route.panel.certificados': 'Panel certificados',
  'route.panel.admin_ideas': 'Panel ideas',
  'route.panel.colaboradores': 'Panel colaboradores',
  'route.panel.desempeno': 'Panel desempeño',
  'route.calendario': 'Calendario',
  'route.calendario.ausentes': 'Calendario ausentes',
  'route.manage_moods': 'Gestionar moods',
  'route.mi_desempeno': 'Mi desempeño',
  'tenant.roles.manage': 'Gestionar roles',
  'tenant.admin': 'Admin empresa',
  'platform.admin': 'Admin plataforma',
};

function permLabel(code: string): string {
  return PERMISSION_LABELS[code] ?? code;
}

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

const emptyMemberForm = {
  nombreUsuario: '',
  password: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  area: '',
  sucursal: '',
  roleCode: 'colaborador',
};

const TenantAdminPanel: React.FC = () => {
  const { empresaId } = useAuth();
  const tenantId = empresaId ?? 'default';

  const [tab, setTab] = useState<TabId>('areas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [overview, setOverview] = useState<TenantAdminOverview | null>(null);
  const [areas, setAreas] = useState<TenantAdminArea[]>([]);
  const [sucursales, setSucursales] = useState<TenantAdminSucursal[]>([]);
  const [roles, setRoles] = useState<TenantAdminRole[]>([]);
  const [members, setMembers] = useState<TenantMember[]>([]);

  const [areaForm, setAreaForm] = useState({ name: '', globalView: false });
  const [sucursalForm, setSucursalForm] = useState({ code: '', name: '' });
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TenantMember | null>(null);
  const [rolesMember, setRolesMember] = useState<TenantMember | null>(null);
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [areaDraft, setAreaDraft] = useState({ name: '', globalView: false });
  const [editingSucursalId, setEditingSucursalId] = useState<number | null>(null);
  const [sucursalDraft, setSucursalDraft] = useState({ code: '', name: '' });
  const [savingRow, setSavingRow] = useState<string | null>(null);

  const refreshCatalog = useCallback(async () => {
    try {
      await loadTenantCatalog(tenantId);
    } catch {
      /* cache opcional */
    }
  }, [tenantId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, ar, su, ro, me] = await Promise.all([
        fetchTenantAdminOverview(tenantId),
        listTenantAdminAreas(tenantId),
        listTenantAdminSucursales(tenantId),
        listTenantAdminRoles(tenantId),
        listTenantAdminMembers(tenantId),
      ]);
      setOverview(ov);
      setAreas(ar);
      setSucursales(su);
      setRoles(ro);
      setMembers(me);
      await refreshCatalog();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? err?.message ?? 'Error cargando admin empresa',
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId, refreshCatalog]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const areaNames = useMemo(() => areas.map((a) => a.name), [areas]);
  const sucursalCodes = useMemo(() => sucursales.map((s) => s.code), [sucursales]);

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaForm.name.trim()) return;
    setError(null);
    try {
      await createTenantArea(tenantId, {
        name: areaForm.name.trim(),
        globalView: areaForm.globalView,
      });
      setAreaForm({ name: '', globalView: false });
      setSuccess('Área creada');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error creando área');
    }
  };

  const handleDeleteArea = async (area: TenantAdminArea) => {
    if (!window.confirm(`¿Eliminar área "${area.name}"?`)) return;
    setError(null);
    try {
      await deleteTenantArea(tenantId, area.id);
      setSuccess('Área eliminada');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error eliminando área');
    }
  };

  const handleToggleGlobalView = async (area: TenantAdminArea) => {
    const globalView = !(area.flags?.globalView ?? false);
    setError(null);
    try {
      await updateTenantArea(tenantId, area.id, { globalView });
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error actualizando área');
    }
  };

  const startEditArea = (area: TenantAdminArea) => {
    setEditingAreaId(area.id);
    setAreaDraft({ name: area.name, globalView: area.flags?.globalView ?? false });
    setEditingSucursalId(null);
  };

  const cancelEditArea = () => {
    setEditingAreaId(null);
    setAreaDraft({ name: '', globalView: false });
  };

  const saveAreaInline = async () => {
    if (editingAreaId == null || !areaDraft.name.trim()) return;
    setSavingRow(`area-${editingAreaId}`);
    setError(null);
    try {
      await updateTenantArea(tenantId, editingAreaId, {
        name: areaDraft.name.trim(),
        globalView: areaDraft.globalView,
      });
      setEditingAreaId(null);
      setSuccess('Área actualizada');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error guardando área');
    } finally {
      setSavingRow(null);
    }
  };

  const startEditSucursal = (sucursal: TenantAdminSucursal) => {
    setEditingSucursalId(sucursal.id);
    setSucursalDraft({ code: sucursal.code, name: sucursal.name });
    setEditingAreaId(null);
  };

  const cancelEditSucursal = () => {
    setEditingSucursalId(null);
    setSucursalDraft({ code: '', name: '' });
  };

  const saveSucursalInline = async () => {
    if (
      editingSucursalId == null ||
      !sucursalDraft.code.trim() ||
      !sucursalDraft.name.trim()
    ) {
      return;
    }
    setSavingRow(`sucursal-${editingSucursalId}`);
    setError(null);
    try {
      await updateTenantSucursal(tenantId, editingSucursalId, {
        code: sucursalDraft.code.trim(),
        name: sucursalDraft.name.trim(),
      });
      setEditingSucursalId(null);
      setSuccess('Sucursal actualizada');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error guardando sucursal');
    } finally {
      setSavingRow(null);
    }
  };

  const handleCreateSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sucursalForm.code.trim() || !sucursalForm.name.trim()) return;
    setError(null);
    try {
      await createTenantSucursal(tenantId, {
        code: sucursalForm.code.trim(),
        name: sucursalForm.name.trim(),
      });
      setSucursalForm({ code: '', name: '' });
      setSuccess('Sucursal creada');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error creando sucursal');
    }
  };

  const handleDeleteSucursal = async (sucursal: TenantAdminSucursal) => {
    if (!window.confirm(`¿Eliminar sucursal "${sucursal.name}" (${sucursal.code})?`)) return;
    setError(null);
    try {
      await deleteTenantSucursal(tenantId, sucursal.id);
      setSuccess('Sucursal eliminada');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error eliminando sucursal');
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const created = await createTenantAdminMember(tenantId, {
        ...memberForm,
        area: memberForm.area || areaNames[0] || 'General',
        sucursal: memberForm.sucursal || sucursalCodes[0] || 'HQ',
      });
      setMemberForm(emptyMemberForm);
      setShowMemberForm(false);
      setLastTempPassword(created.temporaryPassword ?? null);
      setSuccess(
        created.temporaryPassword
          ? `Colaborador creado. Contraseña temporal: ${created.temporaryPassword}`
          : 'Colaborador creado',
      );
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error creando colaborador');
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setError(null);
    try {
      await updateTenantAdminMember(tenantId, editingMember.colaboradorId, {
        nombre: memberForm.nombre,
        apellido: memberForm.apellido,
        email: memberForm.email,
        telefono: memberForm.telefono,
        area: memberForm.area,
        sucursal: memberForm.sucursal,
      });
      setEditingMember(null);
      setMemberForm(emptyMemberForm);
      setSuccess('Colaborador actualizado');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error actualizando colaborador');
    }
  };

  const handleDeleteMember = async (member: TenantMember) => {
    const name = `${member.nombre} ${member.apellido}`.trim() || member.nombreUsuario;
    if (!window.confirm(`¿Eliminar colaborador "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError(null);
    try {
      await deleteTenantAdminMember(tenantId, member.colaboradorId);
      setSuccess('Colaborador eliminado');
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error eliminando colaborador');
    }
  };

  const openEditMember = (member: TenantMember) => {
    setEditingMember(member);
    setShowMemberForm(false);
    setMemberForm({
      nombreUsuario: member.nombreUsuario,
      password: '',
      nombre: member.nombre,
      apellido: member.apellido,
      email: member.email,
      telefono: '',
      area: member.area,
      sucursal: member.sucursal,
      roleCode: member.roles[0]?.roleCode ?? 'colaborador',
    });
  };

  const allPermissions = useMemo(() => {
    const set = new Set<string>();
    for (const r of roles) {
      for (const p of r.permissions) set.add(p);
    }
    return Array.from(set).sort();
  }, [roles]);

  const tabsNode = (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTab(id)}
          className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
            tab === id
              ? 'border border-b-white border-slate-200 bg-white text-cyan-700 shadow-sm'
              : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PlatformAdminShell
        loading={loading}
        onRefresh={loadAll}
        badge="Roma Empresa"
        title="Administración del tenant"
        subtitle="Áreas, sucursales, colaboradores, roles y accesos de tu empresa."
        alerts={
          <>
            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
          </>
        }
        tabs={tabsNode}
      >
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PlatformStatCard
            title="Áreas"
            value={overview?.areas ?? '—'}
            icon={GitBranch}
            colorClass="bg-cyan-100 text-cyan-700"
          />
          <PlatformStatCard
            title="Sucursales"
            value={overview?.sucursales ?? '—'}
            icon={MapPin}
            colorClass="bg-violet-100 text-violet-700"
          />
          <PlatformStatCard
            title="Colaboradores"
            value={overview?.members ?? '—'}
            icon={Users}
            colorClass="bg-emerald-100 text-emerald-700"
          />
          <PlatformStatCard
            title="Asignaciones RBAC"
            value={overview?.roleAssignments ?? '—'}
            icon={Shield}
            colorClass="bg-amber-100 text-amber-700"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-2 text-slate-500">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Tenant {tenantId}
            </span>
          </div>

          {tab === 'areas' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateArea} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="min-w-[200px] flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
                  <input
                    value={areaForm.name}
                    onChange={(e) => setAreaForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Ej: Recursos Humanos"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={areaForm.globalView}
                    onChange={(e) => setAreaForm((f) => ({ ...f, globalView: e.target.checked }))}
                  />
                  Vista global
                </label>
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
                  <Plus className="h-4 w-4" />
                  Agregar área
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-2 pr-4">Nombre</th>
                      <th className="py-2 pr-4">Código</th>
                      <th className="py-2 pr-4">Vista global</th>
                      <th className="py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areas.map((area) => {
                      const isEditing = editingAreaId === area.id;
                      const rowSaving = savingRow === `area-${area.id}`;
                      return (
                      <tr key={area.id} className={`border-b border-slate-100 ${isEditing ? 'bg-cyan-50/50' : ''}`}>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <input
                              value={areaDraft.name}
                              onChange={(e) => setAreaDraft((d) => ({ ...d, name: e.target.value }))}
                              className="w-full min-w-[160px] rounded-lg border border-cyan-300 px-2 py-1.5 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium">{area.name}</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-slate-500">{area.code}</td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                              <input
                                type="checkbox"
                                checked={areaDraft.globalView}
                                onChange={(e) => setAreaDraft((d) => ({ ...d, globalView: e.target.checked }))}
                              />
                              Vista global
                            </label>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleGlobalView(area)}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                area.flags?.globalView
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {area.flags?.globalView ? 'Sí' : 'No'}
                            </button>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  disabled={rowSaving}
                                  onClick={saveAreaInline}
                                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2 py-1 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
                                >
                                  {rowSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  disabled={rowSaving}
                                  onClick={cancelEditArea}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditArea(area)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteArea(area)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );})}
                    {!areas.length && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Sin áreas configuradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'sucursales' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateSucursal} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Código</label>
                  <input
                    value={sucursalForm.code}
                    onChange={(e) => setSucursalForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase"
                    placeholder="HQ"
                  />
                </div>
                <div className="min-w-[200px] flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
                  <input
                    value={sucursalForm.name}
                    onChange={(e) => setSucursalForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Casa central"
                  />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
                  <Plus className="h-4 w-4" />
                  Agregar sucursal
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-2 pr-4">Código</th>
                      <th className="py-2 pr-4">Nombre</th>
                      <th className="py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sucursales.map((s) => {
                      const isEditing = editingSucursalId === s.id;
                      const rowSaving = savingRow === `sucursal-${s.id}`;
                      return (
                      <tr key={s.id} className={`border-b border-slate-100 ${isEditing ? 'bg-cyan-50/50' : ''}`}>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <input
                              value={sucursalDraft.code}
                              onChange={(e) => setSucursalDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
                              className="w-24 rounded-lg border border-cyan-300 px-2 py-1.5 font-mono text-sm uppercase"
                              autoFocus
                            />
                          ) : (
                            <span className="font-mono font-semibold">{s.code}</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <input
                              value={sucursalDraft.name}
                              onChange={(e) => setSucursalDraft((d) => ({ ...d, name: e.target.value }))}
                              className="w-full min-w-[160px] rounded-lg border border-cyan-300 px-2 py-1.5 text-sm"
                            />
                          ) : (
                            s.name
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  disabled={rowSaving}
                                  onClick={saveSucursalInline}
                                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2 py-1 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
                                >
                                  {rowSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  disabled={rowSaving}
                                  onClick={cancelEditSucursal}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditSucursal(s)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSucursal(s)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );})}
                    {!sucursales.length && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          Sin sucursales configuradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'roles' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Los roles y permisos vienen del catálogo Roma. Acá podés ver qué accede cada rol;
                la asignación a colaboradores se hace en la pestaña Colaboradores.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">{roleLabel(role.code)}</h3>
                        <p className="font-mono text-xs text-slate-500">{role.code}</p>
                      </div>
                      {!role.assignableByTenant && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Solo plataforma
                        </span>
                      )}
                    </div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                      {role.permissions.length} permisos
                    </p>
                    <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
                      {role.permissions.map((p) => (
                        <li key={p} className="rounded bg-slate-50 px-2 py-1">
                          {permLabel(p)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'colaboradores' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMemberForm(true);
                    setEditingMember(null);
                    setMemberForm({
                      ...emptyMemberForm,
                      area: areaNames[0] ?? '',
                      sucursal: sucursalCodes[0] ?? '',
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo colaborador
                </button>
                {lastTempPassword && (
                  <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Última contraseña temporal: <strong>{lastTempPassword}</strong>
                  </span>
                )}
              </div>

              {(showMemberForm || editingMember) && (
                <form
                  onSubmit={editingMember ? handleUpdateMember : handleCreateMember}
                  className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2"
                >
                  {!editingMember && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Usuario</label>
                        <input
                          required
                          value={memberForm.nombreUsuario}
                          onChange={(e) => setMemberForm((f) => ({ ...f, nombreUsuario: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Contraseña (opcional)</label>
                        <input
                          type="password"
                          value={memberForm.password}
                          onChange={(e) => setMemberForm((f) => ({ ...f, password: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Auto-generada si vacío"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
                    <input
                      required
                      value={memberForm.nombre}
                      onChange={(e) => setMemberForm((f) => ({ ...f, nombre: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Apellido</label>
                    <input
                      required
                      value={memberForm.apellido}
                      onChange={(e) => setMemberForm((f) => ({ ...f, apellido: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                    <input
                      type="email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  {!editingMember && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Rol inicial</label>
                      <select
                        value={memberForm.roleCode}
                        onChange={(e) => setMemberForm((f) => ({ ...f, roleCode: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        {TENANT_ASSIGNABLE_ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Área</label>
                    <select
                      required
                      value={memberForm.area}
                      onChange={(e) => setMemberForm((f) => ({ ...f, area: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      {areaNames.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Sucursal</label>
                    <select
                      required
                      value={memberForm.sucursal}
                      onChange={(e) => setMemberForm((f) => ({ ...f, sucursal: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      {sucursalCodes.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 md:col-span-2">
                    <button type="submit" className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
                      {editingMember ? 'Guardar cambios' : 'Crear colaborador'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMemberForm(false);
                        setEditingMember(null);
                        setMemberForm(emptyMemberForm);
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-2 pr-4">Colaborador</th>
                      <th className="py-2 pr-4">Área / Sucursal</th>
                      <th className="py-2 pr-4">Roles</th>
                      <th className="py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.colaboradorId} className="border-b border-slate-100">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{m.nombre} {m.apellido}</div>
                          <div className="text-xs text-slate-500">@{m.nombreUsuario}</div>
                        </td>
                        <td className="py-3 pr-4 text-xs">
                          {m.area || '—'} · {m.sucursal || '—'}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {m.roles.map((r) => (
                              <span
                                key={r.roleCode}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                              >
                                {roleLabel(r.roleCode)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => setRolesMember(m)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-cyan-700 hover:bg-cyan-50"
                            >
                              <UserCog className="h-4 w-4" />
                              Roles
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditMember(m)}
                              className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-50"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(m)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!members.length && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Sin colaboradores
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'accesos' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Matriz de permisos por rol. Los accesos se definen en Roma; acá solo consultás qué
                incluye cada rol.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="sticky left-0 bg-white py-2 pr-4 font-semibold text-slate-600">
                        Permiso
                      </th>
                      {roles.map((r) => (
                        <th key={r.id} className="px-2 py-2 text-center font-semibold text-slate-600">
                          {roleLabel(r.code)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allPermissions.map((perm) => (
                      <tr key={perm} className="border-b border-slate-100">
                        <td className="sticky left-0 bg-white py-2 pr-4">
                          <div className="font-medium text-slate-800">{permLabel(perm)}</div>
                          <div className="font-mono text-[10px] text-slate-400">{perm}</div>
                        </td>
                        {roles.map((r) => (
                          <td key={r.id} className="px-2 py-2 text-center">
                            {r.permissions.includes(perm) ? (
                              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            ) : (
                              <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-200" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          )}
        </div>
      </PlatformAdminShell>

      <MemberRolesModal
        tenantId={tenantId}
        member={rolesMember}
        open={!!rolesMember}
        onClose={() => setRolesMember(null)}
        onSaved={(updated) => {
          setMembers((prev) =>
            prev.map((m) => (m.colaboradorId === updated.colaboradorId ? updated : m)),
          );
          setSuccess('Roles actualizados');
        }}
        setMemberRoles={setTenantAdminMemberRoles}
      />
    </>
  );
};

export default TenantAdminPanel;
