import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSHA256,
  parseAnswerKeyText,
  classifyExamQuestion,
  buildExtractedDraftsFromFiles,
} from './examIngestion';

test('ExamIngestion: computeSHA256 produces valid 64-char hex string', async () => {
  const hash = await computeSHA256('PROVA_POLICIA_FEDERAL_2024');
  assert.equal(typeof hash, 'string');
  assert.equal(hash.length, 64);
  // deterministic check
  const hash2 = await computeSHA256('PROVA_POLICIA_FEDERAL_2024');
  assert.equal(hash, hash2);
});

test('ExamIngestion: parseAnswerKeyText correctly parses Cebraspe format with anuladas', () => {
  const rawKeyText = `
    GABARITO OFICIAL DEFINITIVO - CARGO: AGENTE DE POLÍCIA FEDERAL
    Item 1: C
    Item 2: E
    Item 3: C
    Item 4: X (ANULADA)
    Item 5: E
  `;
  const result = parseAnswerKeyText(rawKeyText, 'certo_errado');
  assert.equal(result.totalFound, 5);
  assert.equal(result.annulledCount, 1);
  assert.equal(result.entries.get(1)?.letter, 'C');
  assert.equal(result.entries.get(1)?.isAnnulled, false);
  assert.equal(result.entries.get(2)?.letter, 'E');
  assert.equal(result.entries.get(4)?.isAnnulled, true);
  assert.equal(result.entries.get(4)?.letter, 'X');
});

test('ExamIngestion: parseAnswerKeyText correctly parses Multiple Choice (FGV/FCC)', () => {
  const rawKeyText = `
    1 - B | 2 - D | 3 - A | 4 - E | 5 - C
  `;
  const result = parseAnswerKeyText(rawKeyText, 'multipla_escolha');
  assert.equal(result.totalFound, 5);
  assert.equal(result.entries.get(1)?.letter, 'B');
  assert.equal(result.entries.get(2)?.letter, 'D');
  assert.equal(result.entries.get(3)?.letter, 'A');
});

test('ExamIngestion: classifyExamQuestion identifies Administrative and Constitutional Law', () => {
  const admStatement =
    'O ato administrativo dotado de presunção de legitimidade impõe a transferência do ônus da prova ao particular.';
  const admRes = classifyExamQuestion(admStatement);
  assert.equal(admRes.discipline, 'Direito Administrativo');
  assert.equal(admRes.topic, 'Atos Administrativos');
  assert.ok(admRes.confidence >= 90);

  const constStatement =
    'Segundo a CF/88, são direitos fundamentais o direito à vida, à liberdade, à igualdade, à segurança e à propriedade.';
  const constRes = classifyExamQuestion(constStatement);
  assert.equal(constRes.discipline, 'Direito Constitucional');
  assert.equal(constRes.topic, 'Direitos e Garantias Fundamentais');
});

test('ExamIngestion: buildExtractedDraftsFromFiles pairs questions with answer keys', () => {
  const keyMap = parseAnswerKeyText('Item 1: C\nItem 2: E\nItem 3: C', 'certo_errado');
  const drafts = buildExtractedDraftsFromFiles(
    {
      jobId: 'job-test-123',
      board: 'Cebraspe',
      organization: 'Polícia Federal',
      position: 'Agente',
      year: 2024,
      modality: 'certo_errado',
      examFileName: 'PF_2024_CADERNO.pdf',
      examFileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      answerKeyFileName: 'PF_2024_GABARITO.pdf',
      answerKeyFileHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      answerKeyType: 'definitivo',
      sampleQuestionsCount: 3,
    },
    keyMap
  );

  assert.equal(drafts.length, 3);
  assert.equal(drafts[0].numberInExam, 1);
  assert.equal(drafts[0].jobId, 'job-test-123');
  // Option C should be correct for question 1
  const optC = drafts[0].options.find(o => o.id === 'C');
  assert.equal(optC?.isCorrect, true);
});
