import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { studentRouter } from './routes/student.js';
import { collegeRouter } from './routes/college.js';
import { industryRouter } from './routes/industry.js';
import { aiRouter } from './routes/ai.js';
import { authRouter } from './routes/auth.js';
import { intelligenceRouter } from './routes/intelligence.js';
import { roadmapRouter } from './routes/roadmap.js';

import {
    authenticateToken,
    requireRole
} from './middleware/authMiddleware.js';


const app = express();


/*
 * ============================================================
 * APPLICATION CONFIGURATION
 * ============================================================
 */

const port = Number(process.env.PORT) || 4000;


/*
 * ============================================================
 * GLOBAL MIDDLEWARE
 * ============================================================
 *
 * These middleware functions apply to the complete API.
 *
 * helmet
 * -------
 * Adds security-related HTTP headers.
 *
 * cors
 * ----
 * Allows the frontend application to communicate with the API.
 *
 * express.json
 * ------------
 * Parses JSON request bodies.
 *
 * morgan
 * ------
 * Logs incoming HTTP requests during development.
 * ============================================================
 */

app.use(
    helmet()
);

app.use(
    cors()
);

app.use(
    express.json({
        limit: '2mb'
    })
);

app.use(
    morgan('dev')
);


/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 *
 * Public endpoint.
 *
 * Used by:
 * - Docker
 * - deployment systems
 * - monitoring
 * - load balancers
 * - frontend diagnostics
 *
 * No authentication required.
 *
 * GET /api/health
 * ============================================================
 */

app.get(
    '/api/health',
    (req, res) => {

        res.status(200).json({
            ok: true,
            service: 'skillbridge-api',
            timestamp: new Date().toISOString()
        });

    }
);


/*
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 *
 * Authentication routes remain public because users must be
 * able to register and log in before receiving a JWT.
 *
 * Available endpoints:
 *
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 *
 * The /me endpoint performs authentication internally.
 * ============================================================
 */

app.use(
    '/api/auth',
    authRouter
);


/*
 * ============================================================
 * SHARED INTELLIGENCE
 * ============================================================
 *
 * SkillBridge intentionally does NOT completely isolate the
 * three major platform roles.
 *
 * Students, colleges and industry users need controlled
 * access to shared intelligence.
 *
 * Examples:
 *
 * STUDENT
 * -------
 * - college information
 * - program information
 * - curriculum intelligence
 * - workshops
 * - placement intelligence
 * - industry skill demand
 * - jobs
 * - internships
 *
 * COLLEGE
 * -------
 * - industry demand
 * - skill trends
 * - aggregated student intelligence
 * - talent intelligence
 *
 * INDUSTRY
 * --------
 * - college programs
 * - curriculum information
 * - aggregated talent intelligence
 * - skill demand
 *
 * IMPORTANT:
 *
 * Authentication alone does NOT mean that all platform data
 * is visible.
 *
 * The intelligence router is responsible for exposing only
 * safe, authorized, shared information.
 *
 * Authentication:
 *
 * JWT
 *  ↓
 * authenticateToken
 *  ↓
 * intelligenceRouter
 *  ↓
 * visibility rules
 *
 * GET /api/intelligence/skills
 * GET /api/intelligence/colleges
 * GET /api/intelligence/industry
 * GET /api/intelligence/summary
 * ============================================================
 */

app.use(
    '/api/intelligence',
    authenticateToken,
    intelligenceRouter
);


/*
 * ============================================================
 * STUDENT ROUTES
 * ============================================================
 *
 * Student-specific private operations.
 *
 * Only authenticated users with:
 *
 * role = student
 *
 * can access these endpoints.
 *
 * Examples:
 *
 * GET    /api/students/me
 * PUT    /api/students/me/profile
 * POST   /api/students/me/skills
 * DELETE /api/students/me/skills/:skillId
 * POST   /api/students/me/assessments
 *
 * College and industry users receive 403 when attempting to
 * access student-private operations.
 * ============================================================
 */

app.use(
    '/api/students',
    authenticateToken,
    requireRole('student'),
    studentRouter
);


/*
 * ============================================================
 * ADAPTIVE ROADMAP
 * ============================================================
 *
 * The roadmap is a student-owned resource.
 *
 * Only authenticated students can access the roadmap API.
 *
 * The roadmap system will eventually combine:
 *
 * 1. Student career profile
 * 2. Current skills
 * 3. Target skills
 * 4. Assessments
 * 5. Target role
 * 6. Available weekly hours
 * 7. Career deadline
 * 8. Skill prerequisites
 * 9. Industry demand
 * 10. AI recommendations
 *
 *
 * Architecture:
 *
 * Student Profile
 *       │
 *       ├── Skills
 *       ├── Assessments
 *       ├── Target Role
 *       ├── Weekly Hours
 *       └── Deadline
 *               │
 *               ▼
 *       Deterministic Roadmap Engine
 *               │
 *               ▼
 *       AI Recommendation Layer
 *               │
 *               ▼
 *       Versioned Roadmap
 *               │
 *               ▼
 *          React Flow UI
 *
 *
 * IMPORTANT:
 *
 * AI does NOT control authorization.
 *
 * AI may:
 *
 * - recommend
 * - explain
 * - personalize
 * - optimize
 *
 * But the API remains responsible for:
 *
 * - authentication
 * - authorization
 * - ownership
 * - validation
 * - persistence
 *
 *
 * Available roadmap endpoints will include:
 *
 * GET /api/roadmap/me
 * GET /api/roadmap/me/versions
 *
 * Future endpoints:
 *
 * POST /api/roadmap/generate
 * POST /api/roadmap/optimize
 * POST /api/roadmap/:id/activate
 * PATCH /api/roadmap/nodes/:id/progress
 *
 * ============================================================
 */

app.use(
    '/api/roadmap',
    authenticateToken,
    requireRole('student'),
    roadmapRouter
);


/*
 * ============================================================
 * COLLEGE ROUTES
 * ============================================================
 *
 * College-specific private/administrative operations.
 *
 * Only authenticated users with:
 *
 * role = college
 *
 * can access these routes.
 *
 * College users can manage their authorized institutional
 * information through this router.
 *
 * Cross-role READ access should be implemented through
 * /api/intelligence rather than bypassing authorization.
 *
 * ============================================================
 */

app.use(
    '/api/college',
    authenticateToken,
    requireRole('college'),
    collegeRouter
);


/*
 * ============================================================
 * INDUSTRY ROUTES
 * ============================================================
 *
 * Industry-specific private/administrative operations.
 *
 * Only authenticated users with:
 *
 * role = industry
 *
 * can access these routes.
 *
 * Private industry information remains protected.
 *
 * Shared market intelligence should be exposed through:
 *
 * /api/intelligence
 *
 * rather than directly exposing private industry records.
 *
 * ============================================================
 */

app.use(
    '/api/industry',
    authenticateToken,
    requireRole('industry'),
    industryRouter
);


/*
 * ============================================================
 * AI ROUTES
 * ============================================================
 *
 * AI services are available to authenticated users.
 *
 * IMPORTANT ARCHITECTURAL RULE:
 *
 * The AI layer can:
 *
 * - explain
 * - recommend
 * - personalize
 * - summarize
 * - generate
 * - optimize
 *
 * The AI layer MUST NOT determine authorization.
 *
 * Authorization is always performed by the API layer.
 *
 * Architecture:
 *
 * Request
 *   ↓
 * JWT Authentication
 *   ↓
 * API Authorization
 *   ↓
 * Data Validation
 *   ↓
 * AI Service
 *   ↓
 * Result
 *
 * ============================================================
 */

app.use(
    '/api/ai',
    authenticateToken,
    aiRouter
);


/*
 * ============================================================
 * UNKNOWN API ROUTE
 * ============================================================
 *
 * If an API request reaches this point, no route matched it.
 *
 * Return JSON instead of Express's default HTML response.
 * ============================================================
 */

app.use(
    (req, res) => {

        res.status(404).json({
            error: 'API endpoint not found',
            path: req.originalUrl,
            method: req.method
        });

    }
);


/*
 * ============================================================
 * GLOBAL ERROR HANDLER
 * ============================================================
 *
 * This must remain AFTER all routes and middleware.
 *
 * It prevents internal implementation details from being
 * exposed to API clients.
 *
 * Production clients receive:
 *
 * {
 *     "error": "Internal server error"
 * }
 *
 * while the complete error is logged on the server.
 * ============================================================
 */

app.use(
    (err, req, res, next) => {

        console.error(
            'Unhandled error:',
            err
        );

        if (res.headersSent) {
            return next(err);
        }

        res.status(500).json({
            error: 'Internal server error'
        });

    }
);


/*
 * ============================================================
 * SERVER STARTUP
 * ============================================================
 */

app.listen(
    port,
    () => {

        console.log(
            `SkillBridge API running on port ${port}`
        );

    }
);