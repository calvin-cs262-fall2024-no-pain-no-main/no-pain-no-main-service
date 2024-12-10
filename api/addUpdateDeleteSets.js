//3) delete exercise from a workout
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
// const bcrypt = require('bcrypt');

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

//add a set to the exercise, and update the performance_data
//requirements in payload: user_id, workout_id, and exercise_id
const addSetToExercise = async (req, res) => {
    try {
        const { user_id, exercise_id, workout_id, reps, weight } = req.body;

        if (!user_id || !exercise_id || !workout_id || (reps === undefined) || (weight === undefined)) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Query to fetch the current performance_data
        const queryFetch = `
            SELECT performance_data
            FROM UserWorkoutPerformance
            WHERE user_id = $1 AND exercise_id = $2 AND workout_id = $3
        `;
        const resultFetch = await pool.query(queryFetch, [user_id, exercise_id, workout_id]);

        if (resultFetch.rows.length === 0) {
            return res.status(404).json({ error: "Record not found." });
        }

        const performanceData = resultFetch.rows[0].performance_data || { sets: [] };

        // Add the new set
        const newSetNumber = performanceData.sets.length + 1;
        const newSet = { set: newSetNumber, reps, weight };
        performanceData.sets.push(newSet);

        // Update the database
        const queryUpdate = `
            UPDATE UserWorkoutPerformance
            SET performance_data = $1
            WHERE user_id = $2 AND exercise_id = $3 AND workout_id = $4
        `;
        await pool.query(queryUpdate, [performanceData, user_id, exercise_id, workout_id]);

        res.status(200).json({ message: "Set added successfully.", performance_data: performanceData });
    } catch (error) {
        console.error("Error adding set to exercise:", error);
        res.status(500).json({ error: "An error occurred while adding the set." });
    }
};

//delete the set from the exercise, and update set numbers (ie if sets 1, 2, and 3 exist and set 2 is deleted,
//remaining sets are labeled 1 and 2)
//requirements of payload: workout_id, user_id, exercise_id, and the set number
const deleteSetFromExercise = async (req, res) => {
    try {
        const { user_id, exercise_id, workout_id, set_number } = req.body;

        if (!user_id || !exercise_id || !workout_id || set_number == null) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Query to fetch the current performance_data
        const queryFetch = `
            SELECT performance_data
            FROM UserWorkoutPerformance
            WHERE user_id = $1 AND exercise_id = $2 AND workout_id = $3
        `;
        const resultFetch = await pool.query(queryFetch, [user_id, exercise_id, workout_id]);

        if (resultFetch.rows.length === 0) {
            return res.status(404).json({ error: "Record not found." });
        }

        const performanceData = resultFetch.rows[0].performance_data;

        if (!performanceData || !performanceData.sets || performanceData.sets.length === 0) {
            return res.status(400).json({ error: "No sets available to delete." });
        }

        // Filter out the set to delete and adjust subsequent set numbers
        const updatedSets = performanceData.sets
            .filter(set => set.set !== set_number) // Remove the set
            .map((set, index) => ({ ...set, set: index + 1 })); // Adjust set numbers

        if (updatedSets.length === performanceData.sets.length) {
            return res.status(404).json({ error: "Set not found." });
        }

        // Update the database with the adjusted performance data
        const queryUpdate = `
            UPDATE UserWorkoutPerformance
            SET performance_data = $1
            WHERE user_id = $2 AND exercise_id = $3 AND workout_id = $4
        `;
        await pool.query(queryUpdate, [{ sets: updatedSets }, user_id, exercise_id, workout_id]);

        res.status(200).json({ message: "Set deleted successfully.", performance_data: { sets: updatedSets } });
    } catch (error) {
        console.error("Error deleting set from exercise:", error);
        res.status(500).json({ error: "An error occurred while deleting the set." });
    }
};

//adjust the weight and reps within a set
//requirements of payload: workout_id, user_id, exercise_id, and the set number
const updateSet = async (req, res) => {
    try {
        const { user_id, exercise_id, workout_id, set_number, reps, weight } = req.body;

        if (!user_id || !exercise_id || !workout_id || set_number == null) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Query to fetch the current performance_data
        const queryFetch = `
            SELECT performance_data
            FROM UserWorkoutPerformance
            WHERE user_id = $1 AND exercise_id = $2 AND workout_id = $3
        `;
        const resultFetch = await pool.query(queryFetch, [user_id, exercise_id, workout_id]);

        if (resultFetch.rows.length === 0) {
            return res.status(404).json({ error: "Record not found." });
        }

        const performanceData = resultFetch.rows[0].performance_data;

        if (!performanceData || !performanceData.sets || performanceData.sets.length === 0) {
            return res.status(400).json({ error: "No sets available to update." });
        }

        // Find the set to update
        const updatedSets = performanceData.sets.map(set => {
            if (set.set === set_number) {
                return {
                    ...set,
                    reps: reps !== undefined ? reps : set.reps,
                    weight: weight !== undefined ? weight : set.weight,
                };
            }
            return set;
        });

        // Check if the set was updated
        const setExists = updatedSets.some(set => set.set === set_number);
        if (!setExists) {
            return res.status(404).json({ error: "Set not found." });
        }

        // Update the database with the modified performance data
        const queryUpdate = `
            UPDATE UserWorkoutPerformance
            SET performance_data = $1
            WHERE user_id = $2 AND exercise_id = $3 AND workout_id = $4
        `;
        await pool.query(queryUpdate, [{ sets: updatedSets }, user_id, exercise_id, workout_id]);

        res.status(200).json({ message: "Set updated successfully.", performance_data: { sets: updatedSets } });
    } catch (error) {
        console.error("Error updating set:", error);
        res.status(500).json({ error: "An error occurred while updating the set." });
    }
};


module.exports = { addSetToExercise, deleteSetFromExercise, updateSet };