export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'USUARIO';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  nickname: string;
  role: UserRole;
  avatarUrl?: string;
  isPublicRanking: boolean;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
}

export interface UserSettings {
  userId: string;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'system';
  zenMode: boolean;
  dailyGoal: number; // questions/day
  weeklyGoal: number;
  autoPlayTimer: boolean;
  audioFeedback: boolean;
}

export interface Invitation {
  id: string;
  code: string;
  email: string;
  role: UserRole;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  isRevoked: boolean;
}

export type QuestionModality = 'multipla_escolha' | 'certo_errado';
export type QuestionDifficulty = 'facil' | 'medio' | 'dificil' | 'muito_dificil';
export type AnswerKeyStatus = 'valida' | 'anulada' | 'gabarito_alterado';

export interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D', 'E' or 'C', 'E'
  text: string;
  isCorrect: boolean;
  explanation?: string;
  percentageChosen?: number; // statistic from other candidates
}

export interface Question {
  id: string;
  code: string; // e.g. QB-2024-001
  board: string; // e.g. Cebraspe, FGV, FCC, Vunesp
  organization: string; // e.g. PF, PRF, Receita Federal, TJ-SP
  examName: string;
  position: string; // e.g. Auditor Fiscal, Agente
  year: number;
  educationLevel: 'superior' | 'medio' | 'fundamental';
  discipline: string; // e.g. Direito Administrativo
  topic: string; // e.g. Atos Administrativos
  subtopic?: string; // e.g. Anulação e Revogação
  modality: QuestionModality;
  difficulty: QuestionDifficulty;
  statement: string; // Full markdown or rich text statement
  supportText?: string; // Texts or reference excerpts
  options: QuestionOption[];
  correctOptionId: string; // 'A', 'B', etc. or 'C'/'E'
  keyStatus: AnswerKeyStatus;
  keyStatusNote?: string;
  explanation: {
    author: string;
    role: string;
    text: string;
    legalBasis?: string; // e.g. "Art. 37 da CF/88", "Súmula 473 do STF"
    updatedAt: string;
  };
  originalExamUrl?: string;
  sourceDocHash?: string;
  totalAttempts: number;
  correctAttempts: number;
  isPublished: boolean;
  createdAt: string;
  reviewStatus: 'aguardando_revisao' | 'aprovada' | 'rejeitada' | 'publicada';
}

export interface QuestionAttempt {
  id: string;
  userId: string;
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  answeredAt: string;
  attemptNumber: number; // 1 for first time, 2, 3...
  reviewBox: number; // 1 to 5 for spaced repetition
  nextReviewAt?: string;
  isMastered: boolean;
}

export interface PersonalNote {
  id: string;
  userId: string;
  questionId: string;
  content: string;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  userId: string;
  title: string;
  description?: string;
  folderId?: string;
  color?: string;
  questionIds: string[];
  createdAt: string;
  updatedAt: string;
  lastStudiedAt?: string;
  isPublic?: boolean;
}

export interface NotebookFolder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface SimulationQuestionConfig {
  discipline: string;
  count: number;
}

export interface Simulation {
  id: string;
  userId: string;
  title: string;
  description?: string;
  mode: 'prova' | 'treinamento'; // 'prova' = gabarito no final; 'treinamento' = imediato
  durationMinutes: number;
  questionIds: string[];
  scoringRule: 'padrao' | 'cespe_ce'; // 1 correct - 1 incorrect for cespe
  status: 'em_andamento' | 'concluido' | 'cancelado';
  createdAt: string;
  completedAt?: string;
}

export interface SimulationAttempt {
  id: string;
  simulationId: string;
  userId: string;
  answers: Record<string, { selectedOptionId: string; answeredAt: string; timeSpentSeconds: number }>;
  flaggedQuestionIds: string[];
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  startedAt: string;
  finishedAt?: string;
  timeUsedSeconds: number;
}

export interface IngestionSource {
  id: string;
  name: string; // e.g. "Cebraspe - Portal de Concursos", "FGV Conhecimento"
  board: string;
  baseUrl: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  crawlerType: 'oficial_publico' | 'manual_upload';
  lastSyncAt?: string;
  legalTermsSummary: string;
}

export interface IngestionJob {
  id: string;
  title: string;
  sourceId: string;
  board: string;
  organization: string;
  year: number;
  status: 'fila' | 'baixando' | 'extraindo' | 'classificando' | 'revisao' | 'concluido' | 'erro';
  progressPercentage: number;
  sourceDocName: string;
  sourceDocHash?: string;
  sourceDocUrl?: string;
  extractedQuestionsCount: number;
  duplicatesFoundCount: number;
  approvedCount: number;
  publishedCount: number;
  errorMessage?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface ExtractedQuestionDraft {
  id: string;
  jobId: string;
  numberInExam: number;
  statement: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  suggestedDiscipline: string;
  suggestedTopic: string;
  suggestedSubtopic?: string;
  classificationConfidence: number; // 0 to 100
  duplicateSimilarity?: number; // 0 to 100
  potentialDuplicateId?: string;
  reviewStatus: 'pendente' | 'aprovado' | 'rejeitado' | 'duplicado';
  reviewerNotes?: string;
  originalRawSnippet: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  questionsAnswered: number;
  correctAnswers: number;
  timeStudiedSeconds: number;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: string;
  progress: number;
  target: number;
  category: 'constancia' | 'volume' | 'precisao' | 'simulado';
}

export interface RankingUser {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  role: UserRole;
  questionsAnswered: number;
  correctCount: number;
  accuracy: number;
  streakDays: number;
  scorePoints: number;
  rank: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface QuestionFilters {
  searchQuery: string;
  boards: string[];
  organizations: string[];
  years: number[];
  disciplines: string[];
  topics: string[];
  difficulties: QuestionDifficulty[];
  modalities: QuestionModality[];
  educationLevels: ('superior' | 'medio' | 'fundamental')[];
  statusFilter: 'todas' | 'nao_resolvidas' | 'resolvidas' | 'acertadas' | 'erradas' | 'favoritas' | 'anuladas' | 'comentadas';
  notebookId?: string;
}
