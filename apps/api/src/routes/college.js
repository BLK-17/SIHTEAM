import { Router } from 'express';
import { store } from '../services/store.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

/*
 * ============================================================
 * COLLEGE ROUTES
 * ============================================================
 *
 * server.js already verifies the JWT before this router.
 *
 * This middleware makes sure that ONLY college users
 * can access these endpoints.
 */
router.use(requireRole('college'));


/*
 * ============================================================
 * GET /api/college/me
 * ============================================================
 *
 * Returns ONLY the data belonging to the logged-in college.
 */
router.get('/me', (req, res) => {
    try {
        const college = store.getCollege(req.user);

        return res.json(college);
    } catch (error) {
        console.error('Get college profile error:', error);

        return res.status(500).json({
            error: 'Unable to load college data'
        });
    }
});


/*
 * ============================================================
 * GET /api/college/me/courses
 * ============================================================
 *
 * Returns courses available to the logged-in college.
 */
router.get('/me/courses', (req, res) => {
    try {
        const college = store.getCollege(req.user);

        return res.json({
            courses: college.courses
        });
    } catch (error) {
        console.error('Get college courses error:', error);

        return res.status(500).json({
            error: 'Unable to load college courses'
        });
    }
});


/*
 * ============================================================
 * POST /api/college/me/courses
 * ============================================================
 *
 * Adds a course to the logged-in college's data.
 *
 * Expected body:
 *
 * {
 *     "name": "Machine Learning"
 * }
 */
router.post('/me/courses', (req, res) => {
    try {
        const college = store.getCollege(req.user);

        const {
            name
        } = req.body || {};

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                error: 'Course name is required'
            });
        }

        const course = String(name).trim();

        college.courses.push(course);

        return res.status(201).json({
            courses: college.courses
        });
    } catch (error) {
        console.error('Add college course error:', error);

        return res.status(500).json({
            error: 'Unable to add college course'
        });
    }
});


/*
 * ============================================================
 * GET /api/college/me/demand
 * ============================================================
 *
 * Returns industry-demand information available to the
 * logged-in college.
 *
 * This does NOT expose:
 * - student private profiles
 * - student assessments
 * - student certifications
 * - student personal information
 * - industry private account information
 */
router.get('/me/demand', (req, res) => {
    try {
        const college = store.getCollege(req.user);

        return res.json({
            demand: college.demand
        });
    } catch (error) {
        console.error('Get college demand error:', error);

        return res.status(500).json({
            error: 'Unable to load industry demand data'
        });
    }
});


/*
 * ============================================================
 * EXPORT
 * ============================================================
 */
export {
    router as collegeRouter
};