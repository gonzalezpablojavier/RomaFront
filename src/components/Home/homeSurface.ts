/** Tokens de superficie Home — jerarquía anti-template (cards xl, pills full). */

export const homePageShell =
  'relative min-h-full w-full overflow-hidden bg-gradient-to-b from-slate-100 via-[#f0f4f8] to-[#fafafa] px-4 py-5 md:px-6';

export const homeWatermark =
  "pointer-events-none absolute inset-0 bg-[url('/assets/images/logo-head.png')] bg-[length:min(280px,55vw)] bg-[position:center_12%] bg-no-repeat opacity-[0.035]";

/** Contenedor principal: borde fino, sin sombra pesada por defecto. */
export const homeCard = 'rounded-xl border border-slate-200/70 bg-white';

export const homeCardInteractive =
  'transition-[transform,box-shadow,border-color] duration-300 ease-out hover:border-[#009ee3]/30 hover:shadow-[0_4px_20px_rgba(0,158,227,0.08)] active:translate-y-px motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0';

export const homeCardFocus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009ee3]';

/** @deprecated Usar homeCard + homeCardInteractive */
export const homeGlassCard = homeCard;

/** @deprecated Usar homeCardInteractive */
export const homeGlassCardHover = homeCardInteractive;

export const homeAreaChip =
  'inline-block rounded-full border border-[#009ee3]/20 bg-[#009ee3]/10 px-3 py-1 text-xs font-semibold text-[#0077b3]';

export const homeAreaLabel =
  'flex shrink-0 flex-col items-end gap-0.5 border-l-2 border-[#009ee3]/35 pl-2.5';

export const homeCtaButton =
  'rounded-full bg-gradient-to-r from-[#009ee3] to-[#0077b3] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#009ee3]/25 transition-transform duration-200 ease-out hover:brightness-105 active:scale-[0.98] motion-reduce:transform-none';
