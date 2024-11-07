const pgp = require('pg-promise')();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
router.use(express.json());

const dotenv = require('dotenv');
dotenv.config();

const db = pgp({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});


router.get('/', readHelloMessage);
router.post('/login', checkLogin);
router.post('/createUser', createUser);


app.use(router);
app.listen(port, () => console.log(`Listening on port ${port}`));


function readHelloMessage(req, res) {
    res.send('Hello! I see you are looking at our web app!');
};

async function checkLogin(req, res, next) {
    const { username, password } = req.body;

    try {
        const result = await db.any(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.length > 0) {
            res.status(200).json({ exists: true });
        } else {
            res.status(404).json({ exists: false });
        }
    } catch (error) {
        next(error);
    }
};

async function createUser(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Insert new user into the users table
        const result = await db.one(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, password]
        );

        res.status(201).json({
            message: 'User created successfully',
            userId: result.id
        });
    } catch (error) {
        next(error);
    }
};