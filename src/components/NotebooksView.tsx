import React, { useState } from 'react';
import {
  FolderPlus,
  BookOpen,
  Play,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Notebook, Question, QuestionAttempt } from '../types';

interface NotebooksViewProps {
  notebooks: Notebook[];
  allQuestions: Question[];
  userAttempts: Record<string, QuestionAttempt[]>;
  onStudyNotebook: (notebookId: string) => void;
  onCreateNotebook: (title: string, description?: string, color?: string) => void;
  onDeleteNotebook: (notebookId: string) => void;
}

export const NotebooksView: React.FC<NotebooksViewProps> = ({
  notebooks,
  allQuestions,
  userAttempts,
  onStudyNotebook,
  onCreateNotebook,
  onDeleteNotebook,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563eb');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateNotebook(title, description, color);
    setTitle('');
    setDescription('');
    setShowCreateModal(false);
  };

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Meus Cadernos de Questões
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Organize suas questões por concurso, edital verticalizado ou pontos fracos.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-98"
        >
          <FolderPlus className="h-4 w-4" />
          <span>Criar Novo Caderno</span>
        </button>
      </div>

      {/* Grid of Notebooks */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {notebooks.map(nb => {
          const totalQ = nb.questionIds.length;
          let solvedCount = 0;
          let correctCount = 0;

          nb.questionIds.forEach(qId => {
            const atts = userAttempts[qId];
            if (atts && atts.length > 0) {
              solvedCount++;
              if (atts[atts.length - 1].isCorrect) correctCount++;
            }
          });

          const accuracy = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;
          const progressPercent = totalQ > 0 ? Math.round((solvedCount / totalQ) * 100) : 0;

          return (
            <div
              key={nb.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Colored accent top bar */}
              <div
                className="absolute top-0 right-0 left-0 h-1.5"
                style={{ backgroundColor: nb.color || '#2563eb' }}
              />

              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: nb.color || '#2563eb' }}
                    >
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {nb.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {totalQ} {totalQ === 1 ? 'questão' : 'questões'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteNotebook(nb.id)}
                    title="Excluir caderno"
                    className="text-slate-400 opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {nb.description && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {nb.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">
                      Progresso: {solvedCount}/{totalQ} resolvidas
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: nb.color || '#2563eb',
                      }}
                    />
                  </div>
                </div>

                {/* Stats badge */}
                {solvedCount > 0 && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/50">
                    <span className="text-slate-500 dark:text-slate-400">Aproveitamento:</span>
                    <span
                      className={`font-bold ${
                        accuracy >= 70
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {accuracy}% ({correctCount} acertos)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  onClick={() => onStudyNotebook(nb.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-400"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Estudar este Caderno</span>
                </button>
              </div>
            </div>
          );
        })}

        {notebooks.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
            <Layers className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              Nenhum caderno criado ainda
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Crie seu primeiro caderno para agrupar questões por edital ou cargo desejado.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Criar Caderno Agora</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Criar Novo Caderno</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nome do Caderno *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Direito Administrativo — Polícia Federal 2025"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Foco nos temas de atos administrativos e improbidade..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cor de Identificação
                </label>
                <div className="mt-2 flex items-center gap-2">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        color === c ? 'scale-115 ring-2 ring-offset-2 ring-blue-600' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20"
                >
                  Criar Caderno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
