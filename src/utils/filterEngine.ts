import { Question, QuestionFilters, QuestionAttempt } from '../types';

/**
 * Normalizes text for search and duplicate comparison:
 * Lowercases, strips diacritics/accents, removes punctuation and extra whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^\w\s]/g, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple light stemmer for Portuguese common suffixes
 */
function stemWord(word: string): string {
  if (word.length <= 4) return word;
  return word
    .replace(/(mente|acoes|acao|amentos|amento|idades|idade|ando|endo|indo|aram|eram|iram|asse|esse|isse|aria|eria|iria|ou|am|em|es|os|as)$/, '');
}

/**
 * Calculates Sørensen–Dice token similarity between two texts (0 to 1)
 * Uses lightweight word stemming and character trigrams for robust comparison.
 */
export function calculateTextSimilarity(textA: string, textB: string): number {
  const normA = normalizeText(textA);
  const normB = normalizeText(textB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0;

  const wordsA = normA.split(' ').filter(w => w.length > 2).map(stemWord);
  const wordsB = normB.split(' ').filter(w => w.length > 2).map(stemWord);

  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let matchCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      matchCount++;
    }
  }

  // Dice coefficient: (2 * |A ∩ B|) / (|A| + |B|)
  const dice = (2 * matchCount) / (setA.size + setB.size);
  return Number(dice.toFixed(2));
}

/**
 * Detects if a question statement has high duplicate similarity with existing questions
 * Threshold default: 0.65 for semantic paraphrase detection, 0.85+ for near identical
 */
export function detectDuplicate(
  statement: string,
  existingQuestions: Array<{ id: string; statement: string }>,
  threshold: number = 0.65
): { isDuplicate: boolean; similarity: number; matchId?: string } {
  let highestSim = 0;
  let bestMatchId: string | undefined;

  for (const q of existingQuestions) {
    const sim = calculateTextSimilarity(statement, q.statement);
    if (sim > highestSim) {
      highestSim = sim;
      bestMatchId = q.id;
    }
  }

  return {
    isDuplicate: highestSim >= threshold,
    similarity: Math.round(highestSim * 100),
    matchId: highestSim >= threshold ? bestMatchId : undefined,
  };
}

/**
 * Filters question collection according to complex faceted filters
 */
export function filterQuestions(
  questions: Question[],
  filters: QuestionFilters,
  userAttempts: Record<string, QuestionAttempt[]>,
  favoriteIds: Set<string>,
  notebookQuestionIds?: Set<string>
): Question[] {
  return questions.filter(q => {
    // 1. Notebook filter if specified
    if (notebookQuestionIds && !notebookQuestionIds.has(q.id)) {
      return false;
    }

    // 2. Search Query (matches code, statement, topic, subtopic, organization)
    if (filters.searchQuery.trim()) {
      const queryNorm = normalizeText(filters.searchQuery);
      const content = normalizeText(
        `${q.code} ${q.statement} ${q.organization} ${q.board} ${q.position} ${q.discipline} ${q.topic} ${q.subtopic || ''}`
      );
      if (!content.includes(queryNorm)) {
        return false;
      }
    }

    // 3. Boards
    if (filters.boards.length > 0 && !filters.boards.includes(q.board)) {
      return false;
    }

    // 4. Organizations
    if (filters.organizations.length > 0 && !filters.organizations.includes(q.organization)) {
      return false;
    }

    // 5. Years
    if (filters.years.length > 0 && !filters.years.includes(q.year)) {
      return false;
    }

    // 6. Disciplines
    if (filters.disciplines.length > 0 && !filters.disciplines.includes(q.discipline)) {
      return false;
    }

    // 7. Topics
    if (filters.topics.length > 0 && !filters.topics.includes(q.topic)) {
      return false;
    }

    // 8. Difficulties
    if (filters.difficulties.length > 0 && !filters.difficulties.includes(q.difficulty)) {
      return false;
    }

    // 9. Modalities
    if (filters.modalities.length > 0 && !filters.modalities.includes(q.modality)) {
      return false;
    }

    // 10. Education level
    if (filters.educationLevels.length > 0 && !filters.educationLevels.includes(q.educationLevel)) {
      return false;
    }

    // 11. User Status Filter
    const attempts = userAttempts[q.id] || [];
    const hasAttempts = attempts.length > 0;
    const latestAttempt = hasAttempts ? attempts[attempts.length - 1] : null;

    switch (filters.statusFilter) {
      case 'nao_resolvidas':
        if (hasAttempts) return false;
        break;
      case 'resolvidas':
        if (!hasAttempts) return false;
        break;
      case 'acertadas':
        if (!latestAttempt || !latestAttempt.isCorrect) return false;
        break;
      case 'erradas':
        if (!latestAttempt || latestAttempt.isCorrect) return false;
        break;
      case 'favoritas':
        if (!favoriteIds.has(q.id)) return false;
        break;
      case 'anuladas':
        if (q.keyStatus !== 'anulada') return false;
        break;
      case 'comentadas':
        if (!q.explanation || !q.explanation.text) return false;
        break;
      case 'todas':
      default:
        break;
    }

    return true;
  });
}
