import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAccuracy,
  calculateCespeScore,
  calculateStreak,
  calculateMasteryLevel,
  calculateRankingPoints,
} from './scoring';
import {
  normalizeText,
  calculateTextSimilarity,
  detectDuplicate,
} from './filterEngine';
import {
  calculateNextReview,
  generateStudyInsights,
} from './studyPlan';

test('Scoring: calculateAccuracy handles zero and percentages', () => {
  assert.equal(calculateAccuracy(0, 0), 0);
  assert.equal(calculateAccuracy(7, 10), 70);
  assert.equal(calculateAccuracy(1, 3), 33);
  assert.equal(calculateAccuracy(10, 10), 100);
});

test('Scoring: calculateCespeScore subtracts incorrect from correct', () => {
  assert.equal(calculateCespeScore(50, 10, 40), 40);
  assert.equal(calculateCespeScore(10, 20, 0), -10);
  assert.equal(calculateCespeScore(30, 0, 10), 30);
});

test('Scoring: calculateStreak computes consecutive active days', () => {
  const refDate = '2026-11-06T12:00:00Z';
  const history = ['2026-11-06', '2026-11-05', '2026-11-04', '2026-11-01'];
  const res = calculateStreak(history, refDate);
  assert.equal(res.currentStreak, 3);
  assert.equal(res.longestStreak, 3);
  assert.equal(res.studiedToday, true);

  const historyYesterday = ['2026-11-05', '2026-11-04'];
  const resYesterday = calculateStreak(historyYesterday, refDate);
  assert.equal(resYesterday.currentStreak, 2);
  assert.equal(resYesterday.studiedToday, false);

  const brokenHistory = ['2026-11-01', '2026-10-31'];
  const resBroken = calculateStreak(brokenHistory, refDate);
  assert.equal(resBroken.currentStreak, 0);
});

test('Scoring: calculateMasteryLevel requires 2 consecutive correct answers', () => {
  assert.equal(calculateMasteryLevel(0), 'nao_dominado');
  assert.equal(calculateMasteryLevel(1), 'em_aprendizado');
  assert.equal(calculateMasteryLevel(2), 'dominado');
  assert.equal(calculateMasteryLevel(5), 'dominado');
});

test('Scoring: calculateRankingPoints awards points fairly without exploits', () => {
  const points = calculateRankingPoints(10, 5, 4, 1);
  assert.equal(points, 165);
});

test('FilterEngine: normalizeText strips diacritics, punctuation, case', () => {
  assert.equal(
    normalizeText('Constituição Federal de 1988 — Artigo 5º, Inciso LV!'),
    'constituicao federal de 1988 artigo 5 inciso lv'
  );
});

test('FilterEngine: calculateTextSimilarity identifies matching concepts', () => {
  const text1 = 'O princípio da legalidade administrativa vincula os atos do poder público à lei.';
  const text2 = 'Pelo princípio da legalidade administrativa todos os atos do poder público vinculam-se à lei.';
  const sim = calculateTextSimilarity(text1, text2);
  assert.ok(sim >= 0.70, `Expected similarity >= 0.70, got ${sim}`);

  const diffText = 'A fotossíntese é o processo realizado pelas plantas para obtenção de energia.';
  const simDiff = calculateTextSimilarity(text1, diffText);
  assert.ok(simDiff < 0.2, `Expected similarity < 0.2, got ${simDiff}`);
});

test('FilterEngine: detectDuplicate flags matching questions', () => {
  const existing = [
    {
      id: 'q-101',
      statement: 'No que tange aos atos administrativos, a anulação produz efeitos ex tunc e a revogação produz efeitos ex nunc.',
    },
  ];

  const candidate = 'Em relação aos atos administrativos, a anulação opera com efeitos ex tunc e a revogação produz efeitos ex nunc.';
  const check = detectDuplicate(candidate, existing, 0.65);
  assert.equal(check.isDuplicate, true);
  assert.equal(check.matchId, 'q-101');
});

test('StudyPlan: calculateNextReview progresses spaced repetition boxes', () => {
  const step1 = calculateNextReview(1, true);
  assert.equal(step1.nextBox, 2);
  assert.equal(step1.daysUntilReview, 3);
  assert.equal(step1.isMastered, false);

  const step4 = calculateNextReview(4, true);
  assert.equal(step4.nextBox, 5);
  assert.equal(step4.isMastered, true);

  const stepFail = calculateNextReview(4, false);
  assert.equal(stepFail.nextBox, 1);
  assert.equal(stepFail.daysUntilReview, 1);
  assert.equal(stepFail.isMastered, false);
});

test('StudyPlan: generateStudyInsights identifies weak subjects and pending errors', () => {
  const disciplines = [
    { discipline: 'Direito Constitucional', totalAttempts: 20, correctAttempts: 18, accuracy: 90 },
    { discipline: 'Direito Administrativo', totalAttempts: 15, correctAttempts: 6, accuracy: 40 },
  ];

  const insights = generateStudyInsights(disciplines, 3, 5, 20, 12);
  assert.ok(insights.some(i => i.id.startsWith('weak-Direito Administrativo')));
  assert.ok(insights.some(i => i.id === 'pending-errors'));
  assert.ok(insights.some(i => i.id === 'goal-progress'));
  assert.ok(insights.some(i => i.id.startsWith('strong-Direito Constitucional')));
});
