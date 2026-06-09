import React from 'react';
import { homeCard } from './homeSurface';
import HomeSectionLabel from './HomeSectionLabel';
import type { HomeMoodValue } from '../../hooks/useHomeMood';

const MOOD_OPTIONS: { mood: HomeMoodValue; src: string; label: string; character: string }[] = [
  { mood: 'contento', src: '/images/mood/alegria.png', label: 'Contento', character: 'Alegría' },
  { mood: 'enojado', src: '/images/mood/ira.png', label: 'Enojado', character: 'Ira' },
  { mood: 'mal', src: '/images/mood/tristeza.png', label: 'Mal', character: 'Tristeza' },
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
      className={`flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between border-slate-300/70 bg-slate-50 ${homeCard}`}
      aria-label="¿Cómo me siento hoy?"
    >
      <p className="text-sm font-medium text-slate-700">
        ¿Cómo te sentís?
      </p>

      <div className="flex shrink-0 items-center justify-center gap-4 md:gap-5" role="group" aria-label="Estado de ánimo">
        {MOOD_OPTIONS.map(({ mood, src, label, character }) => {
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
                'flex flex-col items-center gap-1.5 transition-all duration-300 ease-out motion-reduce:transition-none',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009ee3]',
                selected
                  ? 'scale-105'
                  : 'hover:scale-105 active:scale-95',
                pending && 'pointer-events-none opacity-70',
                moodPending && !pending && 'opacity-40',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  'flex h-[4.6rem] w-[4.6rem] items-center justify-center rounded-xl border bg-white transition-all duration-300',
                  selected ? 'border-[#009ee3] ring-2 ring-[#009ee3]/45 ring-offset-1' : 'border-slate-200'
                ].join(' ')}
              >
                <img src={src} alt="" className="h-[4rem] object-contain object-bottom" />
              </span>
              <span className={`text-[11px] font-medium transition-colors duration-300 ${selected ? 'text-[#0077b3]' : 'text-slate-500'}`}>
                {character}
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
