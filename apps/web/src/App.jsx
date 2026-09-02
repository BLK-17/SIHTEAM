import { useEffect, useState } from 'react';
import {
    Link,
    useLocation,
    useNavigate
} from 'react-router-dom';

import {
    getCurrentUser,
    getToken,
    login
} from '../lib/api';


function getRolePath(role) {
    if (role === 'student') {
        return '/student';
    }

    if (role === 'college') {
        return '/college';
    }

    if (role === 'industry') {
        return '/industry';
    }

    return '/';
}


export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /*
     * -----------------------------------------
     * ALREADY AUTHENTICATED
     * -----------------------------------------
     *
     * If a valid local session already exists,
     * don't show the login form again.
     */

    useEffect(() => {
        const token = getToken();
        const user = getCurrentUser();

        if (!token || !user) {
            return;
        }

        const destination =
            location.state?.from?.pathname ||
            getRolePath(user.role);

        navigate(destination, {
            replace: true
        });
    }, [navigate, location.state]);


    /*
     * -----------------------------------------
     * LOGIN
     * -----------------------------------------
     */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        setError('');

        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError('Email is required.');
            return;
        }

        if (!password) {
            setError('Password is required.');
            return;
        }

        try {
            setLoading(true);

            const result = await login({
                email: normalizedEmail,
                password
            });

            const user = result?.user;

            if (!user) {
                throw new Error(
                    'Login succeeded but user information was not returned.'
                );
            }

            const destination =
                location.state?.from?.pathname ||
                getRolePath(user.role);

            navigate(destination, {
                replace: true
            });

        } catch (requestError) {
            console.error(
                'Login error:',
                requestError
            );

            setError(
                requestError?.message ||
                    'Unable to sign in. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };


    /*
     * -----------------------------------------
     * UI
     * -----------------------------------------
     */

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">

            <div className="w-full max-w-md">

                {/* Brand */}
                <div className="text-center mb-8">

                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white font-bold text-xl mb-4">
                        SB
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900">
                        SkillBridge AI
                    </h1>

                    <p className="text-sm text-slate-500 mt-2">
                        Intelligent career growth,
                        powered by your skills.
                    </p>

                </div>


                {/* Login Card */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">

                    <div className="mb-6">

                        <h2 className="text-xl font-semibold text-slate-900">
                            Welcome back
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Sign in to continue to your
                            SkillBridge workspace.
                        </p>

                    </div>


                    {/* Error */}
                    {error && (
                        <div
                            role="alert"
                            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* Email */}
                        <div>

                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                                placeholder="you@example.com"
                                disabled={loading}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                            />

                        </div>


                        {/* Password */}
                        <div>

                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your password"
                                disabled={loading}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                            />

                        </div>


                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? 'Signing in...'
                                : 'Sign in'}
                        </button>

                    </form>


                    {/* Test account helper */}
                    <div className="mt-6 pt-5 border-t border-slate-100">

                        <p className="text-xs text-slate-500">
                            Development account
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                            student@skillbridge.test
                        </p>

                    </div>

                </div>


                {/* Registration */}
                <div className="text-center mt-6">

                    <p className="text-sm text-slate-500">
                        Don't have an account?{' '}

                        <Link
                            to="/register"
                            className="font-medium text-slate-900 hover:underline"
                        >
                            Create one
                        </Link>
                    </p>

                </div>

            </div>

        </main>
    );
}