/**
 * This module works with modifying the contents of the main workout table - if the user
 * wants to modify the name, descrition, or public status, he or she may do so without creating an
 * entirely new workout.
 *
 * The functions contained in this module are:
 * 1)updateMainWorkoutProfile
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
 * This function is used to update either the name, description, visibility of the workout,
 * or any combination of these parameters.
 * @async
 * @param {req.body.workout_id} - the id of the workout
 * @param {req.body.user_id} - the id of the user who created the workout
 * @param {req.body.description} - optional: the description of the workout
 * @param {req.body.name} - optional: the name of the workout
 * @param {req.body.is_public} - optional: whether the workout can be seen by the public or not
 *
 * @returns {Promise<void>} - responds with a message saying the workout updated successfully, or an error
 */
const updateMainWorkoutTable = async (req, res) => {
    try {
        const { workout_id, user_id, description, name, is_public } = req.body;

        if (!workout_id || !user_id) {
            return res.status(400).json({ error: "Missing required fields: workout_id and user_id." });
        }

        // Build the SET clause dynamically based on the provided fields
        const fieldsToUpdate = [];
        const values = [];
        let index = 1;

        if (description !== undefined) {
            fieldsToUpdate.push(`description = $${index}`);
            values.push(description);
            index++;
        }

        if (name !== undefined) {
            fieldsToUpdate.push(`name = $${index}`);
            values.push(name);
            index++;
        }

        if (is_public !== undefined) {
            fieldsToUpdate.push(`is_public = $${index}`);
            values.push(is_public);
            index++;
        }

        // If no fields to update, return an error
        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ error: "No fields to update." });
        }

        // Add the workout_id and user_id for the WHERE clause
        const query = `
            UPDATE Workout
            SET ${fieldsToUpdate.join(", ")}
            WHERE id = $${index} AND user_id = $${index + 1}
            RETURNING *;
        `;

        values.push(workout_id, user_id);

        // Perform the update
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workout not found or user does not have permission to update it." });
        }

        // Return the updated workout
        res.status(200).json({ message: "Workout updated successfully.", workout: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { updateMainWorkoutTable };