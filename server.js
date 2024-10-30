const express = require('express'); // npm install express 
const { Pool } = require('pg'); // npm install pg 
const cors = require('cors'); // npm install cors

const app = express();
const port = 3000; // Port for the server NOT the PostgreSQL database

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    host: 'localhost', // localhost or server IP
    user: 'postgres', // Your PostgreSQL username
    password: '', // Your PostgreSQL password
    database: '', // Your database name
    port: 5432, // Default PostgreSQL port is 5432
});

// API endpoint to get user data
app.get('/userdata', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.userdata');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Server error');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});