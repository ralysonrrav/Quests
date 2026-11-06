export interface DisciplineStatsSummary {
  discipline: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

export interface StudyInsight {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  actionFilter?: { discipline?: string };
}

/**
 * Derives actionable, data-driven study recommendations
 * e.g. "Seu desempenho em Direito Administrativo está abaixo da sua média"
 */
export function generateStudyInsights(
  disciplines: DisciplineStatsSummary[],
  unreviewedErrorsCount: number,
  currentStreak: number,
  dailyGoal: number,
  todayQuestionsCount: number
): StudyInsight[] {
  const insights: StudyInsight[] = [];

  if (disciplines.length === 0 && todayQuestionsCount === 0) {
    insights.push({
      id: 'welcome',
      type: 'info',
      title: 'Comece sua jornada de estudos',
      message: 'Resolva suas primeiras questões para ativar o radar de inteligência e diagnóstico de pontos fortes.',
      actionLabel: 'Ir para Questões',
    });
    return insights;
  }

  // Calculate overall user average accuracy
  const totalAllAttempts = disciplines.reduce((acc, d) => acc + d.totalAttempts, 0);
  const totalAllCorrect = disciplines.reduce((acc, d) => acc + d.correctAttempts, 0);
  const globalAccuracy = totalAllAttempts > 0 ? (totalAllCorrect / totalAllAttempts) * 100 : 0;

  // 1. Identify low-performing discipline (needs min 5 attempts to be statistically valid)
  const weakDisciplines = disciplines
    .filter(d => d.totalAttempts >= 5 && d.accuracy < Math.max(50, globalAccuracy - 15))
    .sort((a, b) => a.accuracy - b.accuracy);

  if (weakDisciplines.length > 0) {
    const worst = weakDisciplines[0];
    insights.push({
      id: `weak-${worst.discipline}`,
      type: 'warning',
      title: `Atenção em ${worst.discipline}`,
      message: `Seu aproveitamento em ${worst.discipline} está em ${worst.accuracy}%, abaixo da sua média geral (${Math.round(globalAccuracy)}%). Pratique mais questões desse tema.`,
      actionLabel: `Treinar ${worst.discipline}`,
      actionFilter: { discipline: worst.discipline },
    });
  }

  // 2. Unreviewed error notebook alert
  if (unreviewedErrorsCount > 0) {
    insights.push({
      id: 'pending-errors',
      type: 'warning',
      title: 'Revisão Pendente',
      message: `Você possui ${unreviewedErrorsCount} questão(ões) no Caderno de Erros aguardando revisão espaçada.`,
      actionLabel: 'Revisar Erros',
    });
  }

  // 3. Streak and daily goal progress
  if (todayQuestionsCount >= dailyGoal) {
    insights.push({
      id: 'goal-met',
      type: 'success',
      title: 'Meta Diária Concluída!',
      message: `Excelente! Você atingiu sua meta de ${dailyGoal} questões hoje. Constância é o segredo da aprovação.`,
    });
  } else if (todayQuestionsCount > 0) {
    insights.push({
      id: 'goal-progress',
      type: 'info',
      title: 'Progresso da Meta',
      message: `Faltam apenas ${dailyGoal - todayQuestionsCount} questões para bater sua meta diária de hoje (${todayQuestionsCount}/${dailyGoal}).`,
      actionLabel: 'Continuar Estudando',
    });
  }

  // 4. Strong discipline commendation
  const strongDisciplines = disciplines
    .filter(d => d.totalAttempts >= 10 && d.accuracy >= 80)
    .sort((a, b) => b.accuracy - a.accuracy);

  if (strongDisciplines.length > 0) {
    const best = strongDisciplines[0];
    insights.push({
      id: `strong-${best.discipline}`,
      type: 'success',
      title: `Domínio em ${best.discipline}`,
      message: `Você mantém um excelente índice de ${best.accuracy}% de acertos em ${best.discipline} (${best.totalAttempts} questões).`,
    });
  }

  return insights;
}

/**
 * Leitner Spaced Repetition Box Progression:
 * Box 1: 1 day
 * Box 2: 3 days
 * Box 3: 7 days
 * Box 4: 15 days
 * Box 5: 30 days (Mastered)
 */
export function calculateNextReview(
  currentBox: number,
  isCorrect: boolean
): { nextBox: number; daysUntilReview: number; isMastered: boolean } {
  if (!isCorrect) {
    // Reset to box 1 on failure
    return { nextBox: 1, daysUntilReview: 1, isMastered: false };
  }

  const nextBox = Math.min(5, currentBox + 1);
  const intervalMap: Record<number, number> = {
    1: 1,
    2: 3,
    3: 7,
    4: 14,
    5: 30,
  };

  return {
    nextBox,
    daysUntilReview: intervalMap[nextBox] || 1,
    isMastered: nextBox >= 4,
  };
}
