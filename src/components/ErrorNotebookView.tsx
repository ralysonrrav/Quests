import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Question, QuestionAttempt } from '../types';
import { calculateMasteryLevel } from '../utils/scoring';

interface ErrorItem {
  question: Question;
  firstErrorDate: string;
  totalAttempts: number;
  isMastered: boolean;
  currentBox: number;
  lastAttemptCorrect: boolean;
}

interface ErrorNotebookViewProps {
  errorItems: ErrorItem[];
  userAttempts: Record<string, QuestionAttempt[]>;
  onSolveQuestion: (questionId: string) => void;
}

export const ErrorNotebookView: React.FC<ErrorNotebookViewProps> = ({
  errorItems,
  userAttempts,
  onSolveQuestion,
}) => {
  const [filterMode, setFilterMode] = useState<
    'todos' | 'pendentes' | 'dominados' | 'recorrentes'
  >('todos');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('todas');

  const disciplines = Array.from(new Set(errorItems.map(item => item.question.discipline)));

  const filteredItems = errorItems.filter(item => {
    if (disciplineFilter !== 'todas' && item.question.discipline !== disciplineFilter) {
      return false;
    }

    if (filterMode === 'pendentes') {
      return !item.lastAttemptCorrect;
    }
    if (filterMode === 'dominados') {
      return item.isMastered;
    }
    if (filterMode === 'recorrentes') {
      return item.totalAttempts >= 2 && !item.isMastered;
    }
    return true;
  });

  const masteredCount = errorItems.filter(i => i.isMastered).length;
  const pendingCount = errorItems.filter(i => !i.lastAttemptCorrect).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-6 dark:border-rose-900/40 dark:from-rose-950/20 dark:via-slate-900 dark:to-amber-950/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Caderno Inteligente de Erros & Repetição Espaçada
                </h2>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  {errorItems.length} no histórico
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Toda questão errada é registrada automaticamente. Acerte duas vezes consecutivas para
                alcançar o selo de <strong>Questão Dominada</strong>.
              </p>
            </div>
          </div>

          {/* Quick stats cards */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-rose-200/80 bg-white/80 px-3.5 py-2 text-center shadow-xs dark:border-slate-800 dark:bg-slate-800/80">
              <div className="text-lg font-extrabold text-rose-600">{pendingCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Aguardando Revisão
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-white/80 px-3.5 py-2 text-center shadow-xs dark:border-slate-800 dark:bg-slate-800/80">
              <div className="text-lg font-extrabold text-emerald-600">{masteredCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Dominadas
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rose-100/70 pt-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterMode('todos')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                filterMode === 'todos'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Todos os Erros ({errorItems.length})
            </button>
            <button
              onClick={() => setFilterMode('pendentes')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                filterMode === 'pendentes'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Não Revisados ({pendingCount})
            </button>
            <button
              onClick={() => setFilterMode('recorrentes')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                filterMode === 'recorrentes'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Erros Recorrentes
            </button>
            <button
              onClick={() => setFilterMode('dominados')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                filterMode === 'dominados'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Dominadas ({masteredCount})
            </button>
          </div>

          {/* Discipline selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Filtrar disciplina:</span>
            <select
              value={disciplineFilter}
              onChange={e => setDisciplineFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="todas">Todas as Disciplinas</option>
              {disciplines.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List of Error Items */}
      <div className="space-y-4">
        {filteredItems.map(item => {
          const q = item.question;
          const atts = userAttempts[q.id] || [];

          return (
            <div
              key={q.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-2 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {q.code}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {q.board} • {q.organization} ({q.year})
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {q.discipline}
                  </span>
                  <span className="text-xs text-slate-500">• {q.topic}</span>
                </div>

                <p className="line-clamp-2 text-sm text-slate-800 dark:text-slate-200">
                  {q.statement}
                </p>

                {/* Attempt breakdown history */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Primeiro erro em: {new Date(item.firstErrorDate).toLocaleDateString('pt-BR')}
                  </span>
                  <span>•</span>
                  <span>{item.totalAttempts} tentativas registradas</span>
                  <span>•</span>

                  {/* Mastery Badge */}
                  {item.isMastered ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <ShieldCheck className="h-3 w-3" />
                      Dominada
                    </span>
                  ) : item.lastAttemptCorrect ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Em Aprendizado (Caixa {item.currentBox}/5)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      <AlertTriangle className="h-3 w-3" />
                      Pendente de Revisão
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 shrink-0 sm:mt-0">
                <button
                  onClick={() => onSolveQuestion(q.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 sm:w-auto"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Refazer Questão</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              Nenhuma questão pendente neste filtro!
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Continue resolvendo questões do banco. Qualquer erro será capturado aqui para revisão
              guiada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
