import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;

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

function headers() {
  const empresaId = localStorage.getItem('l_empresa_id');
  return empresaId ? { 'x-empresa-id': empresaId } : {};
}

export async function fetchMundialRounds() {
  const { data } = await axios.get<MundialRound[]>(`${API_URL}/mundial/rounds`, {
    headers: headers(),
  });
  return data;
}

export async function fetchMundialMatches(roundId?: number) {
  const { data } = await axios.get<MundialMatch[]>(`${API_URL}/mundial/matches`, {
    headers: headers(),
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
  const { data } = await axios.get<{ completed: boolean; correctCount: number }>(
    `${API_URL}/mundial/phases/${phase}/trivia/status`,
    { headers: headers() },
  );
  return data;
}

export async function fetchTrivia(phase: MundialPhase) {
  const { data } = await axios.get<{
    phase: MundialPhase;
    phaseLabel: string;
    questions: TriviaQuestion[];
  }>(`${API_URL}/mundial/phases/${phase}/trivia`, { headers: headers() });
  return data;
}

export async function submitTrivia(
  phase: MundialPhase,
  answers: { questionId: number; optionId: number }[],
) {
  const { data } = await axios.post<TriviaSubmitResult>(
    `${API_URL}/mundial/phases/${phase}/trivia`,
    { answers },
    { headers: headers() },
  );
  return data;
}

export async function savePrediction(matchId: number, homeScore: number, awayScore: number) {
  const { data } = await axios.post(`${API_URL}/mundial/predictions`, {
    matchId,
    homeScore,
    awayScore,
  }, { headers: headers() });
  return data;
}

export async function fetchMyPredictions() {
  const { data } = await axios.get(`${API_URL}/mundial/predictions/me`, {
    headers: headers(),
  });
  return data;
}

export async function fetchRanking() {
  const { data } = await axios.get<{
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
  }>(`${API_URL}/mundial/ranking`, { headers: headers() });
  return data;
}

export async function updateMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number,
) {
  const { data } = await axios.patch(
    `${API_URL}/mundial/matches/${matchId}/result`,
    { homeScore, awayScore, status: 'finished' },
    { headers: headers() },
  );
  return data;
}

// --- Admin (solo colaboradorID = 1 en backend) ---

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
  const { data } = await axios.get<{ canAccess: boolean }>(
    `${API_URL}/mundial/admin/access`,
    { headers: headers() },
  );
  return data;
}

export async function fetchMundialAdminTeams() {
  const { data } = await axios.get<MundialTeamsResponse>(
    `${API_URL}/mundial/admin/teams`,
    { headers: headers() },
  );
  return data;
}

export async function adminUpdateTeam(
  code: string,
  body: Partial<Pick<MundialTeam, 'name' | 'groupLetter'>> & { isHost?: boolean },
) {
  const { data } = await axios.patch(`${API_URL}/mundial/admin/teams/${code}`, body, {
    headers: headers(),
  });
  return data;
}

export async function fetchMundialAdminRounds() {
  const { data } = await axios.get<MundialAdminRound[]>(
    `${API_URL}/mundial/admin/rounds`,
    { headers: headers() },
  );
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
  const { data } = await axios.post(`${API_URL}/mundial/admin/rounds`, body, {
    headers: headers(),
  });
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
  const { data } = await axios.patch(`${API_URL}/mundial/admin/rounds/${id}`, body, {
    headers: headers(),
  });
  return data;
}

export async function fetchMundialAdminMatches(params?: {
  roundId?: number;
  phase?: string;
  groupLetter?: string;
}) {
  const { data } = await axios.get<MundialAdminMatch[]>(
    `${API_URL}/mundial/admin/matches`,
    { headers: headers(), params },
  );
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
  const { data } = await axios.post(`${API_URL}/mundial/admin/matches`, body, {
    headers: headers(),
  });
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
  const { data } = await axios.patch(`${API_URL}/mundial/admin/matches/${id}`, body, {
    headers: headers(),
  });
  return data;
}

export async function adminUpdateMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number,
  status: 'scheduled' | 'live' | 'finished' = 'finished',
) {
  const { data } = await axios.patch(
    `${API_URL}/mundial/admin/matches/${matchId}/result`,
    { homeScore, awayScore, status },
    { headers: headers() },
  );
  return data;
}

