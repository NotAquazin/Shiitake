require('dotenv').config();

// Using Sequelize to add models
const { Sequelize, DataTypes } = require('sequelize');

// Enable Supabase
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see the raw SQL queries
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // This is required for Supabase connections
    }
  }
});

const express = require('express')
const port = process.env.PORT || 3000


const User = require('./models/userModel')(sequelize);
const CR = require('./models/crModel')(sequelize);
const Review = require('./models/reviewModel')(sequelize);

User.hasMany(Review);
Review.belongsTo(User);

CR.hasMany(Review);
Review.belongsTo(CR);

sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('✅ All models were synchronized successfully.');
  })
  .catch((error) => {
    console.error('❌ Error synchronizing the database:', error);
  });

const app = express()
app.use(express.json())

// CORS allows clients to make requests to the server, even if they originate from different domains
const cors = require('cors');
app.use(cors());

const authRoutes = require('./server/routes/authRoutes')(User);
app.use('/api/auth', authRoutes);

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

app.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const currentBadges = user.badges || [];
        const newBadges = Array.isArray(req.body.badges) ? req.body.badges : [];
        const updatedBadges = [...new Set([...currentBadges, ...newBadges])];

        await user.update({
            description: req.body.description,
            email: req.body.email,
            badges: updatedBadges,
        });

        return res.status(200).json({ message: 'User updated successfully!', user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

// Gets a single user by ID
app.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) res.json(user);
        else res.status(404).json({ error: "User not found" });
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

// GET all CRs
app.get('/crs', async (req, res) => {
    try {
        const crs = await CR.findAll();
        res.json(crs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET a single CR by ID
app.get('/crs/:id', async (req, res) => {
    try {
        const cr = await CR.findByPk(req.params.id);
        if (cr) res.json(cr);
        else res.status(404).json({ error: "CR not found" });
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

app.put('/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        await review.update({
            rating: req.body.rating,
            comment: req.body.comment,
            reviewTags: Array.isArray(req.body.reviewTags) ? req.body.reviewTags : review.reviewTags,
            author: req.body.author || review.author
        });

        return res.status(200).json({ message: 'Review updated successfully!', review });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

app.put('/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        await review.update({
            rating: req.body.rating,
            comment: req.body.comment,
            reviewTags: Array.isArray(req.body.reviewTags) ? req.body.reviewTags : review.reviewTags,
            author: req.body.author || review.author
        });

        return res.status(200).json({ message: 'Review updated successfully!', review });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

app.delete('/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        await review.destroy();
        return res.status(200).json({ message: 'Review deleted successfully!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
});

app.patch('/reviews/:id/vote', async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        const previousVote = req.body.previousVote || null;
        const nextVote = req.body.nextVote || null;

        let likes = Number(review.likes) || 0;
        let dislikes = Number(review.dislikes) || 0;

        if (previousVote === 'like') likes = Math.max(0, likes - 1);
        if (previousVote === 'dislike') dislikes = Math.max(0, dislikes - 1);
        if (nextVote === 'like') likes += 1;
        if (nextVote === 'dislike') dislikes += 1;

        await review.update({ likes, dislikes });

        return res.status(200).json({
            message: 'Vote updated successfully!',
            review: {
                id: review.id,
                likes: review.likes,
                dislikes: review.dislikes
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
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