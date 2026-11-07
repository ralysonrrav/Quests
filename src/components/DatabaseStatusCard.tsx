import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Server,
  Zap,
  Clock,
  Settings2,
  Save,
  Undo2,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { supabaseService, SupabaseHealthCheckResult } from '../lib/supabaseService';
import {
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  updateRuntimeSupabaseConfig,
  resetRuntimeSupabaseConfig,
} from '../lib/supabaseClient';

export const DatabaseStatusCard: React.FC = () => {
  const [result, setResult] = useState<SupabaseHealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customKey, setCustomKey] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const runCheck = async () => {
    setIsLoading(true);
    try {
      const res = await supabaseService.testConnection();
      setResult(res);
      const cfg = supabaseService.getConfig();
      setCustomUrl(cfg.url);
      setCustomKey(cfg.anonKey);
    } catch (e: any) {
      setResult({
        isConfigured: false,
        status: 'error',
        url: '',
        maskedKey: '',
        message: 'Erro inesperado ao verificar o banco de dados.',
        details: e?.message || String(e),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const handleSaveCustomCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      setSaveMessage('Por favor preencha a URL e a Anon Key.');
      return;
    }

    const success = updateRuntimeSupabaseConfig(customUrl, customKey);
    if (success) {
      setSaveMessage('Credenciais salvas com sucesso no navegador!');
      setTimeout(() => {
        setSaveMessage(null);
        setIsEditingConfig(false);
      }, 1500);
      runCheck();
    } else {
      setSaveMessage('URL inválida. Certifique-se de iniciar com https://.');
    }
  };

  const handleResetToDefault = () => {
    resetRuntimeSupabaseConfig();
    setCustomUrl(DEFAULT_SUPABASE_URL);
    setCustomKey(DEFAULT_SUPABASE_ANON_KEY);
    setSaveMessage('Credenciais restauradas para o padrão oficial.');
    setTimeout(() => {
      setSaveMessage(null);
      setIsEditingConfig(false);
    }, 1500);
    runCheck();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              isLoading
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : result?.status === 'connected'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : result?.status === 'schema_missing'
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                    : result?.status === 'error'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Status do Banco de Dados (Supabase PostgreSQL)
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isLoading
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    : result?.status === 'connected'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : result?.status === 'schema_missing'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : result?.status === 'error'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isLoading
                  ? 'Verificando...'
                  : result?.status === 'connected'
                    ? 'Conexão Ativa & Homologada'
                    : result?.status === 'schema_missing'
                      ? 'Conectado (Migração Pendente)'
                      : result?.status === 'error'
                        ? 'Falha na Conexão'
                        : 'Não Configurado'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Valida em tempo real as credenciais <code className="font-mono text-[11px] text-blue-600 dark:text-blue-400">VITE_SUPABASE_URL</code> e políticas RLS no PostgreSQL.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingConfig(!isEditingConfig)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            title="Configurar ou alterar credenciais do Supabase"
          >
            <Settings2 className="h-3.5 w-3.5 text-slate-500" />
            <span>Configurar Credenciais</span>
          </button>

          <button
            onClick={runCheck}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Testar Conexão</span>
          </button>
        </div>
      </div>

      {/* Inline Configuration Editor Modal/Drawer */}
      {isEditingConfig && (
        <form
          onSubmit={handleSaveCustomCredentials}
          className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs dark:border-blue-900/40 dark:bg-blue-950/20 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-2 dark:border-blue-900/40">
            <h4 className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
              <Settings2 className="h-4 w-4 text-blue-600" />
              Configurar Conexão do Supabase no Navegador
            </h4>
            <span className="text-[11px] text-blue-600 dark:text-blue-400">
              Salvo localmente no dispositivo (LocalStorage)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project URL (VITE_SUPABASE_URL):
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="https://seu-projeto.supabase.co"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anon Key (VITE_SUPABASE_ANON_KEY):
              </label>
              <input
                type="text"
                value={customKey}
                onChange={e => setCustomKey(e.target.value)}
                placeholder="sb_publishable_... ou eyJhbGci..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {saveMessage && (
            <p className="font-semibold text-blue-700 dark:text-blue-300">
              {saveMessage}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Restaurar Padrão Oficial do Projeto
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingConfig(false)}
                className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 font-semibold text-white hover:bg-blue-700 shadow-xs"
              >
                <Save className="h-3.5 w-3.5" />
                Salvar e Reconectar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Status Body */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left Column: Diagnostics Banner */}
        <div className="lg:col-span-2 space-y-3">
          <div
            className={`rounded-xl border p-4 text-xs leading-relaxed ${
              result?.status === 'connected'
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                : result?.status === 'error'
                  ? 'border-rose-200 bg-rose-50/70 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
                  : 'border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {result?.status === 'connected' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : result?.status === 'error' ? (
                <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 w-full">
                <p className="font-bold text-sm">
                  {result?.message || 'Aguardando diagnóstico...'}
                </p>
                {result?.details && (
                  <p className="text-slate-600 dark:text-slate-400">
                    {result.details}
                  </p>
                )}

                {result?.status === 'connected' && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 pt-1 font-semibold text-emerald-700 dark:text-emerald-300">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4" />
                      <span>
                        {result.totalQuestionsCount} questão(ões) homologada(s) no Supabase!
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Políticas RLS e Schema PostgreSQL validados</span>
                    </div>
                  </div>
                )}

                {result?.status === 'schema_missing' && (
                  <div className="mt-2.5 rounded-lg border border-amber-300/80 bg-amber-100/70 p-2.5 dark:border-amber-800/60 dark:bg-amber-900/30">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      Como habilitar as tabelas no Supabase:
                    </p>
                    <ol className="mt-1 list-decimal list-inside space-y-0.5 text-amber-800 dark:text-amber-300">
                      <li>Acesse o painel do seu projeto no Supabase &gt; <strong>SQL Editor</strong>.</li>
                      <li>Copie o script da migração: <code className="font-mono text-[11px] bg-amber-200/60 dark:bg-amber-950 px-1 py-0.5 rounded">supabase/migrations/20261106000001_initial_schema.sql</code>.</li>
                      <li>Clique em <strong>Run</strong>. Em seguida, execute também <code className="font-mono text-[11px] bg-amber-200/60 dark:bg-amber-950 px-1 py-0.5 rounded">supabase/seed.sql</code> para carregar as 8 questões.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tables schema audit checklist */}
          {result?.tablesFound && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tabelas e Permissões Homologadas (RLS)
                </h4>
                <span className="text-[10px] text-slate-400">
                  Auditoria PostgREST v1
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {result.tablesFound.questions ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className="font-mono text-slate-700 dark:text-slate-300">questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {result.tablesFound.profiles ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className="font-mono text-slate-700 dark:text-slate-300">profiles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {result.tablesFound.notebooks ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className="font-mono text-slate-700 dark:text-slate-300">notebooks</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Connection Credentials & Latency Details */}
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Server className="h-4 w-4 text-blue-600" />
              Parâmetros de Ambiente
            </h4>
            {result?.source && (
              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {result.source === 'default_project'
                  ? 'Padrão Oficial'
                  : result.source === 'custom_storage'
                    ? 'Personalizado'
                    : 'Variável .env'}
              </span>
            )}
          </div>

          <div>
            <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
              Project URL
            </span>
            <code className="block mt-0.5 truncate rounded bg-white px-2 py-1 font-mono text-[11px] text-slate-800 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
              {result?.url || 'VITE_SUPABASE_URL'}
            </code>
          </div>

          <div>
            <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
              Anon Key
            </span>
            <code className="block mt-0.5 truncate rounded bg-white px-2 py-1 font-mono text-[11px] text-slate-800 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
              {result?.maskedKey || 'VITE_SUPABASE_ANON_KEY'}
            </code>
          </div>

          {result?.latencyMs !== undefined && (
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Latência de Resposta:
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {result.latencyMs} ms
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
            <p className="flex items-start gap-1">
              <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Para deploy permanente no Vercel, acesse <em>Settings &gt; Environment Variables</em>, adicione <code className="text-blue-600 font-mono">VITE_SUPABASE_URL</code> e <code className="text-blue-600 font-mono">VITE_SUPABASE_ANON_KEY</code> e faça o <em>Redeploy</em>.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
