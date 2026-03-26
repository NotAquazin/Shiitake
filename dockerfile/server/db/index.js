const { Pool } = require('pg');

console.log("DB URL inside db/index.js:", process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Successfully connected to the database at:', res.rows[0].now);
  }
});
module.exports = {
  query: (text, params) => pool.query(text, params),
};
