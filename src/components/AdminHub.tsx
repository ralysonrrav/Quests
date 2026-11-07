import React, { useState } from 'react';
import {
  ShieldCheck,
  DownloadCloud,
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Users,
  KeyRound,
  FileText,
  Clock,
  Layers,
  Database,
  UploadCloud,
  Eye,
  GitPullRequest,
  Fingerprint,
} from 'lucide-react';
import { DatabaseStatusCard } from './DatabaseStatusCard';
import {
  UserProfile,
  UserRole,
  IngestionSource,
  IngestionJob,
  ExtractedQuestionDraft,
  Invitation,
  AuditLog,
} from '../types';

interface AdminHubProps {
  currentUser: UserProfile;
  sources: IngestionSource[];
  jobs: IngestionJob[];
  drafts: ExtractedQuestionDraft[];
  users: UserProfile[];
  invitations: Invitation[];
  auditLogs: AuditLog[];
  onTriggerIngestion: (jobData: any) => void;
  onPublishDraft: (draftId: string, overrides?: { statement?: string; discipline?: string; topic?: string }) => void;
  onCreateInvitation: (email: string, role: UserRole) => void;
  onToggleUserStatus?: (userId: string) => void;
  onRevokeInvitation?: (invitationId: string) => void;
}

export const AdminHub: React.FC<AdminHubProps> = ({
  currentUser,
  sources,
  jobs,
  drafts,
  users,
  invitations,
  auditLogs,
  onTriggerIngestion,
  onPublishDraft,
  onCreateInvitation,
  onToggleUserStatus,
  onRevokeInvitation,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'coleta' | 'revisao' | 'usuarios' | 'auditoria'>('coleta');

  // Coleta manual form state
  const [selectedSourceId, setSelectedSourceId] = useState<string>(sources[0]?.id || '');
  const [searchBoard, setSearchBoard] = useState('Cebraspe');
  const [searchOrg, setSearchOrg] = useState('Polícia Federal');
  const [searchYear, setSearchYear] = useState('2024');
  const [searchDocName, setSearchDocName] = useState('PF_2024_AGENTE_DEFINITIVA.pdf');
  const [isProcessing, setIsProcessing] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('USUARIO');
  const [inviteCreatedCode, setInviteCreatedCode] = useState<string | null>(null);

  // Draft review side-by-side modal
  const [selectedDraftForReview, setSelectedDraftForReview] = useState<ExtractedQuestionDraft | null>(null);
  const [editedDiscipline, setEditedDiscipline] = useState('');
  const [editedTopic, setEditedTopic] = useState('');
  const [editedStatement, setEditedStatement] = useState('');

  const handleStartIngestion = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    onTriggerIngestion({
      sourceId: selectedSourceId,
      board: searchBoard,
      organization: searchOrg,
      year: searchYear,
      docName: searchDocName,
      title: `Ingestão ${searchBoard} — ${searchOrg} (${searchYear})`,
    });
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  };

  const handleCreateInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    onCreateInvitation(inviteEmail, inviteRole);
    setInviteCreatedCode(`QB-${Math.random().toString(36).substring(2, 7).toUpperCase()}-2026`);
    setInviteEmail('');
  };

  const openReviewModal = (draft: ExtractedQuestionDraft) => {
    setSelectedDraftForReview(draft);
    setEditedDiscipline(draft.suggestedDiscipline);
    setEditedTopic(draft.suggestedTopic);
    setEditedStatement(draft.statement);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Painel Administrativo & Central de Coleta
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Ambiente exclusivo para administradores homologarem fontes oficiais, extrações e auditoria.
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveAdminTab('coleta')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeAdminTab === 'coleta'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Central de Coleta ({jobs.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('revisao')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeAdminTab === 'revisao'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span>Fila de Revisão</span>
            {drafts.length > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                {drafts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('usuarios')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeAdminTab === 'usuarios'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Usuários & Convites ({users.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('auditoria')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeAdminTab === 'auditoria'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Auditoria ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Database Connection & Health Check Component */}
      <DatabaseStatusCard />

      {/* ======================================================== */}
      {/* TAB 1: CENTRAL DE COLETA DE PROVAS                       */}
      {/* ======================================================== */}
      {activeAdminTab === 'coleta' && (
        <div className="space-y-6">
          {/* Pipeline Steps Indicator (10-Stage Architecture) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Fluxo Assíncrono da Central de Coleta (Pipeline Homologado)
            </h4>
            <div className="flex min-w-[700px] items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex flex-col items-center gap-1 text-center font-bold text-blue-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">1</span>
                <span>Fontes Oficiais</span>
              </div>
              <div className="h-0.5 w-8 bg-blue-300" />
              <div className="flex flex-col items-center gap-1 text-center font-bold text-blue-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">2</span>
                <span>Busca Manual</span>
              </div>
              <div className="h-0.5 w-8 bg-blue-300" />
              <div className="flex flex-col items-center gap-1 text-center font-bold text-blue-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">3</span>
                <span>Hash & Storage</span>
              </div>
              <div className="h-0.5 w-8 bg-blue-300" />
              <div className="flex flex-col items-center gap-1 text-center font-bold text-blue-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">4</span>
                <span>Extração & OCR</span>
              </div>
              <div className="h-0.5 w-8 bg-blue-300" />
              <div className="flex flex-col items-center gap-1 text-center font-bold text-blue-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">5</span>
                <span>Classificação</span>
              </div>
              <div className="h-0.5 w-8 bg-blue-300" />
              <div className="flex flex-col items-center gap-1 text-center font-bold text-blue-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">6</span>
                <span>Duplicidades</span>
              </div>
              <div className="h-0.5 w-8 bg-blue-300" />
              <div className="flex flex-col items-center gap-1 text-center font-bold text-emerald-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">7</span>
                <span>Revisão & Publicação</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Form: Disparar Nova Coleta Manual */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-1 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <DownloadCloud className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Iniciar Coleta Manual de Prova
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Conforme a Regra 14, coletas automáticas não autorizadas são bloqueadas. O comando deve ser
                iniciado exclusivamente por administradores credenciados.
              </p>

              <form onSubmit={handleStartIngestion} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Fonte Autorizada
                  </label>
                  <select
                    value={selectedSourceId}
                    onChange={e => setSelectedSourceId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {sources.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.board})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Banca
                    </label>
                    <input
                      type="text"
                      value={searchBoard}
                      onChange={e => setSearchBoard(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ano
                    </label>
                    <input
                      type="number"
                      value={searchYear}
                      onChange={e => setSearchYear(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Órgão do Concurso
                  </label>
                  <input
                    type="text"
                    value={searchOrg}
                    onChange={e => setSearchOrg(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Arquivo da Prova (PDF Legítimo)
                  </label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-2.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
                    <UploadCloud className="h-4 w-4 text-blue-600" />
                    <span className="truncate">{searchDocName}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isProcessing ? 'Iniciando Pipeline...' : 'Processar Prova'}</span>
                </button>
              </form>
            </div>

            {/* Ingestion Jobs Monitor (Etapa 10) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Monitor de Trabalhos de Ingestão (Jobs)
                </h3>
                <span className="text-xs text-slate-500">{jobs.length} trabalhos auditados</span>
              </div>

              <div className="mt-4 space-y-4">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {job.title}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              job.status === 'concluido'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : job.status === 'revisao'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Doc: {job.sourceDocName} • Hash SHA-256:{' '}
                          <code className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                            {job.sourceDocHash?.substring(0, 16)}...
                          </code>
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {job.extractedQuestionsCount} questões
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {job.duplicatesFoundCount} duplicadas detectadas
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Progresso de extração e classificação</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {job.progressPercentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${job.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: FILA DE REVISÃO HUMANA (ETAPAS 8 E 9)            */}
      {/* ======================================================== */}
      {activeAdminTab === 'revisao' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
            <strong>Fila de Auditoria Editorial:</strong> Questões extraídas de PDFs oficiais aguardam
            revisão humana antes de publicação. Valide o gabarito, a taxonomia e descarte duplicidades.
          </div>

          <div className="grid grid-cols-1 gap-4">
            {drafts.map(draft => (
              <div
                key={draft.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        Questão {draft.numberInExam} do Caderno
                      </span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {draft.suggestedDiscipline} • {draft.suggestedTopic}
                      </span>
                    </div>

                    {/* Classification confidence score badge */}
                    <div className="flex items-center gap-2">
                      <span
                        title="Score de confiança do classificador taxonômico"
                        className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        Confiança: {draft.classificationConfidence}%
                      </span>
                      {draft.duplicateSimilarity && draft.duplicateSimilarity > 60 && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {draft.duplicateSimilarity}% similar a questão existente
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                    {draft.statement}
                  </p>

                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 pt-1">
                    {draft.options.map(opt => (
                      <div
                        key={opt.id}
                        className={`rounded-lg border px-3 py-1.5 text-xs ${
                          opt.isCorrect
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300'
                        }`}
                      >
                        <strong>{opt.id}:</strong> {opt.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Actions */}
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    onClick={() => openReviewModal(draft)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Conferir Lado a Lado</span>
                  </button>
                  <button
                    onClick={() => onPublishDraft(draft.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Aprovar e Publicar</span>
                  </button>
                </div>
              </div>
            ))}

            {drafts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                  Todas as questões foram revisadas e publicadas!
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  O acervo público está 100% atualizado com as últimas provas homologadas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: GESTÃO DE USUÁRIOS & CONVITES                     */}
      {/* ======================================================== */}
      {activeAdminTab === 'usuarios' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Create Invite */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <KeyRound className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white">Gerar Convite de Acesso</h3>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              O cadastro público é restrito. Somente administradores autorizados convidam novos usuários.
            </p>

            <form onSubmit={handleCreateInviteSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  E-mail do Convidado *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="exemplo@concursando.com.br"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Papel de Acesso (RBAC)
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="USUARIO">USUÁRIO (Acesso ao estudo e simulados)</option>
                  <option value="ADMIN">ADMIN (Revisor de conteúdo e questões)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Administrador geral)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
              >
                Gerar Token de Convite
              </button>

              {inviteCreatedCode && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                  <span className="block font-bold">Convite Criado com Sucesso:</span>
                  <code className="mt-1 block rounded bg-white p-1 text-center font-mono font-bold dark:bg-slate-900">
                    {inviteCreatedCode}
                  </code>
                </div>
              )}
            </form>
          </div>

          {/* Users List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-white">Usuários Cadastrados ({users.length})</h3>
            <p className="text-xs text-slate-500 mb-4">
              Controle de permissões, perfis e status de ativação da conta.
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={u.name}
                      className="h-9 w-9 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        u.role === 'SUPERADMIN'
                          ? 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : u.role === 'ADMIN'
                            ? 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {u.role}
                    </span>
                    {onToggleUserStatus ? (
                      <button
                        onClick={() => onToggleUserStatus(u.id)}
                        title="Clique para alternar status da conta"
                        className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                      >
                        Ativo
                      </button>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Ativo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Invitations List */}
            {invitations && invitations.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Convites Emitidos ({invitations.length})
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invitations.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{inv.email}</p>
                        <p className="text-[11px] font-mono text-slate-500">
                          Código: {inv.code} • Papel: {inv.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.isRevoked ? (
                          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            Revogado
                          </span>
                        ) : (
                          onRevokeInvitation && (
                            <button
                              onClick={() => onRevokeInvitation(inv.id)}
                              className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
                            >
                              Revogar Convite
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: AUDITORIA DO SISTEMA                              */}
      {/* ======================================================== */}
      {activeAdminTab === 'auditoria' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Trilha de Auditoria Imutável (DevSecOps)
              </h3>
              <p className="text-xs text-slate-500">
                Registros de ações administrativas, publicações, convites e acessos privilegiados.
              </p>
            </div>
            <Fingerprint className="h-5 w-5 text-blue-600" />
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.map(log => (
              <div key={log.id} className="py-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {log.userName} ({log.userRole})
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">IP: {log.ipAddress}</span>
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Review Modal */}
      {selectedDraftForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Comparador Lado a Lado: Original do PDF vs Questão Estruturada
                </h3>
              </div>
              <button
                onClick={() => setSelectedDraftForReview(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Left Column: Original raw excerpt from exam doc */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Documento Original (Trecho do PDF)
                </h4>
                <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                  {selectedDraftForReview.originalRawSnippet}
                </div>
              </div>

              {/* Right Column: Editable structured parsed content */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Estrutura Extraída e Classificada
                </h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Disciplina
                  </label>
                  <input
                    type="text"
                    value={editedDiscipline}
                    onChange={e => setEditedDiscipline(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Assunto
                  </label>
                  <input
                    type="text"
                    value={editedTopic}
                    onChange={e => setEditedTopic(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Enunciado Normalizado
                  </label>
                  <textarea
                    rows={4}
                    value={editedStatement}
                    onChange={e => setEditedStatement(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                onClick={() => setSelectedDraftForReview(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  onPublishDraft(selectedDraftForReview.id, {
                    statement: editedStatement,
                    discipline: editedDiscipline,
                    topic: editedTopic,
                  });
                  setSelectedDraftForReview(null);
                }}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
              >
                Confirmar Homologação e Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
