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


//get all exercises that we have saved in the database, then the user can
//search for exercises to add to their workout
const getAllExercises = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exercise');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// this function returns the default workouts, but has since become depricated
//because of the new function getCustomWorkouts
// DO NOT DELETE -- it is still being used in some cases
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

//the ID of the workout is sent in the URL and it
//returns a list of exercises in the workout.
//the name, description, muscle group, workout_id, and exercise_id are returned
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