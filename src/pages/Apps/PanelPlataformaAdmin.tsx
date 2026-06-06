import React, { useCallback, useEffect, useState } from 'react';
import {
  platformAdminService,
  type CreateColaboradorResult,
  type PlatformTenant,
  type TenantDetail,
} from '../../services/platformAdminService';
import { TenantCatalog } from '../../types/tenantRbac';
import { clearTenantConfigCache } from '../../services/tenantConfigService';
import TenantOnboardingWizard, {
  type WizardFormState,
  type WizardSubmitResult,
} from './TenantOnboardingWizard';

type TabId = 'resumen' | 'config' | 'colaboradores' | 'nuevo';

const ROLE_OPTIONS = [
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'manager', label: 'Manager' },
  { value: 'manager_high', label: 'Manager alto' },
  { value: 'manager_low', label: 'Manager bajo' },
  { value: 'desempeno_viewer', label: 'Desempeño' },
  { value: 'depo_sucursal_leader', label: 'Líder depósito' },
  { value: 'platform_admin', label: 'Admin plataforma' },
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
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

const PanelPlataformaAdmin: React.FC = () => {
  const [tab, setTab] = useState<TabId>('resumen');
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('default');
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [catalog, setCatalog] = useState<TenantCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [configForm, setConfigForm] = useState({
    displayName: '',
    logoUrl: '/assets/images/roma.jpeg',
    accentColor: '#FDD05B',
    areasText: '',
    mundialHome: false,
    miDesempenoHomeTile: true,
    commercialGeoCheckIn: false,
    mfaRequired: false,
  });

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

  const loadTenants = useCallback(async () => {
    const list = await platformAdminService.listTenants();
    setTenants(list);
    if (list.length && !list.find((t) => t.id === selectedTenant)) {
      setSelectedTenant(list[0].id);
    }
    return list;
  }, [selectedTenant]);

  const loadDetail = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    const d = await platformAdminService.getTenantDetail(tenantId);
    setDetail(d);
    setConfigForm({
      displayName: d.config.branding?.displayName ?? d.displayName,
      logoUrl: d.config.branding?.logoUrl ?? '/assets/images/roma.jpeg',
      accentColor: d.config.branding?.accentColor ?? '#FDD05B',
      areasText: (d.config.areas ?? []).join(', '),
      mundialHome: d.config.features?.mundialHome === true,
      miDesempenoHomeTile: d.config.features?.miDesempenoHomeTile !== false,
      commercialGeoCheckIn: d.config.features?.commercialGeoCheckIn === true,
      mfaRequired: d.config.security?.mfaRequired === true,
    });
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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadTenants();
      await Promise.all([
        loadDetail(selectedTenant),
        loadCatalog(selectedTenant),
      ]);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [loadTenants, loadDetail, loadCatalog, selectedTenant]);

  useEffect(() => {
    void refresh();
  }, [selectedTenant]);

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
    setTab('resumen');
    setSuccess(`Tenant "${tenantId}" listo.`);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const areas = configForm.areasText.split(',').map((s) => s.trim()).filter(Boolean);
      const updated = await platformAdminService.updateTenantConfig(selectedTenant, {
        displayName: configForm.displayName.trim(),
        logoUrl: configForm.logoUrl.trim(),
        accentColor: configForm.accentColor.trim(),
        areas,
        mundialHome: configForm.mundialHome,
        miDesempenoHomeTile: configForm.miDesempenoHomeTile,
        commercialGeoCheckIn: configForm.commercialGeoCheckIn,
        mfaRequired: configForm.mfaRequired,
      });
      setDetail(updated);
      clearTenantConfigCache(selectedTenant);
      setSuccess('Configuración guardada.');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error guardando config');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!detail) return;
    setLoading(true);
    setError(null);
    try {
      await platformAdminService.setTenantActive(selectedTenant, !detail.isActive);
      setSuccess(detail.isActive ? 'Tenant desactivado.' : 'Tenant activado.');
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
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error creando colaborador');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'config', label: 'Branding & features' },
    { id: 'colaboradores', label: 'Colaboradores' },
    { id: 'nuevo', label: '+ Nueva empresa' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-5 md:px-8">
        <h1 className="text-2xl font-bold text-slate-900">Plataforma Roma</h1>
        <p className="text-sm text-slate-600">
          Onboarding de empresas, branding por tenant y alta de colaboradores.
        </p>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:flex-row md:p-8">
        <aside className="w-full shrink-0 md:w-64">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Empresas
            </h2>
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {tenants.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedTenant(t.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      selectedTenant === t.id
                        ? 'bg-cyan-50 font-medium text-cyan-800 ring-1 ring-cyan-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>{t.displayName}</div>
                    <div className="text-xs text-slate-400">
                      <code>{t.id}</code>
                      {!t.isActive && ' · inactivo'}
                    </div>
                  </button>
                </li>
              ))}
              {!tenants.length && (
                <li className="py-4 text-sm text-slate-500">Sin tenants.</li>
              )}
            </ul>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {error && <Alert type="error">{typeof error === 'string' ? error : JSON.stringify(error)}</Alert>}
          {success && <Alert type="success">{success}</Alert>}

          <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  tab === t.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              disabled={loading}
              onClick={() => void refresh()}
              className="ml-auto rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white hover:ring-1 hover:ring-slate-200"
            >
              {loading ? 'Actualizando…' : '↻ Actualizar'}
            </button>
          </div>

          {tab === 'resumen' && detail && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{detail.displayName}</h2>
                  <p className="text-sm text-slate-500">
                    ID: <code>{detail.id}</code> · Creado{' '}
                    {new Date(detail.createdAt).toLocaleDateString('es-AR')}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      detail.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {detail.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggleActive()}
                  disabled={loading}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  {detail.isActive ? 'Desactivar tenant' : 'Activar tenant'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="Colaboradores" value={detail.stats.colaboradores} />
                <StatCard label="Áreas" value={detail.stats.areas} />
                <StatCard label="Sucursales" value={detail.stats.sucursales} />
                <StatCard label="Asignaciones RBAC" value={detail.stats.roleAssignments} />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-slate-800">Features activas</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>{detail.config.features?.mundialHome ? '✓' : '○'} Mundial en Home</li>
                  <li>{detail.config.features?.miDesempenoHomeTile !== false ? '✓' : '○'} Tile Mi Desempeño</li>
                  <li>{detail.config.features?.commercialGeoCheckIn ? '✓' : '○'} Geo check-in Comercial</li>
                  <li>{detail.config.security?.mfaRequired ? '✓' : '○'} MFA obligatorio (managers/admins)</li>
                </ul>
              </div>

              {catalog?.assignments && catalog.assignments.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-3 font-semibold text-slate-800">Roles asignados</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="py-2 pr-4">Colaborador</th>
                          <th className="py-2 pr-4">Rol</th>
                          <th className="py-2">Área</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalog.assignments.map((a, i) => (
                          <tr key={`${a.colaboradorId}-${a.roleCode}-${i}`} className="border-b border-slate-100">
                            <td className="py-2 pr-4 font-mono text-xs">#{a.colaboradorId}</td>
                            <td className="py-2 pr-4">{a.roleCode}</td>
                            <td className="py-2">{a.areaName ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Branding & features — {selectedTenant}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  Nombre visible
                  <input
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={configForm.displayName}
                    onChange={(e) => setConfigForm({ ...configForm, displayName: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Color acento
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={configForm.accentColor}
                    onChange={(e) => setConfigForm({ ...configForm, accentColor: e.target.value })}
                  />
                </label>
                <label className="col-span-full block text-sm">
                  Logo URL
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={configForm.logoUrl}
                    onChange={(e) => setConfigForm({ ...configForm, logoUrl: e.target.value })}
                  />
                </label>
                <label className="col-span-full block text-sm">
                  Áreas (coma)
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={configForm.areasText}
                    onChange={(e) => setConfigForm({ ...configForm, areasText: e.target.value })}
                  />
                </label>
              </div>
              <fieldset className="rounded-lg border border-slate-200 p-4">
                <legend className="px-1 text-sm font-medium">Features</legend>
                <div className="mt-2 space-y-2">
                  {[
                    { key: 'mundialHome' as const, label: 'Mundial en Home' },
                    { key: 'miDesempenoHomeTile' as const, label: 'Tile Mi Desempeño en Home' },
                    { key: 'commercialGeoCheckIn' as const, label: 'Marcar posición (Comercial)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={configForm[key]}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, [key]: e.target.checked })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="rounded-lg border border-slate-200 p-4">
                <legend className="px-1 text-sm font-medium">Seguridad</legend>
                <label className="mt-2 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={configForm.mfaRequired}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, mfaRequired: e.target.checked })
                    }
                  />
                  <span>
                    Exigir MFA (TOTP) a admins y managers de esta empresa
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Requiere flags MFA_ENFORCE_* activos en el servidor.
                    </span>
                  </span>
                </label>
              </fieldset>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-cyan-600 px-6 py-2.5 font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                Guardar configuración
              </button>
            </form>
          )}

          {tab === 'colaboradores' && (
            <form onSubmit={handleCreateColaborador} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Alta colaborador — {selectedTenant}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  Usuario login
                  <input required className="mt-1 w-full rounded-lg border px-3 py-2" value={colabForm.nombreUsuario} onChange={(e) => setColabForm({ ...colabForm, nombreUsuario: e.target.value })} />
                </label>
                <label className="block text-sm">
                  Contraseña (vacío = auto)
                  <input className="mt-1 w-full rounded-lg border px-3 py-2" value={colabForm.password} onChange={(e) => setColabForm({ ...colabForm, password: e.target.value })} />
                </label>
                <label className="block text-sm">
                  Nombre
                  <input required className="mt-1 w-full rounded-lg border px-3 py-2" value={colabForm.nombre} onChange={(e) => setColabForm({ ...colabForm, nombre: e.target.value })} />
                </label>
                <label className="block text-sm">
                  Apellido
                  <input required className="mt-1 w-full rounded-lg border px-3 py-2" value={colabForm.apellido} onChange={(e) => setColabForm({ ...colabForm, apellido: e.target.value })} />
                </label>
                <label className="block text-sm">
                  Email
                  <input type="email" className="mt-1 w-full rounded-lg border px-3 py-2" value={colabForm.email} onChange={(e) => setColabForm({ ...colabForm, email: e.target.value })} />
                </label>
                <label className="block text-sm">
                  Teléfono WhatsApp
                  <input className="mt-1 w-full rounded-lg border px-3 py-2" value={colabForm.telefono} onChange={(e) => setColabForm({ ...colabForm, telefono: e.target.value })} />
                </label>
                <label className="block text-sm">
                  Área
                  <select required className="mt-1 w-full rounded-lg border px-3 py-2" value={colabForm.area} onChange={(e) => setColabForm({ ...colabForm, area: e.target.value })}>
                    {(catalog?.areas ?? []).map((a) => (
                      <option key={a.code} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Sucursal
                  <select required className="mt-1 w-full rounded-lg border px-3 py-2" value={colabForm.sucursal} onChange={(e) => setColabForm({ ...colabForm, sucursal: e.target.value })}>
                    {(catalog?.sucursales ?? []).map((s) => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Rol
                  <select className="mt-1 w-full rounded-lg border px-3 py-2" value={colabForm.roleCode} onChange={(e) => setColabForm({ ...colabForm, roleCode: e.target.value })}>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={colabForm.sendWhatsApp} onChange={(e) => setColabForm({ ...colabForm, sendWhatsApp: e.target.checked })} />
                Enviar credenciales por WhatsApp
              </label>
              <button type="submit" disabled={loading} className="rounded-lg bg-cyan-600 px-6 py-2.5 font-medium text-white hover:bg-cyan-700 disabled:opacity-50">
                Crear colaborador
              </button>
              {lastCreated && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                  <p className="font-medium">Credenciales</p>
                  <p>Usuario: <code>{lastCreated.nombreUsuario}</code></p>
                  <p>Contraseña: <code>{lastCreated.temporaryPassword}</code></p>
                </div>
              )}
            </form>
          )}

          {tab === 'nuevo' && (
            <TenantOnboardingWizard
              loading={loading}
              onSubmit={handleWizardSubmit}
              onDone={handleWizardDone}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default PanelPlataformaAdmin;
