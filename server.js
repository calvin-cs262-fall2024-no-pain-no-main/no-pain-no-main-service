// service/service.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

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
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if both username and password are provided
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Retrieve the user from the database by username
        const result = await pool.query(
            `SELECT * FROM users WHERE username = $1`,
            [username]
        );

        // If no user found, return an error
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];

        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // If the passwords match, return the user data (excluding password)
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// const signUpUser = async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         console.log("Username:", username);
//         console.log("Password:", password);

//         // Check if username or password is missing
//         if (!username || !password) {
//             return res.status(400).json({ error: 'Username and password are required' });
//         }

//         // Hash the password
//         const saltRounds = 10;
//         const hashedPassword = await bcrypt.hash(password, saltRounds);

//         console.log("Hashed Password:", hashedPassword);

//         // Insert the new user into the database
//         const result = await pool.query(
//             `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING users.id, username`,
//             [username, hashedPassword]
//         );

//         console.log("Inserted User:", result.rows[0]);

//         // Respond with the user info (excluding the password)
//         res.status(201).json({ user: result.rows[0] });
//     } catch (error) {
//         console.error("Error in signUpUser:", error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };

const signUpUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log("Username:", username);
        console.log("Password:", password);

        // Check if username or password is missing
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check if the username already exists
        const existingUser = await pool.query(
            `SELECT * FROM users WHERE username = $1`,
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        console.log("Hashed Password:", hashedPassword);

        // Insert the new user into the database
        const result = await pool.query(
            `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username`,
            [username, hashedPassword]
        );

        console.log("Inserted User:", result.rows[0]);

        // Respond with the user info (excluding the password)
        res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        console.error("Error in signUpUser:", error);

        // Handle unique constraint errors if added at the database level
        if (error.code === '23505') { // PostgreSQL error code for unique violation
            return res.status(400).json({ error: 'Username already exists' });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};


const getAllExercises = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exercise');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Handler to get quiz data
const getAllQuizzes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM quiz');
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

const deleteWorkout = async (req, res) => {
    const { workoutId } = req.body;

    try {
        // Step 1: Delete exercises associated with the workout
        await pool.query(
            'DELETE FROM workoutexercises WHERE workoutid = $1',
            [workoutId]
        );

        console.log(`Exercises for workout ID ${workoutId} deleted`);

        // Step 2: Delete the workout itself
        const result = await pool.query(
            'DELETE FROM workout WHERE id = $1 RETURNING id',
            [workoutId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        console.log(`Workout with ID ${workoutId} deleted`);

        res.status(200).json({ message: 'Workout deleted successfully', workoutId });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


app.get('/', readHelloMessage);
app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.get('/exercises', getAllExercises);
app.get('/workout:id', getWorkoutTemplate);
app.get('/workout:id/exerciseData', getWorkoutData);
app.get('/quizzes', getAllQuizzes);
app.post('/saveworkout', saveWorkout);
app.delete('/deleteworkout', deleteWorkout);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});