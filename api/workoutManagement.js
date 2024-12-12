/**
 * This module defines functions for managing users' workouts. The users need a way to be able to save,
 * delete, and get their workouts.
 *
 * The functions defined in this module are:
 * 1)saveWorkout
 * 2)deleteWorkout
 * 3)getCustomWorkout
 */
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

/**
 * This function saves a user's workout in the database, allowing them to have the opportunity to reuse the workout
 * @async
 * @param {req.body.name} - the name of the workout
 * @param {req.body.description} - the description of the workout
 * @param {req.body.exercises} - the list of exercises that are being saved
 * @param {req.body.userId} - the user ID of the user who created the workout
 * @param {req.body.isPublic} - optional: defines if the workout is public to other users who may want to
 * use the same workout(this feature is not yet implemented in the client, default is false)
 *
 * @returns {Promise<void>} - responds with a message saying the workout has been created, or an error
 *
 * @example - the payload for the corresponding HTTP POST command:
 * '{
 *   "name": "Full Body Workout",
 *   "description": "A complete workout for all muscle groups.",
 *   "exercises": [
 *       { "exercise_id": 1, "performanceData": { "sets": [ { "set": 1, "reps": 10, "weight": 50 } ] } },
 *       { "exercise_id": 2, "performanceData": { "sets": [ { "set": 1, "reps": 12, "weight": 40 } ] } }
 *   ],
 *   "userId": 48,
 *   "isPublic": true
 *}'
 *
 */
const saveWorkout = async (req, res) => {
    const { name, description, exercises, userId, isPublic } = req.body;

    // Validate required fields
    if (!name || !description || !exercises || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Determine the value for is_public
        const isPublicValue = typeof isPublic === 'boolean' ? isPublic : false; // Default to false if not provided

        // Insert workout and get new workout ID
        const workoutResult = await pool.query(
            'INSERT INTO workout (name, description, is_public, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, description, isPublicValue, userId]
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

/**
 *
 * Deletes the corresponding workout, must delete foreign keys in userworkoutperformance, workoutexercises, and finally
 * the workout table. This function should be redesigned if we have time so that the SQL query can be changed to an atomic transaction.
 * @async
 * @param {req.body.workoutId} - the id of the workout being deleted
 * @param {req.body.userId} - the id of the user who created the workout
 *
 * @returns {Promise<void>} - responds with a message saying the workout has been deleted, or an error
 *
 * @example -- Here is the payload to the corresponding HTTP DELETE command:
 * '{
 *   "workoutId": 123,
 *   "userId": 456
 *}'
 *
 */
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


/**
 * get all custom workouts that the user created, so that they can be displayed in the client
 *
 * @param {id} - the ID of the user who created the workouts
 *
 * @returns {Promise<void>} - responds with all workouts and their data, or an error
 *
 * @example - there is no payload for the corresponding HTTP GET command, since the ID is passed via the URL
 */
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
             WHERE w.user_id = $1
             ORDER BY w.id ASC`,
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
             WHERE uwp.user_id = $1 AND uwp.workout_id = ANY($2::int[])
             ORDER BY uwp.workout_id ASC`,
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