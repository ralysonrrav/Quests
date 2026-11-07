import {
  supabase,
  isSupabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
  getActiveSupabaseConfig,
  updateRuntimeSupabaseConfig,
  resetRuntimeSupabaseConfig,
} from './supabaseClient';
import { Question, UserProfile, Notebook, QuestionAttempt } from '../types';

export interface SupabaseHealthCheckResult {
  isConfigured: boolean;
  status: 'connected' | 'schema_missing' | 'error' | 'not_configured';
  url: string;
  maskedKey: string;
  source?: 'custom_storage' | 'env_variable' | 'default_project';
  latencyMs?: number;
  message: string;
  details?: string;
  tablesFound?: {
    questions: boolean;
    profiles: boolean;
    notebooks: boolean;
  };
  totalQuestionsCount?: number;
}

// Helpers for UUID validation to prevent PostgreSQL 22P02 syntax errors
const isValidUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const DEMO_USER_UUIDS: Record<string, string> = {
  'user-superadmin-01': 'a0000000-0000-0000-0000-000000000001',
  'user-admin-01': 'a0000000-0000-0000-0000-000000000002',
  'user-student-01': 'a0000000-0000-0000-0000-000000000003',
};

function toValidUUID(id: string): string | null {
  if (isValidUUID(id)) return id;
  if (DEMO_USER_UUIDS[id]) return DEMO_USER_UUIDS[id];
  return null;
}

export const supabaseService = {
  isConfigured: () => isSupabaseConfigured,

  getConfig: () => getActiveSupabaseConfig(),

  updateConfig: (url: string, key: string) => updateRuntimeSupabaseConfig(url, key),

  resetConfig: () => resetRuntimeSupabaseConfig(),

  // -------------------------------------------------------------
  // HEALTH CHECK / CONNECTION TEST
  // -------------------------------------------------------------
  async testConnection(): Promise<SupabaseHealthCheckResult> {
    const config = getActiveSupabaseConfig();
    const url = config.url;
    const key = config.anonKey;
    const maskedKey = key ? `${key.slice(0, 8)}...${key.slice(-6)}` : 'Não informada';

    if (!isSupabaseConfigured || !supabase) {
      return {
        isConfigured: false,
        status: 'not_configured',
        url: url || 'Não configurada (adicione VITE_SUPABASE_URL no .env)',
        maskedKey,
        source: config.source,
        message: 'Credenciais do Supabase não configuradas no ambiente.',
        details: 'Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env ou no painel da Vercel.',
      };
    }

    const start = performance.now();
    try {
      // Test queries with .limit(1) against actual public schema tables
      const [qRes, profRes, notebRes] = await Promise.all([
        supabase.from('questions').select('id', { count: 'exact' }).limit(1),
        supabase.from('profiles').select('id').limit(1),
        supabase.from('notebooks').select('id').limit(1),
      ]);

      const latencyMs = Math.round(performance.now() - start);

      const isQTableMissing = qRes.error?.code === 'PGRST205';
      const isProfTableMissing = profRes.error?.code === 'PGRST205';
      const isNotebTableMissing = notebRes.error?.code === 'PGRST205';

      const tablesFound = {
        questions: !qRes.error,
        profiles: !profRes.error,
        notebooks: !notebRes.error,
      };

      // If tables are missing (PGRST205), credentials work but migration is pending
      if (isQTableMissing || isProfTableMissing || isNotebTableMissing) {
        return {
          isConfigured: true,
          status: 'schema_missing',
          url,
          maskedKey,
          source: config.source,
          latencyMs,
          message: 'Conectado ao Supabase! Tabelas aguardando migração SQL inicial.',
          details:
            'A URL e a Chave Anônima responderam com sucesso. Para criar as tabelas e regras RLS, execute o arquivo supabase/migrations/20261106000001_initial_schema.sql no SQL Editor do Supabase.',
          tablesFound,
          totalQuestionsCount: 0,
        };
      }

      if (qRes.error) {
        return {
          isConfigured: true,
          status: 'error',
          url,
          maskedKey,
          source: config.source,
          latencyMs,
          message: 'Falha ao consultar banco de dados no Supabase.',
          details: qRes.error.message || qRes.error.details || 'Possível bloqueio de permissão RLS.',
          tablesFound,
        };
      }

      return {
        isConfigured: true,
        status: 'connected',
        url,
        maskedKey,
        source: config.source,
        latencyMs,
        message: 'Conexão ativa e tabelas homologadas no Supabase PostgreSQL!',
        totalQuestionsCount: qRes.count ?? (qRes.data?.length ?? 0),
        tablesFound,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        isConfigured: true,
        status: 'error',
        url,
        maskedKey,
        source: config.source,
        latencyMs,
        message: 'Erro de rede ou conexão recusada pelo Supabase.',
        details: err?.message || 'Verifique se o URL do projeto e a chave anônima estão corretos.',
      };
    }
  },

  // -------------------------------------------------------------
  // QUESTIONS & OPTIONS (Using exact database schema columns)
  // -------------------------------------------------------------
  async getQuestions(): Promise<Question[] | null> {
    if (!supabase) return null;
    try {
      const { data: questionsData, error: qErr } = await supabase
        .from('questions')
        .select(`
          id,
          code,
          board,
          organization,
          exam_name,
          position,
          year,
          education_level,
          modality,
          difficulty,
          statement,
          support_text,
          correct_option_id,
          key_status,
          explanation_author,
          explanation_role,
          explanation_text,
          explanation_legal_basis,
          total_attempts,
          correct_attempts,
          is_published,
          options:question_options (
            id,
            letter_id,
            option_text,
            is_correct,
            percentage_chosen
          )
        `)
        .order('created_at', { ascending: false });

      if (qErr) {
        console.warn('Aviso ao consultar questões no Supabase:', qErr.message);
        return null;
      }

      if (!questionsData || questionsData.length === 0) {
        return [];
      }

      return questionsData.map((row: any) => ({
        id: row.id,
        code: row.code,
        board: row.board,
        organization: row.organization,
        examName: row.exam_name || 'Concurso Público',
        position: row.position || 'Geral',
        year: Number(row.year) || 2024,
        educationLevel: row.education_level || 'superior',
        discipline: 'Geral',
        topic: 'Conhecimentos Específicos',
        subtopic: 'Tópicos do Edital',
        modality: row.modality || 'multipla_escolha',
        difficulty: row.difficulty || 'medio',
        statement: row.statement,
        supportText: row.support_text || undefined,
        correctOptionId: row.correct_option_id,
        keyStatus: row.key_status || 'valida',
        options: (row.options || []).map((o: any) => ({
          id: o.letter_id || o.id,
          text: o.option_text || '',
          isCorrect: Boolean(o.is_correct),
          percentageChosen: Number(o.percentage_chosen) || (o.is_correct ? 75 : 25),
        })),
        explanation: {
          author: row.explanation_author || 'Prof. Questões Brasil',
          role: row.explanation_role || 'Especialista',
          text: row.explanation_text || 'Gabarito oficial homologado.',
          legalBasis: row.explanation_legal_basis || '',
          updatedAt: new Date().toISOString(),
        },
        totalAttempts: row.total_attempts || 0,
        correctAttempts: row.correct_attempts || 0,
        isPublished: Boolean(row.is_published),
        createdAt: new Date().toISOString(),
        reviewStatus: 'publicada',
      }));
    } catch (e: any) {
      console.warn('Exceção ao consultar questões no Supabase:', e?.message || e);
      return null;
    }
  },

  // -------------------------------------------------------------
  // RECORD QUESTION ATTEMPT (question_attempts table)
  // -------------------------------------------------------------
  async recordAttempt(params: {
    userId: string;
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    timeSpentSeconds: number;
  }) {
    if (!supabase) return null;
    const userUuid = toValidUUID(params.userId);
    const questionUuid = toValidUUID(params.questionId);

    // If IDs are not UUIDs (e.g. mock data 'q-ceb-001'), skip DB insert cleanly
    if (!userUuid || !questionUuid) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('question_attempts')
        .insert({
          user_id: userUuid,
          question_id: questionUuid,
          selected_option_id: params.selectedOptionId,
          is_correct: params.isCorrect,
          time_spent_seconds: params.timeSpentSeconds,
        })
        .select()
        .single();

      if (error) {
        console.warn('Aviso ao registrar tentativa no Supabase:', error.message);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  // -------------------------------------------------------------
  // USER NOTEBOOKS (notebooks table)
  // -------------------------------------------------------------
  async getNotebooks(userId: string): Promise<Notebook[] | null> {
    if (!supabase) return null;
    const userUuid = toValidUUID(userId);
    if (!userUuid) return null;

    try {
      const { data, error } = await supabase
        .from('notebooks')
        .select(`
          id,
          title,
          description,
          color,
          created_at,
          updated_at,
          notebook_questions (
            question_id
          )
        `)
        .eq('user_id', userUuid)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Aviso ao consultar cadernos no Supabase:', error.message);
        return null;
      }

      if (!data) return null;

      return data.map((nb: any) => ({
        id: nb.id,
        userId,
        title: nb.title,
        description: nb.description,
        color: nb.color || '#2563eb',
        questionIds: (nb.notebook_questions || []).map((q: any) => q.question_id),
        createdAt: nb.created_at,
        updatedAt: nb.updated_at,
      }));
    } catch {
      return null;
    }
  },

  async createNotebook(params: {
    userId: string;
    title: string;
    description?: string;
    color?: string;
  }): Promise<Notebook | null> {
    if (!supabase) return null;
    const userUuid = toValidUUID(params.userId);
    if (!userUuid) return null;

    try {
      const { data, error } = await supabase
        .from('notebooks')
        .insert({
          user_id: userUuid,
          title: params.title,
          description: params.description,
          color: params.color || '#2563eb',
        })
        .select()
        .single();

      if (error) {
        console.warn('Aviso ao criar caderno no Supabase:', error.message);
        return null;
      }

      return {
        id: data.id,
        userId: params.userId,
        title: data.title,
        description: data.description,
        color: data.color,
        questionIds: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch {
      return null;
    }
  },

  async addQuestionToNotebook(notebookId: string, questionId: string): Promise<boolean> {
    if (!supabase) return false;
    const nbUuid = toValidUUID(notebookId);
    const qUuid = toValidUUID(questionId);
    if (!nbUuid || !qUuid) return false;

    try {
      const { error } = await supabase
        .from('notebook_questions')
        .insert({
          notebook_id: nbUuid,
          question_id: qUuid,
        });

      if (error) {
        console.warn('Aviso ao vincular questão ao caderno:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // USER PROFILES
  // -------------------------------------------------------------
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    if (!supabase) return null;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!profile) return null;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        nickname: profile.nickname || profile.name,
        role: profile.role || 'USUARIO',
        avatarUrl: profile.avatar_url,
        isPublicRanking: profile.is_public_ranking ?? true,
        createdAt: profile.created_at,
        lastLoginAt: profile.last_login_at,
        isActive: profile.status === 'ACTIVE',
      };
    } catch {
      return null;
    }
  },
};
