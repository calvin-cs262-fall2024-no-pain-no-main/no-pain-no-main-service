// service/index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(cors({ origin: '*' })); // Adjust CORS settings as needed

// Handler for root route
const readHelloMessage = (req, res) => {
    res.send('Server is running!');
};

// Handler to check if a user exists
const checkUserExists = async (req, res) => {
    const { username, password } = req.body;
    console.log("received data", { username, password });
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );
        if (result.rows.length > 0) {
            res.status(200).json({ exists: true });
        } else {
            res.status(404).json({ exists: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Handler to get all exercises
const getAllExercises = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exercise');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getWorkoutTemplate = async (req, res) => {
    try {
        // Parse the id from req.params and convert it to an integer
        const id = parseInt(req.params.id, 10);

        // Query the workout based on the id and ispublic status
        const result = await pool.query("SELECT * FROM workout WHERE ispublic = true AND id = $1", [id]);

        // Check if a workout was found and return the result
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Workout not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// const getWorkoutExercises = async (req, res) => {
//     try {
//         const result = await pool.query(`SELECT * FROM workoutexercises WHERE workoutid = 1
//             UNION ALL
//             SELECT name FROM workout
//             `);
//         res.status(200).json(result.rows);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }



// Define routes
app.get('/', readHelloMessage);
app.post('/login', checkUserExists);
app.get('/exercises', getAllExercises);
app.get('/workout:id', getWorkoutTemplate)
// app.get('/myExercises', getWorkoutExercises)

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});