import React, { useState } from 'react';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { QuestionFilters, QuestionDifficulty, QuestionModality } from '../types';

interface FilterBarProps {
  filters: QuestionFilters;
  onChangeFilters: (filters: QuestionFilters) => void;
  availableBoards: string[];
  availableOrganizations: string[];
  availableDisciplines: string[];
  availableYears: number[];
  filteredCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  availableBoards,
  availableOrganizations,
  availableDisciplines,
  availableYears,
  filteredCount,
  totalCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleUpdate = (partial: Partial<QuestionFilters>) => {
    onChangeFilters({ ...filters, ...partial });
  };

  const clearAllFilters = () => {
    onChangeFilters({
      searchQuery: '',
      boards: [],
      organizations: [],
      years: [],
      disciplines: [],
      topics: [],
      difficulties: [],
      modalities: [],
      educationLevels: [],
      statusFilter: 'todas',
    });
  };

  const toggleArrayItem = <T,>(arr: T[], item: T): T[] => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.boards.length > 0 ||
    filters.organizations.length > 0 ||
    filters.disciplines.length > 0 ||
    filters.years.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.modalities.length > 0 ||
    filters.statusFilter !== 'todas';

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Search Input and Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => handleUpdate({ searchQuery: e.target.value })}
            placeholder="Buscar por termo, artigo de lei, tema ou código (ex: habeas corpus, art. 5º, QB-2024)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pr-10 pl-10 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleUpdate({ searchQuery: '' })}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Status Quick Filter Selector */}
          <div className="relative">
            <select
              value={filters.statusFilter}
              onChange={e => handleUpdate({ statusFilter: e.target.value as any })}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-8 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="todas">Status: Todas</option>
              <option value="nao_resolvidas">Não Resolvidas</option>
              <option value="resolvidas">Já Resolvidas</option>
              <option value="acertadas">Apenas Acertadas</option>
              <option value="erradas">Apenas Erradas</option>
              <option value="favoritas">Apenas Favoritas</option>
              <option value="anuladas">Questões Anuladas</option>
              <option value="comentadas">Gabarito Comentado</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Toggle Advanced Filters Drawer */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all ${
              showAdvanced || hasActiveFilters
                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              title="Limpar todos os filtros"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvanced && (
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Disciplinas */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Disciplina
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableDisciplines.map(disc => {
                  const active = filters.disciplines.includes(disc);
                  return (
                    <button
                      key={disc}
                      type="button"
                      onClick={() =>
                        handleUpdate({
                          disciplines: toggleArrayItem(filters.disciplines, disc),
                        })
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {disc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bancas */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Banca Examinadora
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableBoards.map(board => {
                  const active = filters.boards.includes(board);
                  return (
                    <button
                      key={board}
                      type="button"
                      onClick={() =>
                        handleUpdate({
                          boards: toggleArrayItem(filters.boards, board),
                        })
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {board}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Órgãos */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Órgão
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableOrganizations.map(org => {
                  const active = filters.organizations.includes(org);
                  return (
                    <button
                      key={org}
                      type="button"
                      onClick={() =>
                        handleUpdate({
                          organizations: toggleArrayItem(filters.organizations, org),
                        })
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {org}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modalidade & Dificuldade */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Modalidade & Dificuldade
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate({
                      modalities: toggleArrayItem<QuestionModality>(
                        filters.modalities,
                        'certo_errado'
                      ),
                    })
                  }
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    filters.modalities.includes('certo_errado')
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Certo / Errado
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate({
                      modalities: toggleArrayItem<QuestionModality>(
                        filters.modalities,
                        'multipla_escolha'
                      ),
                    })
                  }
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    filters.modalities.includes('multipla_escolha')
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Múltipla Escolha
                </button>

                {(['facil', 'medio', 'dificil'] as QuestionDifficulty[]).map(diff => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() =>
                      handleUpdate({
                        difficulties: toggleArrayItem(filters.difficulties, diff),
                      })
                    }
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                      filters.difficulties.includes(diff)
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {diff === 'medio' ? 'Médio' : diff === 'facil' ? 'Fácil' : 'Difícil'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Pills and Counter */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            Encontradas:
          </span>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {filteredCount} de {totalCount} questões
          </span>

          {/* Active filter badges */}
          {filters.disciplines.map(d => (
            <span
              key={d}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {d}
              <button
                onClick={() =>
                  handleUpdate({ disciplines: filters.disciplines.filter(i => i !== d) })
                }
                className="hover:text-rose-600"
              >
                ×
              </button>
            </span>
          ))}

          {filters.boards.map(b => (
            <span
              key={b}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Banca: {b}
              <button
                onClick={() => handleUpdate({ boards: filters.boards.filter(i => i !== b) })}
                className="hover:text-rose-600"
              >
                ×
              </button>
            </span>
          ))}

          {filters.organizations.map(o => (
            <span
              key={o}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {o}
              <button
                onClick={() =>
                  handleUpdate({ organizations: filters.organizations.filter(i => i !== o) })
                }
                className="hover:text-rose-600"
              >
                ×
              </button>
            </span>
          ))}

          {filters.statusFilter !== 'todas' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Status: {filters.statusFilter}
              <button
                onClick={() => handleUpdate({ statusFilter: 'todas' })}
                className="hover:text-rose-600"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Limpar Filtros
          </button>
        )}
      </div>
    </div>
  );
};
