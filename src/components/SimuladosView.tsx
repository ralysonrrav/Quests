import React, { useState, useEffect } from 'react';
import {
  Award,
  Timer,
  Play,
  CheckCircle2,
  XCircle,
  Flag,
  RotateCcw,
  BarChart2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, Simulation, SimulationAttempt } from '../types';
import { calculateCespeScore } from '../utils/scoring';

interface SimuladosViewProps {
  simulations: Simulation[];
  allQuestions: Question[];
  currentUserId: string;
  onCreateSimulation: (simData: Partial<Simulation>) => void;
  onSubmitSimulation: (simId: string, answers: any, timeUsed: number) => void;
}

export const SimuladosView: React.FC<SimuladosViewProps> = ({
  simulations,
  allQuestions,
  currentUserId,
  onCreateSimulation,
  onSubmitSimulation,
}) => {
  const [activeSim, setActiveSim] = useState<Simulation | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { selectedOptionId: string; answeredAt: string; timeSpentSeconds: number }>
  >({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [examStartedAt, setExamStartedAt] = useState<number>(0);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [completedResult, setCompletedResult] = useState<SimulationAttempt | null>(null);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [checkedFeedbackMap, setCheckedFeedbackMap] = useState<Record<string, boolean>>({});

  // New simulation form state
  const [builderTitle, setBuilderTitle] = useState('Simulado Personalizado — Prova Geral');
  const [builderMode, setBuilderMode] = useState<'prova' | 'treinamento'>('prova');
  const [builderDuration, setBuilderDuration] = useState(20);
  const [builderScoring, setBuilderScoring] = useState<'cespe_ce' | 'padrao'>('cespe_ce');
  const [builderQuestionCount, setBuilderQuestionCount] = useState(5);
  const [builderDiscipline, setBuilderDiscipline] = useState<string>('todas');

  // Timer loop for active simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeSim && timeLeftSeconds > 0 && !completedResult) {
      interval = setInterval(() => {
        setTimeLeftSeconds(prev => {
          if (prev <= 1) {
            handleFinalizeExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSim, timeLeftSeconds, completedResult]);

  const handleStartSim = (sim: Simulation) => {
    setActiveSim(sim);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setFlaggedIds(new Set());
    setTimeLeftSeconds(sim.durationMinutes * 60);
    setExamStartedAt(Date.now());
    setCompletedResult(null);
  };

  const handleSelectSimAnswer = (optionId: string) => {
    if (!activeSim) return;
    const qId = activeSim.questionIds[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [qId]: {
        selectedOptionId: optionId,
        answeredAt: new Date().toISOString(),
        timeSpentSeconds: 30,
      },
    }));
  };

  const toggleFlagCurrent = () => {
    if (!activeSim) return;
    const qId = activeSim.questionIds[currentQuestionIndex];
    const next = new Set(flaggedIds);
    if (next.has(qId)) next.delete(qId);
    else next.add(qId);
    setFlaggedIds(next);
  };

  const handleFinalizeExam = () => {
    if (!activeSim) return;
    setShowFinishConfirm(false);
    const timeUsed = Math.round((Date.now() - examStartedAt) / 1000);

    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    activeSim.questionIds.forEach(qId => {
      const q = allQuestions.find(item => item.id === qId);
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
      activeSim.scoringRule === 'cespe_ce'
        ? calculateCespeScore(correctCount, wrongCount, blankCount)
        : correctCount;

    const result: SimulationAttempt = {
      id: `sim-att-${Date.now()}`,
      simulationId: activeSim.id,
      userId: currentUserId,
      answers,
      flaggedQuestionIds: Array.from(flaggedIds),
      score,
      totalQuestions: activeSim.questionIds.length,
      correctCount,
      wrongCount,
      blankCount,
      startedAt: new Date(examStartedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      timeUsedSeconds: timeUsed,
    };

    setCompletedResult(result);
    onSubmitSimulation(activeSim.id, answers, timeUsed);

    // Confetti celebration if positive score
    if (score > 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleCreateNewSim = (e: React.FormEvent) => {
    e.preventDefault();
    let pool = allQuestions;
    if (builderDiscipline !== 'todas') {
      pool = pool.filter(q => q.discipline === builderDiscipline);
    }
    const selectedIds = pool.slice(0, builderQuestionCount).map(q => q.id);

    onCreateSimulation({
      title: builderTitle,
      mode: builderMode,
      durationMinutes: builderDuration,
      scoringRule: builderScoring,
      questionIds: selectedIds.length > 0 ? selectedIds : allQuestions.slice(0, 4).map(q => q.id),
      userId: currentUserId,
    });

    setShowBuilderModal(false);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // RENDER: Active Sim Exam Interface
  // -------------------------------------------------------------
  if (activeSim && !completedResult) {
    const totalSimQuestions = activeSim.questionIds.length;
    const currentQId = activeSim.questionIds[currentQuestionIndex];
    const currentQuestion = allQuestions.find(q => q.id === currentQId);
    const currentAnswer = answers[currentQId]?.selectedOptionId;
    const isCurrentFlagged = flaggedIds.has(currentQId);

    const answeredCount = Object.keys(answers).length;

    return (
      <div className="space-y-4">
        {/* Exam Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {activeSim.title}
            </h2>
            <p className="text-xs text-slate-500">
              Modo: {activeSim.mode === 'prova' ? 'Prova Oficial (Gabarito ao final)' : 'Treinamento'} • Regra:{' '}
              {activeSim.scoringRule === 'cespe_ce' ? '1 Errada anula 1 Certa (CESPE)' : 'Padrão (1 pt/acerto)'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-sm font-bold ${
                timeLeftSeconds < 180
                  ? 'border-rose-300 bg-rose-50 text-rose-700 animate-pulse dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300'
                  : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <Timer className="h-4 w-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            {/* Finalize Button */}
            <button
              onClick={() => setShowFinishConfirm(true)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Finalizar Prova
            </button>
          </div>
        </div>

        {/* Question Navigation Sheet / Grid */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500 pr-2">Folha de Respostas:</span>
          {activeSim.questionIds.map((qId, idx) => {
            const hasAns = !!answers[qId];
            const isFlag = flaggedIds.has(qId);
            const isCurrent = idx === currentQuestionIndex;

            let badgeStyle = 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
            if (isCurrent) {
              badgeStyle = 'border-blue-600 bg-blue-600 text-white font-bold ring-2 ring-blue-500/20';
            } else if (isFlag) {
              badgeStyle = 'border-amber-400 bg-amber-100 text-amber-900 font-bold dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300';
            } else if (hasAns) {
              badgeStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
            }

            return (
              <button
                key={qId}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-transform ${badgeStyle}`}
              >
                {idx + 1}
              </button>
            );
          })}
          <div className="ml-auto text-xs text-slate-500">
            {answeredCount}/{totalSimQuestions} preenchidas
          </div>
        </div>

        {/* Active Question Display */}
        {currentQuestion && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                  Item {currentQuestionIndex + 1} de {totalSimQuestions}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {currentQuestion.discipline} • {currentQuestion.topic}
                </span>
              </div>
              <button
                onClick={toggleFlagCurrent}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  isCurrentFlagged
                    ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <Flag className={`h-3.5 w-3.5 ${isCurrentFlagged ? 'fill-amber-500' : ''}`} />
                <span>{isCurrentFlagged ? 'Marcada para revisar' : 'Marcar para revisar'}</span>
              </button>
            </div>

            <div className="my-5 text-base leading-relaxed text-slate-900 dark:text-slate-100 font-sans">
              {currentQuestion.statement}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map(opt => {
                const isSelected = currentAnswer === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectSimAnswer(opt.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 font-medium text-blue-950 ring-2 ring-blue-600/20 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {opt.id}
                    </div>
                    <div className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200">
                      {opt.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Treinamento Mode: Conferir Gabarito Desta Questão */}
            {activeSim.mode === 'treinamento' && currentAnswer && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {!checkedFeedbackMap[currentQId] ? (
                  <button
                    onClick={() =>
                      setCheckedFeedbackMap(prev => ({ ...prev, [currentQId]: true }))
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Conferir Gabarito Desta Questão</span>
                  </button>
                ) : (
                  <div
                    className={`rounded-xl border p-3 text-xs leading-relaxed ${
                      currentAnswer === currentQuestion.correctOptionId
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {currentAnswer === currentQuestion.correctOptionId ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Correto! Gabarito Oficial: {currentQuestion.correctOptionId}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-rose-600" />
                          <span>Incorreto. Gabarito Oficial: {currentQuestion.correctOptionId}</span>
                        </>
                      )}
                    </div>
                    {currentQuestion.explanation && (
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        {currentQuestion.explanation.text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Nav */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              <button
                disabled={currentQuestionIndex === totalSimQuestions - 1}
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <span>Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal: Confirm Finish */}
        {showFinishConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Finalizar Simulado?</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Você respondeu {answeredCount} de {totalSimQuestions} questões.
                {totalSimQuestions - answeredCount > 0 && (
                  <span className="block mt-1 font-bold text-amber-600">
                    Atenção: restam {totalSimQuestions - answeredCount} questão(ões) em branco!
                  </span>
                )}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  Continuar Respondendo
                </button>
                <button
                  onClick={handleFinalizeExam}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Confirmar e Entregar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Completed Simulado Results Screen
  // -------------------------------------------------------------
  if (completedResult && activeSim) {
    const accuracy =
      completedResult.totalQuestions > 0
        ? Math.round((completedResult.correctCount / completedResult.totalQuestions) * 100)
        : 0;

    return (
      <div className="space-y-6">
        {/* Results Banner */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 dark:border-blue-900/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-indigo-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                Relatório de Desempenho Homologado
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {activeSim.title}
              </h2>
              <p className="text-xs text-slate-500">
                Concluído em {new Date(completedResult.finishedAt || '').toLocaleDateString('pt-BR')} • Tempo utilizado: {formatTimer(completedResult.timeUsedSeconds)}
              </p>
            </div>

            <button
              onClick={() => {
                setActiveSim(null);
                setCompletedResult(null);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              Voltar aos Simulados
            </button>
          </div>

          {/* KPI Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase text-slate-500">Nota Líquida</span>
              <div
                className={`mt-1 text-2xl font-extrabold ${
                  completedResult.score >= 0 ? 'text-blue-600' : 'text-rose-600'
                }`}
              >
                {completedResult.score} pts
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase text-slate-500">Aproveitamento</span>
              <div className="mt-1 text-2xl font-extrabold text-emerald-600">{accuracy}%</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase text-slate-500">Acertos</span>
              <div className="mt-1 text-2xl font-extrabold text-emerald-600">
                {completedResult.correctCount}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase text-slate-500">Erros</span>
              <div className="mt-1 text-2xl font-extrabold text-rose-600">
                {completedResult.wrongCount}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-bold uppercase text-slate-500">Em Branco</span>
              <div className="mt-1 text-2xl font-extrabold text-slate-500">
                {completedResult.blankCount}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Gabarito da Prova & Justificativas
          </h3>
          {activeSim.questionIds.map((qId, idx) => {
            const q = allQuestions.find(item => item.id === qId);
            if (!q) return null;
            const ans = completedResult.answers[qId]?.selectedOptionId;
            const isCorrect = ans === q.correctOptionId;

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Questão {idx + 1} ({q.code})
                    </span>
                    <span className="text-xs text-slate-500">• {q.discipline}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                      !ans
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : isCorrect
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {!ans ? (
                      'Em Branco'
                    ) : isCorrect ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correto
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" /> Incorreto (Marcou {ans}, Gabarito:{' '}
                        {q.correctOptionId})
                      </>
                    )}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  {q.statement}
                </p>

                {/* Explanation snippet */}
                {q.explanation && (
                  <div className="mt-3.5 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    <strong className="text-blue-600 dark:text-blue-400">
                      Gabarito Comentado ({q.explanation.author}):
                    </strong>{' '}
                    {q.explanation.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Simulados List / Catalog
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Simulados Personalizados
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Treine em condições reais de prova com cronômetro regressivo e regra CESPE (1 errada anula 1 certa).
          </p>
        </div>

        <button
          onClick={() => setShowBuilderModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
        >
          <Award className="h-4 w-4" />
          <span>Gerar Novo Simulado</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {simulations.map(sim => (
          <div
            key={sim.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {sim.mode === 'prova' ? 'Modo Prova Oficial' : 'Modo Treinamento'}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                    {sim.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Timer className="h-3.5 w-3.5" />
                  <span>{sim.durationMinutes} min</span>
                </div>
              </div>

              {sim.description && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  {sim.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{sim.questionIds.length} questões</span>
                <span>•</span>
                <span>
                  {sim.scoringRule === 'cespe_ce' ? 'Regra CESPE (anulação)' : '1 ponto por acerto'}
                </span>
                <span>•</span>
                <span
                  className={sim.status === 'concluido' ? 'text-emerald-600 font-semibold' : ''}
                >
                  {sim.status === 'concluido' ? 'Concluído' : 'Disponível'}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                onClick={() => handleStartSim(sim)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-400"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{sim.status === 'concluido' ? 'Refazer Simulado' : 'Iniciar Simulado'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Builder */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Configurar Simulado Personalizado
            </h3>
            <form onSubmit={handleCreateNewSim} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Título da Prova *
                </label>
                <input
                  type="text"
                  required
                  value={builderTitle}
                  onChange={e => setBuilderTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Quantidade de Questões
                  </label>
                  <select
                    value={builderQuestionCount}
                    onChange={e => setBuilderQuestionCount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value={4}>4 Questões (Rápido)</option>
                    <option value={6}>6 Questões</option>
                    <option value={8}>8 Questões</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tempo Limite
                  </label>
                  <select
                    value={builderDuration}
                    onChange={e => setBuilderDuration(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value={10}>10 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={45}>45 minutos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Regra de Pontuação
                  </label>
                  <select
                    value={builderScoring}
                    onChange={e => setBuilderScoring(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="cespe_ce">Cebraspe (1 errada anula 1 certa)</option>
                    <option value="padrao">Padrão (+1 ponto por acerto)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Modo
                  </label>
                  <select
                    value={builderMode}
                    onChange={e => setBuilderMode(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="prova">Modo Prova (Gabarito ao final)</option>
                    <option value="treinamento">Treinamento</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Criar e Iniciar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
