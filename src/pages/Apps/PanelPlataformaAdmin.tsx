import React, { useCallback, useEffect, useState } from 'react';
import {
  platformAdminService,
  type CreateColaboradorResult,
  type PlatformTenant,
} from '../../services/platformAdminService';
import { TenantCatalog } from '../../types/tenantRbac';

type TabId = 'tenants' | 'colaboradores';

const ROLE_OPTIONS = [
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'manager', label: 'Manager' },
  { value: 'manager_high', label: 'Manager alto' },
  { value: 'desempeno_viewer', label: 'Desempeño' },
  { value: 'platform_admin', label: 'Admin plataforma' },
];

const PanelPlataformaAdmin: React.FC = () => {
  const [tab, setTab] = useState<TabId>('tenants');
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tenantForm, setTenantForm] = useState({
    tenantId: '',
    displayName: '',
    areasText: 'Sistemas, Comercial, Administración, Depósito',
    sucursalesText: 'MDP, PICO, DIMES, ROSARIO',
    empresaPanelUser: '',
    empresaPanelPass: '',
    empresaPanelEmail: '',
  });

  const [selectedTenant, setSelectedTenant] = useState('default');
  const [catalog, setCatalog] = useState<TenantCatalog | null>(null);
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
    setLoading(true);
    setError(null);
    try {
      const list = await platformAdminService.listTenants();
      setTenants(list);
      if (list.length && !list.find((t) => t.id === selectedTenant)) {
        setSelectedTenant(list[0].id);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error cargando tenants');
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  const loadCatalog = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      const data = await platformAdminService.getTenantCatalog(tenantId);
      setCatalog(data);
      if (data.areas.length && !colabForm.area) {
        setColabForm((f) => ({ ...f, area: data.areas[0].name }));
      }
      if (data.sucursales.length && !colabForm.sucursal) {
        setColabForm((f) => ({ ...f, sucursal: data.sucursales[0].code }));
      }
    } catch (e: any) {
      setCatalog(null);
      setError(e?.response?.data?.message ?? 'No se pudo cargar catálogo del tenant');
    }
  }, [colabForm.area, colabForm.sucursal]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (tab === 'colaboradores' && selectedTenant) {
      void loadCatalog(selectedTenant);
    }
  }, [tab, selectedTenant, loadCatalog]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const areas = tenantForm.areasText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const sucursales = tenantForm.sucursalesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await platformAdminService.createTenant({
        tenantId: tenantForm.tenantId.trim().toLowerCase(),
        displayName: tenantForm.displayName.trim(),
        areas,
        sucursales,
        seedDefaultRoles: true,
        empresaPanelUser: tenantForm.empresaPanelUser || undefined,
        empresaPanelPass: tenantForm.empresaPanelPass || undefined,
        empresaPanelEmail: tenantForm.empresaPanelEmail || undefined,
        empresaPanelNombre: tenantForm.displayName.trim(),
      });
      setSuccess(`Tenant "${result.tenantId}" creado correctamente.`);
      setTenantForm({
        tenantId: '',
        displayName: '',
        areasText: 'Sistemas, Comercial, Administración, Depósito',
        sucursalesText: 'MDP, PICO',
        empresaPanelUser: '',
        empresaPanelPass: '',
        empresaPanelEmail: '',
      });
      await loadTenants();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error creando tenant');
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
      const wa = result.whatsAppSent
        ? ' WhatsApp enviado.'
        : result.whatsAppError
          ? ` WhatsApp: ${result.whatsAppError}`
          : '';
      setSuccess(
        `Colaborador #${result.colaboradorId} (${result.nombreUsuario}) creado.${wa}`,
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error creando colaborador');
    } finally {
      setLoading(false);
    }
  };

  const handleResendWhatsApp = async () => {
    if (!lastCreated) return;
    setLoading(true);
    setError(null);
    try {
      await platformAdminService.sendCredentials(
        lastCreated.tenantId,
        lastCreated.colaboradorId,
        lastCreated.temporaryPassword,
      );
      setSuccess('Credenciales reenviadas por WhatsApp.');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error enviando WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Admin plataforma Roma</h1>
      <p className="mb-6 text-sm text-slate-600">
        Alta de empresas (tenants), colaboradores y envío de credenciales por WhatsApp.
      </p>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {(['tenants', 'colaboradores'] as TabId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === id
                ? 'border-b-2 border-cyan-600 text-cyan-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {id === 'tenants' ? 'Empresas' : 'Colaboradores'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {tab === 'tenants' && (
        <div className="grid gap-8 md:grid-cols-2">
          <form onSubmit={handleCreateTenant} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Nueva empresa</h2>
            <label className="block text-sm">
              <span className="text-slate-600">ID tenant (slug)</span>
              <input
                required
                pattern="[a-z0-9][a-z0-9_-]*"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={tenantForm.tenantId}
                onChange={(e) => setTenantForm({ ...tenantForm, tenantId: e.target.value })}
                placeholder="acme-corp"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Nombre visible</span>
              <input
                required
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={tenantForm.displayName}
                onChange={(e) => setTenantForm({ ...tenantForm, displayName: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Áreas (separadas por coma)</span>
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={tenantForm.areasText}
                onChange={(e) => setTenantForm({ ...tenantForm, areasText: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Sucursales (códigos, coma)</span>
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={tenantForm.sucursalesText}
                onChange={(e) => setTenantForm({ ...tenantForm, sucursalesText: e.target.value })}
              />
            </label>
            <fieldset className="rounded border border-slate-200 p-3">
              <legend className="px-1 text-sm font-medium text-slate-700">Panel empresa (opcional)</legend>
              <label className="mt-2 block text-sm">
                Usuario panel
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={tenantForm.empresaPanelUser}
                  onChange={(e) => setTenantForm({ ...tenantForm, empresaPanelUser: e.target.value })}
                />
              </label>
              <label className="mt-2 block text-sm">
                Email panel
                <input
                  type="email"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={tenantForm.empresaPanelEmail}
                  onChange={(e) => setTenantForm({ ...tenantForm, empresaPanelEmail: e.target.value })}
                />
              </label>
              <label className="mt-2 block text-sm">
                Contraseña panel
                <input
                  type="password"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={tenantForm.empresaPanelPass}
                  onChange={(e) => setTenantForm({ ...tenantForm, empresaPanelPass: e.target.value })}
                />
              </label>
            </fieldset>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-600 py-2.5 font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              Crear empresa
            </button>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Empresas registradas</h2>
            {loading && <p className="text-sm text-slate-500">Cargando…</p>}
            <ul className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <li key={t.id} className="py-3">
                  <div className="font-medium text-slate-900">{t.displayName}</div>
                  <div className="text-xs text-slate-500">
                    <code>{t.id}</code> · {t.isActive ? 'activo' : 'inactivo'}
                  </div>
                </li>
              ))}
              {!tenants.length && !loading && (
                <li className="py-4 text-sm text-slate-500">Sin tenants todavía.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {tab === 'colaboradores' && (
        <form onSubmit={handleCreateColaborador} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Nuevo colaborador</h2>
          <label className="block text-sm">
            Empresa (tenant)
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName} ({t.id})
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              Usuario login
              <input
                required
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={colabForm.nombreUsuario}
                onChange={(e) => setColabForm({ ...colabForm, nombreUsuario: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Contraseña (vacío = autogenerada)
              <input
                type="text"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={colabForm.password}
                onChange={(e) => setColabForm({ ...colabForm, password: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Nombre
              <input
                required
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={colabForm.nombre}
                onChange={(e) => setColabForm({ ...colabForm, nombre: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Apellido
              <input
                required
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={colabForm.apellido}
                onChange={(e) => setColabForm({ ...colabForm, apellido: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={colabForm.email}
                onChange={(e) => setColabForm({ ...colabForm, email: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Teléfono (WhatsApp)
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={colabForm.telefono}
                onChange={(e) => setColabForm({ ...colabForm, telefono: e.target.value })}
                placeholder="2235xxxxxx"
              />
            </label>
            <label className="block text-sm">
              Área
              <select
                required
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
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
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
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
              Rol
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={colabForm.roleCode}
                onChange={(e) => setColabForm({ ...colabForm, roleCode: e.target.value })}
              >
                {ROLE_OPTIONS.map((r) => (
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
            Enviar credenciales por WhatsApp al crear
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-6 py-2.5 font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            Crear colaborador
          </button>

          {lastCreated && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-medium text-amber-900">Credenciales generadas</p>
              <p>
                Usuario: <code>{lastCreated.nombreUsuario}</code>
              </p>
              <p>
                Contraseña: <code>{lastCreated.temporaryPassword}</code>
              </p>
              <p className="mt-2 text-xs text-amber-800">
                Guardá esto: no se vuelve a mostrar si no reenviás por WhatsApp.
              </p>
              {colabForm.telefono && (
                <button
                  type="button"
                  onClick={handleResendWhatsApp}
                  className="mt-3 rounded border border-amber-400 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                >
                  Reenviar por WhatsApp
                </button>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default PanelPlataformaAdmin;
