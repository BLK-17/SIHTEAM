const API =
    import.meta.env.VITE_API_URL ||
    'http://localhost:4000/api';


/*
 * ============================================================
 * TOKEN HELPERS
 * ============================================================
 */

export function getToken() {
    return localStorage.getItem('skillbridge_token');
}


export function setToken(token) {
    if (token) {
        localStorage.setItem('skillbridge_token', token);
    }
}


export function removeToken() {
    localStorage.removeItem('skillbridge_token');
}


/*
 * ============================================================
 * USER HELPERS
 * ============================================================
 */

export function getCurrentUser() {
    const user = localStorage.getItem('skillbridge_user');

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch {
        localStorage.removeItem('skillbridge_user');
        return null;
    }
}


export function setCurrentUser(user) {
    if (user) {
        localStorage.setItem(
            'skillbridge_user',
            JSON.stringify(user)
        );
    }
}


export function removeCurrentUser() {
    localStorage.removeItem('skillbridge_user');
}


/*
 * ============================================================
 * AUTH STORAGE
 * ============================================================
 */

export function saveAuth(data) {
    if (data?.token) {
        setToken(data.token);
    }

    if (data?.user) {
        setCurrentUser(data.user);
    }
}


export function clearAuth() {
    removeToken();
    removeCurrentUser();
}


/*
 * ============================================================
 * API REQUEST
 * ============================================================
 */

export async function api(path, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };


    /*
     * Add JWT automatically to protected requests.
     */
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }


    const response = await fetch(
        `${API}${path}`,
        {
            ...options,
            headers
        }
    );


    /*
     * Try to parse JSON response.
     */
    let data;

    try {
        data = await response.json();
    } catch {
        data = null;
    }


    /*
     * Handle authentication failure.
     */
    if (response.status === 401) {
        clearAuth();
    }


    /*
     * Handle API errors.
     */
    if (!response.ok) {
        const message =
            data?.error ||
            data?.message ||
            'Request failed';

        throw new Error(message);
    }


    return data;
}


/*
 * ============================================================
 * AUTH API
 * ============================================================
 */

export async function register({
    name,
    email,
    password,
    role
}) {
    const data = await api(
        '/auth/register',
        {
            method: 'POST',
            body: JSON.stringify({
                name,
                email,
                password,
                role
            })
        }
    );

    saveAuth(data);

    return data;
}


export async function login({
    email,
    password
}) {
    const data = await api(
        '/auth/login',
        {
            method: 'POST',
            body: JSON.stringify({
                email,
                password
            })
        }
    );

    saveAuth(data);

    return data;
}


export function logout() {
    clearAuth();
}


/*
 * ============================================================
 * CURRENT USER
 * ============================================================
 */

export async function getMe() {
    return api('/auth/me');
}


/*
 * ============================================================
 * API URL
 * ============================================================
 */

export { API };