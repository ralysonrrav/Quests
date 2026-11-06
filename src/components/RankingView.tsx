import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  Medal,
  Sparkles,
} from 'lucide-react';
import { RankingUser, UserProfile } from '../types';

interface RankingViewProps {
  rankings: RankingUser[];
  currentUser: UserProfile;
}

export const RankingView: React.FC<RankingViewProps> = ({ rankings, currentUser }) => {
  const [period, setPeriod] = useState<'geral' | 'semanal' | 'diario'>('geral');
  const [isPublic, setIsPublic] = useState(currentUser.isPublicRanking);
  const [showRulesModal, setShowRulesModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ranking Geral de Estudantes
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Competição saudável com pontuação auditável contra repetição indevida de questões.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Rules button */}
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <HelpCircle className="h-4 w-4 text-blue-600" />
            <span>Regras de Pontuação</span>
          </button>

          {/* Privacy Toggle */}
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              isPublic
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span>{isPublic ? 'Perfil Público' : 'Modo Anônimo'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <button
          onClick={() => setPeriod('geral')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            period === 'geral'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Ranking Geral
        </button>
        <button
          onClick={() => setPeriod('semanal')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            period === 'semanal'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Semanal
        </button>
        <button
          onClick={() => setPeriod('diario')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
            period === 'diario'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Hoje (Diário)
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3.5">Posição</th>
              <th className="px-5 py-3.5">Estudante</th>
              <th className="px-5 py-3.5 text-center">Questões</th>
              <th className="px-5 py-3.5 text-center">Aproveitamento</th>
              <th className="px-5 py-3.5 text-center">Constância</th>
              <th className="px-5 py-3.5 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rankings.map(user => {
              const isCurrent = user.userId === currentUser.id;
              return (
                <tr
                  key={user.userId}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    isCurrent
                      ? 'bg-blue-50/70 font-semibold dark:bg-blue-950/40'
                      : ''
                  }`}
                >
                  {/* Rank position */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {user.rank === 1 ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-amber-950 font-bold shadow-xs">
                          <Trophy className="h-4 w-4" />
                        </div>
                      ) : user.rank === 2 ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-300 text-slate-800 font-bold">
                          2º
                        </div>
                      ) : user.rank === 3 ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700/80 text-white font-bold">
                          3º
                        </div>
                      ) : (
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {user.rank}º
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Student profile */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt={user.nickname}
                        className="h-9 w-9 rounded-xl object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <span>{user.nickname}</span>
                          {isCurrent && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Você
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {user.correctCount} acertos
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Solved */}
                  <td className="px-5 py-4 text-center font-mono text-xs text-slate-700 dark:text-slate-300">
                    {user.questionsAnswered}
                  </td>

                  {/* Accuracy */}
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {user.accuracy}%
                    </span>
                  </td>

                  {/* Streak */}
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Flame className="h-3.5 w-3.5 fill-amber-500" />
                      {user.streakDays}d
                    </span>
                  </td>

                  {/* Points */}
                  <td className="px-5 py-4 text-right">
                    <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400">
                      {user.scorePoints.toLocaleString('pt-BR')} pts
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Regras de Pontuação Anti-Abuso
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Para garantir justiça sem favorecer quem apenas decora a mesma questão repetidamente, o ranking do Questões Brasil adota a seguinte fórmula transparente:
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span><strong>+10 pontos:</strong> Primeira resolução correta de questão inédita</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span><strong>+4 pontos:</strong> Acerto em revisão espaçada do Caderno de Erros</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span><strong>+25 pontos:</strong> Conclusão de simulado completo no modo Prova</span>
              </li>
              <li className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500 shrink-0" />
                <span><strong>+5 pontos/dia:</strong> Bônus de constância por manter a meta diária</span>
              </li>
            </ul>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRulesModal(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
