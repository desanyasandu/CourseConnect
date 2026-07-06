import oracledb from 'oracledb';

export async function executeOracleQuery(query, binds = []) {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECTION_STRING
        });
        const result = await connection.execute(query, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
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