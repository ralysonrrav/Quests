# Modelagem de Banco de Dados — Questões Brasil (PostgreSQL / Supabase)

Este documento especifica a arquitetura relacional de dados da plataforma **Questões Brasil**, incluindo migrations versionadas, integridade referencial, índices de alta performance e políticas de **Row Level Security (RLS)** rigorosas para cada tabela exposta.

---

## 1. Diagrama de Domínio e Entidades

O banco de dados é particionado em 5 subsistemas principais:

1. **Identidade e Autorização:** `profiles`, `user_roles`, `invitations`, `user_settings`, `audit_logs`.
2. **Catálogo de Concursos:** `exam_boards`, `organizations`, `positions`, `exams`, `disciplines`, `topics`, `questions`, `question_options`, `content_sources`.
3. **Coleta e Extração (Central de Coleta):** `ingestion_sources`, `ingestion_jobs`, `ingestion_job_items`, `extraction_results`, `duplicate_candidates`.
4. **Estudos e Resolução:** `question_attempts`, `notebooks`, `notebook_questions`, `notebook_folders`, `favorites`, `personal_notes`, `daily_activity`, `achievements`.
5. **Simulados:** `simulations`, `simulation_questions`, `simulation_attempts`.

---

## 2. Migrations SQL Completas (PostgreSQL 15+ / Supabase)

```sql
-- ====================================================================
-- MIGRATION 001: Identidade, Perfis e Controle de Acesso (RBAC)
-- ====================================================================

CREATE TYPE user_role_enum AS ENUM ('SUPERADMIN', 'ADMIN', 'USUARIO');
CREATE TYPE difficulty_enum AS ENUM ('facil', 'medio', 'dificil', 'muito_dificil');
CREATE TYPE modality_enum AS ENUM ('multipla_escolha', 'certo_errado');
CREATE TYPE answer_key_status_enum AS ENUM ('valida', 'anulada', 'gabarito_alterado');
CREATE TYPE job_status_enum AS ENUM ('fila', 'baixando', 'extraindo', 'classificando', 'revisao', 'concluido', 'erro');

-- 1. Profiles (espelho da auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    nickname TEXT NOT NULL UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'USUARIO',
    avatar_url TEXT,
    is_public_ranking BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Invitations (Controle de entrada restrita)
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'USUARIO',
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT false
);

-- 3. Audit Logs (Trilha imutável)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    user_name TEXT NOT NULL,
    user_role user_role_enum NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- MIGRATION 002: Catálogo de Questões e Taxonomia
-- ====================================================================

-- 4. Disciplinas
CREATE TABLE public.disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Assuntos e Subassuntos
CREATE TABLE public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    parent_topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Questões
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    board TEXT NOT NULL,
    organization TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    position TEXT NOT NULL,
    year SMALLINT NOT NULL,
    education_level TEXT NOT NULL,
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id),
    topic_id UUID NOT NULL REFERENCES public.topics(id),
    subtopic_id UUID REFERENCES public.topics(id),
    modality modality_enum NOT NULL,
    difficulty difficulty_enum NOT NULL DEFAULT 'medio',
    statement TEXT NOT NULL,
    support_text TEXT,
    correct_option_id TEXT NOT NULL, -- 'A', 'B', 'C', 'D', 'E' ou 'C', 'E'
    key_status answer_key_status_enum NOT NULL DEFAULT 'valida',
    key_status_note TEXT,
    explanation_author TEXT NOT NULL,
    explanation_role TEXT NOT NULL,
    explanation_text TEXT NOT NULL,
    explanation_legal_basis TEXT,
    source_doc_hash TEXT,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_attempts INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Alternativas das Questões
CREATE TABLE public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    letter_id TEXT NOT NULL, -- 'A', 'B', 'C', 'D', 'E'
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    percentage_chosen NUMERIC(5,2) DEFAULT 0.00
);

-- ====================================================================
-- MIGRATION 003: Estudos, Tentativas e Caderno de Erros
-- ====================================================================

-- 8. Tentativas de Resolução (Histórico Imutável)
CREATE TABLE public.question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    review_box SMALLINT NOT NULL DEFAULT 1, -- Leitner 1..5
    is_mastered BOOLEAN NOT NULL DEFAULT false,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Cadernos Pessoais
CREATE TABLE public.notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#2563eb',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Questões nos Cadernos (N:N)
CREATE TABLE public.notebook_questions (
    notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (notebook_id, question_id)
);

-- 11. Anotações Pessoais
CREATE TABLE public.personal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, question_id)
);

-- 12. Favoritas
CREATE TABLE public.favorites (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, question_id)
);

-- ====================================================================
-- MIGRATION 004: Simulados Personalizados
-- ====================================================================

-- 13. Simulados
CREATE TABLE public.simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    mode TEXT NOT NULL DEFAULT 'prova', -- 'prova' ou 'treinamento'
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    scoring_rule TEXT NOT NULL DEFAULT 'cespe_ce',
    status TEXT NOT NULL DEFAULT 'em_andamento',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- 14. Tentativas de Simulados
CREATE TABLE public.simulation_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    blank_count INTEGER NOT NULL DEFAULT 0,
    time_used_seconds INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- MIGRATION 005: Central de Coleta de Provas
-- ====================================================================

-- 15. Ingestion Sources
CREATE TABLE public.ingestion_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    board TEXT NOT NULL,
    base_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    crawler_type TEXT NOT NULL DEFAULT 'oficial_publico',
    legal_terms_summary TEXT NOT NULL,
    last_sync_at TIMESTAMPTZ
);

-- 16. Ingestion Jobs
CREATE TABLE public.ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source_id UUID NOT NULL REFERENCES public.ingestion_sources(id),
    board TEXT NOT NULL,
    organization TEXT NOT NULL,
    year SMALLINT NOT NULL,
    status job_status_enum NOT NULL DEFAULT 'fila',
    progress_percentage SMALLINT NOT NULL DEFAULT 0,
    source_doc_name TEXT NOT NULL,
    source_doc_hash TEXT,
    extracted_questions_count INTEGER NOT NULL DEFAULT 0,
    duplicates_found_count INTEGER NOT NULL DEFAULT 0,
    approved_count INTEGER NOT NULL DEFAULT 0,
    published_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);
```

---

## 3. Políticas de Row Level Security (RLS)

O Supabase exige RLS ativado em todas as tabelas públicas:

```sql
-- Habilita RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Helper function: Verifica se o usuário autenticado é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles: Cada usuário lê/atualiza o seu; Admins leem todos
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin() OR is_public_ranking = true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- 2. Questions & Options: Qualquer usuário autenticado lê questões publicadas
CREATE POLICY "questions_read_published" ON public.questions FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "questions_admin_manage" ON public.questions FOR ALL USING (public.is_admin());

CREATE POLICY "question_options_read" ON public.question_options FOR SELECT USING (true);
CREATE POLICY "question_options_admin_manage" ON public.question_options FOR ALL USING (public.is_admin());

-- 3. Attempts: Usuário acessa EXCLUSIVAMENTE suas tentativas
CREATE POLICY "attempts_user_isolation" ON public.question_attempts FOR ALL USING (user_id = auth.uid());

-- 4. Notebooks: Usuário gerencia seus cadernos
CREATE POLICY "notebooks_user_isolation" ON public.notebooks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "notebook_questions_isolation" ON public.notebook_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.notebooks WHERE id = notebook_id AND user_id = auth.uid())
);

-- 5. Personal Notes & Favorites: Isolamento absoluto
CREATE POLICY "personal_notes_isolation" ON public.personal_notes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "favorites_isolation" ON public.favorites FOR ALL USING (user_id = auth.uid());

-- 6. Central de Coleta: Somente ADMIN e SUPERADMIN
CREATE POLICY "ingestion_jobs_admin_only" ON public.ingestion_jobs FOR ALL USING (public.is_admin());
CREATE POLICY "audit_logs_read_admin" ON public.audit_logs FOR SELECT USING (public.is_admin());
```

---

## 4. Índices de Alta Performance

```sql
-- Otimização dos filtros frequentes do banco de questões
CREATE INDEX idx_questions_board_year ON public.questions(board, year);
CREATE INDEX idx_questions_discipline ON public.questions(discipline_id, topic_id);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX idx_questions_is_published ON public.questions(is_published);

-- Busca textual em enunciados (Full Text Search)
CREATE INDEX idx_questions_fts ON public.questions USING gin(to_tsvector('portuguese', statement));

-- Otimização do cálculo de Streak e Caderno de Erros
CREATE INDEX idx_attempts_user_date ON public.question_attempts(user_id, answered_at DESC);
CREATE INDEX idx_attempts_user_question ON public.question_attempts(user_id, question_id, is_correct);
```
