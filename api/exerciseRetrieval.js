/**
 * This module defines functions that are used for making GET requests to the database, such as all the available
 * exercises, the default/template workouts, and the exercises associated to a specific workout
 *
 * The functions names that are defined are:
 * 1)getAllExercises
 * 2)getWorkoutTemplate
 * 3)getExercisesInAWorkout
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
 * Gets the entire list of exercises that users can choose from to add to their workout.
 * These exercises are displayed as a list on the front end interface. That way, on the front
 * end users can filter to find the exercise they are looking for.
 *
 * @async
 *
 * @returns {Promise<void>} - responds with the exercise data, or an error
 *
 * @example - there is no payload required for the HTTP GET command.
 */
const getAllExercises = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exercise');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


/**
 * This function returns the default/template workouts, but has since become depricated
 * because of the new function getCustomWorkouts
 * DO NOT DELETE(yet) -- it is still being called in the client - if there is time, we will remove this
 */
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

/**
 * returns all the exercises in a specific workout
 * @async
 *
 * @param {id} - the workout id is passed through the URL--> #FIXME if time
 *
 * @returns {Promise<void>} - responds with a list of each of the exercises with information about them
 *
 * @example - there is no payload for the HTTP GET command.
 *
 */
const getExercisesInAWorkout = async (req, res) => {
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

module.exports = { getAllExercises, getWorkoutTemplate, getExercisesInAWorkout };