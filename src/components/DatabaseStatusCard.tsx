import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
  Clock,
  Layers,
} from 'lucide-react';
import { supabaseService, SupabaseHealthCheckResult } from '../lib/supabaseService';

export const DatabaseStatusCard: React.FC = () => {
  const [result, setResult] = useState<SupabaseHealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const runCheck = async () => {
    setIsLoading(true);
    try {
      const res = await supabaseService.testConnection();
      setResult(res);
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              isLoading
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : result?.status === 'connected'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : result?.status === 'error'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
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
              Valida em tempo real as credenciais <code className="font-mono text-[11px] text-blue-600 dark:text-blue-400">VITE_SUPABASE_URL</code> e chaves de acesso.
            </p>
          </div>
        </div>

        <button
          onClick={runCheck}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Testar Conexão</span>
        </button>
      </div>

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
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  {result?.message || 'Aguardando diagnóstico...'}
                </p>
                {result?.details && (
                  <p className="text-slate-600 dark:text-slate-400">
                    {result.details}
                  </p>
                )}
                {result?.status === 'connected' && result.totalQuestionsCount !== undefined && (
                  <div className="mt-2 flex items-center gap-2 pt-1 font-semibold text-emerald-700 dark:text-emerald-300">
                    <Zap className="h-4 w-4" />
                    <span>
                      {result.totalQuestionsCount} questão(ões) catalogada(s) e acessíveis diretamente na nuvem!
                    </span>
                  </div>
                )}
                {result?.status === 'schema_missing' && (
                  <div className="mt-2.5 rounded-lg border border-amber-300/80 bg-amber-100/70 p-2.5 dark:border-amber-800/60 dark:bg-amber-900/30">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      Como habilitar as tabelas em 1 minuto:
                    </p>
                    <ol className="mt-1 list-decimal list-inside space-y-0.5 text-amber-800 dark:text-amber-300">
                      <li>Acesse o painel do seu projeto no Supabase &gt; <strong>SQL Editor</strong>.</li>
                      <li>Copie e cole o script da migração: <code className="font-mono text-[11px] bg-amber-200/60 dark:bg-amber-950 px-1 py-0.5 rounded">supabase/migrations/20261106000001_initial_schema.sql</code>.</li>
                      <li>Clique em <strong>Run</strong>. As tabelas e permissões RLS serão criadas e este painel ficará 100% verde!</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tables schema audit checklist */}
          {result?.tablesFound && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tabelas e Permissões Homologadas (RLS)
              </h4>
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
          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Server className="h-4 w-4 text-blue-600" />
            Parâmetros de Ambiente
          </h4>

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

          {result?.status !== 'connected' && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
              <p>
                <strong>Dica:</strong> No Vercel, acesse <em>Settings &gt; Environment Variables</em>, adicione <code className="text-blue-600">VITE_SUPABASE_URL</code> e <code className="text-blue-600">VITE_SUPABASE_ANON_KEY</code> e faça o <em>Redeploy</em>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
