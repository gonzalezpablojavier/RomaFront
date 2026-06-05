import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatKickoffArgentina, argentinaDateKey } from '../../utils/mundialTime';
import { ChevronLeft } from 'lucide-react';
import {
  fetchMundialAdminAccess,
  fetchMundialMatches,
  fetchMundialRounds,
  fetchMyPredictions,
  fetchRanking,
  fetchTriviaStatus,
  MUNDIAL_PHASE_LABELS,
  type MundialMatch,
  type MundialPhase,
  type MundialRound,
} from '../../api/api_mundial';
import HomeSectionLabel from '../../components/Home/HomeSectionLabel';
import {
  homeAreaChip,
  homeCard,
  homeCardFocus,
  homePageShell,
  homeWatermark,
} from '../../components/Home/homeSurface';
import MatchCard from '../../components/Mundial/MatchCard';
import TriviaGateBanner from '../../components/Mundial/TriviaGateBanner';
import TriviaRoundFlow from '../../components/Mundial/TriviaRoundFlow';
import RankingTable from '../../components/Mundial/RankingTable';
import TeamFlag from '../../components/Mundial/TeamFlag';
import MundialAdminPanel from '../../components/Mundial/MundialAdminPanel';
import { ensureFreshAccessToken } from '../../api/api_auth';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

type TabId = 'fixture' | 'predictions' | 'ranking' | 'admin';

const MundialPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [tab, setTab] = useState<TabId>('fixture');
  const [rounds, setRounds] = useState<MundialRound[]>([]);
  const [matches, setMatches] = useState<MundialMatch[]>([]);
  const [predictions, setPredictions] = useState<
    Array<{
      homeScore: number;
      awayScore: number;
      points: number | null;
      match?: MundialMatch & {
        homeTeam?: { name: string; code: string; isoCountry: string };
        awayTeam?: { name: string; code: string; isoCountry: string };
      };
    }>
  >([]);
  const [rankingData, setRankingData] = useState<Awaited<ReturnType<typeof fetchRanking>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [triviaPhase, setTriviaPhase] = useState<MundialPhase | null>(null);
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null);
  const [canAdmin, setCanAdmin] = useState(false);

  const loadFixture = useCallback(async (roundId?: number) => {
    const r = await fetchMundialRounds();
    setRounds(r);
    const rid = roundId ?? r[0]?.id;
    if (rid != null) setActiveRoundId(rid);
    const m = await fetchMundialMatches(rid);
    setMatches(m);
  }, []);

  const selectRound = useCallback(async (roundId: number) => {
    setActiveRoundId(roundId);
    setLoading(true);
    try {
      const m = await fetchMundialMatches(roundId);
      setMatches(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = await ensureFreshAccessToken();
      if (!token) {
        logout();
        navigate('/auth/login', { state: { from: location }, replace: true });
        return;
      }
      const admin = await fetchMundialAdminAccess().catch(() => ({ canAccess: false }));
      setCanAdmin(admin.canAccess);
      if (tab === 'fixture') await loadFixture();
      if (tab === 'predictions') {
        const p = await fetchMyPredictions();
        setPredictions(p);
      }
      if (tab === 'ranking') {
        const rank = await fetchRanking();
        setRankingData(rank);
      }
      if (tab === 'admin' && !admin.canAccess) {
        setTab('fixture');
      }
    } catch (e) {
      console.error(e);
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        logout();
        navigate('/auth/login', { state: { from: location }, replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [tab, loadFixture, location, navigate, logout]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activeRound = rounds.find((r) => r.id === activeRoundId) ?? rounds[0];
  const activePhase: MundialPhase = (activeRound?.phase as MundialPhase) ?? 'groups';
  const phaseTriviaDone = activeRound?.triviaCompleted ?? false;
  const needsTrivia =
    !phaseTriviaDone && matches.some((m) => m.phase === activePhase && m.triviaRequired);

  const matchesByDate = useMemo(() => {
    const map = new Map<string, MundialMatch[]>();
    for (const m of matches) {
      const key = argentinaDateKey(m.kickoffAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [matches]);

  if (triviaPhase != null) {
    return (
      <TriviaRoundFlow
        phase={triviaPhase}
        phaseTitle={MUNDIAL_PHASE_LABELS[triviaPhase]}
        onBack={() => setTriviaPhase(null)}
        onDone={() => {
          setTriviaPhase(null);
          loadFixture();
        }}
      />
    );
  }

  const tabClass = (id: TabId) =>
    tab === id
      ? homeAreaChip
      : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600';

  return (
    <div className={homePageShell}>
      <div className={homeWatermark} aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-5 md:px-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`mb-3 flex items-center gap-1 text-sm font-medium text-[#0077b3] ${homeCardFocus}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Volver al inicio
        </button>

        <header className={`mb-4 px-4 py-3 ${homeCard}`}>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Mundial 2026 · Distri
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">11 jun – 19 jul 2026</p>
        </header>

        <div
          className="mb-6 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Secciones mundial"
        >
          {(
            [
              ['fixture', 'Fixture'],
              ['predictions', 'Mis predicciones'],
              ['ranking', 'Ranking'],
              ...(canAdmin ? [['admin', 'Administración'] as const] : []),
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`shrink-0 ${tabClass(id)}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl bg-slate-200/80" />
            <div className="h-32 animate-pulse rounded-xl bg-slate-200/80" />
          </div>
        ) : (
          <>
            {tab === 'fixture' && (
              <div>
                {rounds.length > 1 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {rounds.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => selectRound(r.id)}
                        className={
                          activeRoundId === r.id
                            ? homeAreaChip
                            : 'rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600'
                        }
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                )}

                {needsTrivia && (
                  <TriviaGateBanner
                    roundTitle={MUNDIAL_PHASE_LABELS[activePhase]}
                    onStart={() => setTriviaPhase(activePhase)}
                  />
                )}

                {matchesByDate.map(([dateKey, dayMatches]: [string, MundialMatch[]]) => (
                  <section key={dateKey} className="mb-6">
                    <HomeSectionLabel>
                      {format(new Date(`${dateKey}T12:00:00`), "EEEE d 'de' MMMM", {
                        locale: es,
                      })}
                    </HomeSectionLabel>
                    <div className="space-y-3">
                      {dayMatches.map((m) => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          onSaved={loadFixture}
                          onNeedTrivia={async (phase) => {
                            const st = await fetchTriviaStatus(phase);
                            if (!st.completed) setTriviaPhase(phase);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ))}

                {matches.length === 0 && (
                  <p className={`p-4 text-center text-sm text-slate-500 ${homeCard}`}>
                    No hay partidos cargados para esta jornada.
                  </p>
                )}
              </div>
            )}

            {tab === 'predictions' && (
              <div className="space-y-3">
                {predictions.length === 0 ? (
                  <p className={`p-4 text-center text-sm text-slate-500 ${homeCard}`}>
                    Todavía no cargaste pronósticos.
                  </p>
                ) : (
                  predictions.map((p, idx) => {
                    const m = p.match;
                    if (!m?.homeTeam || !m?.awayTeam) return null;
                    return (
                      <article key={idx} className={`p-4 ${homeCard}`}>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <TeamFlag
                            isoCountry={m.homeTeam.isoCountry}
                            teamCode={m.homeTeam.code}
                            size={24}
                          />
                          <span>
                            {m.homeTeam.name} {p.homeScore}-{p.awayScore} {m.awayTeam.name}
                          </span>
                          <TeamFlag
                            isoCountry={m.awayTeam.isoCountry}
                            teamCode={m.awayTeam.code}
                            size={24}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {m.status === 'finished'
                            ? p.points != null
                              ? `+${p.points} pts`
                              : 'Sin puntos'
                            : 'Pendiente de jugar'}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {tab === 'ranking' && rankingData && (
              <RankingTable
                myPosition={rankingData.myPosition}
                myPoints={rankingData.myPoints}
                totalPlayers={rankingData.totalPlayers}
                ranking={rankingData.ranking}
              />
            )}

            {tab === 'admin' && canAdmin && <MundialAdminPanel />}
          </>
        )}
      </div>
    </div>
  );
};

export default MundialPage;
