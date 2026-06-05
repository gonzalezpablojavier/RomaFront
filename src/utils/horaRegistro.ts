import dayjs from 'dayjs';

/**
 * Formatea `horaRegistro` del API para mostrar en hora Argentina.
 * Mismo criterio que panelPresentismo: el valor guardado va 3 h atrás respecto a ARG.
 */
export function formatHoraRegistroArgentina(
  horaRegistro: string | null | undefined,
  formato = 'HH:mm'
): string | null {
  if (!horaRegistro) return null;
  const parsed = dayjs(String(horaRegistro).trim());
  if (!parsed.isValid()) return null;
  return parsed.add(3, 'hour').format(formato);
}
