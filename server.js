// service/index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
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


const getWorkoutData = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        const result = await pool.query(
            `SELECT exercise.*, workoutexercises.*
             FROM workoutexercises
             JOIN exercise ON workoutexercises.exerciseid = exercise.id
             WHERE workoutexercises.workoutid = $1`, [id]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const saveWorkout = async (req, res) => {
    const { name, description, exercises } = req.body;

    try {
        // Step 1: Insert the workout and retrieve the new workout ID
        const workoutResult = await pool.query(
            'INSERT INTO workout (name, description, ispublic) VALUES ($1, $2, $3) RETURNING id',
            [name, description, true]
        );

        const workoutId = workoutResult.rows[0].id;

        console.log(`New workout created with ID: ${workoutId}`);

        // Step 2: Insert exercises with workoutId, handling missing restTime with a default value
        const workoutExercisesPromises = exercises.map((exercise) => {
            const { sets, reps, resttime = 60, exerciseid } = exercise; // Default restTime to 60 seconds if not provided

            return pool.query(
                'INSERT INTO workoutexercises (sets, reps, resttime, exerciseid, workoutid) VALUES ($1, $2, $3, $4, $5)',
                [sets, reps, resttime, exerciseid, workoutId]
            );
        });

        await Promise.all(workoutExercisesPromises);

        res.status(201).json({ message: 'Workout created successfully', workoutId });
    } catch (error) {
        console.error('Error saving workout:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




// Define routes
app.get('/', readHelloMessage);
app.post('/login', checkUserExists);
app.get('/exercises', getAllExercises);
app.get('/workout:id', getWorkoutTemplate);
app.get('/workout:id/exerciseData', getWorkoutData);
app.post('/saveworkout', saveWorkout)

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});