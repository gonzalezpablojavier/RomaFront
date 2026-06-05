const MUNDIAL_OFFSET = '-03:00';
const ARG_TZ = 'America/Argentina/Buenos_Aires';

/** Parsea kickoffAt del API (siempre con offset Argentina o wall). */
export function parseKickoffArgentina(isoOrWall: string): Date {
  const s = isoOrWall.trim();
  if (s.includes('T') && (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s))) {
    return new Date(s);
  }
  const wall = s.slice(0, 19).replace('T', ' ');
  return new Date(wall.replace(' ', 'T') + MUNDIAL_OFFSET);
}

function argParts(d: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ARG_TZ,
    ...options,
  }).formatToParts(d);
}

const part = (parts: Intl.DateTimeFormatPart[], type: string) =>
  parts.find((p) => p.type === type)?.value ?? '';

/** Clave yyyy-MM-dd en calendario Argentina (agrupar fixture por día). */
export function argentinaDateKey(isoOrWall: string): string {
  const parts = argParts(parseKickoffArgentina(isoOrWall), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}`;
}

export function formatKickoffArgentina(isoOrWall: string, pattern: string): string {
  const d = parseKickoffArgentina(isoOrWall);
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  if (pattern === "EEE d MMM · HH:mm' hs (ARG)'") {
    const parts = argParts(d, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${cap(part(parts, 'weekday'))} ${part(parts, 'day')} ${cap(part(parts, 'month'))} · ${part(parts, 'hour')}:${part(parts, 'minute')} hs (ARG)`;
  }

  if (pattern === "EEE d MMM yyyy HH:mm' hs (ARG)'") {
    const parts = argParts(d, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${cap(part(parts, 'weekday'))} ${part(parts, 'day')} ${cap(part(parts, 'month'))} ${part(parts, 'year')} ${part(parts, 'hour')}:${part(parts, 'minute')} hs (ARG)`;
  }

  // Fallback genérico en calendario Argentina
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ARG_TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
  }).format(d);
}

/** `datetime-local` desde valor API (hora Argentina). */
export function kickoffToDatetimeLocal(isoOrWall: string): string {
  const parts = argParts(parseKickoffArgentina(isoOrWall), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}T${part(parts, 'hour')}:${part(parts, 'minute')}`;
}

/** Envía al API: ISO con offset Argentina (no UTC del navegador). */
export function datetimeLocalToKickoffApi(local: string): string {
  const [date, time] = local.split('T');
  return `${date}T${time}:00${MUNDIAL_OFFSET}`;
}
