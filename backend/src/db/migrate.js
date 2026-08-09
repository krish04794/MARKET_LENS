const fs = require('fs');
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Acpc@2025',
    multipleStatements: true,
  });
  const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
  await conn.query(sql);
  console.log('✅ Migration complete');
  await conn.end();
}

migrate().catch(console.error);
