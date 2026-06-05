import React from 'react';
import { homeCard } from './homeSurface';
import HomeSectionLabel from './HomeSectionLabel';
import type { HomeMoodValue } from '../../hooks/useHomeMood';

const MOOD_OPTIONS: { mood: HomeMoodValue; src: string; label: string }[] = [
  { mood: 'contento', src: '/images/contento.svg', label: 'Contento' },
  { mood: 'enojado', src: '/images/enojado.svg', label: 'Enojado' },
  { mood: 'mal', src: '/images/triste.svg', label: 'Mal' },
];

interface HomeMoodStripProps {
  lastMood?: { mood: string } | null;
  moodPending: HomeMoodValue | null;
  moodMessage: string | null;
  onSelect: (mood: HomeMoodValue) => void;
}

const HomeMoodStrip: React.FC<HomeMoodStripProps> = ({
  lastMood,
  moodPending,
  moodMessage,
  onSelect,
}) => (
  <section className="mb-6" aria-labelledby="home-mood-heading">
    <HomeSectionLabel id="home-mood-heading">Clima del día</HomeSectionLabel>
    <article
      className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${homeCard}`}
      aria-label="¿Cómo me siento hoy?"
    >
      <p className="text-sm font-medium text-slate-700">
        ¿Cómo te sentís? <span className="font-normal text-slate-400">(opcional)</span>
      </p>

      <div className="flex shrink-0 items-center justify-center gap-2 md:gap-3" role="group" aria-label="Estado de ánimo">
        {MOOD_OPTIONS.map(({ mood, src, label }) => {
          const selected = lastMood?.mood === mood;
          const pending = moodPending === mood;

          return (
            <button
              key={mood}
              type="button"
              onClick={() => onSelect(mood)}
              disabled={!!moodPending}
              aria-label={label}
              aria-pressed={selected}
              className={[
                'rounded-xl p-1.5 transition-all duration-300 ease-out motion-reduce:transition-none',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009ee3]',
                selected
                  ? 'scale-105 ring-2 ring-[#009ee3]/45 ring-offset-2'
                  : 'hover:scale-105 hover:bg-slate-50 active:scale-95',
                pending && 'pointer-events-none opacity-70',
                moodPending && !pending && 'opacity-40',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100/90">
                <img src={src} alt="" className="h-8 w-8" />
              </span>
            </button>
          );
        })}
      </div>

      {moodMessage ? (
        <p role="status" aria-live="polite" className="text-center text-xs font-medium text-[#0077b3] md:text-right">
          {moodMessage}
        </p>
      ) : null}
    </article>
  </section>
);

export default HomeMoodStrip;
