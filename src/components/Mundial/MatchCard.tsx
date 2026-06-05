import React, { useEffect, useState } from 'react';
import { formatKickoffArgentina } from '../../utils/mundialTime';
import { Lock } from 'lucide-react';
import type { MundialMatch, MundialPhase } from '../../api/api_mundial';
import { savePrediction } from '../../api/api_mundial';
import TeamFlag from './TeamFlag';
import { homeCard, homeCtaButton } from '../Home/homeSurface';

interface MatchCardProps {
  match: MundialMatch;
  onSaved: () => void;
  onNeedTrivia: (phase: MundialPhase) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onSaved, onNeedTrivia }) => {
  const [home, setHome] = useState(
    match.myPrediction?.homeScore?.toString() ?? '',
  );
  const [away, setAway] = useState(
    match.myPrediction?.awayScore?.toString() ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!match.myPrediction);

  useEffect(() => {
    const hasPrediction = !!match.myPrediction;
    setSaved(hasPrediction);
    if (hasPrediction) {
      setHome(String(match.myPrediction!.homeScore));
      setAway(String(match.myPrediction!.awayScore));
    }
  }, [match.id, match.myPrediction]);

  const locked = match.triviaRequired;
  const isReadOnly = saved || !match.canPredict;
  const closed = !match.canPredict && !locked;
  const timeLabel = formatKickoffArgentina(
    match.kickoffAt,
    "EEE d MMM · HH:mm' hs (ARG)'",
  );

  const handleSave = async () => {
    if (saved) return;
    if (locked) {
      onNeedTrivia(match.phase);
      return;
    }
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isNaN(h) || Number.isNaN(a) || h < 0 || a < 0) {
      setError('Ingresá goles válidos (0–99)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await savePrediction(match.id, h, a);
      setSaved(true);
      onSaved();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo guardar';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      className={`p-4 ${homeCard} ${locked ? 'opacity-70' : ''}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {match.phase === 'final' ? 'Final · ' : match.groupLetter ? `Grupo ${match.groupLetter} · ` : ''}
          {timeLabel}
        </span>
        {match.phase === 'final' && !closed && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900">
            +6 pts si acertás el ganador
          </span>
        )}
        {locked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
            <Lock className="h-3 w-3" aria-hidden />
            Trivia pendiente
          </span>
        )}
        {closed && match.status === 'finished' && (
          <span className="font-medium text-emerald-700">
            Final {match.homeScore}-{match.awayScore}
          </span>
        )}
        {closed && match.status !== 'finished' && (
          <span className="font-medium text-slate-500">Cerrado</span>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <TeamFlag
            isoCountry={match.homeTeam.isoCountry}
            teamCode={match.homeTeam.code}
          />
          <span className="max-w-[5rem] truncate text-center text-xs font-medium text-slate-800 sm:max-w-none sm:text-sm">
            {match.homeTeam.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            disabled={isReadOnly}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="w-12 rounded-lg border border-slate-200 py-2 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#009ee3] disabled:bg-slate-50"
            aria-label={`Goles ${match.homeTeam.name}`}
          />
          <span className="text-slate-400">:</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            disabled={isReadOnly}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="w-12 rounded-lg border border-slate-200 py-2 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#009ee3] disabled:bg-slate-50"
            aria-label={`Goles ${match.awayTeam.name}`}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <TeamFlag
            isoCountry={match.awayTeam.isoCountry}
            teamCode={match.awayTeam.code}
          />
          <span className="max-w-[5rem] truncate text-center text-xs font-medium text-slate-800 sm:max-w-none sm:text-sm">
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      {match.myPrediction && match.status === 'finished' && match.myPrediction.points != null && (
        <p className="mt-2 text-center text-xs font-semibold text-amber-700">
          +{match.myPrediction.points} pts
        </p>
      )}

      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}

      {(match.canPredict || saved) && (
        <button
          type="button"
          disabled={saving || saved}
          onClick={handleSave}
          className={`mt-3 w-full rounded-full py-2.5 text-sm font-semibold transition disabled:cursor-default ${
            saved
              ? 'bg-emerald-50 text-emerald-800'
              : `${homeCtaButton} disabled:opacity-60`
          }`}
          aria-disabled={saved}
        >
          {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
        </button>
      )}
    </article>
  );
};

export default MatchCard;
