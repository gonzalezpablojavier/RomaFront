/** Excepciones isoCountry → nombre de archivo en public/assets/images/flags */
const FLAG_OVERRIDES: Record<string, string> = {
  'GB-ENG': 'GB-ENG',
  'GB-SCT': 'GB-SCT',
};

export function resolveFlagPath(isoCountry: string): string | null {
  const code = FLAG_OVERRIDES[isoCountry] ?? isoCountry;
  if (!/^[A-Z0-9-]{2,16}$/i.test(code)) return null;
  return `/assets/images/flags/${code}.svg`;
}
