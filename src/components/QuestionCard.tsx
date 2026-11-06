import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  CheckCircle2,
  XCircle,
  FileText,
  FolderPlus,
  Flag,
  Maximize2,
  Clock,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Strikethrough,
  AlertOctagon,
  Scale,
  UserCheck,
} from 'lucide-react';
import { Question, QuestionAttempt, PersonalNote, Notebook } from '../types';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  userAttempt?: QuestionAttempt;
  isFavorited: boolean;
  personalNote?: PersonalNote;
  notebooks: Notebook[];
  onAnswer: (questionId: string, selectedOptionId: string, timeSpentSeconds: number) => void;
  onToggleFavorite: (questionId: string) => void;
  onSaveNote: (questionId: string, content: string) => void;
  onAddToNotebook: (notebookId: string, questionId: string) => void;
  onOpenFocusMode?: () => void;
  onNextQuestion?: () => void;
  hasNextQuestion?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  userAttempt,
  isFavorited,
  personalNote,
  notebooks,
  onAnswer,
  onToggleFavorite,
  onSaveNote,
  onAddToNotebook,
  onOpenFocusMode,
  onNextQuestion,
  hasNextQuestion,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(
    userAttempt ? userAttempt.selectedOptionId : null
  );
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<string>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(!userAttempt);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [showNotebookModal, setShowNotebookModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [noteContent, setNoteContent] = useState<string>(personalNote?.content || '');
  const [reportReason, setReportReason] = useState<string>('');
  const [reportSent, setReportSent] = useState<boolean>(false);

  // Sync state if question or attempt changes
  useEffect(() => {
    setSelectedOption(userAttempt ? userAttempt.selectedOptionId : null);
    setEliminatedOptions(new Set());
    setTimerSeconds(userAttempt ? userAttempt.timeSpentSeconds : 0);
    setIsTimerRunning(!userAttempt);
    setIsRetrying(false);
    setNoteContent(personalNote?.content || '');
    setReportSent(false);
  }, [question.id, userAttempt, personalNote]);

  // Resolution timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !userAttempt) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, userAttempt]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const handleSelectOption = (optionId: string) => {
    if (userAttempt) return; // already answered
    if (eliminatedOptions.has(optionId)) {
      // un-eliminate if user clicks to select
      const next = new Set(eliminatedOptions);
      next.delete(optionId);
      setEliminatedOptions(next);
    }
    setSelectedOption(optionId);
  };

  const handleToggleEliminate = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    if (userAttempt) return;
    const next = new Set(eliminatedOptions);
    if (next.has(optionId)) {
      next.delete(optionId);
    } else {
      next.add(optionId);
      if (selectedOption === optionId) {
        setSelectedOption(null);
      }
    }
    setEliminatedOptions(next);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOption) return;
    setIsTimerRunning(false);
    setIsRetrying(false);
    onAnswer(question.id, selectedOption, timerSeconds);
  };

  const handleStartRetry = () => {
    setIsRetrying(true);
    setSelectedOption(null);
    setEliminatedOptions(new Set());
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const isAnswered = !!userAttempt && !isRetrying;
  const isCorrect = userAttempt ? userAttempt.isCorrect : false;

  const difficultyColors = {
    facil: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    medio: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    dificil: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    muito_dificil: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  };

  const difficultyLabels = {
    facil: 'Fácil',
    medio: 'Médio',
    dificil: 'Difícil',
    muito_dificil: 'Muito Difícil',
  };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center gap-2">
          {/* Question Index Badge */}
          <span className="flex items-center gap-1.5 rounded-md bg-blue-700 px-2.5 py-1 text-xs font-bold text-white shadow-sm shadow-blue-500/20">
            <span>Questão {questionNumber}</span>
            <span className="text-blue-200 font-normal">/ {totalQuestions}</span>
          </span>

          {/* Exam Code */}
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {question.code}
          </span>

          {/* Board & Org */}
          <span className="rounded-md bg-slate-200/80 px-2 py-1 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {question.board}
          </span>
          <span className="rounded-md bg-slate-200/80 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {question.organization} ({question.year})
          </span>

          {/* Difficulty */}
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${difficultyColors[question.difficulty]}`}
          >
            {difficultyLabels[question.difficulty]}
          </span>

          {/* Modality */}
          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {question.modality === 'certo_errado' ? 'Certo / Errado' : 'Múltipla Escolha'}
          </span>

          {/* Key Status (Anulada / Alterada) */}
          {question.keyStatus !== 'valida' && (
            <span className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <AlertOctagon className="h-3 w-3" />
              {question.keyStatus === 'anulada' ? 'Anulada' : 'Gabarito Alterado'}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          {/* Individual Question Timer */}
          <div
            title="Tempo gasto na resolução desta questão"
            className="mr-1 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Clock className={`h-3.5 w-3.5 ${isTimerRunning ? 'animate-pulse text-blue-600' : ''}`} />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => onToggleFavorite(question.id)}
            title={isFavorited ? 'Remover dos favoritos' : 'Favoritar questão'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              isFavorited
                ? 'border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                : 'border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isFavorited ? 'fill-amber-500' : ''}`} />
          </button>

          {/* Personal Notes */}
          <button
            onClick={() => setShowNotesModal(true)}
            title="Anotações pessoais"
            className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              personalNote?.content
                ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                : 'border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            {personalNote?.content && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-600" />
            )}
          </button>

          {/* Add to Notebook */}
          <button
            onClick={() => setShowNotebookModal(true)}
            title="Adicionar a caderno"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <FolderPlus className="h-4 w-4" />
          </button>

          {/* Report Error */}
          <button
            onClick={() => setShowReportModal(true)}
            title="Reportar erro ou contestar gabarito"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <Flag className="h-4 w-4" />
          </button>

          {/* Focus Mode */}
          {onOpenFocusMode && (
            <button
              onClick={onOpenFocusMode}
              title="Modo Foco / Zen"
              className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 sm:flex dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Subject Taxonomy Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-5 py-2 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
        <span className="font-semibold text-slate-900 dark:text-white">{question.discipline}</span>
        <span>•</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{question.topic}</span>
        {question.subtopic && (
          <>
            <span>•</span>
            <span className="text-slate-500 dark:text-slate-400">{question.subtopic}</span>
          </>
        )}
      </div>

      {/* Question Body */}
      <div className="p-5 sm:p-6">
        {/* Support Text if present */}
        {question.supportText && (
          <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 italic dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
            {question.supportText}
          </div>
        )}

        {/* Statement */}
        <div className="mb-6 text-base font-normal leading-relaxed text-slate-900 dark:text-slate-100">
          {question.statement}
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {question.options.map(option => {
            const isSelected = selectedOption === option.id;
            const isEliminated = eliminatedOptions.has(option.id);
            const isOptionCorrect = option.isCorrect;

            // Highlight styling after answering
            let optionStyle =
              'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700';

            if (isAnswered) {
              if (isOptionCorrect) {
                // Official correct answer
                optionStyle =
                  'border-emerald-500 bg-emerald-50/90 text-emerald-950 font-medium ring-1 ring-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500';
              } else if (isSelected && !isOptionCorrect) {
                // Selected incorrect answer
                optionStyle =
                  'border-rose-400 bg-rose-50/90 text-rose-950 ring-1 ring-rose-400/50 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-500';
              } else {
                optionStyle = 'opacity-60 border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40';
              }
            } else if (isSelected) {
              optionStyle =
                'border-blue-600 bg-blue-50/90 text-blue-950 font-medium ring-2 ring-blue-600/20 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-100';
            } else if (isEliminated) {
              optionStyle =
                'opacity-40 line-through bg-slate-100/80 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800';
            }

            return (
              <div
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={`group relative flex cursor-pointer items-start justify-between rounded-xl border p-3.5 transition-all sm:p-4 ${optionStyle}`}
              >
                <div className="flex items-start gap-3.5 pr-2">
                  {/* Option Letter Circle */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      isAnswered
                        ? isOptionCorrect
                          ? 'bg-emerald-600 text-white'
                          : isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {isAnswered && isOptionCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isAnswered && isSelected && !isOptionCorrect ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      option.id
                    )}
                  </div>

                  {/* Option Text */}
                  <div
                    className={`text-sm leading-relaxed sm:text-base ${
                      isEliminated ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {option.text}
                  </div>
                </div>

                {/* Right controls: Strike-through button & Percentage */}
                <div className="flex items-center gap-2 pt-0.5">
                  {/* Percentage chosen by candidate community (visible after answering) */}
                  {isAnswered && option.percentageChosen !== undefined && (
                    <span
                      title={`${option.percentageChosen}% dos estudantes escolheram esta alternativa`}
                      className={`text-xs font-semibold ${
                        isOptionCorrect
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {option.percentageChosen}%
                    </span>
                  )}

                  {/* Riscar / Eliminar alternativa */}
                  {!isAnswered && (
                    <button
                      type="button"
                      onClick={e => handleToggleEliminate(e, option.id)}
                      title={isEliminated ? 'Desfazer eliminação' : 'Riscar alternativa'}
                      className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-colors ${
                        isEliminated
                          ? 'border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'border-transparent text-slate-600 opacity-60 hover:border-slate-200 hover:bg-white hover:opacity-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Strikethrough className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
          {!isAnswered ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleConfirmAnswer}
                disabled={!selectedOption}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all ${
                  selectedOption
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 active:scale-98'
                    : 'cursor-not-allowed bg-slate-300 text-slate-500 shadow-none dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Responder</span>
              </button>

              {selectedOption && (
                <button
                  onClick={() => setSelectedOption(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="mr-1 inline-block h-3.5 w-3.5" />
                  Limpar
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Answer verdict badge */}
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
                  isCorrect
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Parabéns! Resposta correta</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>Incorreto. Gabarito: {question.correctOptionId}</span>
                  </>
                )}
              </div>

              {/* Refazer Questão Button */}
              <button
                onClick={handleStartRetry}
                title="Resolver novamente para fixação"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                <span>Refazer Questão</span>
              </button>

              {hasNextQuestion && onNextQuestion && (
                <button
                  onClick={onNextQuestion}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  <span>Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Keyboard shortcut hint */}
          <div className="hidden text-xs text-slate-600 sm:block dark:text-slate-300">
            Dica: use as teclas <kbd className="rounded border px-1 py-0.5 font-mono">1-5</kbd> ou{' '}
            <kbd className="rounded border px-1 py-0.5 font-mono">A-E</kbd> e{' '}
            <kbd className="rounded border px-1 py-0.5 font-mono">Enter</kbd>
          </div>
        </div>

        {/* Gabarito Comentado (Appears automatically once answered) */}
        {isAnswered && question.explanation && (
          <div className="mt-6 rounded-2xl border border-blue-200/80 bg-gradient-to-b from-blue-50/60 to-white p-5 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-slate-900">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3 dark:border-blue-900/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                  Gabarito Comentado pelo Professor
                </h4>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {question.explanation.author}
                </span>
                <span className="hidden sm:inline">({question.explanation.role})</span>
              </div>
            </div>

            {/* Explanation Content */}
            <div className="mt-3.5 whitespace-pre-line text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
              {question.explanation.text}
            </div>

            {/* Legal Basis Badge */}
            {question.explanation.legalBasis && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-100/50 px-3.5 py-2 text-xs font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                <Scale className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400" />
                <span>
                  <strong className="font-bold">Fundamentação:</strong> {question.explanation.legalBasis}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Anotações Pessoais */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Anotações Pessoais</h3>
              </div>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-slate-600 hover:text-slate-700 dark:text-slate-300"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Suas anotações ficam gravadas privadamente para esta questão ({question.code}).
            </p>
            <textarea
              rows={5}
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="Ex: Pegadinha típica da banca sobre competência privativa vs concorrente..."
              className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowNotesModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onSaveNote(question.id, noteContent);
                  setShowNotesModal(false);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Salvar Anotação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar a Caderno */}
      {showNotebookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Adicionar ao Caderno</h3>
              </div>
              <button
                onClick={() => setShowNotebookModal(false)}
                className="text-slate-600 hover:text-slate-700 dark:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {notebooks.map(nb => {
                const alreadyIn = nb.questionIds.includes(question.id);
                return (
                  <div
                    key={nb.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{nb.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{nb.questionIds.length} questões</p>
                    </div>
                    <button
                      onClick={() => {
                        onAddToNotebook(nb.id, question.id);
                        setShowNotebookModal(false);
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        alreadyIn
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {alreadyIn ? 'Já incluso' : 'Adicionar'}
                    </button>
                  </div>
                );
              })}

              {notebooks.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-500">
                  Nenhum caderno criado ainda. Crie seus cadernos temáticos na aba &quot;Cadernos&quot;.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Denunciar Erro */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Reportar Erro na Questão</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-600 hover:text-slate-700 dark:text-slate-300"
              >
                ✕
              </button>
            </div>
            {reportSent ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <p className="mt-2 font-bold text-slate-900 dark:text-white">Denúncia enviada com sucesso!</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Nossa equipe de professores e revisores analisará o item.
                </p>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                  Descreva inconsistências no enunciado, gabarito divergente ou anulação da questão:
                </p>
                <textarea
                  rows={4}
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  placeholder="Ex: O gabarito oficial definitivo da banca alterou esta alternativa de C para E..."
                  className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setReportSent(true)}
                    disabled={!reportReason.trim()}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    Enviar Denúncia
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
