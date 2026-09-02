import express from 'express';
import { query } from '../services/db.js';

const router = express.Router();

/*
 * ============================================================
 * ROADMAP ENGINE
 * ============================================================
 *
 * Deterministic first.
 *
 * The engine uses:
 * - student profile
 * - current skills
 * - assessments
 * - target role
 * - available hours
 * - deadline
 *
 * AI can later optimize/explain the generated roadmap.
 * AI never controls authorization.
 * ============================================================
 */


/*
 * Target-role skill blueprints.
 *
 * These are intentionally deterministic so roadmap generation
 * remains reproducible even when the AI service is unavailable.
 */
const ROLE_BLUEPRINTS = {
    'Frontend Developer': [
        {
            title: 'HTML & CSS',
            category: 'Frontend',
            estimatedHours: 20,
            prerequisites: []
        },
        {
            title: 'JavaScript',
            category: 'Frontend',
            estimatedHours: 35,
            prerequisites: ['HTML & CSS']
        },
        {
            title: 'Git & GitHub',
            category: 'Tools',
            estimatedHours: 12,
            prerequisites: []
        },
        {
            title: 'React',
            category: 'Frontend',
            estimatedHours: 40,
            prerequisites: ['JavaScript']
        },
        {
            title: 'REST APIs',
            category: 'Backend',
            estimatedHours: 20,
            prerequisites: ['JavaScript']
        },
        {
            title: 'Frontend Testing',
            category: 'Quality',
            estimatedHours: 20,
            prerequisites: ['React']
        },
        {
            title: 'Production Frontend Project',
            category: 'Project',
            estimatedHours: 35,
            prerequisites: ['React', 'REST APIs', 'Git & GitHub']
        }
    ],

    'Backend Developer': [
        {
            title: 'Programming Fundamentals',
            category: 'Programming',
            estimatedHours: 30,
            prerequisites: []
        },
        {
            title: 'JavaScript',
            category: 'Programming',
            estimatedHours: 35,
            prerequisites: ['Programming Fundamentals']
        },
        {
            title: 'Git & GitHub',
            category: 'Tools',
            estimatedHours: 12,
            prerequisites: []
        },
        {
            title: 'Node.js',
            category: 'Backend',
            estimatedHours: 30,
            prerequisites: ['JavaScript']
        },
        {
            title: 'REST APIs',
            category: 'Backend',
            estimatedHours: 20,
            prerequisites: ['Node.js']
        },
        {
            title: 'PostgreSQL',
            category: 'Database',
            estimatedHours: 30,
            prerequisites: ['REST APIs']
        },
        {
            title: 'Authentication & Security',
            category: 'Security',
            estimatedHours: 25,
            prerequisites: ['REST APIs']
        },
        {
            title: 'Backend Testing',
            category: 'Quality',
            estimatedHours: 20,
            prerequisites: ['REST APIs']
        },
        {
            title: 'Production Backend Project',
            category: 'Project',
            estimatedHours: 40,
            prerequisites: [
                'PostgreSQL',
                'Authentication & Security',
                'Backend Testing'
            ]
        }
    ],

    'Full Stack Developer': [
        {
            title: 'HTML & CSS',
            category: 'Frontend',
            estimatedHours: 20,
            prerequisites: []
        },
        {
            title: 'JavaScript',
            category: 'Programming',
            estimatedHours: 35,
            prerequisites: ['HTML & CSS']
        },
        {
            title: 'Git & GitHub',
            category: 'Tools',
            estimatedHours: 12,
            prerequisites: []
        },
        {
            title: 'React',
            category: 'Frontend',
            estimatedHours: 40,
            prerequisites: ['JavaScript']
        },
        {
            title: 'Node.js',
            category: 'Backend',
            estimatedHours: 30,
            prerequisites: ['JavaScript']
        },
        {
            title: 'REST APIs',
            category: 'Backend',
            estimatedHours: 20,
            prerequisites: ['Node.js']
        },
        {
            title: 'PostgreSQL',
            category: 'Database',
            estimatedHours: 30,
            prerequisites: ['REST APIs']
        },
        {
            title: 'Authentication & Security',
            category: 'Security',
            estimatedHours: 25,
            prerequisites: ['REST APIs']
        },
        {
            title: 'Full-Stack Testing',
            category: 'Quality',
            estimatedHours: 20,
            prerequisites: ['React', 'REST APIs']
        },
        {
            title: 'Production Full-Stack Project',
            category: 'Project',
            estimatedHours: 50,
            prerequisites: [
                'React',
                'PostgreSQL',
                'Authentication & Security',
                'Full-Stack Testing'
            ]
        }
    ]
};


/*
 * Normalize skill names so comparisons are reliable.
 */
function normalize(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}


/*
 * Find the student's level for a skill.
 */
function getSkillLevel(userSkills, title) {

    const target = normalize(title);

    const match = userSkills.find(
        skill =>
            normalize(skill.name) === target
    );

    if (!match) {
        return 0;
    }

    return Number(match.current_level) || 0;
}


/*
 * Calculate readiness from skill levels.
 *
 * Current level is expected to be a 1-5 style value.
 */
function calculateProgress(level) {

    if (level <= 0) return 0;

    return Math.min(
        100,
        Math.round((level / 5) * 100)
    );
}


/*
 * Calculate deadline feasibility.
 */
function calculateTimeline(
    totalHours,
    weeklyHours,
    deadline
) {

    const safeWeeklyHours =
        Math.max(
            1,
            Number(weeklyHours) || 10
        );

    const requiredWeeks =
        Math.ceil(
            totalHours / safeWeeklyHours
        );

    let availableWeeks = null;

    if (deadline) {

        const deadlineDate =
            new Date(deadline);

        const now =
            new Date();

        const difference =
            deadlineDate.getTime() -
            now.getTime();

        availableWeeks =
            Math.max(
                0,
                Math.ceil(
                    difference /
                    (1000 * 60 * 60 * 24 * 7)
                )
            );
    }

    return {
        weeklyHours: safeWeeklyHours,
        requiredWeeks,
        availableWeeks,
        feasible:
            availableWeeks === null ||
            requiredWeeks <= availableWeeks
    };
}


/*
 * Determine node status.
 */
function calculateStatus(
    progress,
    prerequisitesReady
) {

    if (progress >= 100) {
        return 'completed';
    }

    if (!prerequisitesReady) {
        return 'locked';
    }

    if (progress > 0) {
        return 'in-progress';
    }

    return 'available';
}


/*
 * ============================================================
 * LOAD STUDENT CONTEXT
 * ============================================================
 */

async function getStudentContext(userId) {

    const profileResult =
        await query(
            `
            SELECT
                user_id,
                degree,
                branch,
                academic_year,
                semester,
                graduation_date,
                current_situation,
                target_role,
                hours_per_week,
                target_timeline_weeks,
                deadline
            FROM student_profiles
            WHERE user_id = $1
            LIMIT 1
            `,
            [userId]
        );

    const skillsResult =
        await query(
            `
            SELECT
                s.id,
                s.name,
                s.category,
                us.current_level,
                us.target_level,
                us.confidence
            FROM user_skills us
            INNER JOIN skills s
                ON s.id = us.skill_id
            WHERE us.user_id = $1
            ORDER BY s.name
            `,
            [userId]
        );

    const assessmentsResult =
        await query(
            `
            SELECT
                id,
                name,
                score,
                max_score,
                skill_id,
                metadata,
                completed_at
            FROM assessments
            WHERE user_id = $1
            ORDER BY completed_at DESC NULLS LAST, created_at DESC
            `,
            [userId]
        );

    return {
        profile:
            profileResult.rows[0] || null,

        skills:
            skillsResult.rows,

        assessments:
            assessmentsResult.rows
    };
}


/*
 * ============================================================
 * GENERATE ROADMAP PLAN
 * ============================================================
 */

function buildRoadmapPlan(context) {

    const profile =
        context.profile || {};

    const targetRole =
        profile.target_role ||
        'Backend Developer';

    const blueprint =
        ROLE_BLUEPRINTS[targetRole] ||
        ROLE_BLUEPRINTS['Backend Developer'];

    const userSkills =
        context.skills || [];

    const nodePlans = [];

    /*
     * First determine each skill's current state.
     */
    for (const item of blueprint) {

        const level =
            getSkillLevel(
                userSkills,
                item.title
            );

        const progress =
            calculateProgress(level);

        nodePlans.push({
            ...item,
            level,
            progress
        });
    }

    /*
     * Determine prerequisite readiness.
     */
    for (const node of nodePlans) {

        const prerequisitesReady =
            node.prerequisites.every(
                prerequisite => {

                    const prerequisiteNode =
                        nodePlans.find(
                            candidate =>
                                normalize(candidate.title) ===
                                normalize(prerequisite)
                        );

                    return (
                        prerequisiteNode &&
                        prerequisiteNode.progress >= 70
                    );
                }
            );

        node.prerequisitesReady =
            prerequisitesReady;

        node.status =
            calculateStatus(
                node.progress,
                prerequisitesReady
            );
    }

    /*
     * Prioritize:
     *
     * 1. incomplete prerequisites
     * 2. available learning
     * 3. projects
     */
    for (const node of nodePlans) {

        if (node.status === 'locked') {
            node.priority = 'blocked';
        } else if (node.progress === 0) {
            node.priority = 'high';
        } else if (node.progress < 70) {
            node.priority = 'medium';
        } else if (node.progress < 100) {
            node.priority = 'low';
        } else {
            node.priority = 'complete';
        }
    }

    const totalHours =
        nodePlans.reduce(
            (sum, node) =>
                sum + Number(node.estimatedHours || 0),
            0
        );

    const timeline =
        calculateTimeline(
            totalHours,
            profile.hours_per_week,
            profile.deadline
        );

    /*
     * Career readiness:
     *
     * Completed = 100%
     * Partial skills contribute proportionally.
     */
    const readiness =
        nodePlans.length
            ? Math.round(
                nodePlans.reduce(
                    (sum, node) =>
                        sum + node.progress,
                    0
                ) / nodePlans.length
            )
            : 0;

    return {
        targetRole,
        nodes: nodePlans,
        totalHours,
        readiness,
        timeline
    };
}


/*
 * ============================================================
 * CREATE ROADMAP
 * ============================================================
 */

async function createRoadmap(
    userId,
    context,
    plan,
    source = 'system'
) {

    /*
     * Find the next version.
     */
    const versionResult =
        await query(
            `
            SELECT
                COALESCE(MAX(version), 0) + 1 AS version
            FROM roadmaps
            WHERE user_id = $1
            `,
            [userId]
        );

    const version =
        Number(versionResult.rows[0].version);


    /*
     * Archive existing active roadmap.
     */
    await query(
        `
        UPDATE roadmaps
        SET status = 'archived'
        WHERE user_id = $1
          AND status = 'active'
        `,
        [userId]
    );


    /*
     * Create new roadmap.
     *
     * We only use columns confirmed in your schema.
     */
    const roadmapResult =
        await query(
            `
            INSERT INTO roadmaps (
                user_id,
                version,
                status,
                source,
                target_role,
                ai_reasoning,
                optimization_summary
            )
            VALUES (
                $1,
                $2,
                'active',
                $3,
                $4,
                $5,
                $6
            )
            RETURNING *
            `,
            [
                userId,
                version,
                source,
                plan.targetRole,

                `Deterministic roadmap generated from target role, current skills, prerequisites, available study time and career timeline.`,

                `Career readiness is ${plan.readiness}%. Estimated learning workload is ${plan.totalHours} hours over approximately ${plan.timeline.requiredWeeks} weeks.`
            ]
        );

    const roadmap =
        roadmapResult.rows[0];


    /*
     * Map node titles to database IDs.
     */
    const nodeIds =
        new Map();


    /*
     * Insert nodes.
     *
     * We intentionally use only the columns that are already
     * confirmed from your schema:
     *
     * id
     * roadmap_id
     * skill_id
     * title
     * node_type
     * category
     *
     * Additional columns are NOT assumed.
     */
    for (const node of plan.nodes) {

        let skillId = null;

        const skillResult =
            await query(
                `
                SELECT id
                FROM skills
                WHERE LOWER(name) = LOWER($1)
                LIMIT 1
                `,
                [node.title]
            );

        if (skillResult.rows.length) {
            skillId =
                skillResult.rows[0].id;
        }

        const nodeResult =
            await query(
                `
                INSERT INTO roadmap_nodes (
                    roadmap_id,
                    skill_id,
                    title,
                    node_type,
                    category
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5
                )
                RETURNING id
                `,
                [
                    roadmap.id,
                    skillId,
                    node.title,
                    node.category === 'Project'
                        ? 'project'
                        : 'skill',
                    node.category
                ]
            );

        nodeIds.set(
            normalize(node.title),
            nodeResult.rows[0].id
        );
    }


    /*
     * Insert prerequisite edges.
     */
    for (const node of plan.nodes) {

        const targetId =
            nodeIds.get(
                normalize(node.title)
            );

        for (const prerequisite of node.prerequisites) {

            const sourceId =
                nodeIds.get(
                    normalize(prerequisite)
                );

            if (!sourceId || !targetId) {
                continue;
            }

            await query(
                `
                INSERT INTO roadmap_edges (
                    roadmap_id,
                    source_node_id,
                    target_node_id,
                    edge_type
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    'prerequisite'
                )
                `,
                [
                    roadmap.id,
                    sourceId,
                    targetId
                ]
            );
        }
    }


    return roadmap;
}


/*
 * ============================================================
 * FORMAT ROADMAP RESPONSE
 * ============================================================
 */

async function getRoadmap(
    userId,
    roadmapId
) {

    const roadmapResult =
        await query(
            `
            SELECT
                id,
                user_id,
                version,
                status,
                source,
                target_role,
                ai_reasoning,
                optimization_summary,
                created_at,
                updated_at
            FROM roadmaps
            WHERE id = $1
              AND user_id = $2
            LIMIT 1
            `,
            [
                roadmapId,
                userId
            ]
        );

    if (!roadmapResult.rows.length) {
        return null;
    }

    const roadmap =
        roadmapResult.rows[0];


    const nodesResult =
        await query(
            `
            SELECT
                rn.id,
                rn.roadmap_id,
                rn.skill_id,
                rn.title,
                rn.node_type,
                rn.category
            FROM roadmap_nodes rn
            WHERE rn.roadmap_id = $1
            ORDER BY rn.id
            `,
            [roadmap.id]
        );


    const edgesResult =
        await query(
            `
            SELECT
                id,
                roadmap_id,
                source_node_id,
                target_node_id,
                edge_type,
                created_at
            FROM roadmap_edges
            WHERE roadmap_id = $1
            ORDER BY id
            `,
            [roadmap.id]
        );


    /*
     * Convert database nodes into React Flow-compatible nodes.
     */
    const nodes =
        nodesResult.rows.map(
            (node, index) => {

                const matchingPlan =
                    null;

                return {
                    id: node.id,
                    type:
                        node.node_type === 'project'
                            ? 'project'
                            : 'skill',

                    position: {
                        x: (index % 4) * 300,
                        y: Math.floor(index / 4) * 220
                    },

                    data: {
                        id: node.id,
                        title: node.title,
                        category: node.category,
                        status: 'available',
                        progress: 0,
                        priority: 'medium'
                    }
                };
            }
        );


    /*
     * Convert database edges into React Flow edges.
     */
    const edges =
        edgesResult.rows.map(
            edge => ({
                id: edge.id,
                source: edge.source_node_id,
                target: edge.target_node_id,
                type: 'smoothstep',
                label: edge.edge_type
            })
        );


    return {
        roadmap,
        nodes,
        edges
    };
}


/*
 * ============================================================
 * GET CURRENT ROADMAP
 * ============================================================
 *
 * GET /api/roadmap/me
 * ============================================================
 */

router.get(
    '/me',
    async (req, res, next) => {

        try {

            const latestResult =
                await query(
                    `
                    SELECT id
                    FROM roadmaps
                    WHERE user_id = $1
                    ORDER BY version DESC
                    LIMIT 1
                    `,
                    [req.user.userId]
                );

            if (!latestResult.rows.length) {

                return res.json({
                    roadmap: null,
                    nodes: [],
                    edges: []
                });
            }

            const result =
                await getRoadmap(
                    req.user.userId,
                    latestResult.rows[0].id
                );

            return res.json(result);

        } catch (error) {

            next(error);

        }
    }
);


/*
 * ============================================================
 * GET ROADMAP VERSIONS
 * ============================================================
 *
 * GET /api/roadmap/me/versions
 * ============================================================
 */

router.get(
    '/me/versions',
    async (req, res, next) => {

        try {

            const result =
                await query(
                    `
                    SELECT
                        id,
                        version,
                        status,
                        source,
                        target_role,
                        ai_reasoning,
                        optimization_summary,
                        created_at,
                        updated_at
                    FROM roadmaps
                    WHERE user_id = $1
                    ORDER BY version DESC
                    `,
                    [req.user.userId]
                );

            return res.json({
                versions: result.rows
            });

        } catch (error) {

            next(error);

        }
    }
);


/*
 * ============================================================
 * GENERATE ROADMAP
 * ============================================================
 *
 * POST /api/roadmap/generate
 *
 * Creates a new version from the student's current context.
 * ============================================================
 */

router.post(
    '/generate',
    async (req, res, next) => {

        try {

            const context =
                await getStudentContext(
                    req.user.userId
                );

            const plan =
                buildRoadmapPlan(
                    context
                );

            const roadmap =
                await createRoadmap(
                    req.user.userId,
                    context,
                    plan,
                    'system'
                );

            const result =
                await getRoadmap(
                    req.user.userId,
                    roadmap.id
                );

            return res.status(201).json({
                ...result,

                analysis: {
                    careerReadiness:
                        plan.readiness,

                    totalHours:
                        plan.totalHours,

                    requiredWeeks:
                        plan.timeline.requiredWeeks,

                    availableWeeks:
                        plan.timeline.availableWeeks,

                    feasible:
                        plan.timeline.feasible,

                    targetRole:
                        plan.targetRole
                }
            });

        } catch (error) {

            next(error);

        }
    }
);


/*
 * ============================================================
 * OPTIMIZE ROADMAP
 * ============================================================
 *
 * POST /api/roadmap/optimize
 *
 * For now optimization is deterministic.
 *
 * The AI optimization layer will later enrich:
 *
 * - reasoning
 * - learning order
 * - resource recommendations
 * - personalized explanations
 *
 * without allowing the AI to bypass authorization.
 * ============================================================
 */

router.post(
    '/optimize',
    async (req, res, next) => {

        try {

            const context =
                await getStudentContext(
                    req.user.userId
                );

            const plan =
                buildRoadmapPlan(
                    context
                );

            const roadmap =
                await createRoadmap(
                    req.user.userId,
                    context,
                    plan,
                    'optimized'
                );

            const result =
                await getRoadmap(
                    req.user.userId,
                    roadmap.id
                );

            return res.status(201).json({
                ...result,

                analysis: {
                    careerReadiness:
                        plan.readiness,

                    totalHours:
                        plan.totalHours,

                    requiredWeeks:
                        plan.timeline.requiredWeeks,

                    availableWeeks:
                        plan.timeline.availableWeeks,

                    feasible:
                        plan.timeline.feasible,

                    targetRole:
                        plan.targetRole,

                    optimization:
                        'Roadmap reordered using deterministic skill prerequisites and current skill readiness.'
                }
            });

        } catch (error) {

            next(error);

        }
    }
);


export {
    router as roadmapRouter
};