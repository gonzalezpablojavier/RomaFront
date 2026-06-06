/** Etiquetas UI para roles Roma (códigos = tenant_role.code en backend). */
export const ROMA_ROLE_LABELS: Record<string, string> = {
  colaborador: 'Colaborador',
  manager: 'Manager',
  manager_high: 'Manager alto',
  manager_low: 'Manager calendario',
  desempeno_viewer: 'Desempeño',
  depo_sucursal_leader: 'Líder sucursal depósito',
  depo_coordinator: 'Coordinador depósito',
  platform_admin: 'Admin plataforma',
};

export const ROMA_ROLE_OPTIONS = Object.entries(ROMA_ROLE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

/** Roles que un admin de tenant puede asignar (sin platform_admin). */
export const TENANT_ASSIGNABLE_ROLE_OPTIONS = ROMA_ROLE_OPTIONS.filter(
  (r) => r.value !== 'platform_admin',
);

export function roleLabel(code: string): string {
  return ROMA_ROLE_LABELS[code] ?? code;
}
