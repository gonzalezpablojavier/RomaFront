import React, { useMemo, useState } from 'react';

export interface WizardFormState {
  tenantId: string;
  displayName: string;
  logoUrl: string;
  accentColor: string;
  areasText: string;
  sucursalesText: string;
  mundialHome: boolean;
  miDesempenoHomeTile: boolean;
  commercialGeoCheckIn: boolean;
  createAdmin: boolean;
  adminNombre: string;
  adminApellido: string;
  adminUsuario: string;
  adminPassword: string;
  adminEmail: string;
  adminTelefono: string;
  adminSendWhatsApp: boolean;
  adminRoleCode: string;
}

export interface WizardSubmitResult {
  tenantId: string;
  displayName: string;
  admin?: {
    colaboradorId: number;
    nombreUsuario: string;
    temporaryPassword: string;
    whatsAppSent: boolean;
    whatsAppError: string | null;
  };
}

const INITIAL_FORM: WizardFormState = {
  tenantId: '',
  displayName: '',
  logoUrl: '/assets/images/roma.jpeg',
  accentColor: '#FDD05B',
  areasText: 'Sistemas, Comercial, Administración, Depósito',
  sucursalesText: 'MDP, PICO',
  mundialHome: false,
  miDesempenoHomeTile: true,
  commercialGeoCheckIn: false,
  createAdmin: true,
  adminNombre: '',
  adminApellido: '',
  adminUsuario: '',
  adminPassword: '',
  adminEmail: '',
  adminTelefono: '',
  adminSendWhatsApp: true,
  adminRoleCode: 'manager_high',
};

const STEPS = [
  { id: 1, title: 'Identidad', hint: 'Nombre y branding' },
  { id: 2, title: 'Estructura', hint: 'Áreas y sucursales' },
  { id: 3, title: 'Features', hint: 'Módulos del Home' },
  { id: 4, title: 'Admin RRHH', hint: 'Primer usuario' },
  { id: 5, title: 'Confirmar', hint: 'Revisión final' },
] as const;

function slugifyTenantId(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function parseList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function BrandingPreview({
  displayName,
  logoUrl,
  accentColor,
}: {
  displayName: string;
  logoUrl: string;
  accentColor: string;
}) {
  return (
    <div
      className="rounded-xl border border-slate-200 p-4"
      style={{ borderTopColor: accentColor, borderTopWidth: 4 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100"
          style={{ boxShadow: `0 0 0 2px ${accentColor}33` }}
        >
          <img
            src={logoUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/images/roma.jpeg';
            }}
          />
        </div>
        <div>
          <div className="font-semibold text-slate-900">
            {displayName || 'Nombre de la empresa'}
          </div>
          <div className="text-xs text-slate-500">Vista previa del Home</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {['Inicio', 'Vacaciones', 'Presentismo'].map((tile) => (
          <div
            key={tile}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700"
            style={{ backgroundColor: `${accentColor}44` }}
          >
            {tile}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TenantOnboardingWizardProps {
  loading: boolean;
  onSubmit: (form: WizardFormState) => Promise<WizardSubmitResult>;
  onDone: (tenantId: string) => void;
}

const TenantOnboardingWizard: React.FC<TenantOnboardingWizardProps> = ({
  loading,
  onSubmit,
  onDone,
}) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormState>(INITIAL_FORM);
  const [tenantIdTouched, setTenantIdTouched] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [result, setResult] = useState<WizardSubmitResult | null>(null);

  const areas = useMemo(() => parseList(form.areasText), [form.areasText]);
  const sucursales = useMemo(() => parseList(form.sucursalesText), [form.sucursalesText]);

  const patch = (partial: Partial<WizardFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const handleDisplayNameChange = (displayName: string) => {
    const next: Partial<WizardFormState> = { displayName };
    if (!tenantIdTouched) {
      next.tenantId = slugifyTenantId(displayName);
    }
    patch(next);
  };

  const validateStep = (current: number): string | null => {
    if (current === 1) {
      if (!form.displayName.trim()) return 'Ingresá el nombre visible de la empresa.';
      if (!/^[a-z0-9][a-z0-9_-]*$/.test(form.tenantId.trim())) {
        return 'El ID tenant debe ser un slug (minúsculas, números, guión).';
      }
    }
    if (current === 2) {
      if (!areas.length) return 'Definí al menos un área.';
      if (!sucursales.length) return 'Definí al menos una sucursal.';
    }
    if (current === 4 && form.createAdmin) {
      if (!form.adminNombre.trim() || !form.adminApellido.trim()) {
        return 'Nombre y apellido del admin son obligatorios.';
      }
      if (!form.adminUsuario.trim()) return 'Usuario de login del admin es obligatorio.';
      if (form.adminPassword.trim() && form.adminPassword.trim().length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres.';
      }
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const err = validateStep(4);
    if (err) {
      setStepError(err);
      setStep(4);
      return;
    }
    setStepError(null);
    try {
      const created = await onSubmit(form);
      setResult(created);
      setStep(STEPS.length);
    } catch {
      // error handled by parent
    }
  };

  if (result) {
    return (
      <div className="max-w-xl space-y-4 rounded-xl border border-green-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-green-800">Empresa creada</h2>
        <p className="text-sm text-slate-600">
          <strong>{result.displayName}</strong> (<code>{result.tenantId}</code>) está lista.
        </p>
        {result.admin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-medium text-amber-900">Admin RRHH</p>
            <p>
              Usuario: <code>{result.admin.nombreUsuario}</code>
            </p>
            <p>
              Contraseña: <code>{result.admin.temporaryPassword}</code>
            </p>
            {result.admin.whatsAppSent && (
              <p className="mt-1 text-green-700">Credenciales enviadas por WhatsApp.</p>
            )}
            {result.admin.whatsAppError && (
              <p className="mt-1 text-red-700">WhatsApp: {result.admin.whatsAppError}</p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => onDone(result.tenantId)}
          className="rounded-lg bg-cyan-600 px-6 py-2.5 font-medium text-white hover:bg-cyan-700"
        >
          Ir al resumen del tenant
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Wizard — Nueva empresa</h2>
        <p className="text-sm text-slate-500">Onboarding guiado en {STEPS.length} pasos</p>
      </div>

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <li
            key={s.id}
            className={`flex-1 min-w-[5.5rem] rounded-lg px-2 py-2 text-center text-xs ${
              step === s.id
                ? 'bg-cyan-600 font-medium text-white'
                : step > s.id
                  ? 'bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100'
                  : 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
            }`}
          >
            <div>{s.id}. {s.title}</div>
            <div className="hidden opacity-80 sm:block">{s.hint}</div>
          </li>
        ))}
      </ol>

      {stepError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {stepError}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <label className="block text-sm">
            Nombre visible
            <input
              required
              autoFocus
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="Acme Corp"
            />
          </label>
          <label className="block text-sm">
            ID tenant (slug)
            <input
              required
              pattern="[a-z0-9][a-z0-9_-]*"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              value={form.tenantId}
              onChange={(e) => {
                setTenantIdTouched(true);
                patch({ tenantId: e.target.value.toLowerCase() });
              }}
              placeholder="acme-corp"
            />
            <span className="mt-1 block text-xs text-slate-400">
              Se genera automático desde el nombre; podés editarlo.
            </span>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              Logo URL
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.logoUrl}
                onChange={(e) => patch({ logoUrl: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Color acento
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  className="h-10 w-12 cursor-pointer rounded border border-slate-300"
                  value={form.accentColor}
                  onChange={(e) => patch({ accentColor: e.target.value })}
                />
                <input
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                  value={form.accentColor}
                  onChange={(e) => patch({ accentColor: e.target.value })}
                />
              </div>
            </label>
          </div>
          <BrandingPreview
            displayName={form.displayName}
            logoUrl={form.logoUrl}
            accentColor={form.accentColor}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <label className="block text-sm">
            Áreas (separadas por coma)
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.areasText}
              onChange={(e) => patch({ areasText: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <span key={a} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {a}
              </span>
            ))}
          </div>
          <label className="block text-sm">
            Sucursales (códigos, coma)
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.sucursalesText}
              onChange={(e) => patch({ sucursalesText: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {sucursales.map((s) => (
              <span key={s} className="rounded-full bg-cyan-50 px-3 py-1 text-xs text-cyan-800">
                {s.toUpperCase()}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Tip: podés copiar la estructura de Roma (Sistemas, Comercial…) o armar una más chica
            para pilotos.
          </p>
        </div>
      )}

      {step === 3 && (
        <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium">Features del Home</legend>
          {[
            {
              key: 'mundialHome' as const,
              label: 'Mundial en Home',
              desc: 'Tile del mundial de predicciones',
            },
            {
              key: 'miDesempenoHomeTile' as const,
              label: 'Mi Desempeño en Home',
              desc: 'Acceso rápido al módulo de desempeño',
            },
            {
              key: 'commercialGeoCheckIn' as const,
              label: 'Geo check-in Comercial',
              desc: 'Marcar posición GPS en presentismo comercial',
            },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex cursor-pointer gap-3 rounded-lg p-2 hover:bg-slate-50">
              <input
                type="checkbox"
                className="mt-1"
                checked={form[key]}
                onChange={(e) => patch({ [key]: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium text-slate-800">{label}</span>
                <span className="block text-xs text-slate-500">{desc}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.createAdmin}
              onChange={(e) => patch({ createAdmin: e.target.checked })}
            />
            Crear admin RRHH inicial (recomendado)
          </label>
          {form.createAdmin && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                Nombre
                <input
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.adminNombre}
                  onChange={(e) => patch({ adminNombre: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Apellido
                <input
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.adminApellido}
                  onChange={(e) => patch({ adminApellido: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Usuario login
                <input
                  required
                  className="mt-1 w-full rounded-lg border px-3 py-2 font-mono"
                  value={form.adminUsuario}
                  onChange={(e) => patch({ adminUsuario: e.target.value })}
                  placeholder="admin.acme"
                />
              </label>
              <label className="block text-sm">
                Contraseña (vacío = auto)
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.adminPassword}
                  onChange={(e) => patch({ adminPassword: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.adminEmail}
                  onChange={(e) => patch({ adminEmail: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Teléfono WhatsApp
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.adminTelefono}
                  onChange={(e) => patch({ adminTelefono: e.target.value })}
                />
              </label>
              <label className="block text-sm md:col-span-2">
                Rol inicial
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={form.adminRoleCode}
                  onChange={(e) => patch({ adminRoleCode: e.target.value })}
                >
                  <option value="manager_high">Manager alto (acceso amplio)</option>
                  <option value="manager">Manager</option>
                  <option value="manager_low">Manager bajo</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.adminSendWhatsApp}
                  onChange={(e) => patch({ adminSendWhatsApp: e.target.checked })}
                />
                Enviar credenciales por WhatsApp al crear
              </label>
            </div>
          )}
          {!form.createAdmin && (
            <p className="text-sm text-amber-700">
              Podés dar de alta usuarios después desde la pestaña Colaboradores.
            </p>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 text-sm text-slate-700">
          <h3 className="font-semibold text-slate-900">Resumen</h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Empresa</dt>
              <dd className="font-medium">{form.displayName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Tenant ID</dt>
              <dd className="font-mono">{form.tenantId}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Áreas</dt>
              <dd>{areas.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Sucursales</dt>
              <dd>{sucursales.join(', ')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Features</dt>
              <dd>
                {[
                  form.mundialHome && 'Mundial',
                  form.miDesempenoHomeTile && 'Mi Desempeño',
                  form.commercialGeoCheckIn && 'Geo Comercial',
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Ninguna extra'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Admin inicial</dt>
              <dd>
                {form.createAdmin
                  ? `${form.adminNombre} ${form.adminApellido} (${form.adminUsuario}) — ${form.adminRoleCode}`
                  : 'No se creará ahora'}
              </dd>
            </div>
          </dl>
          <BrandingPreview
            displayName={form.displayName}
            logoUrl={form.logoUrl}
            accentColor={form.accentColor}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        {step > 1 && step < STEPS.length && (
          <button
            type="button"
            onClick={goBack}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Anterior
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            Siguiente
          </button>
        )}
        {step === STEPS.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            disabled={loading}
            className="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            Revisar resumen
          </button>
        )}
        {step === STEPS.length && !result && (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creando…' : 'Crear empresa'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TenantOnboardingWizard;
