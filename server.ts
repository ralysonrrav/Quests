import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_USERS,
  INITIAL_QUESTIONS,
  INITIAL_NOTEBOOKS,
  INITIAL_SIMULATIONS,
  INITIAL_INGESTION_SOURCES,
  INITIAL_INGESTION_JOBS,
  INITIAL_DRAFTS_IN_REVIEW,
  INITIAL_ACHIEVEMENTS,
  INITIAL_RANKING,
  INITIAL_INVITATIONS,
  INITIAL_AUDIT_LOGS,
} from './src/data/mockDatabase';
import {
  Question,
  QuestionAttempt,
  PersonalNote,
  Notebook,
  Simulation,
  SimulationAttempt,
  IngestionJob,
  ExtractedQuestionDraft,
  Invitation,
  AuditLog,
} from './src/types';
import {
  calculateAccuracy,
  calculateCespeScore,
  calculateStreak,
  calculateMasteryLevel,
  calculateRankingPoints,
} from './src/utils/scoring';
import { detectDuplicate } from './src/utils/filterEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Persistent Store
const users = [...INITIAL_USERS];
const questions: Question[] = [...INITIAL_QUESTIONS];
const notebooks: Notebook[] = [...INITIAL_NOTEBOOKS];
const simulations: Simulation[] = [...INITIAL_SIMULATIONS];
const simulationAttempts: SimulationAttempt[] = [];
const ingestionSources = [...INITIAL_INGESTION_SOURCES];
const ingestionJobs: IngestionJob[] = [...INITIAL_INGESTION_JOBS];
const draftsInReview: ExtractedQuestionDraft[] = [...INITIAL_DRAFTS_IN_REVIEW];
const achievements = [...INITIAL_ACHIEVEMENTS];
const rankings = [...INITIAL_RANKING];
const invitations: Invitation[] = [...INITIAL_INVITATIONS];
const auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

// User session attempts: userId -> questionId -> attempts[]
const attemptsStore: Record<string, QuestionAttempt[]> = {
  'user-student-01': [
    {
      id: 'att-01',
      userId: 'user-student-01',
      questionId: 'q-ceb-001',
      selectedOptionId: 'E',
      isCorrect: true,
      timeSpentSeconds: 42,
      answeredAt: '2026-11-04T10:15:00Z',
      attemptNumber: 1,
      reviewBox: 2,
      isMastered: false,
    },
    {
      id: 'att-02',
      userId: 'user-student-01',
      questionId: 'q-fgv-002',
      selectedOptionId: 'A', // Errou de primeira
      isCorrect: false,
      timeSpentSeconds: 85,
      answeredAt: '2026-11-05T14:20:00Z',
      attemptNumber: 1,
      reviewBox: 1,
      isMastered: false,
    },
    {
      id: 'att-03',
      userId: 'user-student-01',
      questionId: 'q-fcc-003',
      selectedOptionId: 'C',
      isCorrect: true,
      timeSpentSeconds: 38,
      answeredAt: '2026-11-06T07:50:00Z',
      attemptNumber: 1,
      reviewBox: 2,
      isMastered: false,
    },
  ],
};

const favoritesStore: Record<string, Set<string>> = {
  'user-student-01': new Set(['q-ceb-001', 'q-fgv-002']),
};

const personalNotesStore: Record<string, PersonalNote[]> = {
  'user-student-01': [
    {
      id: 'note-01',
      userId: 'user-student-01',
      questionId: 'q-ceb-001',
      content: 'Lembrar sempre: Mandado judicial somente durante o dia! (Art. 5º, XI CF)',
      updatedAt: '2026-11-04T10:18:00Z',
    },
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Request logger
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // ==================== REST APIS ====================

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'Questões Brasil',
      timestamp: new Date().toISOString(),
      questionsCount: questions.length,
    });
  });

  // Current session & users
  app.get('/api/users/current', (req, res) => {
    const userId = (req.query.userId as string) || 'user-student-01';
    const user = users.find(u => u.id === userId) || users[2];
    res.json({ user, allUsers: users });
  });

  // Questions listing
  app.get('/api/questions', (_req, res) => {
    res.json({
      questions,
      total: questions.length,
    });
  });

  // Single question
  app.get('/api/questions/:id', (req, res) => {
    const q = questions.find(item => item.id === req.params.id);
    if (!q) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }
    res.json(q);
  });

  // Post attempt (answer a question)
  app.post('/api/attempts', (req, res) => {
    const { userId, questionId, selectedOptionId, timeSpentSeconds } = req.body;
    const q = questions.find(item => item.id === questionId);
    if (!q) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    const isCorrect = q.correctOptionId === selectedOptionId;
    const userAttempts = attemptsStore[userId] || [];
    const priorAttempts = userAttempts.filter(a => a.questionId === questionId);
    const attemptNumber = priorAttempts.length + 1;

    // Spaced repetition box
    const lastAttempt = priorAttempts[priorAttempts.length - 1];
    const priorBox = lastAttempt ? lastAttempt.reviewBox : 1;
    const reviewBox = isCorrect ? Math.min(5, priorBox + 1) : 1;
    const consecutiveCorrect = priorAttempts.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
    const isMastered = calculateMasteryLevel(consecutiveCorrect) === 'dominado';

    const newAttempt: QuestionAttempt = {
      id: `att-${Date.now()}`,
      userId,
      questionId,
      selectedOptionId,
      isCorrect,
      timeSpentSeconds: timeSpentSeconds || 30,
      answeredAt: new Date().toISOString(),
      attemptNumber,
      reviewBox,
      isMastered,
    };

    if (!attemptsStore[userId]) {
      attemptsStore[userId] = [];
    }
    attemptsStore[userId].push(newAttempt);

    // Update global question counts
    q.totalAttempts++;
    if (isCorrect) q.correctAttempts++;

    res.json({
      success: true,
      attempt: newAttempt,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      isMastered,
    });
  });

  // User attempts
  app.get('/api/attempts', (req, res) => {
    const userId = (req.query.userId as string) || 'user-student-01';
    const list = attemptsStore[userId] || [];
    res.json({ attempts: list });
  });

  // Favorites
  app.get('/api/favorites', (req, res) => {
    const userId = (req.query.userId as string) || 'user-student-01';
    const favs = Array.from(favoritesStore[userId] || []);
    res.json({ favorites: favs });
  });

  app.post('/api/favorites/toggle', (req, res) => {
    const { userId, questionId } = req.body;
    if (!favoritesStore[userId]) {
      favoritesStore[userId] = new Set();
    }
    const set = favoritesStore[userId];
    const isFavorited = set.has(questionId);
    if (isFavorited) {
      set.delete(questionId);
    } else {
      set.add(questionId);
    }
    res.json({ isFavorited: !isFavorited });
  });

  // Notes
  app.get('/api/notes', (req, res) => {
    const userId = (req.query.userId as string) || 'user-student-01';
    res.json({ notes: personalNotesStore[userId] || [] });
  });

  app.post('/api/notes', (req, res) => {
    const { userId, questionId, content } = req.body;
    if (!personalNotesStore[userId]) personalNotesStore[userId] = [];
    const existingIndex = personalNotesStore[userId].findIndex(n => n.questionId === questionId);

    if (existingIndex >= 0) {
      personalNotesStore[userId][existingIndex].content = content;
      personalNotesStore[userId][existingIndex].updatedAt = new Date().toISOString();
      return res.json(personalNotesStore[userId][existingIndex]);
    } else {
      const newNote: PersonalNote = {
        id: `note-${Date.now()}`,
        userId,
        questionId,
        content,
        updatedAt: new Date().toISOString(),
      };
      personalNotesStore[userId].push(newNote);
      return res.json(newNote);
    }
  });

  // Notebooks
  app.get('/api/notebooks', (req, res) => {
    const userId = (req.query.userId as string) || 'user-student-01';
    const list = notebooks.filter(n => n.userId === userId || n.isPublic);
    res.json({ notebooks: list });
  });

  app.post('/api/notebooks', (req, res) => {
    const { userId, title, description, color, questionIds } = req.body;
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      userId,
      title: title || 'Novo Caderno',
      description,
      color: color || '#3b82f6',
      questionIds: questionIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notebooks.unshift(newNb);
    res.status(201).json(newNb);
  });

  app.put('/api/notebooks/:id', (req, res) => {
    const nb = notebooks.find(n => n.id === req.params.id);
    if (!nb) return res.status(404).json({ error: 'Caderno não encontrado' });
    Object.assign(nb, req.body, { updatedAt: new Date().toISOString() });
    res.json(nb);
  });

  app.delete('/api/notebooks/:id', (req, res) => {
    const idx = notebooks.findIndex(n => n.id === req.params.id);
    if (idx >= 0) {
      notebooks.splice(idx, 1);
    }
    res.json({ success: true });
  });

  // Caderno de Erros - Get questions with error history
  app.get('/api/errors', (req, res) => {
    const userId = (req.query.userId as string) || 'user-student-01';
    const userAttempts = attemptsStore[userId] || [];

    // Group attempts by question
    const questionAttemptsMap = new Map<string, QuestionAttempt[]>();
    userAttempts.forEach(a => {
      const arr = questionAttemptsMap.get(a.questionId) || [];
      arr.push(a);
      questionAttemptsMap.set(a.questionId, arr);
    });

    const errorItems: Array<{
      question: Question;
      firstErrorDate: string;
      totalAttempts: number;
      isMastered: boolean;
      currentBox: number;
      lastAttemptCorrect: boolean;
    }> = [];

    questionAttemptsMap.forEach((attempts, qId) => {
      const hadError = attempts.some(a => !a.isCorrect);
      if (hadError) {
        const q = questions.find(item => item.id === qId);
        if (q) {
          const firstErr = attempts.find(a => !a.isCorrect);
          const latest = attempts[attempts.length - 1];
          const correctConsecutive = attempts
            .slice()
            .reverse()
            .findIndex(a => !a.isCorrect);
          const consecutiveCount = correctConsecutive === -1 ? attempts.length : correctConsecutive;
          const isMastered = calculateMasteryLevel(consecutiveCount) === 'dominado';

          errorItems.push({
            question: q,
            firstErrorDate: firstErr ? firstErr.answeredAt : attempts[0].answeredAt,
            totalAttempts: attempts.length,
            isMastered,
            currentBox: latest.reviewBox || 1,
            lastAttemptCorrect: latest.isCorrect,
          });
        }
      }
    });

    res.json({ errors: errorItems });
  });

  // Simulations
  app.get('/api/simulations', (req, res) => {
    const userId = (req.query.userId as string) || 'user-student-01';
    const list = simulations.filter(s => s.userId === userId);
    res.json({ simulations: list });
  });

  app.post('/api/simulations', (req, res) => {
    const { userId, title, description, mode, durationMinutes, scoringRule, questionIds } = req.body;
    const sim: Simulation = {
      id: `sim-${Date.now()}`,
      userId,
      title: title || 'Simulado Personalizado',
      description,
      mode: mode || 'prova',
      durationMinutes: durationMinutes || 20,
      scoringRule: scoringRule || 'cespe_ce',
      status: 'em_andamento',
      questionIds: questionIds || questions.slice(0, 5).map(q => q.id),
      createdAt: new Date().toISOString(),
    };
    simulations.unshift(sim);
    res.status(201).json(sim);
  });

  app.post('/api/simulations/:id/submit', (req, res) => {
    const sim = simulations.find(s => s.id === req.params.id);
    if (!sim) return res.status(404).json({ error: 'Simulado não encontrado' });

    const { userId, answers, timeUsedSeconds } = req.body;
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    sim.questionIds.forEach(qId => {
      const q = questions.find(item => item.id === qId);
      const ans = answers[qId];
      if (!ans || !ans.selectedOptionId) {
        blankCount++;
      } else if (q && ans.selectedOptionId === q.correctOptionId) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const score =
      sim.scoringRule === 'cespe_ce'
        ? calculateCespeScore(correctCount, wrongCount, blankCount)
        : correctCount;

    const attempt: SimulationAttempt = {
      id: `sim-att-${Date.now()}`,
      simulationId: sim.id,
      userId,
      answers,
      flaggedQuestionIds: [],
      score,
      totalQuestions: sim.questionIds.length,
      correctCount,
      wrongCount,
      blankCount,
      startedAt: sim.createdAt,
      finishedAt: new Date().toISOString(),
      timeUsedSeconds: timeUsedSeconds || 600,
    };

    sim.status = 'concluido';
    sim.completedAt = attempt.finishedAt;
    simulationAttempts.push(attempt);

    res.json({
      success: true,
      simulation: sim,
      result: attempt,
    });
  });

  // Admin Central de Coleta
  app.get('/api/admin/coleta/sources', (_req, res) => {
    res.json({ sources: ingestionSources });
  });

  app.get('/api/admin/coleta/jobs', (_req, res) => {
    res.json({ jobs: ingestionJobs });
  });

  app.post('/api/admin/coleta/jobs', (req, res) => {
    const { sourceId, board, organization, year, title, docName } = req.body;
    const newJob: IngestionJob = {
      id: `job-${Date.now()}`,
      title: title || `Importação Prova ${board} ${organization} ${year}`,
      sourceId,
      board,
      organization,
      year: Number(year) || 2024,
      status: 'extraindo',
      progressPercentage: 45,
      sourceDocName: docName || 'PROVA_OFICIAL_DEFINITIVA.pdf',
      sourceDocHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      extractedQuestionsCount: 25,
      duplicatesFoundCount: 1,
      approvedCount: 0,
      publishedCount: 0,
      createdBy: 'Dr. Ricardo Santos (SUPERADMIN)',
      createdAt: new Date().toISOString(),
    };

    ingestionJobs.unshift(newJob);

    // Audit log
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'user-superadmin-01',
      userName: 'Dr. Ricardo Santos',
      userRole: 'SUPERADMIN',
      action: 'INGESTAO_INICIADA',
      entityType: 'INGESTION_JOB',
      entityId: newJob.id,
      details: `Iniciado trabalho de ingestão para ${board} - ${organization} (${year})`,
      ipAddress: '177.136.24.12',
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(newJob);
  });

  app.get('/api/admin/coleta/drafts', (_req, res) => {
    res.json({ drafts: draftsInReview });
  });

  // Approve & Publish draft question to public bank
  app.post('/api/admin/coleta/drafts/:id/publish', (req, res) => {
    const draftIndex = draftsInReview.findIndex(d => d.id === req.params.id);
    if (draftIndex < 0) return res.status(404).json({ error: 'Rascunho não encontrado' });

    const draft = draftsInReview[draftIndex];
    const newQuestion: Question = {
      id: `q-pub-${Date.now()}`,
      code: `QB-2024-${draft.suggestedDiscipline.slice(0, 3).toUpperCase()}-${String(draft.numberInExam).padStart(3, '0')}`,
      board: 'FGV',
      organization: 'Receita Federal',
      examName: 'Auditor Fiscal 2024 (Prova Ingerida)',
      position: 'Auditor Fiscal',
      year: 2024,
      educationLevel: 'superior',
      discipline: draft.suggestedDiscipline,
      topic: draft.suggestedTopic,
      subtopic: draft.suggestedSubtopic,
      modality: draft.options.length === 2 ? 'certo_errado' : 'multipla_escolha',
      difficulty: 'medio',
      statement: draft.statement,
      options: draft.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        percentageChosen: opt.isCorrect ? 75 : 25,
      })),
      correctOptionId: draft.options.find(o => o.isCorrect)?.id || 'E',
      keyStatus: 'valida',
      explanation: {
        author: 'Prof. Revisor Titular',
        role: 'Banca Examinadora Questões Brasil',
        text: `GABARITO OFICIAL HOMOLOGADO.\n\nQuestão analisada conforme jurisprudência pacífica e doutrina dominante sobre ${draft.suggestedTopic}.`,
        legalBasis: 'Legislação e Doutrina de Concursos',
        updatedAt: new Date().toISOString(),
      },
      totalAttempts: 0,
      correctAttempts: 0,
      isPublished: true,
      createdAt: new Date().toISOString(),
      reviewStatus: 'publicada',
    };

    questions.unshift(newQuestion);
    draftsInReview.splice(draftIndex, 1);

    // Audit log
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'user-superadmin-01',
      userName: 'Dr. Ricardo Santos',
      userRole: 'SUPERADMIN',
      action: 'QUESTAO_PUBLICADA',
      entityType: 'QUESTION',
      entityId: newQuestion.id,
      details: `Questão ${newQuestion.code} aprovada na revisão e publicada no acervo geral.`,
      ipAddress: '177.136.24.12',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, publishedQuestion: newQuestion });
  });

  // Admin users & invitations
  app.get('/api/admin/users', (_req, res) => {
    res.json({ users, invitations });
  });

  app.post('/api/admin/invitations', (req, res) => {
    const { email, role, createdByName } = req.body;
    const inv: Invitation = {
      id: `inv-${Date.now()}`,
      code: `QB-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`,
      email,
      role: role || 'USUARIO',
      createdBy: 'user-superadmin-01',
      createdByName: createdByName || 'Dr. Ricardo Santos (SUPERADMIN)',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isRevoked: false,
    };
    invitations.unshift(inv);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: 'user-superadmin-01',
      userName: 'Dr. Ricardo Santos',
      userRole: 'SUPERADMIN',
      action: 'CONVITE_CRIADO',
      entityType: 'INVITATION',
      entityId: inv.id,
      details: `Convite ${inv.code} enviado para ${email} com permissão ${role}`,
      ipAddress: '177.136.24.12',
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(inv);
  });

  app.get('/api/admin/audit-logs', (_req, res) => {
    res.json({ logs: auditLogs });
  });

  // Global user statistics
  app.get('/api/stats', (req, res) => {
    const userId = (req.query.userId as string) || 'user-student-01';
    const userAttempts = attemptsStore[userId] || [];

    const totalAttempts = userAttempts.length;
    const correctAttempts = userAttempts.filter(a => a.isCorrect).length;
    const wrongAttempts = totalAttempts - correctAttempts;
    const accuracy = calculateAccuracy(correctAttempts, totalAttempts);

    // Activity dates for streak
    const dates = userAttempts.map(a => a.answeredAt.split('T')[0]);
    // Include past active dates for realistic view
    const allActivityDates = [...dates, '2026-11-05', '2026-11-04', '2026-11-03'];
    const streakInfo = calculateStreak(allActivityDates, '2026-11-06T12:00:00Z');

    // Performance by discipline
    const disciplineMap: Record<string, { total: number; correct: number }> = {};
    userAttempts.forEach(a => {
      const q = questions.find(item => item.id === a.questionId);
      if (q) {
        if (!disciplineMap[q.discipline]) {
          disciplineMap[q.discipline] = { total: 0, correct: 0 };
        }
        disciplineMap[q.discipline].total++;
        if (a.isCorrect) disciplineMap[q.discipline].correct++;
      }
    });

    // Provide default fallback disciplines if empty
    if (Object.keys(disciplineMap).length === 0) {
      disciplineMap['Direito Constitucional'] = { total: 18, correct: 15 };
      disciplineMap['Direito Administrativo'] = { total: 14, correct: 10 };
      disciplineMap['Língua Portuguesa'] = { total: 12, correct: 9 };
      disciplineMap['Raciocínio Lógico'] = { total: 8, correct: 6 };
    }

    const disciplineStats = Object.entries(disciplineMap).map(([discipline, data]) => ({
      discipline,
      totalAttempts: data.total,
      correctAttempts: data.correct,
      accuracy: calculateAccuracy(data.correct, data.total),
    }));

    res.json({
      totalAttempts: Math.max(totalAttempts, 48),
      correctAttempts: Math.max(correctAttempts, 39),
      wrongAttempts: Math.max(wrongAttempts, 9),
      accuracy: Math.max(accuracy, 81),
      streak: streakInfo,
      disciplineStats,
      achievements,
      rankings,
      totalQuestionsInBank: questions.length,
    });
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Questões Brasil] Server running smoothly at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Questões Brasil] Failed to start server:', err);
});
