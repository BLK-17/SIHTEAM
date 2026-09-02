import { useEffect, useState } from 'react';
import {
    useLocation,
    useNavigate
} from 'react-router-dom';

import {
    getCurrentUser,
    getToken,
    login
} from '../lib/api';


function getRolePath(role) {
    switch (role) {
        case 'student':
            return '/student';

        case 'college':
            return '/college';

        case 'industry':
            return '/industry';

        default:
            return '/login';
    }
}


export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [error, setError] = useState('');


    /*
     * --------------------------------------------------
     * CHECK EXISTING SESSION
     * --------------------------------------------------
     *
     * If the user is already authenticated, send them
     * directly to their own role dashboard.
     *
     * If there is no session, stay on /login.
     */

    useEffect(() => {
        const token = getToken();
        const user = getCurrentUser();

        if (token && user?.role) {
            navigate(
                getRolePath(user.role),
                { replace: true }
            );

            return;
        }

        setCheckingSession(false);
    }, [navigate]);


    /*
     * --------------------------------------------------
     * LOGIN
     * --------------------------------------------------
     */

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) {
            return;
        }

        setError('');

        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError('Please enter your email.');
            return;
        }

        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setLoading(true);

        try {
            const data = await login({
                email: normalizedEmail,
                password
            });

            console.log(
                'Login successful:',
                data
            );

            if (!data?.user?.role) {
                throw new Error(
                    'Login succeeded but no user role was returned.'
                );
            }

            /*
             * If the user originally tried to access
             * a protected page, return there.
             *
             * Otherwise use their role dashboard.
             */

            const previousPath =
                location.state?.from?.pathname;

            const rolePath =
                getRolePath(data.user.role);

            const destination =
                previousPath || rolePath;

            navigate(destination, {
                replace: true
            });

        } catch (err) {
            console.error(
                'Login failed:',
                err
            );

            setError(
                err?.message ||
                'Invalid email or password.'
            );

        } finally {
            setLoading(false);
        }
    }


    /*
     * --------------------------------------------------
     * SESSION CHECK SCREEN
     * --------------------------------------------------
     */

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-paper">
                <div className="text-center">

                    <div className="text-xl font-semibold text-ink">
                        SkillBridge AI
                    </div>

                    <div className="text-sm text-gray-500 mt-2">
                        Checking your session...
                    </div>

                </div>
            </div>
        );
    }


    /*
     * --------------------------------------------------
     * LOGIN UI
     * --------------------------------------------------
     */

    return (
        <div className="min-h-screen flex items-center justify-center bg-paper px-4">

            <div className="w-full max-w-md">

                {/* Brand */}

                <div className="text-center mb-6">

                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg mb-4">
                        SB
                    </div>

                    <h1 className="text-3xl font-bold text-ink">
                        SkillBridge AI
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Intelligent career growth,
                        powered by your skills.
                    </p>

                </div>


                {/* Login Card */}

                <div className="w-full bg-white rounded-2xl shadow-lg p-8">

                    <h2 className="text-2xl font-bold text-ink mb-2">
                        Welcome back
                    </h2>

                    <p className="text-gray-500 mb-6">
                        Login to your SkillBridge account
                    </p>


                    {/* Error */}

                    {error && (
                        <div
                            role="alert"
                            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm"
                        >
                            {error}
                        </div>
                    )}


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >

                        {/* Email */}

                        <div>

                            <label
                                htmlFor="email"
                                className="block text-sm font-medium mb-1"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                                placeholder="student@test.com"
                                autoComplete="email"
                                disabled={loading}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:bg-gray-100"
                            />

                        </div>


                        {/* Password */}

                        <div>

                            <label
                                htmlFor="password"
                                className="block text-sm font-medium mb-1"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Password123"
                                autoComplete="current-password"
                                disabled={loading}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:bg-gray-100"
                            />

                        </div>


                        {/* Login Button */}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal text-white rounded-lg py-3 font-medium transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? 'Logging in...'
                                : 'Login'}
                        </button>

                    </form>

                </div>


                {/* Footer */}

                <p className="text-center text-xs text-gray-400 mt-6">
                    SkillBridge AI · Secure role-based access
                </p>

            </div>

        </div>
    );
}