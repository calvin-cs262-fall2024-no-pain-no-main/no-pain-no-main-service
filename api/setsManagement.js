/**
 * This module contains route hander functions that are required for the API endpoints that are
 * defined in server.js, and handle changes to the sets in an exercise.
 *
 * Sets are stored in a singular cell and are associated to the user, workout, and exercise by foreign keys.
 * The set data looks like this:
 * {Sets : [
 *  {set: 1, reps: x, weight: x},
 *  {set: 2, reps: x, weight: x},
 *  ...
 * ]}
 *
 * The functions defined are:
 * 1)addSetToExercise
 * 2)deleteSetFromExercise
 * 3)updateSet
 *
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
 * add a set to the exercise by updating the performance_data for the specified exercise
 *
 * @async
 * @param {req.body.user_id} - the user's id
 * @param {req.body.exercise_id} - the id of the exercise that a set is being added to
 * @param {req.body.workout_id} - the id of the workout that the exercise is part of
 * @param {req.body.reps} - the number of reps in the set
 * @param {req.body.weight} - the weight used for that particular set
 *
 * @returns {Promise<void>} - responds with a sucess message and the new set added, or a failure
 *
 * @example - the payload of the HTTP PUT command:
 * '{
 *   "user_id": 14,
 *   "exercise_id": 6,
 *   "workout_id": 245,
 *   "reps": 12,
 *   "weight": 200
 *}'
 */
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


/**
 * Delete the set from the exercise, and update set numbers (ie if sets 1, 2, and 3 exist and set 2 is deleted,
 * remaining sets are labeled 1 and 2)
 * *NOTE* Since this is just modifying performance_data, this is a PUT command
 *
 * @async
 * @param {req.body.user_id} - the user's id
 * @param {req.body.exercise_id} - the id of the exercise that a set is being added to
 * @param {req.body.workout_id} - the id of the workout that the exercise is part of
 * @param {req.body.set_number} - the set number that is being removed
 *
 * @returns {Promise<void>} - returns a message with the deleted set, or an error
 *
 * @example - the payload of the HTTP PUT command:
 *'{
 *   "user_id": 14,
 *   "exercise_id": 6,
 *   "workout_id": 245,
 *  "set_number": 2
 *}'
 */
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

        // if (resultFetch.rows.length === 0) {
        //     return res.status(404).json({ error: "Record not found." });
        // }

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

/**
 * The user needs a way to be able to update the reps or weight within a partiular set
 * The function needs for first fetch the current set data, modify it, then write the updated version back
 * @async
 * @param {req.body.user_id} - the user's id
 * @param {req.body.exercise_id} - the id of the exercise that a set is being added to
 * @param {req.body.workout_id} - the id of the workout that the exercise is part of
 * @param {req.body.set_number} - the particular set that the user wants to change
 * @param {req.body.reps} - the number of reps in the set
 * @param {req.body.weight} - the weight used for that particular set
 *
 * @returns {Promise<void>} - responds with a message and the list of sets, or an error.
 *
 * @example - payload of the HTTP PUT command:
 * -d '{
 *   "user_id": 14,
 *   "exercise_id": 6,
 *   "workout_id": 245,
 *   "set_number": 2,
 *   "reps": 12,
 *   "weight": 175
 *}'
 *
 */
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