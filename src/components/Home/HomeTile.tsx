import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { homeCard, homeCardFocus, homeCardInteractive } from './homeSurface';

export type HomeTileStatus = 'success' | 'warning' | 'error' | 'pending' | 'neutral';
export type HomeTileVariant = 'compact' | 'stacked';

export interface HomeTileBadge {
  content: string | number;
  variant?: 'primary' | 'success' | 'warning' | 'info';
}

export interface HomeTileProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconNode?: React.ReactNode;
  status?: HomeTileStatus;
  variant?: HomeTileVariant;
  badges?: HomeTileBadge[];
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  colSpan?: string;
  children?: React.ReactNode;
  'aria-label'?: string;
}

const statusBorder: Record<HomeTileStatus, string> = {
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  error: 'border-l-red-500',
  pending: 'border-l-amber-400',
  neutral: 'border-l-transparent',
};

const statusIconSurface: Record<HomeTileStatus, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 group-hover:bg-emerald-500/15',
  warning: 'bg-amber-500/10 text-amber-800 group-hover:bg-amber-500/15',
  error: 'bg-red-500/10 text-red-700 group-hover:bg-red-500/15',
  pending: 'bg-amber-400/10 text-amber-800 group-hover:bg-amber-400/15',
  neutral: 'bg-[#009ee3]/10 text-[#009ee3] group-hover:bg-[#009ee3]/15',
};

const badgeStyles: Record<NonNullable<HomeTileBadge['variant']>, string> = {
  primary: 'bg-[#009ee3] text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-slate-600 text-white',
};

function joinClasses(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

const HomeTile: React.FC<HomeTileProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconNode,
  status = 'neutral',
  variant = 'compact',
  badges,
  onClick,
  className = '',
  colSpan = '',
  children,
  'aria-label': ariaLabel,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
  };

  const isCompact = variant === 'compact';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel ?? title}
      className={joinClasses(
        colSpan,
        'group relative w-full text-left',
        homeCard,
        homeCardInteractive,
        homeCardFocus,
        isCompact ? 'flex min-h-[4.5rem] items-center gap-3 p-3' : 'flex min-h-[7.5rem] flex-col p-4',
        status !== 'neutral' && `border-l-4 ${statusBorder[status]}`,
        className,
      )}
    >
      {badges && badges.length > 0 && (
        <div
          className={joinClasses(
            'absolute flex gap-1',
            isCompact ? 'bottom-2 right-2' : 'right-2 top-2 flex-col items-end gap-1',
          )}
        >
          {badges.map((badge, index) => (
            <span
              key={index}
              className={joinClasses(
                'min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none shadow-sm',
                badgeStyles[badge.variant ?? 'primary'],
              )}
            >
              {badge.content}
            </span>
          ))}
        </div>
      )}

      {children ? (
        children
      ) : isCompact ? (
        <>
          <span
            className={joinClasses(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0',
              statusIconSurface[status],
            )}
          >
            {iconNode ?? (Icon ? <Icon className="h-5 w-5" strokeWidth={2} aria-hidden /> : null)}
          </span>
          <span className={joinClasses('min-w-0 flex-1', badges?.length ? 'pr-1 pb-5' : 'pr-1')}>
            <span className="block text-sm font-semibold leading-snug text-slate-900">{title}</span>
            {subtitle && (
              <span className="mt-0.5 block text-sm font-semibold leading-snug text-slate-900">{subtitle}</span>
            )}
          </span>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <div
            className={joinClasses(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100',
              statusIconSurface[status],
            )}
          >
            {iconNode ?? (Icon ? <Icon className="h-6 w-6" strokeWidth={2} aria-hidden /> : null)}
          </div>
          <div className="w-full text-center">
            <p className="text-sm font-semibold leading-tight text-slate-900">{title}</p>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
      )}
    </button>
  );
};

export default HomeTile;
