import React, { useCallback, useEffect, useState } from 'react';
import { formatKickoffArgentina } from '../../utils/mundialTime';
import {
  fetchMundialMatches,
  fetchMundialRounds,
  updateMatchResult,
  type MundialMatch,
  type MundialRound,
} from '../../api/api_mundial';
import { homeCard, homeCardFocus, homeCtaButton } from '../Home/homeSurface';
import TeamFlag from './TeamFlag';

const inputClass =
  'w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm';

const MundialResultsPanel: React.FC = () => {
  const [rounds, setRounds] = useState<MundialRound[]>([]);
  const [matches, setMatches] = useState<MundialMatch[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRounds = useCallback(async () => {
    const r = await fetchMundialRounds();
    setRounds(r);
    return r;
  }, []);

  const loadMatches = useCallback(async (roundId?: number | null) => {
    const m = await fetchMundialMatches(roundId ?? undefined);
    setMatches(m);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await loadRounds();
        if (!alive) return;
        const rid = r[0]?.id ?? null;
        setActiveRoundId(rid);
        await loadMatches(rid);
      } catch (e) {
        if (alive) setError('No se pudieron cargar los partidos.');
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadRounds, loadMatches]);

  const selectRound = async (roundId: number) => {
    setActiveRoundId(roundId);
    setLoading(true);
    setError(null);
    try {
      await loadMatches(roundId);
    } catch (e) {
      setError('No se pudieron cargar los partidos.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async (
    match: MundialMatch,
    home: string,
    away: string,
  ) => {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isNaN(h) || Number.isNaN(a)) {
      setError('Goles inválidos');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await updateMatchResult(match.id, h, a);
      setMessage(
        `Resultado guardado${res.predictionsUpdated != null ? ` (${res.predictionsUpdated} pronósticos)` : ''}`,
      );
      await loadMatches(activeRoundId);
    } catch (e) {
      setError('No se pudo guardar el resultado.');
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`border-sky-200 bg-sky-50/90 p-4 ${homeCard}`}>
        <p className="text-sm font-semibold text-sky-900">Carga de resultados</p>
        <p className="mt-1 text-xs text-sky-800">
          Como manager podés cargar el marcador final. Se recalculan los puntos de los
          pronósticos automáticamente.
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {rounds.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {rounds.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectRound(r.id)}
              className={
                activeRoundId === r.id
                  ? 'rounded-full bg-[#0077b3] px-3 py-1.5 text-xs font-semibold text-white'
                  : `rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ${homeCardFocus}`
              }
            >
              {r.title}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando partidos…</p>
      ) : matches.length === 0 ? (
        <p className={`p-4 text-center text-sm text-slate-500 ${homeCard}`}>
          No hay partidos en esta jornada.
        </p>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchResultRow key={m.id} match={m} onSave={handleSaveResult} />
          ))}
        </div>
      )}
    </div>
  );
};

const MatchResultRow: React.FC<{
  match: MundialMatch;
  onSave: (m: MundialMatch, home: string, away: string) => Promise<void>;
}> = ({ match, onSave }) => {
  const [homeScore, setHomeScore] = useState(
    match.homeScore != null ? String(match.homeScore) : '',
  );
  const [awayScore, setAwayScore] = useState(
    match.awayScore != null ? String(match.awayScore) : '',
  );
  const [saving, setSaving] = useState(false);

  return (
    <article className={`p-4 ${homeCard}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <TeamFlag
            isoCountry={match.homeTeam.isoCountry}
            teamCode={match.homeTeam.code}
            size={22}
          />
          <span>{match.homeTeam.name}</span>
          <span className="text-slate-400">vs</span>
          <span>{match.awayTeam.name}</span>
          <TeamFlag
            isoCountry={match.awayTeam.isoCountry}
            teamCode={match.awayTeam.code}
            size={22}
          />
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {match.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {formatKickoffArgentina(match.kickoffAt, "EEE d MMM yyyy HH:mm' hs (ARG)'")}
        {match.groupLetter ? ` · Grupo ${match.groupLetter}` : ''}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-600">Resultado:</span>
        <input
          type="number"
          min={0}
          max={99}
          className={inputClass}
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
        />
        <span className="text-slate-400">:</span>
        <input
          type="number"
          min={0}
          max={99}
          className={inputClass}
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
        />
        <button
          type="button"
          disabled={saving}
          className={homeCtaButton}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave(match, homeScore, awayScore);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? 'Guardando…' : 'Cargar resultado'}
        </button>
      </div>
    </article>
  );
};

export default MundialResultsPanel;
