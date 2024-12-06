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


const updateUserMetrics = async (req, res) => {
    try {
        const { id } = req.params; // Assume the ID is passed as a route parameter
        const { height, weight, experience_type } = req.body;

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
        const { id } = req.params;

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

const hasUserLoggedIn = async (req, res) => {
    const userId = parseInt(req.params.id); // Extract and parse the user ID from the route

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const query = 'SELECT has_logged_in FROM Users WHERE id = $1'; // SQL query
        const result = await pool.query(query, [userId]); // Execute the query

        if (result.rows.length === 0) {
            // If no user found
            return res.status(404).json({ error: 'User not found' });
        }

        const hasLoggedIn = result.rows[0].has_logged_in; // Extract has_logged_in value
        res.status(200).send(hasLoggedIn.toString()); // Respond with true/false
    } catch (error) {
        console.error('Database query failed:', error); // Log the error
        res.status(500).json({ error: 'Internal server error' }); // Respond with error
    }
};
const updateFirstLogin = async (req, res) => {
    const userId = parseInt(req.params.id); // Extract and parse the user ID from the route

    if (isNaN(userId)) {
        return res.status(400).send('Invalid user ID');
    }

    try {
        const query = 'UPDATE Users SET has_logged_in = true WHERE id = $1 RETURNING has_logged_in'; // SQL query
        const result = await pool.query(query, [userId]); // Execute the query

        if (result.rows.length === 0) {
            // If no user found
            return res.status(404).send('User not found');
        }

        const updatedValue = result.rows[0].has_logged_in; // Extract the updated value
        res.status(200).send(updatedValue.toString()); // Respond with true
    } catch (error) {
        console.error('Database query failed:', error); // Log the error
        res.status(500).send('Internal server error'); // Respond with error
    }
};





module.exports = { loginUser, signUpUser, getUserMetrics, updateUserMetrics, hasUserLoggedIn, updateFirstLogin };