/**
This module contains route hander functions that are required for the API endpoints that are
defined in server.js.

The functions defined in this module are for adding and deleting exercises from a workout
    1) addExerciseToWorkout
    2) deleteExerciseFromWorkout

    Both of these functions make use of database transactions, which groups multiple operations
    into one atomic command -- this is useful just in case there is an issue, otherwise there may be
    an instance were rows are properly added/removed from some tables, but not others
*/

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


/**
 * Deletes an exercise from a specific user's workout. This function removes rows
 *  from the workoutexercises and userworkoutperformance tables.
 *
 * @async
 * @param {string} req.body.user_id - the ID of the user
 * @param {string} req.body.workout_id - the ID of the workout
 * @param {string} req.body.exercise_id - the ID of the exercise
 * @returns {Promise<void>} - Responds with either a success or failure message
 *
 * @example Here is an example of the request body:
 *'{
 *  "user_id": 40,
 *   "workout_id": 226,
 *  "exercise_id": 7
 *}'
*/
const deleteExerciseFromWorkout = async (req, res) => {
    try {
        const { user_id, workout_id, exercise_id } = req.body;

        if (!user_id || !workout_id || !exercise_id) {
            return res.status(400).json({ error: "Missing required fields: user_id, workout_id, exercise_id." });
        }

        // Begin a transaction
        await pool.query('BEGIN');

        // Delete from UserWorkoutPerformance
        await pool.query(
            `DELETE FROM UserWorkoutPerformance
             WHERE user_id = $1 AND workout_id = $2 AND exercise_id = $3`,
            [user_id, workout_id, exercise_id]
        );

        // Delete from WorkoutExercises
        await pool.query(
            `DELETE FROM WorkoutExercises
             WHERE workout_id = $1 AND exercise_id = $2`,
            [workout_id, exercise_id]
        );

        // Commit the transaction
        await pool.query('COMMIT');

        // Respond with a success message
        res.status(200).json({ message: "Exercise successfully deleted from workout." });
    } catch (error) {
        // Rollback the transaction in case of error
        await pool.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Add an exercise to a workout.
 * It updates tables in to workoutexercises and userworkoutperformance.
 * performance_data is a list of objects, where each item represents a set
 *
 *  * @async
 * @param {string} req.body.user_id - the ID of the user
 * @param {string} req.body.workout_id - the ID of the workout
 * @param {string} req.body.exercise_id - the ID of the exercise
 * @param {string} req.body.performance_data - the set information
 * @returns {Promise<void>} - Responds with either a success or failure message
 *
 * @example Here is an example of the request body:
 *'{
 *   "user_id": 40,
 *  "workout_id": 226,
 *   "exercise_id": 3,
 *  "performance_data": {
 *         "sets": [
 *          {"set": 1, "reps": 10, "weight": 135}
 *      ]
 *  }
 * }'
*/
const addExerciseToWorkout = async (req, res) => {
    try {
        const { user_id, workout_id, exercise_id, performance_data } = req.body;

        if (!user_id || !workout_id || !exercise_id || !performance_data) {
            return res.status(400).json({ error: "Missing required fields: user_id, workout_id, exercise_id, performance_data." });
        }

        // Begin a transaction(a set of database operations)
        await pool.query('BEGIN');

        // Insert into WorkoutExercises
        const workoutExercisesResult = await pool.query(
            `INSERT INTO WorkoutExercises (exercise_id, workout_id)
             VALUES ($1, $2)
             RETURNING id`,
            [exercise_id, workout_id]
        );

        // Insert into UserWorkoutPerformance
        await pool.query(
            `INSERT INTO UserWorkoutPerformance (user_id, workout_id, exercise_id, performance_data)
             VALUES ($1, $2, $3, $4)`,
            [user_id, workout_id, exercise_id, performance_data]
        );

        // Commit the transaction
        await pool.query('COMMIT');

        // Respond with a success message
        res.status(200).json({
            message: "Exercise successfully added to workout.",
            workoutExerciseId: workoutExercisesResult.rows[0].id
        });
    } catch (error) {
        // Rollback the transaction in case of error
        await pool.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { deleteExerciseFromWorkout, addExerciseToWorkout };