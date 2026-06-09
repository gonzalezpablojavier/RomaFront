import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { homeAreaLabel, homeCard } from './homeSurface';

interface HomeHeroProps {
  greeting: string;
  nombre?: string | null;
  loadingName?: boolean;
  headerAlerta?: string | null;
  userArea?: string;
}

const HomeHero: React.FC<HomeHeroProps> = ({
  greeting,
  nombre,
  loadingName,
  headerAlerta,
  userArea,
}) => (
  <header className={`mb-4 px-4 py-3 ${homeCard}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        {loadingName ? (
          <div className="h-7 w-48 animate-pulse rounded-md bg-slate-200/80" aria-hidden />
        ) : (
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            {greeting}
            {nombre ? `, ${nombre}` : ''}
          </h1>
        )}
        <p className="mt-0.5 truncate text-sm text-slate-600">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          {headerAlerta ? (
            <span className="font-medium text-[#0077b3]"> · {headerAlerta}</span>
          ) : null}
        </p>
      </div>
      {userArea ? (
        <div className={homeAreaLabel} aria-label={`Área: ${userArea}`}>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Área</span>
          <span className="text-sm font-semibold text-[#0077b3]">{userArea}</span>
        </div>
      ) : null}
    </div>
  </header>
);

export default HomeHero;
