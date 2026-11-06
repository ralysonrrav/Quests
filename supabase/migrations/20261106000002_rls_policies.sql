-- ==============================================================================
-- QUESTÕES BRASIL — MIGRATION 02: ROW LEVEL SECURITY (RLS) POLICIES
-- Strict least-privilege security model with Role-Based Access Control (RBAC)
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_notebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR SECURITY RULES (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

-- Check if current authenticated user has a specific role
CREATE OR REPLACE FUNCTION auth.has_role(required_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = required_role
  );
$$;

-- Check if current user is an admin or superadmin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('ADMIN', 'SUPERADMIN')
  );
$$;

-- Check if current user is a superadmin
CREATE OR REPLACE FUNCTION auth.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'SUPERADMIN'
  );
$$;

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------------------------------------------

-- Users can read their own profile, admins can read all profiles
CREATE POLICY "Profiles are viewable by owner or admins"
ON profiles FOR SELECT
USING (
  auth.uid() = id OR auth.is_admin()
);

-- Public rankings can read profiles that have not hidden their ranking
CREATE POLICY "Public ranking visible profiles"
ON profiles FOR SELECT
USING (
  hide_ranking = FALSE AND status = 'ACTIVE'
);

-- Users can update their own profile, admins can update any profile
CREATE POLICY "Profiles updatable by owner or admins"
ON profiles FOR UPDATE
USING (
  auth.uid() = id OR auth.is_admin()
)
WITH CHECK (
  auth.uid() = id OR auth.is_admin()
);

-- ------------------------------------------------------------------------------
-- 2. USER ROLES & INVITATIONS POLICIES
-- ------------------------------------------------------------------------------

CREATE POLICY "Roles viewable by user or superadmin"
ON user_roles FOR SELECT
USING (
  auth.uid() = user_id OR auth.is_superadmin()
);

CREATE POLICY "Roles modifiable exclusively by superadmin"
ON user_roles FOR ALL
USING (auth.is_superadmin())
WITH CHECK (auth.is_superadmin());

CREATE POLICY "Invitations manageable by superadmins"
ON user_invitations FOR ALL
USING (auth.is_superadmin())
WITH CHECK (auth.is_superadmin());

-- ------------------------------------------------------------------------------
-- 3. QUESTIONS & OPTIONS POLICIES
-- ------------------------------------------------------------------------------

-- All active users can read published questions
CREATE POLICY "Published questions viewable by authenticated users"
ON questions FOR SELECT
USING (
  status = 'PUBLISHED' OR auth.is_admin()
);

-- Only admins/superadmins can insert, update, or archive questions
CREATE POLICY "Questions manageable by admins"
ON questions FOR ALL
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

CREATE POLICY "Question options viewable by all authenticated users"
ON question_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM questions q
    WHERE q.id = question_options.question_id
      AND (q.status = 'PUBLISHED' OR auth.is_admin())
  )
);

CREATE POLICY "Question options manageable by admins"
ON question_options FOR ALL
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- ------------------------------------------------------------------------------
-- 4. RESOLUTIONS, NOTES, AND REPORTS
-- ------------------------------------------------------------------------------

-- Resolutions: private to user
CREATE POLICY "Resolutions viewable by owner or admin"
ON question_resolutions FOR SELECT
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Resolutions insertable by owner"
ON question_resolutions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Question Notes: private to author
CREATE POLICY "Notes isolated to user"
ON question_notes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Question Reports: user can create, admins can review all
CREATE POLICY "Reports creatable by user, viewable by admins"
ON question_reports FOR SELECT
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Reports insertable by user"
ON question_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reports manageable by admins"
ON question_reports FOR UPDATE
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- ------------------------------------------------------------------------------
-- 5. NOTEBOOKS & NOTEBOOK QUESTIONS
-- ------------------------------------------------------------------------------

CREATE POLICY "Notebooks managed by owner"
ON notebooks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Notebook questions managed by notebook owner"
ON notebook_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM notebooks n
    WHERE n.id = notebook_questions.notebook_id
      AND n.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM notebooks n
    WHERE n.id = notebook_questions.notebook_id
      AND n.user_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------------
-- 6. CADERNO INTELIGENTE DE ERROS (SPACED REPETITION)
-- ------------------------------------------------------------------------------

CREATE POLICY "Error notebook isolated to user"
ON error_notebook FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. SIMULATIONS & ANSWERS
-- ------------------------------------------------------------------------------

CREATE POLICY "Simulations managed by owner"
ON simulations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Simulation questions managed by simulation owner"
ON simulation_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM simulations s
    WHERE s.id = simulation_questions.simulation_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM simulations s
    WHERE s.id = simulation_questions.simulation_id
      AND s.user_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------------
-- 8. INGESTION PIPELINE & AUDIT LOGS (ADMIN ONLY)
-- ------------------------------------------------------------------------------

CREATE POLICY "Ingestion jobs accessible only by admins"
ON ingestion_jobs FOR ALL
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

CREATE POLICY "Ingestion drafts accessible only by admins"
ON ingestion_drafts FOR ALL
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- Audit logs: readable by superadmins, append-only system function
CREATE POLICY "Audit logs readable by superadmin"
ON audit_logs FOR SELECT
USING (auth.is_superadmin());

CREATE POLICY "Audit logs insertable by admins"
ON audit_logs FOR INSERT
WITH CHECK (auth.is_admin());
