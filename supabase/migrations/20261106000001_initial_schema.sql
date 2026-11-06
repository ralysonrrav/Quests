-- Migration: 20261106000001_initial_schema.sql
-- Description: Core schema for Questões Brasil (Identity, Catalog, Ingestion, Studies, Simulations)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role_enum AS ENUM ('SUPERADMIN', 'ADMIN', 'USUARIO');
CREATE TYPE difficulty_enum AS ENUM ('facil', 'medio', 'dificil', 'muito_dificil');
CREATE TYPE modality_enum AS ENUM ('multipla_escolha', 'certo_errado');
CREATE TYPE answer_key_status_enum AS ENUM ('valida', 'anulada', 'gabarito_alterado');
CREATE TYPE job_status_enum AS ENUM ('fila', 'baixando', 'extraindo', 'classificando', 'revisao', 'concluido', 'erro');

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- 2. Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
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

-- 3. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
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

-- 4. Disciplinas & Assuntos
CREATE TABLE IF NOT EXISTS public.disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
    parent_topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Questões e Alternativas
CREATE TABLE IF NOT EXISTS public.questions (
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
    correct_option_id TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    letter_id TEXT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    percentage_chosen NUMERIC(5,2) DEFAULT 0.00
);

-- 6. Resoluções e Cadernos
CREATE TABLE IF NOT EXISTS public.question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    review_box SMALLINT NOT NULL DEFAULT 1,
    is_mastered BOOLEAN NOT NULL DEFAULT false,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#2563eb',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notebook_questions (
    notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (notebook_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.personal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.favorites (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, question_id)
);

-- 7. Simulados
CREATE TABLE IF NOT EXISTS public.simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    mode TEXT NOT NULL DEFAULT 'prova',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    scoring_rule TEXT NOT NULL DEFAULT 'cespe_ce',
    status TEXT NOT NULL DEFAULT 'em_andamento',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.simulation_attempts (
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

-- 8. Ingestão e Fontes Oficiais
CREATE TABLE IF NOT EXISTS public.ingestion_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    board TEXT NOT NULL,
    base_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    crawler_type TEXT NOT NULL DEFAULT 'oficial_publico',
    legal_terms_summary TEXT NOT NULL,
    last_sync_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
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
