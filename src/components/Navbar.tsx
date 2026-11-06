import React from 'react';
import {
  BookOpen,
  CheckSquare,
  AlertTriangle,
  Award,
  BarChart3,
  Trophy,
  ShieldCheck,
  Flame,
  Sun,
  Moon,
  User,
  ChevronDown,
  Menu,
  X,
  Target,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (userId: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  streakDays: number;
  todayQuestions: number;
  dailyGoal: number;
  unreviewedErrorsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  allUsers,
  onSwitchUser,
  theme,
  onToggleTheme,
  streakDays,
  todayQuestions,
  dailyGoal,
  unreviewedErrorsCount,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'questoes', label: 'Questões', icon: BookOpen },
    { id: 'cadernos', label: 'Meus Cadernos', icon: CheckSquare },
    {
      id: 'erros',
      label: 'Caderno de Erros',
      icon: AlertTriangle,
      badge: unreviewedErrorsCount > 0 ? unreviewedErrorsCount : undefined,
    },
    { id: 'simulados', label: 'Simulados', icon: Award },
    { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3 },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
  ];

  // Admin tab visible for ADMIN and SUPERADMIN
  if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN') {
    navItems.push({
      id: 'admin',
      label: 'Central de Coleta & Admin',
      icon: ShieldCheck,
      badge: undefined,
    });
  }

  const roleBadgeColors: Record<UserRole, string> = {
    SUPERADMIN: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    ADMIN: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    USUARIO: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('questoes')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Questões<span className="text-blue-600 dark:text-blue-400">Brasil</span>
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                  Livre
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Plataforma Aberta de Concursos
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Header Right Utilities */}
        <div className="flex items-center gap-2.5">
          {/* Quick Streak Widget */}
          <div
            title={`Sequência ativa: ${streakDays} dias consecutivos de estudos`}
            className="hidden items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-800 sm:flex dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>{streakDays} {streakDays === 1 ? 'dia' : 'dias'}</span>
          </div>

          {/* Daily Goal Progress */}
          <div
            title={`Meta diária: ${todayQuestions} de ${dailyGoal} questões resolvidas hoje`}
            className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 sm:flex dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
          >
            <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {todayQuestions}/{dailyGoal} hoje
            </span>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            aria-label="Alternar tema claro e escuro"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pr-2.5 text-left text-xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser.name}
                className="h-7 w-7 rounded-md object-cover"
              />
              <div className="hidden text-left md:block">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {currentUser.nickname}
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span
                    className={`rounded border px-1 py-0.2 font-bold uppercase tracking-wider ${roleBadgeColors[currentUser.role]}`}
                  >
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown for Role & Profile switching */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Conectado como:</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{currentUser.email}</p>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Alternar Perfil de Acesso:
                  </div>
                  {allUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setUserDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        <div>
                          <div>{u.nickname}</div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-300">{u.email}</div>
                        </div>
                      </div>
                      <span
                        className={`rounded border px-1 py-0.5 text-[9px] font-bold uppercase ${roleBadgeColors[u.role]}`}
                      >
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden dark:border-slate-800 dark:text-slate-400"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-2 gap-2 pb-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span>{streakDays} dias de sequência</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 p-2 text-xs font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
              <Target className="h-4 w-4 text-blue-600" />
              <span>{todayQuestions}/{dailyGoal} meta diária</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 pt-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
