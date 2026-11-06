-- ==============================================================================
-- QUESTÕES BRASIL — MIGRATION 03: INDEXES AND FULL-TEXT SEARCH (FTS)
-- Performance tuning for multi-faceted filters and sub-second full-text queries
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. COMPOSITE INDEXES FOR FAST FILTERING
-- ------------------------------------------------------------------------------

-- Fast question filtering by status, institution, agency, and year
CREATE INDEX IF NOT EXISTS idx_questions_faceted_search 
ON questions (status, institution, agency, year, discipline, difficulty);

-- Fast lookup for topic filtering
CREATE INDEX IF NOT EXISTS idx_questions_discipline_topic 
ON questions (discipline, topic);

-- Fast lookup for ingestion hash integrity checks (anti-duplication)
CREATE INDEX IF NOT EXISTS idx_questions_content_hash 
ON questions (content_hash);

-- Fast lookup for user resolutions
CREATE INDEX IF NOT EXISTS idx_question_resolutions_user_question 
ON question_resolutions (user_id, question_id, created_at DESC);

-- Fast lookup for user streak and daily stats calculation
CREATE INDEX IF NOT EXISTS idx_question_resolutions_user_date 
ON question_resolutions (user_id, created_at DESC);

-- Fast Leitner review queue ordering
CREATE INDEX IF NOT EXISTS idx_error_notebook_review 
ON error_notebook (user_id, next_review_at ASC, mastery_level ASC);

-- ------------------------------------------------------------------------------
-- 2. PORTUGUESE FULL-TEXT SEARCH (GIN INDEX)
-- ------------------------------------------------------------------------------

-- Add generated tsvector column for Portuguese text search
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', coalesce(statement, '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce(legal_basis, '')), 'B') ||
  setweight(to_tsvector('portuguese', coalesce(institution, '') || ' ' || coalesce(agency, '') || ' ' || coalesce(discipline, '') || ' ' || coalesce(topic, '')), 'C')
) STORED;

-- Create GIN index on search_vector
CREATE INDEX IF NOT EXISTS idx_questions_search_vector_gin 
ON questions USING gin (search_vector);

-- ------------------------------------------------------------------------------
-- 3. AUDIT LOGS SEARCH INDEX
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created 
ON audit_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_resource 
ON audit_logs (action, resource_type, created_at DESC);
