import React from 'react';
import { Brain } from 'lucide-react';
import { homeCard, homeCtaButton } from '../Home/homeSurface';

interface TriviaGateBannerProps {
  roundTitle: string;
  onStart: () => void;
}

const TriviaGateBanner: React.FC<TriviaGateBannerProps> = ({ roundTitle, onStart }) => (
  <div className={`mb-4 p-4 ${homeCard}`}>
    <div className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#009ee3]/10 text-[#009ee3]">
        <Brain className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">Cultura Distri — {roundTitle}</p>
        <p className="mt-1 text-xs text-slate-600">
          Respondé 2 preguntas y acertá las dos para desbloquear tus pronósticos.
        </p>
        <button type="button" onClick={onStart} className={`mt-3 ${homeCtaButton}`}>
          Ir a la trivia
        </button>
      </div>
    </div>
  </div>
);

export default TriviaGateBanner;
