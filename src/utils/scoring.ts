/**
 * Scoring, Accuracy, Streak and Mastery Calculations
 */

export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * CESPE / Cebraspe Scoring Rule:
 * 1 right = +1, 1 wrong = -1, blank = 0
 */
export function calculateCespeScore(correct: number, wrong: number, _blank: number = 0): number {
  const rawScore = correct - wrong;
  return rawScore;
}

/**
 * Standard multiple choice score:
 * 1 point per correct answer
 */
export function calculateStandardScore(correct: number): number {
  return Math.max(0, correct);
}

/**
 * Calculates current and longest streak from an array of ISO date strings (YYYY-MM-DD)
 * Study threshold: requires at least 1 qualified question attempt on that day.
 */
export function calculateStreak(
  activityDates: string[],
  referenceDateStr?: string
): { currentStreak: number; longestStreak: number; studiedToday: boolean } {
  if (!activityDates || activityDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, studiedToday: false };
  }

  // Deduplicate and sort dates descending
  const uniqueSortedDates = Array.from(new Set(activityDates))
    .filter(Boolean)
    .sort()
    .reverse();

  if (uniqueSortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, studiedToday: false };
  }

  const today = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const formatUtcDate = (d: Date) => d.toISOString().split('T')[0];

  const todayStr = formatUtcDate(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatUtcDate(yesterday);

  const studiedToday = uniqueSortedDates.includes(todayStr);

  // Check if streak is alive (either studied today or yesterday)
  let currentStreak = 0;
  let checkDate = studiedToday ? new Date(today) : new Date(yesterday);

  if (studiedToday || uniqueSortedDates.includes(yesterdayStr)) {
    while (true) {
      const dateToCheckStr = formatUtcDate(checkDate);
      if (uniqueSortedDates.includes(dateToCheckStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak across history
  // Sort ascending for forward iteration
  const ascDates = [...uniqueSortedDates].reverse().map(d => new Date(d));
  let longestStreak = 0;
  let running = 0;
  let prevDate: Date | null = null;

  for (const d of ascDates) {
    if (!prevDate) {
      running = 1;
    } else {
      const diffMs = d.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        running++;
      } else if (diffDays === 0) {
        // duplicate day, keep running
      } else {
        running = 1;
      }
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
    prevDate = d;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak, studiedToday };
}

/**
 * Determines mastery status for a question in Caderno de Erros.
 * Rule:
 * 0 or negative -> 'nao_dominado'
 * 1 correct repetition -> 'em_aprendizado'
 * 2 or more consecutive correct repetitions -> 'dominado'
 */
export function calculateMasteryLevel(
  consecutiveCorrect: number
): 'nao_dominado' | 'em_aprendizado' | 'dominado' {
  if (consecutiveCorrect >= 2) return 'dominado';
  if (consecutiveCorrect === 1) return 'em_aprendizado';
  return 'nao_dominado';
}

/**
 * Transparent scoring system for competitive ranking:
 * - Inédita acertada: 10 pts
 * - Revisão acertada: 4 pts
 * - Simulado concluído: 25 pts bônus
 * - Streak diário ativo: 5 pts bônus por dia
 */
export function calculateRankingPoints(
  firstAttemptCorrectCount: number,
  reviewCorrectCount: number,
  streakDays: number,
  simulationsCompleted: number = 0
): number {
  const points =
    firstAttemptCorrectCount * 10 +
    reviewCorrectCount * 4 +
    simulationsCompleted * 25 +
    streakDays * 5;
  return Math.max(0, points);
}
