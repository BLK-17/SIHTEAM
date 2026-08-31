CREATE TABLE IF NOT EXISTS users(id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL, role TEXT NOT NULL CHECK(role IN ('student','college','industry')), name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS skills(id UUID PRIMARY KEY, name TEXT UNIQUE NOT NULL, category TEXT, description TEXT);
CREATE TABLE IF NOT EXISTS user_skills(id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), skill_id UUID REFERENCES skills(id), level INT CHECK(level BETWEEN 0 AND 100), verified BOOLEAN DEFAULT FALSE, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS assessments(id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), name TEXT NOT NULL, score INT, status TEXT DEFAULT 'completed', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS courses(id UUID PRIMARY KEY, college_id UUID REFERENCES users(id), name TEXT NOT NULL, semester INT);
CREATE TABLE IF NOT EXISTS demand_signals(id UUID PRIMARY KEY, skill_id UUID REFERENCES skills(id), growth_pct NUMERIC(5,2), source TEXT, observed_at TIMESTAMPTZ DEFAULT now());
