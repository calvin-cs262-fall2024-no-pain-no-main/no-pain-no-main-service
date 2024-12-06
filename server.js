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

const { loginUser, signUpUser, getUserMetrics, updateUserMetrics, hasUserLoggedIn, updateFirstLogin } = require('./api/userFunctions');
const { saveWorkout, deleteWorkout, getCustomWorkouts, updateExerciseData } = require('./api/customWorkoutFunctions');
const { getAllExercises, getWorkoutTemplate, getWorkoutData } = require('./api/defaultWorkoutFunctions');
const { getAllQuizzes } = require('./api/quizFunctions');


app.use(express.json());
app.use(cors({ origin: '*' })); // Adjust CORS settings as needed

// Handler for root route
const readHelloMessage = (req, res) => {
    res.send('Server is running!');
};



app.get('/', readHelloMessage);
app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.get('/exercises', getAllExercises);

app.get('/templateworkout:id', getWorkoutTemplate);
app.get('/workout:id/exerciseData', getWorkoutData);
app.get('/quizzes', getAllQuizzes);

app.get('/customworkout:id', getCustomWorkouts); //ID is the user's id
app.post('/saveworkout', saveWorkout);
app.put('/updateuserexercise', updateExerciseData);
app.delete('/deleteworkout', deleteWorkout);

//get and update the user metrics (height, weight, and experience)
app.put('/setmetrics:id', updateUserMetrics);
app.get('/getmetrics:id', getUserMetrics);

//get and update the logged-in value, so the wizard can be displayed or not
app.get('/hasuserloggedin:id', hasUserLoggedIn);
app.put('/loginfirsttime:id', updateFirstLogin);



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
