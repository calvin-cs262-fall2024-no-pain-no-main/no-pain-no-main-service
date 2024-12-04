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
        const result = await pool.query("SELECT * FROM workout WHERE is_public = true AND id = $1", [id]);

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
             JOIN exercise ON workoutexercises.exercise_id = exercise.id
             WHERE workoutexercises.workout_id = $1`, [id]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getCustomWorkouts = async (req, res) => {
    const userId = req.params.id; // Extract id from the URL parameter

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Step 1: Get all workouts for the user
        const workoutsResult = await pool.query(
            `SELECT w.id, w.name, w.description, w.is_public
             FROM workout w
             WHERE w.user_id = $1`,
            [userId]
        );

        const workouts = workoutsResult.rows;

        if (workouts.length === 0) {
            return res.status(404).json({ message: 'No workouts found for the user' });
        }

        // Step 2: Get performance data for each workout
        const workoutIds = workouts.map(workout => workout.id);
        const performanceResult = await pool.query(
            `SELECT uwp.workout_id, uwp.exercise_id, uwp.performance_data
             FROM UserWorkoutPerformance uwp
             WHERE uwp.user_id = $1 AND uwp.workout_id = ANY($2::int[])`,
            [userId, workoutIds]
        );

        const performanceData = performanceResult.rows;

        // Step 3: Attach performance data to each workout
        const workoutsWithPerformance = workouts.map(workout => {
            const performance = performanceData.filter(
                pd => pd.workout_id === workout.id
            );
            return {
                ...workout,
                exercises: performance.map(pd => ({
                    exercise_id: pd.exercise_id,
                    performance_data: pd.performance_data
                }))
            };
        });

        res.status(200).json(workoutsWithPerformance);
    } catch (error) {
        console.error('Error fetching user workouts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const saveWorkout = async (req, res) => {
    const { name, description, exercises, userId } = req.body;
    if (!name || !description || !exercises || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Insert workout and get new workout ID
        const workoutResult = await pool.query(
            'INSERT INTO workout (name, description, is_public, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, description, true, userId]
        );
        const workoutId = workoutResult.rows[0].id;

        console.log(`New workout created with ID: ${workoutId}`);

        // Insert into WorkoutExercises
        const workoutExercisesPromises = exercises.map(({ exercise_id }) => {
            return pool.query(
                'INSERT INTO WorkoutExercises (exercise_id, workout_id) VALUES ($1, $2)',
                [exercise_id, workoutId]
            );
        });

        // Insert into UserWorkoutPerformance
        const userWorkoutPerformancePromises = exercises.map(({ exercise_id, performanceData }) => {
            return pool.query(
                'INSERT INTO UserWorkoutPerformance (user_id, exercise_id, workout_id, performance_data) VALUES ($1, $2, $3, $4)',
                [userId, exercise_id, workoutId, JSON.stringify(performanceData)]
            );
        });

        // Await all promises
        await Promise.all([...workoutExercisesPromises, ...userWorkoutPerformancePromises]);

        res.status(201).json({ message: 'Workout created successfully', workoutId });
    } catch (error) {
        console.error('Error saving workout:', error);

        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({ error: 'Invalid user or exercise reference' });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteWorkout = async (req, res) => {
    const { workoutId, userId } = req.body; // Expect workoutId and userId in the request body

    if (!workoutId || !userId) {
        return res.status(400).json({ error: 'Missing required fields: workoutId or userId' });
    }

    try {
        // Step 1: Check if the workout exists and belongs to the user
        const workoutCheckResult = await pool.query(
            'SELECT id FROM workout WHERE id = $1 AND user_id = $2',
            [workoutId, userId]
        );

        if (workoutCheckResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workout not found or does not belong to this user' });
        }

        // Step 2: Delete associated records in UserWorkoutPerformance table
        await pool.query(
            'DELETE FROM UserWorkoutPerformance WHERE workout_id = $1 AND user_id = $2',
            [workoutId, userId]
        );

        console.log(`Deleted UserWorkoutPerformance entries for workout ID: ${workoutId}`);

        // Step 3: Delete associated records in WorkoutExercises table
        await pool.query(
            'DELETE FROM workoutexercises WHERE workout_id = $1',
            [workoutId]
        );

        console.log(`Deleted WorkoutExercises entries for workout ID: ${workoutId}`);

        // Step 4: Delete the workout from the workout table
        await pool.query(
            'DELETE FROM workout WHERE id = $1 AND user_id = $2',
            [workoutId, userId]
        );

        console.log(`Deleted workout with ID: ${workoutId}`);

        res.status(200).json({ message: 'Workout and associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateWorkout = async (req, res) => {
    const { userId, workoutId, name, description, setsToAdd, setsToRemove, performanceDataToUpdate } = req.body;

    if (!userId || !workoutId) {
        return res.status(400).json({ error: 'Missing required fields: userId or workoutId' });
    }

    try {
        // Step 1: Verify if the workout exists and belongs to the user
        const workoutCheckResult = await pool.query(
            'SELECT id, user_id FROM Workout WHERE id = $1 AND user_id = $2',
            [workoutId, userId]
        );

        if (workoutCheckResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workout not found or does not belong to this user' });
        }

        // Step 2: Update workout name and description if provided
        if (name || description) {
            await pool.query(
                'UPDATE Workout SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3',
                [name, description, workoutId]
            );
        }

        // Step 3: Add new sets to the UserWorkoutPerformance performance_data if setsToAdd is provided
        if (setsToAdd && Array.isArray(setsToAdd)) {
            for (const { exercise_id, set, performanceData } of setsToAdd) {
                await pool.query(
                    `UPDATE UserWorkoutPerformance
                     SET performance_data = performance_data || $1::jsonb
                     WHERE user_id = $2 AND workout_id = $3 AND exercise_id = $4`,
                    [JSON.stringify({ [set]: performanceData }), userId, workoutId, exercise_id]
                );
            }
        }

        // Step 4: Remove sets from UserWorkoutPerformance performance_data if setsToRemove is provided
        if (setsToRemove && Array.isArray(setsToRemove)) {
            for (const { exercise_id, set } of setsToRemove) {
                await pool.query(
                    `UPDATE UserWorkoutPerformance
                     SET performance_data = performance_data - $1
                     WHERE user_id = $2 AND workout_id = $3 AND exercise_id = $4`,
                    [set, userId, workoutId, exercise_id]
                );
            }
        }

        // Step 5: Update specific set data in performance_data if performanceDataToUpdate is provided
        if (performanceDataToUpdate && Array.isArray(performanceDataToUpdate)) {
            for (const { exercise_id, set, performanceData } of performanceDataToUpdate) {
                await pool.query(
                    `UPDATE UserWorkoutPerformance
                     SET performance_data = jsonb_set(performance_data, '{${set}}', $1::jsonb)
                     WHERE user_id = $2 AND workout_id = $3 AND exercise_id = $4`,
                    [JSON.stringify(performanceData), userId, workoutId, exercise_id]
                );
            }
        }

        res.status(200).json({ message: 'Workout updated successfully' });
    } catch (error) {
        console.error('Error updating workout:', error);

        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({ error: 'Invalid user or exercise reference' });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};


app.get('/', readHelloMessage);
app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.get('/exercises', getAllExercises);

app.get('/templateworkout:id', getWorkoutTemplate);
app.get('/workout:id/exerciseData', getWorkoutData);
app.get('/quizzes', getAllQuizzes);

app.post('/saveworkout', saveWorkout);
app.put('/updateworkout', updateWorkout);
app.get('/customworkout:id', getCustomWorkouts); //ID is the user's id

app.delete('/deleteworkout', deleteWorkout);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
