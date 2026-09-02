import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { query } from '../services/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const ALLOWED_ROLES = new Set([
    'student',
    'college',
    'industry'
]);

function createToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        JWT_SECRET,
        {
            expiresIn: '2h'
        }
    );
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}


// =========================================================
// REGISTER
// =========================================================

router.post('/register', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                error: 'Name is required'
            });
        }

        if (!email?.trim()) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({
                error: 'Password must contain at least 8 characters'
            });
        }

        if (!ALLOWED_ROLES.has(role)) {
            return res.status(400).json({
                error: 'Invalid role'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = name.trim();

        const existingUser = await query(
            `
            SELECT id
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'An account with this email already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await query(
            `
            INSERT INTO users (
                name,
                email,
                password_hash,
                role
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role
            `,
            [
                normalizedName,
                normalizedEmail,
                passwordHash,
                role
            ]
        );

        const user = result.rows[0];

        // Create the role-specific profile.
        if (role === 'student') {
            await query(
                `
                INSERT INTO student_profiles (
                    user_id,
                    target_role
                )
                VALUES ($1, $2)
                `,
                [user.id, 'Backend Developer']
            );
        }

        if (role === 'college') {
            await query(
                `
                INSERT INTO college_profiles (
                    user_id
                )
                VALUES ($1)
                `,
                [user.id]
            );
        }

        if (role === 'industry') {
            await query(
                `
                INSERT INTO industry_profiles (
                    user_id
                )
                VALUES ($1)
                `,
                [user.id]
            );
        }

        const token = createToken(user);

        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: publicUser(user)
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'An account with this email already exists'
            });
        }

        return res.status(500).json({
            error: 'Registration failed'
        });
    }
});


// =========================================================
// LOGIN
// =========================================================

router.post('/login', async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await query(
            `
            SELECT
                id,
                name,
                email,
                password_hash,
                role
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        const passwordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordValid) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const token = createToken(user);

        return res.json({
            message: 'Login successful',
            token,
            user: publicUser(user)
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            error: 'Login failed'
        });
    }
});


// =========================================================
// CURRENT USER
// =========================================================

router.get(
    '/me',
    authenticateToken,
    async (req, res) => {
        try {
            const result = await query(
                `
                SELECT
                    id,
                    name,
                    email,
                    role
                FROM users
                WHERE id = $1
                LIMIT 1
                `,
                [req.user.userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            return res.json({
                user: publicUser(result.rows[0])
            });

        } catch (error) {
            console.error('Get current user error:', error);

            return res.status(500).json({
                error: 'Unable to retrieve current user'
            });
        }
    }
);


export { router as authRouter };