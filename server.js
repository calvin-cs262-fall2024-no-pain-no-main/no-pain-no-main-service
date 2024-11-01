// service/index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(cors({
    origin: '*', // Adjust this to your needs in production
}));

// Endpoint to check if a user exists
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ exists: true });
        } else {
            res.status(404).json({ exists: false });
        }
    } catch (error) {
        console.error(error);
        console.log("Uh oh");
        res.status(500).json({ error: 'Internal server error' });
    }
});


const testLogin = async (username, password) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            console.log(`User ${username} found! Login successful.`);
        } else {
            console.log(`User ${username} not found or incorrect password.`);
        }
    } catch (error) {
        console.error('Error executing test query', error.stack);
    }
};

// Example usage of testLogin
testLogin('test', 'demo123'); // Replace with actual test credentials
testLogin('test', 'demo1234');
console.log("This is a test!");

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//----------------------------------------