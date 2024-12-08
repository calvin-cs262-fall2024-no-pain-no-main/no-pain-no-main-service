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

const updateUserMetrics = async (req, res) => {
    try {
        const { id, height, weight, experience_type } = req.body;

        console.log("Updating User ID:", id);
        console.log("New Metrics:", { height, weight, experience_type });

        // Check if at least one metric is provided
        if (height === undefined && weight === undefined && experience_type === undefined) {
            return res.status(400).json({ error: 'At least one metric (height, weight, or experience_type) is required' });
        }

        // Build the dynamic query
        const fields = [];
        const values = [];

        if (height !== undefined) {
            fields.push(`height = $${fields.length + 1}`);
            values.push(height);
        }
        if (weight !== undefined) {
            fields.push(`weight = $${fields.length + 1}`);
            values.push(weight);
        }
        if (experience_type !== undefined) {
            fields.push(`experience_type = $${fields.length + 1}`);
            values.push(experience_type);
        }

        // Add the ID to the values array
        values.push(id);

        // Create the query
        const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${values.length}
        RETURNING id, username, height, weight, experience_type;
      `;

        // Execute the query
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log("Updated User:", result.rows[0]);

        // Respond with the updated user information
        res.status(200).json({ user: result.rows[0] });
    } catch (error) {
        console.error("Error in updateUserMetrics:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getUserMetrics = async (req, res) => {
    try {
        const { id } = req.body;

        // Query to get the user's metrics
        const result = await pool.query(
            `SELECT id, username, height, weight, experience_type FROM users WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user: result.rows[0] });
    } catch (error) {
        console.error("Error in getUserMetrics:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteUserAccount = async (req, res) => {
    try {
        const { user_id } = req.body;

        // Start a transaction to ensure all deletions are atomic
        await pool.query('BEGIN');

        // Step 1: Delete from UserWorkoutPerformance
        await pool.query(
            `DELETE FROM UserWorkoutPerformance
             WHERE user_id = $1`,
            [user_id]
        );

        // Step 2: Get all workout IDs associated with the user
        const workoutIdsResult = await pool.query(
            `SELECT id FROM Workout
             WHERE user_id = $1`,
            [user_id]
        );
        const workoutIds = workoutIdsResult.rows.map(row => row.id);

        if (workoutIds.length > 0) {
            // Step 3: Delete from WorkoutExercises for the user's workouts
            await pool.query(
                `DELETE FROM WorkoutExercises
                 WHERE workout_id = ANY($1::int[])`,
                [workoutIds]
            );

            // Step 4: Delete the user's workouts from Workout
            await pool.query(
                `DELETE FROM Workout
                 WHERE id = ANY($1::int[])`,
                [workoutIds]
            );
        }

        // Step 5: Delete the user from Users
        await pool.query(
            `DELETE FROM Users
             WHERE id = $1`,
            [user_id]
        );

        // Commit the transaction
        await pool.query('COMMIT');

        res.status(200).json({ message: 'User account and associated data successfully deleted.' });
    } catch (error) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        console.error('Error deleting user account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



module.exports = { getUserMetrics, updateUserMetrics, deleteUserAccount };