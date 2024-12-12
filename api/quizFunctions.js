/**
 * This module is designated for functions associated with the quiz table. The functions
 * defined in this module are:
 * 1) getAllQuizzes
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
 * Fetches all the quiz data from the database
 *
 * @async
 * @example - There is no payload for this HTTP GET command
 *
 */
const getAllQuizzes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM quiz');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getAllQuizzes };