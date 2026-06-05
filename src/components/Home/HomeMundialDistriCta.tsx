import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { homeCard, homeCardFocus, homeCardInteractive } from './homeSurface';

interface HomeMundialDistriCtaProps {
  onClick: () => void;
}

const HomeMundialDistriCta: React.FC<HomeMundialDistriCtaProps> = ({ onClick }) => (
  <section className="mb-6" aria-label="Mundial Distri">
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[3.25rem] w-full items-center gap-3 p-4 text-left ${homeCard} ${homeCardInteractive} ${homeCardFocus}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#009ee3]/10 text-[#009ee3]">
        <Trophy className="h-6 w-6" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">Mundial Distri</span>
        <span className="mt-0.5 block text-xs text-slate-500">
          Pronosticá y sumá puntos
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
    </button>
  </section>
);

export default HomeMundialDistriCta;
