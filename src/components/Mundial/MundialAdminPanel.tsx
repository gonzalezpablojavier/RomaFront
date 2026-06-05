import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  datetimeLocalToKickoffApi,
  formatKickoffArgentina,
  kickoffToDatetimeLocal,
} from '../../utils/mundialTime';
import {
  adminCreateMatch,
  adminCreateRound,
  adminUpdateMatch,
  adminUpdateMatchResult,
  adminUpdateRound,
  adminUpdateTeam,
  fetchMundialAdminMatches,
  fetchMundialAdminRounds,
  fetchMundialAdminTeams,
  type MundialAdminMatch,
  type MundialAdminRound,
  type MundialPhase,
  type MundialTeam,
} from '../../api/api_mundial';
import { homeCard, homeCtaButton, homeCardFocus } from '../Home/homeSurface';

type AdminSection = 'matches' | 'rounds' | 'teams';

const PHASES: { value: MundialPhase; label: string }[] = [
  { value: 'groups', label: 'Grupos' },
  { value: 'round32', label: 'Dieciseisavos' },
  { value: 'round16', label: 'Octavos' },
  { value: 'quarter', label: 'Cuartos' },
  { value: 'semi', label: 'Semifinal' },
  { value: 'third', label: 'Tercer puesto' },
  { value: 'final', label: 'Final' },
];

const GROUPS = 'ABCDEFGHIJKL'.split('');

const inputClass =
  'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900';
const labelClass = 'mb-0.5 block text-xs font-medium text-slate-600';

const MundialAdminPanel: React.FC = () => {
  const [section, setSection] = useState<AdminSection>('matches');
  const [teamsData, setTeamsData] = useState<{ teams: MundialTeam[]; byGroup: Record<string, MundialTeam[]> } | null>(null);
  const [rounds, setRounds] = useState<MundialAdminRound[]>([]);
  const [matches, setMatches] = useState<MundialAdminMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filterRoundId, setFilterRoundId] = useState<number | ''>('');
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [newRound, setNewRound] = useState({
    slug: '',
    title: '',
    phase: 'groups' as MundialPhase,
    startDate: '',
    endDate: '',
    sortOrder: '1',
    isActive: true,
  });

  const [newMatch, setNewMatch] = useState({
    roundId: '',
    phase: 'groups' as MundialPhase,
    groupLetter: 'A',
    homeTeamCode: '',
    awayTeamCode: '',
    kickoffLocal: '',
    venue: '',
  });

  const teamCodes = useMemo(
    () => (teamsData?.teams ?? []).map((t) => t.code).sort(),
    [teamsData],
  );

  const showMsg = (text: string) => {
    setMessage(text);
    setError(null);
    setTimeout(() => setMessage(null), 4000);
  };

  const showErr = (e: unknown) => {
    const msg =
      axiosMessage(e) ?? 'Error al guardar';
    setError(msg);
    setMessage(null);
  };

  const loadTeams = useCallback(async () => {
    const data = await fetchMundialAdminTeams();
    setTeamsData(data);
  }, []);

  const loadRounds = useCallback(async () => {
    const data = await fetchMundialAdminRounds();
    setRounds(data);
  }, []);

  const loadMatches = useCallback(async () => {
    const data = await fetchMundialAdminMatches({
      roundId: filterRoundId === '' ? undefined : Number(filterRoundId),
      phase: filterPhase || undefined,
      groupLetter: filterGroup || undefined,
    });
    setMatches(data);
  }, [filterRoundId, filterPhase, filterGroup]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadTeams(), loadRounds()]);
      await loadMatches();
    } catch (e) {
      showErr(e);
    } finally {
      setLoading(false);
    }
  }, [loadTeams, loadRounds, loadMatches]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (rounds.length > 0 && !newMatch.roundId) {
      setNewMatch((m) => ({ ...m, roundId: String(rounds[0].id) }));
    }
  }, [rounds, newMatch.roundId]);

  useEffect(() => {
    if (section === 'matches') loadMatches().catch(showErr);
  }, [section, loadMatches]);

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateRound({
        slug: newRound.slug.trim(),
        title: newRound.title.trim(),
        phase: newRound.phase,
        startDate: newRound.startDate,
        endDate: newRound.endDate || undefined,
        sortOrder: parseInt(newRound.sortOrder, 10) || 0,
        isActive: newRound.isActive,
      });
      showMsg('Jornada creada');
      setNewRound({
        slug: '',
        title: '',
        phase: 'groups',
        startDate: '',
        endDate: '',
        sortOrder: String(rounds.length + 1),
        isActive: true,
      });
      await loadRounds();
    } catch (err) {
      showErr(err);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateMatch({
        roundId: Number(newMatch.roundId),
        phase: newMatch.phase,
        groupLetter: newMatch.phase === 'groups' ? newMatch.groupLetter : undefined,
        homeTeamCode: newMatch.homeTeamCode.toUpperCase(),
        awayTeamCode: newMatch.awayTeamCode.toUpperCase(),
        kickoffAt: datetimeLocalToKickoffApi(newMatch.kickoffLocal),
        venue: newMatch.venue || undefined,
      });
      showMsg('Partido creado');
      await loadMatches();
    } catch (err) {
      showErr(err);
    }
  };

  const handleSaveResult = async (m: MundialAdminMatch, home: string, away: string) => {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isNaN(h) || Number.isNaN(a)) {
      setError('Goles inválidos');
      return;
    }
    try {
      await adminUpdateMatchResult(m.id, h, a, 'finished');
      showMsg(`Resultado guardado (${m.predictionCount} pronósticos actualizados)`);
      await loadMatches();
    } catch (err) {
      showErr(err);
    }
  };

  const sectionBtn = (id: AdminSection, label: string) => (
    <button
      type="button"
      onClick={() => setSection(id)}
      className={
        section === id
          ? 'rounded-full bg-[#0077b3] px-3 py-1.5 text-xs font-semibold text-white'
          : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600'
      }
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className={`border-amber-200 bg-amber-50/90 p-4 ${homeCard}`}>
        <p className="text-sm font-semibold text-amber-900">Panel administrador</p>
        <p className="mt-1 text-xs text-amber-800">
          Solo colaboradorID 1. Todos los horarios son <strong>hora Argentina</strong> (ART).
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {sectionBtn('matches', 'Partidos y resultados')}
        {sectionBtn('rounds', 'Jornadas')}
        {sectionBtn('teams', 'Equipos por grupo')}
      </div>

      {loading && section !== 'matches' ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : null}

      {section === 'teams' && teamsData && (
        <div className="space-y-4">
          {GROUPS.map((g) => {
            const list = teamsData.byGroup[g] ?? [];
            if (list.length === 0) return null;
            return (
              <section key={g} className={`p-4 ${homeCard}`}>
                <h3 className="mb-2 text-sm font-bold text-slate-900">Grupo {g}</h3>
                <ul className="space-y-2">
                  {list.map((t) => (
                    <TeamGroupRow key={t.code} team={t} onSaved={loadTeams} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {section === 'rounds' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={handleCreateRound} className={`space-y-3 p-4 ${homeCard}`}>
            <h3 className="text-sm font-bold text-slate-900">Nueva jornada / fase</h3>
            <div>
              <label className={labelClass}>Slug (único)</label>
              <input
                className={inputClass}
                value={newRound.slug}
                onChange={(e) => setNewRound({ ...newRound, slug: e.target.value })}
                placeholder="jornada-2"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Título UI</label>
              <input
                className={inputClass}
                value={newRound.title}
                onChange={(e) => setNewRound({ ...newRound, title: e.target.value })}
                placeholder="Jornada 2 · 16 jun"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Fase</label>
              <select
                className={inputClass}
                value={newRound.phase}
                onChange={(e) =>
                  setNewRound({ ...newRound, phase: e.target.value as MundialPhase })
                }
              >
                {PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Inicio</label>
                <input
                  type="date"
                  className={inputClass}
                  value={newRound.startDate}
                  onChange={(e) => setNewRound({ ...newRound, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Fin</label>
                <input
                  type="date"
                  className={inputClass}
                  value={newRound.endDate}
                  onChange={(e) => setNewRound({ ...newRound, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Orden</label>
                <input
                  type="number"
                  className={inputClass}
                  value={newRound.sortOrder}
                  onChange={(e) => setNewRound({ ...newRound, sortOrder: e.target.value })}
                />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={newRound.isActive}
                  onChange={(e) => setNewRound({ ...newRound, isActive: e.target.checked })}
                />
                Activa
              </label>
            </div>
            <button type="submit" className={homeCtaButton}>
              Crear jornada
            </button>
          </form>

          <div className={`space-y-2 p-4 ${homeCard}`}>
            <h3 className="text-sm font-bold text-slate-900">Jornadas existentes</h3>
            {rounds.map((r) => (
              <RoundRow key={r.id} round={r} onSaved={loadRounds} />
            ))}
          </div>
        </div>
      )}

      {section === 'matches' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateMatch} className={`space-y-3 p-4 ${homeCard}`}>
            <h3 className="text-sm font-bold text-slate-900">Nuevo partido</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass}>Jornada</label>
                <select
                  className={inputClass}
                  value={newMatch.roundId}
                  onChange={(e) => setNewMatch({ ...newMatch, roundId: e.target.value })}
                  required
                >
                  <option value="">—</option>
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.phase})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fase</label>
                <select
                  className={inputClass}
                  value={newMatch.phase}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, phase: e.target.value as MundialPhase })
                  }
                >
                  {PHASES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {newMatch.phase === 'groups' && (
                <div>
                  <label className={labelClass}>Grupo</label>
                  <select
                    className={inputClass}
                    value={newMatch.groupLetter}
                    onChange={(e) => setNewMatch({ ...newMatch, groupLetter: e.target.value })}
                  >
                    {GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>Local</label>
                <select
                  className={inputClass}
                  value={newMatch.homeTeamCode}
                  onChange={(e) => setNewMatch({ ...newMatch, homeTeamCode: e.target.value })}
                  required
                >
                  <option value="">—</option>
                  {teamCodes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Visitante</label>
                <select
                  className={inputClass}
                  value={newMatch.awayTeamCode}
                  onChange={(e) => setNewMatch({ ...newMatch, awayTeamCode: e.target.value })}
                  required
                >
                  <option value="">—</option>
                  {teamCodes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Kickoff (hora Argentina)</label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={newMatch.kickoffLocal}
                  onChange={(e) => setNewMatch({ ...newMatch, kickoffLocal: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Sede</label>
                <input
                  className={inputClass}
                  value={newMatch.venue}
                  onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className={homeCtaButton}>
              Agregar partido
            </button>
          </form>

          <div className={`flex flex-wrap gap-2 p-4 ${homeCard}`}>
            <select
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
              value={filterRoundId}
              onChange={(e) =>
                setFilterRoundId(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Todas las jornadas</option>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
            >
              <option value="">Todas las fases</option>
              {PHASES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
            >
              <option value="">Todos los grupos</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  Grupo {g}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => loadMatches()} className={`text-sm ${homeCardFocus}`}>
              Filtrar
            </button>
          </div>

          <div className="space-y-3">
            {matches.map((m) => (
              <MatchAdminRow
                key={m.id}
                match={m}
                rounds={rounds}
                onSaved={loadMatches}
                onSaveResult={handleSaveResult}
              />
            ))}
            {matches.length === 0 && (
              <p className={`p-4 text-center text-sm text-slate-500 ${homeCard}`}>
                Sin partidos con estos filtros.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function axiosMessage(e: unknown): string | null {
  if (e && typeof e === 'object' && 'response' in e) {
    const res = (e as { response?: { data?: { message?: string | string[] } } }).response;
    const m = res?.data?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return null;
}

const TeamGroupRow: React.FC<{
  team: MundialTeam;
  onSaved: () => Promise<void>;
}> = ({ team, onSaved }) => {
  const [group, setGroup] = useState(team.groupLetter);
  const [saving, setSaving] = useState(false);

  return (
    <li className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-mono font-semibold text-slate-800">{team.code}</span>
      <span className="text-slate-600">{team.name}</span>
      <select
        className="rounded border border-slate-200 px-1 py-0.5 text-xs"
        value={group}
        onChange={(e) => setGroup(e.target.value)}
      >
        {GROUPS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={saving || group === team.groupLetter}
        className="text-xs font-medium text-[#0077b3] disabled:opacity-40"
        onClick={async () => {
          setSaving(true);
          try {
            await adminUpdateTeam(team.code, { groupLetter: group });
            await onSaved();
          } finally {
            setSaving(false);
          }
        }}
      >
        Guardar grupo
      </button>
    </li>
  );
};

const RoundRow: React.FC<{
  round: MundialAdminRound;
  onSaved: () => Promise<void>;
}> = ({ round, onSaved }) => {
  const [title, setTitle] = useState(round.title);
  const [active, setActive] = useState(round.isActive);

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm">
      <p className="font-mono text-xs text-slate-500">{round.slug}</p>
      <input
        className={`${inputClass} mt-1`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <p className="mt-1 text-xs text-slate-500">
        {round.phase} · {round.matchCount} partidos · orden {round.sortOrder}
      </p>
      <label className="mt-2 flex items-center gap-2 text-xs">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Visible en app
      </label>
      <button
        type="button"
        className="mt-2 text-xs font-medium text-[#0077b3]"
        onClick={async () => {
          await adminUpdateRound(round.id, { title, isActive: active });
          await onSaved();
        }}
      >
        Actualizar
      </button>
    </div>
  );
};

const MatchAdminRow: React.FC<{
  match: MundialAdminMatch;
  rounds: MundialAdminRound[];
  onSaved: () => Promise<void>;
  onSaveResult: (m: MundialAdminMatch, home: string, away: string) => Promise<void>;
}> = ({ match, rounds, onSaved, onSaveResult }) => {
  const [kickoffLocal, setKickoffLocal] = useState(kickoffToDatetimeLocal(match.kickoffAt));
  const [status, setStatus] = useState(match.status);
  const [homeScore, setHomeScore] = useState(
    match.homeScore != null ? String(match.homeScore) : '',
  );
  const [awayScore, setAwayScore] = useState(
    match.awayScore != null ? String(match.awayScore) : '',
  );

  const homeName = match.homeTeam?.name ?? match.homeTeamCode;
  const awayName = match.awayTeam?.name ?? match.awayTeamCode;

  return (
    <article className={`p-4 ${homeCard}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {homeName} vs {awayName}
          </p>
          <p className="text-xs text-slate-500">
            #{match.id}
            {match.groupLetter ? ` · Grupo ${match.groupLetter}` : ''} · {match.phase}
            {match.round?.title ? ` · ${match.round.title}` : ''}
          </p>
          <p className="text-xs text-slate-500">
            {formatKickoffArgentina(match.kickoffAt, "EEE d MMM yyyy HH:mm' hs (ARG)'")}
            {match.venue ? ` · ${match.venue}` : ''}
          </p>
          {match.predictionCount > 0 && (
            <p className="text-xs text-amber-700">{match.predictionCount} pronósticos</p>
          )}
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {match.status}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass}>Kickoff (hora Argentina)</label>
          <input
            type="datetime-local"
            className={inputClass}
            value={kickoffLocal}
            onChange={(e) => setKickoffLocal(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Estado</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="scheduled">scheduled</option>
            <option value="live">live</option>
            <option value="finished">finished</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Jornada</label>
          <select
            className={inputClass}
            defaultValue={match.roundId}
            onChange={async (e) => {
              await adminUpdateMatch(match.id, { roundId: Number(e.target.value) });
              await onSaved();
            }}
          >
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
          onClick={async () => {
            await adminUpdateMatch(match.id, {
              kickoffAt: datetimeLocalToKickoffApi(kickoffLocal),
              status,
            });
            await onSaved();
          }}
        >
          Guardar horario / estado
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-600">Resultado:</span>
        <input
          type="number"
          min={0}
          max={99}
          className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
        />
        <span className="text-slate-400">:</span>
        <input
          type="number"
          min={0}
          max={99}
          className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
        />
        <button
          type="button"
          className={homeCtaButton}
          onClick={() => onSaveResult(match, homeScore, awayScore)}
        >
          Cargar resultado y puntos
        </button>
      </div>
    </article>
  );
};

export default MundialAdminPanel;
