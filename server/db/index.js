const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test the connection on startup
pool.query('SELECT NOW()')
  .then(res => {
    console.log('Database connection successful. Current DB time:', res.rows[0].now);
  })
  .catch(err => {
    console.error('Failed to connect to the database on startup:', err.message);
  });

// Handle pool errors gracefully to prevent the app from crashing
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client:', err.message);
});

module.exports = { pool };
