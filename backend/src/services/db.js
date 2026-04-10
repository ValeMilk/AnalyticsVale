import pg from 'pg';
import config from '../config/index.js';

const pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool PostgreSQL:', err);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`Query lenta (${duration}ms):`, text.slice(0, 80));
  }
  return res;
}

export async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('PostgreSQL conectado:', res.rows[0].now);
    return true;
  } catch (err) {
    console.error('Falha ao conectar PostgreSQL:', err.message);
    return false;
  }
}

export default pool;
