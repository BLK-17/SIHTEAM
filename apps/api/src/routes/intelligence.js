import express from 'express';

import { query } from '../services/db.js';

const router = express.Router();


/*
 * =========================================================
 * SHARED INTELLIGENCE
 *
 * This router is intentionally protected only by
 * authentication at server.js level.
 *
 * Every authenticated role may READ relevant shared
 * information.
 *
 * No endpoint in this router modifies another role's data.
 * =========================================================
 */


/*
 * =========================================================
 * GET SKILL CATALOG
 * =========================================================
 *
 * Student / College / Industry
 * ----------------------------
 * All authenticated users may view the common skill
 * catalogue.
 */

router.get('/skills', async (req, res) => {
    try {
        const result = await query(
            `
            SELECT
                id,
                name,
                category,
                description
            FROM skills
            ORDER BY
                category NULLS LAST,
                name
            `
        );

        return res.json({
            skills: result.rows
        });

    } catch (error) {
        console.error(
            'Get shared skills error:',
            error
        );

        return res.status(500).json({
            error: 'Unable to retrieve skill intelligence'
        });
    }
});


/*
 * =========================================================
 * GET COLLEGE DIRECTORY
 * =========================================================
 *
 * Other roles can discover colleges.
 *
 * IMPORTANT:
 * We intentionally DO NOT expose:
 *
 * - faculty private information
 * - passwords
 * - emails
 * - internal administration data
 * - private student information
 *
 * Only institution-level public information belongs here.
 */

router.get('/colleges', async (req, res) => {
    try {
        const result = await query(
            `
            SELECT
                u.id,
                u.name
            FROM users u

            INNER JOIN college_profiles cp
                ON cp.user_id = u.id

            WHERE u.role = 'college'

            ORDER BY u.name
            `
        );

        return res.json({
            colleges: result.rows.map((college) => ({
                id: college.id,
                name: college.name
            }))
        });

    } catch (error) {
        console.error(
            'Get college intelligence error:',
            error
        );

        return res.status(500).json({
            error: 'Unable to retrieve college information'
        });
    }
});


/*
 * =========================================================
 * GET INDUSTRY DIRECTORY
 * =========================================================
 *
 * Other roles can discover industry organizations.
 *
 * Private employee/company information is NOT exposed.
 */

router.get('/industry', async (req, res) => {
    try {
        const result = await query(
            `
            SELECT
                u.id,
                u.name
            FROM users u

            INNER JOIN industry_profiles ip
                ON ip.user_id = u.id

            WHERE u.role = 'industry'

            ORDER BY u.name
            `
        );

        return res.json({
            industries: result.rows.map((industry) => ({
                id: industry.id,
                name: industry.name
            }))
        });

    } catch (error) {
        console.error(
            'Get industry intelligence error:',
            error
        );

        return res.status(500).json({
            error: 'Unable to retrieve industry information'
        });
    }
});


/*
 * =========================================================
 * GET SHARED PLATFORM SUMMARY
 * =========================================================
 *
 * This gives every authenticated role a SAFE high-level
 * view of the SkillBridge ecosystem.
 *
 * It does NOT expose private records.
 */

router.get('/summary', async (req, res) => {
    try {
        const result = await query(
            `
            SELECT
                COUNT(*) FILTER (
                    WHERE role = 'student'
                ) AS students,

                COUNT(*) FILTER (
                    WHERE role = 'college'
                ) AS colleges,

                COUNT(*) FILTER (
                    WHERE role = 'industry'
                ) AS industries

            FROM users
            `
        );

        const summary = result.rows[0];

        return res.json({
            students: Number(summary.students || 0),
            colleges: Number(summary.colleges || 0),
            industries: Number(summary.industries || 0)
        });

    } catch (error) {
        console.error(
            'Get platform intelligence summary error:',
            error
        );

        return res.status(500).json({
            error: 'Unable to retrieve platform intelligence'
        });
    }
});


export { router as intelligenceRouter };