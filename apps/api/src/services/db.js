import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'skillbridge',
    user: process.env.DB_USER || 'skillbridge',
    password: process.env.DB_PASSWORD || 'skillbridge',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
});

export async function query(text, params = []) {
    return pool.query(text, params);
}

export async function getClient() {
    return pool.connect();
}

export async function closeDatabase() {
    await pool.end();
}

export default pool;