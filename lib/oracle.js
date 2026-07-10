import oracledb from 'oracledb';

let cached = global.oracledbPool;

if (!cached) {
    cached = global.oracledbPool = { pool: null, promise: null };
}

async function getPool() {
    if (cached.pool) {
        return cached.pool;
    }
    if (!cached.promise) {
        cached.promise = oracledb.createPool({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECTION_STRING,
            poolMin: 1,
            poolMax: 10,
            poolIncrement: 1
        }).then((pool) => {
            return pool;
        });
    }
    cached.pool = await cached.promise;
    return cached.pool;
}

export async function executeOracleQuery(query, binds = [], options = {}) {
    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();
        const result = await connection.execute(query, binds, { 
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            autoCommit: true,
            ...options 
        });
        return result.rows;
    } catch (err) {
        console.error('Oracle DB Error:', err);
        throw err;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
}