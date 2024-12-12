/**
 * The Auth module describes functions associated with the creation of an account,
 * as well as logging in a user in.
 *
 * The functions defined in this module are as follows:
 *
 * 1)loginUser - handles logging in a user to their account
 * 2)signUpUser - handles the creation of an account for a new user
 * 3)hasUserLoggedIn - checks to see if the user has logged in before
 * 4)updateFirstLogin - if the user is logging in for the first time, update the status
 *
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
 * Sends the username and password to see if the user exists, and if the password is correct.
 * It does so by fetching the row based on the username, and compares the password given by the
 * user and the password returned by the database
 *
 * This is definitely not a secure way of doing things, but it is good enough for the scope of the
 * project at this time.
 *
 * @async
 * @param {string} req.body.username - the username
 * @param {string} req.body.password - the users password
 * @returns {Promise<void>} - responds with either a success, or an failure/error
 *
 * @example - an example of the HTTP payload - this is a POST:
 * '{
 *   "username": "exampleUser",
 *  "password": "examplePassword"
 *   }'
 *
 *
*/
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

/**
 * Creates a new account (row in the users table) that can be associated with the user.
 * Having an account is required because workouts are saved by being associated to the user who created the workout.
 * The username MUST be unique.
 *
 *
 * @async
 * @param {string} req.body.username - the username
 * @param {string} req.body.password - the users password
 * @returns {Promise<void>} - responds with one of the following: 1) success
 *                                                                2) the username is already taken - failure
 *                                                                3) failure(either improper payload given, or another error)
 * @example - An example of the HTTP payload - This is a POST:
 * '{
 *  "username": "exampleUser",
 *   "password": "examplePassword"
 *}'
 *
*/
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

/**
 * Checks to see if the user has logged in before - this information will be used to
 * display an opening wizard to ask questions about the user's workout habits - this is only displayed the first
 * time the user opens the app (the front end has not yet implemented this).
 *
 *
 * @param {id} - the id of the user, which is parsed from the URL
 * @returns {Promise<void>} - responds with true/false, or a failure
 *
 * @example - There is no payload for this HTTP command, and it is a GET
 *
 */

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

/**
 * Upon logging in for the first time, the value has_logged_in needs to be set to true -- they have
 * now logged in for the first time, and the startup wizard should no longer be displayed
 *
 * @param {id} - the user's id, which is sent as part of the URL
 * @returns {Promise<void>} - responds with true if the operation is a success
 *
 * @example - There is no payload for this HTTP command, and it is a GET
 */
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

module.exports = { loginUser, signUpUser, hasUserLoggedIn, updateFirstLogin };