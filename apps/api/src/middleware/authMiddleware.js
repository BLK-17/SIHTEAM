import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;


/*
 * ============================================================
 * AUTHENTICATE JWT
 * ============================================================
 */

function authenticateToken(req, res, next) {

    if (!JWT_SECRET) {
        return res.status(500).json({
            error: 'JWT_SECRET is not configured'
        });
    }

    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    const parts = authorization.trim().split(/\s+/);

    if (parts.length !== 2) {
        return res.status(401).json({
            error: 'Invalid authorization header'
        });
    }

    const [scheme, token] = parts;

    if (scheme.toLowerCase() !== 'bearer') {
        return res.status(401).json({
            error: 'Invalid authorization header'
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };

        next();

    } catch (error) {

        console.error(
            'JWT verification failed:',
            error.message
        );

        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
}


/*
 * ============================================================
 * ROLE AUTHORIZATION
 * ============================================================
 */

function requireRole(...allowedRoles) {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).json({
                error: 'Access denied',
                message: `This resource requires one of these roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
}


export {
    authenticateToken,
    requireRole
};