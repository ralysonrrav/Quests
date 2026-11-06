import React, { useState, useEffect } from 'react';
import { Minimize2, Clock, ChevronLeft, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { Question, QuestionAttempt } from '../types';

interface FocusModeModalProps {
  questions: Question[];
  currentIndex: number;
  userAttempts: Record<string, QuestionAttempt[]>;
  onClose: () => void;
  onAnswer: (questionId: string, selectedOptionId: string, timeSpentSeconds: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  questions,
  currentIndex,
  userAttempts,
  onClose,
  onAnswer,
  onNext,
  onPrevious,
}) => {
  const currentQ = questions[currentIndex];
  const userAttempt = userAttempts[currentQ?.id]?.[userAttempts[currentQ?.id]?.length - 1];
  const [selectedOption, setSelectedOption] = useState<string | null>(
    userAttempt ? userAttempt.selectedOptionId : null
  );
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSelectedOption(userAttempt ? userAttempt.selectedOptionId : null);
    setSeconds(0);
  }, [currentIndex, userAttempt]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        onNext();
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        onPrevious();
      } else if (!userAttempt) {
        const key = e.key.toUpperCase();
        if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
          setSelectedOption(key);
        } else if (['1', '2', '3', '4', '5'].includes(key)) {
          const map: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
          setSelectedOption(map[key]);
        } else if (e.key === 'Enter' && selectedOption) {
          onAnswer(currentQ.id, selectedOption, seconds);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, userAttempt, currentQ, seconds]);

  if (!currentQ) return null;

  const fontClass =
    fontSize === 'normal'
      ? 'text-base leading-relaxed'
      : fontSize === 'large'
        ? 'text-lg leading-relaxed'
        : 'text-xl leading-loose';

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/98 text-white backdrop-blur-md">
      {/* Top Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-blue-600 px-3 py-1 font-mono text-xs font-bold text-white">
            Questão {currentIndex + 1} de {questions.length}
          </span>
          <span className="text-xs text-slate-400">
            {currentQ.board} • {currentQ.organization} • {currentQ.discipline}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-300">
            <Clock className="h-4 w-4 text-blue-400" />
            <span>{formatTimer(seconds)}</span>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 p-1 text-xs">
            <button
              onClick={() => setFontSize('normal')}
              className={`rounded px-2 py-0.5 ${fontSize === 'normal' ? 'bg-blue-600 font-bold' : 'text-slate-400'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`rounded px-2 py-0.5 ${fontSize === 'large' ? 'bg-blue-600 font-bold' : 'text-slate-400'}`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`rounded px-2 py-0.5 ${fontSize === 'xlarge' ? 'bg-blue-600 font-bold' : 'text-slate-400'}`}
            >
              A++
            </button>
          </div>

          <button
            onClick={onClose}
            title="Sair do Modo Foco (Esc)"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Minimize2 className="h-4 w-4" />
            <span>Sair do Foco</span>
          </button>
        </div>
      </div>

      {/* Main Focus Reading Container */}
      <div className="mx-auto flex-1 max-w-4xl overflow-y-auto px-6 py-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-8 shadow-xl">
          {currentQ.supportText && (
            <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/80 p-4 text-sm italic text-slate-300">
              {currentQ.supportText}
            </div>
          )}

          <div className={`mb-8 font-normal text-slate-100 ${fontClass}`}>
            {currentQ.statement}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map(opt => {
              const isSelected = selectedOption === opt.id;
              const isAnswered = !!userAttempt;
              const isOptionCorrect = opt.isCorrect;

              let style = 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600';
              if (isAnswered) {
                if (isOptionCorrect) {
                  style = 'border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-1 ring-emerald-500';
                } else if (isSelected && !isOptionCorrect) {
                  style = 'border-rose-500 bg-rose-950/60 text-rose-200 ring-1 ring-rose-500';
                } else {
                  style = 'opacity-40 border-slate-800';
                }
              } else if (isSelected) {
                style = 'border-blue-500 bg-blue-950/60 text-blue-100 ring-2 ring-blue-500/50';
              }

              return (
                <div
                  key={opt.id}
                  onClick={() => !userAttempt && setSelectedOption(opt.id)}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${style}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {opt.id}
                  </div>
                  <div className="text-base text-slate-200 leading-relaxed">{opt.text}</div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-700/80 pt-6">
            <div className="flex items-center gap-3">
              {!userAttempt ? (
                <button
                  onClick={() =>
                    selectedOption && onAnswer(currentQ.id, selectedOption, seconds)
                  }
                  disabled={!selectedOption}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 disabled:opacity-40"
                >
                  Responder (Enter)
                </button>
              ) : (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
                    userAttempt.isCorrect
                      ? 'bg-emerald-950 text-emerald-300'
                      : 'bg-rose-950 text-rose-300'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {userAttempt.isCorrect
                      ? 'Resposta Correta!'
                      : `Incorreto. Gabarito: ${currentQ.correctOptionId}`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={onPrevious}
                className="flex items-center gap-1 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior (P)</span>
              </button>
              <button
                disabled={currentIndex === questions.length - 1}
                onClick={onNext}
                className="flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-200 disabled:opacity-40"
              >
                <span>Próxima (N)</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
