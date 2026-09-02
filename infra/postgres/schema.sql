CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN ('student', 'college', 'industry')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users(role);

-- =========================================================
-- STUDENT PROFILES
-- =========================================================

CREATE TABLE IF NOT EXISTS student_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    degree TEXT,
    branch TEXT,
    academic_year TEXT,
    semester INTEGER,

    graduation_date DATE,

    current_situation TEXT,

    target_role TEXT,

    hours_per_week NUMERIC(5,2),

    target_timeline_weeks INTEGER,

    deadline DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_target_role
    ON student_profiles(target_role);

-- =========================================================
-- SKILLS
-- =========================================================

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,

    category TEXT,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- USER SKILLS
-- =========================================================

CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,

    current_level NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (current_level >= 0 AND current_level <= 100),

    target_level NUMERIC(5,2) NOT NULL DEFAULT 100
        CHECK (target_level >= 0 AND target_level <= 100),

    source TEXT DEFAULT 'self_reported',

    confidence NUMERIC(5,2)
        CHECK (confidence >= 0 AND confidence <= 100),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user
    ON user_skills(user_id);

CREATE INDEX IF NOT EXISTS idx_user_skills_skill
    ON user_skills(skill_id);

-- =========================================================
-- ASSESSMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name TEXT NOT NULL,

    score NUMERIC(5,2)
        CHECK (score >= 0 AND score <= 100),

    max_score NUMERIC(5,2)
        CHECK (max_score > 0),

    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,

    metadata JSONB DEFAULT '{}'::jsonb,

    completed_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_user
    ON assessments(user_id);

-- =========================================================
-- ROADMAPS
-- =========================================================

CREATE TABLE IF NOT EXISTS roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    version INTEGER NOT NULL DEFAULT 1,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (
            status IN ('draft', 'active', 'archived')
        ),

    source TEXT NOT NULL DEFAULT 'system'
        CHECK (
            source IN (
                'system',
                'ai',
                'optimized',
                'manual'
            )
        ),

    target_role TEXT,

    ai_reasoning TEXT,

    optimization_summary TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, version)
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user
    ON roadmaps(user_id);

CREATE INDEX IF NOT EXISTS idx_roadmaps_status
    ON roadmaps(status);

-- =========================================================
-- ROADMAP NODES
-- =========================================================

CREATE TABLE IF NOT EXISTS roadmap_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,

    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,

    title TEXT NOT NULL,

    node_type TEXT NOT NULL DEFAULT 'skill'
        CHECK (
            node_type IN (
                'skill',
                'assessment',
                'project',
                'milestone',
                'ai_recommendation'
            )
        ),

    category TEXT,

    status TEXT NOT NULL DEFAULT 'locked'
        CHECK (
            status IN (
                'locked',
                'available',
                'in-progress',
                'completed'
            )
        ),

    progress NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (progress >= 0 AND progress <= 100),

    priority TEXT DEFAULT 'medium'
        CHECK (
            priority IN (
                'low',
                'medium',
                'high',
                'critical'
            )
        ),

    estimated_hours NUMERIC(7,2),

    weekly_hours NUMERIC(7,2),

    reason TEXT,

    ai_recommended BOOLEAN DEFAULT FALSE,

    deadline DATE,

    position_x NUMERIC(10,2) DEFAULT 0,

    position_y NUMERIC(10,2) DEFAULT 0,

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_roadmap
    ON roadmap_nodes(roadmap_id);

CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_skill
    ON roadmap_nodes(skill_id);

-- =========================================================
-- ROADMAP EDGES
-- =========================================================

CREATE TABLE IF NOT EXISTS roadmap_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,

    source_node_id UUID NOT NULL
        REFERENCES roadmap_nodes(id) ON DELETE CASCADE,

    target_node_id UUID NOT NULL
        REFERENCES roadmap_nodes(id) ON DELETE CASCADE,

    edge_type TEXT DEFAULT 'prerequisite'
        CHECK (
            edge_type IN (
                'prerequisite',
                'recommended',
                'unlocks',
                'related'
            )
        ),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(
        roadmap_id,
        source_node_id,
        target_node_id
    )
);

CREATE INDEX IF NOT EXISTS idx_roadmap_edges_roadmap
    ON roadmap_edges(roadmap_id);

-- =========================================================
-- COLLEGE PROFILES
-- =========================================================

CREATE TABLE IF NOT EXISTS college_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    institution_name TEXT,

    institution_code TEXT,

    department TEXT,

    designation TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- INDUSTRY PROFILES
-- =========================================================

CREATE TABLE IF NOT EXISTS industry_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    company_name TEXT,

    industry TEXT,

    designation TEXT,

    company_size TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- MARKET DEMAND SIGNALS
-- =========================================================

CREATE TABLE IF NOT EXISTS demand_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,

    role TEXT,

    demand_score NUMERIC(5,2)
        CHECK (demand_score >= 0 AND demand_score <= 100),

    growth_score NUMERIC(5,2)
        CHECK (growth_score >= 0 AND growth_score <= 100),

    source TEXT,

    region TEXT,

    observed_at TIMESTAMPTZ DEFAULT NOW(),

    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_demand_signals_skill
    ON demand_signals(skill_id);

CREATE INDEX IF NOT EXISTS idx_demand_signals_role
    ON demand_signals(role);

CREATE INDEX IF NOT EXISTS idx_demand_signals_observed
    ON demand_signals(observed_at);

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at
    ON users;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS student_profiles_updated_at
    ON student_profiles;

CREATE TRIGGER student_profiles_updated_at
BEFORE UPDATE ON student_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_skills_updated_at
    ON user_skills;

CREATE TRIGGER user_skills_updated_at
BEFORE UPDATE ON user_skills
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS roadmaps_updated_at
    ON roadmaps;

CREATE TRIGGER roadmaps_updated_at
BEFORE UPDATE ON roadmaps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS roadmap_nodes_updated_at
    ON roadmap_nodes;

CREATE TRIGGER roadmap_nodes_updated_at
BEFORE UPDATE ON roadmap_nodes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS college_profiles_updated_at
    ON college_profiles;

CREATE TRIGGER college_profiles_updated_at
BEFORE UPDATE ON college_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS industry_profiles_updated_at
    ON industry_profiles;

CREATE TRIGGER industry_profiles_updated_at
BEFORE UPDATE ON industry_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();