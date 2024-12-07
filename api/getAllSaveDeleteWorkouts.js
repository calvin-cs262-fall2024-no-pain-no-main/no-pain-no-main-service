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

//This function saves a workout, where a name, description, exercises, and the user id associated with creating the workout are needed.
//A row in the workout table is added.
//Rows in the workoutexercise table are added, that contain the exercises in that workout
//Rows in userworkout performance are added so the sets, reps, and weight can be saved for that particular user
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

//deletes the corresponding workout, the workout_id and user_id are necessary for this.
//must delete foreign key entries in userworkoutperformance, workout exercises, and finally the workout table
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

//get all custom workouts that the user created (this is very similar to )
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

module.exports = { saveWorkout, deleteWorkout, getCustomWorkouts };