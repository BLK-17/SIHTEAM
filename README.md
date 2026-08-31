# SkillBridge AI

SkillBridge AI is an AI-powered employability platform connecting **Student Skills → College Curriculum → Industry Demand → Verified Talent → Placement Feedback**.

## Implemented architecture

- **Frontend:** React + Vite + Tailwind CSS + Chart.js-ready data layer
- **Backend:** Node.js + Express REST API
- **AI/ML:** Python + FastAPI + scikit-learn + NLTK + Transformers + LangChain + Qdrant integration points
- **Data:** PostgreSQL for relational data, MongoDB for flexible documents, Qdrant for vector/RAG retrieval
- **DevOps:** Docker + GitHub Actions
- **Cloud:** deploy web to Vercel, API/AI to Render/AWS, and managed PostgreSQL/MongoDB/Qdrant in production

## Product flow

1. Student creates profile and skills
2. Skill verification combines projects, assessments, certifications and GitHub evidence
3. Gap analysis compares verified skill levels with target-role requirements
4. AI generates a shortest learning roadmap and project recommendations
5. Assessments verify progress
6. Resume/ATS analyzer improves job application quality
7. Industry searches verified candidates
8. Industry demand feeds back into college curriculum decisions
9. Placement outcomes feed the continuous improvement loop

## Run locally

### Option A — UI + API

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Option B — Full infrastructure

```bash
docker compose up --build
```

Services:

- Web: `http://localhost:5173`
- API: `http://localhost:4000/api/health`
- AI: `http://localhost:8000/health`
- Qdrant: `http://localhost:6333`
- PostgreSQL: `localhost:5432`
- MongoDB: `localhost:27017`

## Main API routes

- `GET /api/health`
- `GET /api/students/demo`
- `POST /api/students/demo/skills`
- `GET /api/college/demo`
- `POST /api/college/demo/courses`
- `GET /api/industry/demo`
- `GET /api/industry/candidates?q=Docker&minScore=70`
- `POST /api/ai/ats`
- `POST /api/ai/chat`
- `POST http://localhost:8000/mentor`

## Next production integrations

1. JWT/OAuth authentication and RBAC
2. Real PostgreSQL repositories replacing in-memory demo store
3. MongoDB document storage for resumes/projects
4. Qdrant embeddings + RAG knowledge base
5. GitHub API verification
6. Job-market ingestion and normalization
7. LLM provider for richer roadmap/mentor generation
8. Assessment engine with anti-cheating controls
9. Resume PDF/DOCX parsing
10. Observability, rate limiting, audit logs and production secrets

The original prototype and finalized feature/architecture flow are the product reference for this implementation. fileciteturn0file0
