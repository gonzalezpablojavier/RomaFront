import { apiClient } from './apiClient';

export type TriviaCategory = 'cultura' | 'habitos' | 'pilares';

export interface MundialTeam {
  code: string;
  name: string;
  groupLetter: string;
  isoCountry: string;
}

export interface MundialRound {
  id: number;
  slug: string;
  title: string;
  phase: MundialPhase;
  triviaCompleted: boolean;
}

export interface MundialMatch {
  id: number;
  roundId: number;
  phase: MundialPhase;
  groupLetter: string | null;
  kickoffAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: MundialTeam;
  awayTeam: MundialTeam;
  canPredict: boolean;
  triviaRequired: boolean;
  myPrediction: { homeScore: number; awayScore: number; points: number | null } | null;
}

export interface TriviaQuestion {
  id: number;
  sortOrder: number;
  category: TriviaCategory;
  text: string;
  options: { id: number; sortOrder: number; text: string }[];
}

export interface TriviaSubmitResult {
  completed: boolean;
  passed: boolean;
  correctCount: number;
  total: number;
  feedback: Array<{
    questionId: number;
    category: string;
    isCorrect: boolean;
    explanation: string | null;
    correctOptionText: string;
  }>;
}

export async function fetchMundialRounds() {
  const { data } = await apiClient.get<MundialRound[]>('/mundial/rounds');
  return data;
}

export async function fetchMundialMatches(roundId?: number) {
  const { data } = await apiClient.get<MundialMatch[]>('/mundial/matches', {
    params: roundId ? { roundId } : undefined,
  });
  return data;
}

export const MUNDIAL_PHASE_LABELS: Record<MundialPhase, string> = {
  groups: 'Fase de grupos',
  round32: 'Dieciseisavos de final',
  round16: 'Octavos de final',
  quarter: 'Cuartos de final',
  semi: 'Semifinal',
  third: 'Tercer puesto',
  final: 'Final',
};

export async function fetchTriviaStatus(phase: MundialPhase) {
  const { data } = await apiClient.get<{ completed: boolean; correctCount: number }>(
    `/mundial/phases/${phase}/trivia/status`,
  );
  return data;
}

export async function fetchTrivia(phase: MundialPhase) {
  const { data } = await apiClient.get<{
    phase: MundialPhase;
    phaseLabel: string;
    questions: TriviaQuestion[];
  }>(`/mundial/phases/${phase}/trivia`);
  return data;
}

export async function submitTrivia(
  phase: MundialPhase,
  answers: { questionId: number; optionId: number }[],
) {
  const { data } = await apiClient.post<TriviaSubmitResult>(
    `/mundial/phases/${phase}/trivia`,
    { answers },
  );
  return data;
}

export async function savePrediction(matchId: number, homeScore: number, awayScore: number) {
  const { data } = await apiClient.post('/mundial/predictions', {
    matchId,
    homeScore,
    awayScore,
  });
  return data;
}

export async function fetchMyPredictions() {
  const { data } = await apiClient.get('/mundial/predictions/me');
  return data;
}

export async function fetchRanking() {
  const { data } = await apiClient.get<{
    myPosition: number | null;
    myPoints: number;
    totalPlayers: number;
    ranking: Array<{
      position: number;
      colaboradorID: number;
      nombre: string;
      totalPoints: number;
      isMe: boolean;
    }>;
  }>('/mundial/ranking');
  return data;
}

export async function updateMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number,
) {
  const { data } = await apiClient.patch<{
    ok: number;
    predictionsUpdated?: number;
  }>(
    `/mundial/matches/${matchId}/result`,
    { homeScore, awayScore, status: 'finished' },
  );
  return data;
}

export interface MundialAccess {
  canManageFixture: boolean;
  canLoadResults: boolean;
  /** Alias legacy de canManageFixture */
  canAccess: boolean;
}

export async function fetchMundialAccess() {
  const { data } = await apiClient.get<MundialAccess>('/mundial/access');
  return data;
}

// --- Admin fixture (solo colaboradorID = 1 en backend) ---

export type MundialPhase =
  | 'groups'
  | 'round32'
  | 'round16'
  | 'quarter'
  | 'semi'
  | 'third'
  | 'final';

export interface MundialAdminRound {
  id: number;
  slug: string;
  title: string;
  phase: string;
  startDate: string;
  endDate: string | null;
  sortOrder: number;
  isActive: boolean;
  matchCount: number;
}

export interface MundialAdminMatch {
  id: number;
  roundId: number;
  phase: string;
  groupLetter: string | null;
  kickoffAt: string;
  venue: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  homeTeamCode: string;
  awayTeamCode: string;
  homeTeam?: MundialTeam;
  awayTeam?: MundialTeam;
  round?: { id: number; title: string; slug: string };
  predictionCount: number;
}

export interface MundialTeamsResponse {
  teams: MundialTeam[];
  byGroup: Record<string, MundialTeam[]>;
}

export async function fetchMundialAdminAccess() {
  return fetchMundialAccess();
}

export async function fetchMundialAdminTeams() {
  const { data } = await apiClient.get<MundialTeamsResponse>('/mundial/admin/teams');
  return data;
}

export async function adminUpdateTeam(
  code: string,
  body: Partial<Pick<MundialTeam, 'name' | 'groupLetter'>> & { isHost?: boolean },
) {
  const { data } = await apiClient.patch(`/mundial/admin/teams/${code}`, body);
  return data;
}

export async function fetchMundialAdminRounds() {
  const { data } = await apiClient.get<MundialAdminRound[]>('/mundial/admin/rounds');
  return data;
}

export async function adminCreateRound(body: {
  slug: string;
  title: string;
  phase?: MundialPhase;
  startDate: string;
  endDate?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const { data } = await apiClient.post('/mundial/admin/rounds', body);
  return data;
}

export async function adminUpdateRound(
  id: number,
  body: Partial<{
    slug: string;
    title: string;
    phase: MundialPhase;
    startDate: string;
    endDate: string | null;
    sortOrder: number;
    isActive: boolean;
  }>,
) {
  const { data } = await apiClient.patch(`/mundial/admin/rounds/${id}`, body);
  return data;
}

export async function fetchMundialAdminMatches(params?: {
  roundId?: number;
  phase?: string;
  groupLetter?: string;
}) {
  const { data } = await apiClient.get<MundialAdminMatch[]>('/mundial/admin/matches', { params });
  return data;
}

export async function adminCreateMatch(body: {
  roundId: number;
  phase?: MundialPhase;
  groupLetter?: string;
  homeTeamCode: string;
  awayTeamCode: string;
  kickoffAt: string;
  venue?: string;
}) {
  const { data } = await apiClient.post('/mundial/admin/matches', body);
  return data;
}

export async function adminUpdateMatch(
  id: number,
  body: Partial<{
    roundId: number;
    phase: MundialPhase;
    groupLetter: string | null;
    homeTeamCode: string;
    awayTeamCode: string;
    kickoffAt: string;
    venue: string | null;
    status: string;
  }>,
) {
  const { data } = await apiClient.patch(`/mundial/admin/matches/${id}`, body);
  return data;
}

export async function adminUpdateMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number,
  status: 'scheduled' | 'live' | 'finished' = 'finished',
) {
  const { data } = await apiClient.patch(
    `/mundial/admin/matches/${matchId}/result`,
    { homeScore, awayScore, status },
  );
  return data;
}
