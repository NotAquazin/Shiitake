// Using Sequelize to add models
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(
  process.env.DB_NAME || 'database123',
  process.env.DB_USER || 'user123',
  process.env.DB_PASSWORD || 'password123',
  {
    host: process.env.DB_HOST || 'db', // 'db' is the Docker service name
    dialect: 'postgres',
    logging: false // Set to console.log to see the raw SQL queries
  }
);

const express = require('express')
const pool = require('./database')
const port = 3000


const User = require('./models/userModel')(sequelize);
const CR = require('./models/crModel')(sequelize);
const Review = require('./models/reviewModel')(sequelize);

sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('✅ All models were synchronized successfully.');
  })
  .catch((error) => {
    console.error('❌ Error synchronizing the database:', error);
  });

const app = express()
app.use(express.json())

// Routes
app.get('/',async  (req,res) => {
    try {
        const data = await pool.query('SELECT * FROM schools')
        res.status(200).send(data.rows)
    } 
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

// ==========================================
// USER ROUTES
// ==========================================
app.post('/users', async (req, res) => {
    try {
        // Sequelize automatically maps req.body to your User model fields
        // (e.g., username, email, password)
        const newUser = await User.create(req.body);
        res.status(201).json({ message: 'User created successfully!', user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll(); // Replaces 'SELECT * FROM users'
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// CR (RESTROOM) ROUTES
// ==========================================
app.post('/crs', async (req, res) => {
    try {
        const newCR = await CR.create(req.body);
        res.status(201).json({ message: 'CR created successfully!', cr: newCR });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/crs', async (req, res) => {
    try {
        const crs = await CR.findAll();
        res.status(200).json(crs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// REVIEW ROUTES
// ==========================================
app.post('/reviews', async (req, res) => {
    try {
        const newReview = await Review.create(req.body);
        res.status(201).json({ message: 'Review created successfully!', review: newReview });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.findAll(); // This fetches everything in the Reviews table
        res.status(200).json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

/* // Insert command
app.post('/', async (req,res) => {
    const {name, location} = req.body
    try {
        await pool.query('INSERT INTO schools (name, address) VALUES ($1, $2)',[name,location])
        res.status(200).send({message: 'Succesfully added child'})
    } 
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
}) */

// sequelize handles it
/* // Initialize Table
app.get('/setup', async (req,res) => {
    try {
        await pool.query('CREATE TABLE schools(id SERIAL PRIMARY KEY, name VARCHAR(100), address VARCHAR(100))')
        res.status(200).send({message: 'Succesfully created table'})

    } 
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
}) */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server has started on port: ${PORT}`))