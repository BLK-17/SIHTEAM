import express from 'express';

import { query } from '../services/db.js';

const router = express.Router();


// =========================================================
// GET CURRENT STUDENT
// =========================================================

router.get('/me', async (req, res) => {
    try {
        const userId = req.user.userId;

        const profileResult = await query(
            `
            SELECT
                u.id,
                u.name,
                u.email,
                u.role,

                sp.degree,
                sp.branch,
                sp.academic_year,
                sp.semester,
                sp.graduation_date,
                sp.current_situation,
                sp.target_role,
                sp.hours_per_week,
                sp.target_timeline_weeks,
                sp.deadline

            FROM users u

            LEFT JOIN student_profiles sp
                ON sp.user_id = u.id

            WHERE u.id = $1
              AND u.role = 'student'

            LIMIT 1
            `,
            [userId]
        );

        if (profileResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Student profile not found'
            });
        }

        const student = profileResult.rows[0];

        const skillsResult = await query(
            `
            SELECT
                s.id,
                s.name,
                s.category,
                s.description,
                us.current_level,
                us.target_level,
                us.confidence,
                us.source

            FROM user_skills us

            INNER JOIN skills s
                ON s.id = us.skill_id

            WHERE us.user_id = $1

            ORDER BY s.category NULLS LAST, s.name
            `,
            [userId]
        );

        const assessmentsResult = await query(
            `
            SELECT
                id,
                name,
                score,
                max_score,
                metadata,
                completed_at

            FROM assessments

            WHERE user_id = $1

            ORDER BY created_at DESC
            `,
            [userId]
        );

        return res.json({
            id: student.id,
            name: student.name,
            email: student.email,
            role: student.role,

            degree: student.degree,
            branch: student.branch,

            academicYear: student.academic_year,
            semester: student.semester,

            graduationDate: student.graduation_date,

            currentSituation: student.current_situation,

            targetRole:
                student.target_role || 'Backend Developer',

            hoursPerWeek: student.hours_per_week,

            targetTimelineWeeks:
                student.target_timeline_weeks,

            deadline: student.deadline,

            skills: skillsResult.rows.map((skill) => ({
                id: skill.id,
                name: skill.name,
                category: skill.category,
                description: skill.description,
                have: Number(skill.current_level),
                need: Number(skill.target_level),
                confidence: skill.confidence
                    ? Number(skill.confidence)
                    : null,
                source: skill.source
            })),

            assessments: assessmentsResult.rows.map(
                (assessment) => ({
                    id: assessment.id,
                    name: assessment.name,
                    score: Number(assessment.score),
                    maxScore: Number(
                        assessment.max_score
                    ),
                    type: assessment.metadata?.type || null,
                    completedAt:
                        assessment.completed_at,
                    metadata: assessment.metadata
                })
            )
        });

    } catch (error) {
        console.error(
            'Get student profile error:',
            error
        );

        return res.status(500).json({
            error: 'Unable to retrieve student profile'
        });
    }
});


// =========================================================
// UPDATE CAREER CONTEXT
// =========================================================

router.put('/me/profile', async (req, res) => {
    try {
        const userId = req.user.userId;

        const {
            degree,
            branch,
            academicYear,
            semester,
            graduationDate,
            currentSituation,
            targetRole,
            hoursPerWeek,
            targetTimelineWeeks,
            deadline
        } = req.body;

        const result = await query(
            `
            INSERT INTO student_profiles (
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
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
            )

            ON CONFLICT (user_id)
            DO UPDATE SET
                degree = EXCLUDED.degree,
                branch = EXCLUDED.branch,
                academic_year = EXCLUDED.academic_year,
                semester = EXCLUDED.semester,
                graduation_date = EXCLUDED.graduation_date,
                current_situation = EXCLUDED.current_situation,
                target_role = EXCLUDED.target_role,
                hours_per_week = EXCLUDED.hours_per_week,
                target_timeline_weeks =
                    EXCLUDED.target_timeline_weeks,
                deadline = EXCLUDED.deadline,
                updated_at = NOW()

            RETURNING *
            `,
            [
                userId,
                degree || null,
                branch || null,
                academicYear || null,
                semester || null,
                graduationDate || null,
                currentSituation || null,
                targetRole || null,
                hoursPerWeek || null,
                targetTimelineWeeks || null,
                deadline || null
            ]
        );

        const profile = result.rows[0];

        return res.json({
            message: 'Career profile updated',

            profile: {
                degree: profile.degree,
                branch: profile.branch,
                academicYear:
                    profile.academic_year,
                semester: profile.semester,
                graduationDate:
                    profile.graduation_date,
                currentSituation:
                    profile.current_situation,
                targetRole: profile.target_role,
                hoursPerWeek:
                    profile.hours_per_week,
                targetTimelineWeeks:
                    profile.target_timeline_weeks,
                deadline: profile.deadline
            }
        });

    } catch (error) {
        console.error(
            'Update student profile error:',
            error
        );

        return res.status(500).json({
            error: 'Unable to update career profile'
        });
    }
});


// =========================================================
// ADD / UPDATE SKILL
// =========================================================

router.post('/me/skills', async (req, res) => {
    try {
        const userId = req.user.userId;

        const {
            name,
            category,
            description,
            have = 0,
            need = 80,
            confidence,
            source = 'self_reported'
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                error: 'Skill name is required'
            });
        }

        const currentLevel = Number(have);
        const targetLevel = Number(need);

        if (
            !Number.isInteger(currentLevel) ||
            currentLevel < 0 ||
            currentLevel > 100
        ) {
            return res.status(400).json({
                error:
                    'Current skill level must be between 0 and 100'
            });
        }

        if (
            !Number.isInteger(targetLevel) ||
            targetLevel < 0 ||
            targetLevel > 100
        ) {
            return res.status(400).json({
                error:
                    'Target skill level must be between 0 and 100'
            });
        }

        let normalizedConfidence = null;

        if (
            confidence !== undefined &&
            confidence !== null &&
            confidence !== ''
        ) {
            normalizedConfidence = Number(confidence);

            if (
                !Number.isFinite(normalizedConfidence) ||
                normalizedConfidence < 0 ||
                normalizedConfidence > 100
            ) {
                return res.status(400).json({
                    error:
                        'Confidence must be between 0 and 100'
                });
            }
        }

        const skillResult = await query(
            `
            INSERT INTO skills (
                name,
                category,
                description
            )
            VALUES ($1,$2,$3)

            ON CONFLICT (name)
            DO UPDATE SET
                category = COALESCE(
                    EXCLUDED.category,
                    skills.category
                ),
                description = COALESCE(
                    EXCLUDED.description,
                    skills.description
                )

            RETURNING id, name, category, description
            `,
            [
                name.trim(),
                category || null,
                description || null
            ]
        );

        const skill = skillResult.rows[0];

        const userSkillResult = await query(
            `
            INSERT INTO user_skills (
                user_id,
                skill_id,
                current_level,
                target_level,
                confidence,
                source
            )
            VALUES ($1,$2,$3,$4,$5,$6)

            ON CONFLICT (user_id, skill_id)
            DO UPDATE SET
                current_level =
                    EXCLUDED.current_level,
                target_level =
                    EXCLUDED.target_level,
                confidence =
                    EXCLUDED.confidence,
                source =
                    EXCLUDED.source,
                updated_at = NOW()

            RETURNING *
            `,
            [
                userId,
                skill.id,
                currentLevel,
                targetLevel,
                normalizedConfidence,
                source
            ]
        );

        const userSkill = userSkillResult.rows[0];

        return res.status(201).json({
            message: 'Skill saved',

            skill: {
                id: skill.id,
                name: skill.name,
                category: skill.category,
                description: skill.description,
                have: Number(
                    userSkill.current_level
                ),
                need: Number(
                    userSkill.target_level
                ),
                confidence:
                    userSkill.confidence
                        ? Number(userSkill.confidence)
                        : null,
                source: userSkill.source
            }
        });

    } catch (error) {
        console.error(
            'Save student skill error:',
            error
        );

        return res.status(500).json({
            error: 'Unable to save skill'
        });
    }
});


// =========================================================
// DELETE SKILL
// =========================================================

router.delete(
    '/me/skills/:skillId',
    async (req, res) => {
        try {
            const userId = req.user.userId;
            const { skillId } = req.params;

            const result = await query(
                `
                DELETE FROM user_skills
                WHERE user_id = $1
                  AND skill_id = $2
                RETURNING id
                `,
                [userId, skillId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Skill not found'
                });
            }

            return res.json({
                message: 'Skill removed'
            });

        } catch (error) {
            console.error(
                'Delete student skill error:',
                error
            );

            return res.status(500).json({
                error:
                    'Unable to remove skill'
            });
        }
    }
);


// =========================================================
// ADD ASSESSMENT
// =========================================================

router.post(
    '/me/assessments',
    async (req, res) => {
        try {
            const userId = req.user.userId;

            const {
                name,
                score,
                maxScore = 100,
                assessmentType,
                metadata = {}
            } = req.body;

            if (!name?.trim()) {
                return res.status(400).json({
                    error:
                        'Assessment name is required'
                });
            }

            const numericScore = Number(score);
            const numericMaxScore =
                Number(maxScore);

            if (
                Number.isNaN(numericScore) ||
                Number.isNaN(numericMaxScore) ||
                numericScore < 0 ||
                numericMaxScore <= 0 ||
                numericScore > numericMaxScore
            ) {
                return res.status(400).json({
                    error:
                        'Invalid assessment score'
                });
            }

            const safeMetadata =
                metadata &&
                typeof metadata === 'object' &&
                !Array.isArray(metadata)
                    ? {
                        ...metadata,
                        ...(assessmentType
                            ? {
                                type:
                                    assessmentType
                            }
                            : {})
                    }
                    : {
                        ...(assessmentType
                            ? {
                                type:
                                    assessmentType
                            }
                            : {})
                    };

            const result = await query(
                `
                INSERT INTO assessments (
                    user_id,
                    name,
                    score,
                    max_score,
                    metadata,
                    completed_at
                )
                VALUES (
                    $1,$2,$3,$4,$5,NOW()
                )

                RETURNING *
                `,
                [
                    userId,
                    name.trim(),
                    numericScore,
                    numericMaxScore,
                    safeMetadata
                ]
            );

            const assessment =
                result.rows[0];

            return res.status(201).json({
                message:
                    'Assessment saved',

                assessment: {
                    id: assessment.id,
                    name: assessment.name,
                    score:
                        Number(
                            assessment.score
                        ),
                    maxScore:
                        Number(
                            assessment.max_score
                        ),
                    type:
                        assessment.metadata
                            ?.type || null,
                    completedAt:
                        assessment.completed_at,
                    metadata:
                        assessment.metadata
                }
            });

        } catch (error) {
            console.error(
                'Save assessment error:',
                error
            );

            return res.status(500).json({
                error:
                    'Unable to save assessment'
            });
        }
    }
);


export { router as studentRouter };