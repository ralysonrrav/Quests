import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Question, UserProfile, Notebook, Simulation, QuestionAttempt } from '../types';

export const supabaseService = {
  isConfigured: () => isSupabaseConfigured,

  // -------------------------------------------------------------
  // QUESTIONS & OPTIONS
  // -------------------------------------------------------------
  async getQuestions(): Promise<Question[] | null> {
    if (!supabase) return null;
    try {
      const { data: questionsData, error: qErr } = await supabase
        .from('questions')
        .select(`
          id,
          code,
          board:institution,
          organization:agency,
          examName:exam_name,
          position,
          year,
          educationLevel:education_level,
          discipline,
          topic,
          subtopic,
          modality,
          difficulty,
          statement,
          correctOptionId:correct_option,
          keyStatus:key_status,
          explanationText:explanation_text,
          explanationAuthor:explanation_author,
          legalBasis:legal_basis,
          totalAttempts:total_attempts,
          correctAttempts:correct_attempts,
          isPublished:status,
          options:question_options (
            id:option_id,
            text,
            isCorrect:is_correct
          )
        `)
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false });

      if (qErr) {
        console.warn('Erro ao carregar questões do Supabase:', qErr);
        return null;
      }

      if (!questionsData || questionsData.length === 0) {
        return null;
      }

      return questionsData.map((row: any) => ({
        id: row.id,
        code: row.code,
        board: row.board,
        organization: row.organization,
        examName: row.examName,
        position: row.position,
        year: Number(row.year),
        educationLevel: row.educationLevel,
        discipline: row.discipline,
        topic: row.topic,
        subtopic: row.subtopic,
        modality: row.modality,
        difficulty: row.difficulty,
        statement: row.statement,
        correctOptionId: row.correctOptionId,
        keyStatus: row.keyStatus,
        options: (row.options || []).map((o: any) => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
          percentageChosen: o.isCorrect ? 75 : 25,
        })),
        explanation: {
          author: row.explanationAuthor || 'Prof. Questões Brasil',
          role: 'Especialista',
          text: row.explanationText || 'Gabarito oficial homologado.',
          legalBasis: row.legalBasis || '',
          updatedAt: new Date().toISOString(),
        },
        totalAttempts: row.totalAttempts || 0,
        correctAttempts: row.correctAttempts || 0,
        isPublished: true,
        createdAt: new Date().toISOString(),
        reviewStatus: 'publicada',
      }));
    } catch (e) {
      console.warn('Exceção ao consultar Supabase:', e);
      return null;
    }
  },

  // -------------------------------------------------------------
  // RECORD QUESTION ATTEMPT / RESOLUTION
  // -------------------------------------------------------------
  async recordAttempt(params: {
    userId: string;
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    timeSpentSeconds: number;
  }) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('question_resolutions')
        .insert({
          user_id: params.userId,
          question_id: params.questionId,
          chosen_option: params.selectedOptionId,
          is_correct: params.isCorrect,
          time_spent_seconds: params.timeSpentSeconds,
        })
        .select()
        .single();

      if (error) {
        console.warn('Erro ao salvar resolução no Supabase:', error);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('Exceção ao salvar tentativa no Supabase:', e);
      return null;
    }
  },

  // -------------------------------------------------------------
  // USER NOTEBOOKS
  // -------------------------------------------------------------
  async getNotebooks(userId: string): Promise<Notebook[] | null> {
    if (!supabase) return null;
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao carregar cadernos do Supabase:', error);
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
    } catch (e) {
      console.warn('Exceção ao consultar cadernos:', e);
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
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .insert({
          user_id: params.userId,
          title: params.title,
          description: params.description,
          color: params.color || '#2563eb',
        })
        .select()
        .single();

      if (error) {
        console.warn('Erro ao criar caderno no Supabase:', error);
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
    } catch (e) {
      console.warn('Exceção ao criar caderno:', e);
      return null;
    }
  },

  async addQuestionToNotebook(notebookId: string, questionId: string) {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('notebook_questions')
        .insert({
          notebook_id: notebookId,
          question_id: questionId,
        });

      if (error) {
        console.warn('Erro ao vincular questão ao caderno:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Exceção ao vincular questão:', e);
      return false;
    }
  },

  // -------------------------------------------------------------
  // AUTHENTICATION & USER PROFILE
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

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single();

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        nickname: profile.nickname || profile.name,
        role: roleRow?.role || 'USUARIO',
        avatarUrl: profile.avatar_url,
        isPublicRanking: !profile.hide_ranking,
        createdAt: profile.created_at,
        lastLoginAt: profile.last_login_at,
        isActive: profile.status === 'ACTIVE',
      };
    } catch (e) {
      console.warn('Exceção ao obter perfil:', e);
      return null;
    }
  },
};
