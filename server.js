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

const { loginUser, signUpUser, hasUserLoggedIn, updateFirstLogin } = require('./api/SignupLogin');
const { getUserMetrics, updateUserMetrics } = require('./api/userMetrics');

const { saveWorkout, deleteWorkout, getCustomWorkouts } = require('./api/getAllSaveDeleteWorkouts');
const { getAllExercises, getWorkoutTemplate, getExercisesInAWorkout } = require('./api/getExercises');
const { getAllQuizzes } = require('./api/quizFunctions');
const { addSetToExercise, deleteSetFromExercise, updateSet } = require('./api/addUpdateDeleteSets');

app.use(express.json());
app.use(cors({ origin: '*' })); // Adjust CORS settings as needed

// Handler for root route
const readHelloMessage = (req, res) => {
    res.send('Server is running!');
};


app.get('/', readHelloMessage);
//functions to handle logging in a user, and signing them up
app.post('/login', loginUser);
app.post('/signup', signUpUser);

//get and update the logged-in value, so the wizard can be displayed or not
app.get('/hasuserloggedin:id', hasUserLoggedIn);
app.put('/loginfirsttime:id', updateFirstLogin);

//get all the exercises and quizzes we have in the DB
app.get('/exercises', getAllExercises);
app.get('/quizzes', getAllQuizzes);

//This returns a list of exercises and info about them, that are in a workout
//the id is the workout_id
app.get('/workout:id/exerciseData', getExercisesInAWorkout);

//get, save, and delete workouts
app.get('/customworkout:id', getCustomWorkouts); //ID is the user's id
app.post('/saveworkout', saveWorkout);
app.delete('/deleteworkout', deleteWorkout);

//get and update the user metrics (height, weight, and experience)
app.put('/setmetrics:id', updateUserMetrics);
app.get('/getmetrics:id', getUserMetrics);

//add and delete sets to an exercise
//the 'delete' route below is a PUT because we are just updating the field, not deleting any rows
app.put('/addsettoexercise', addSetToExercise);
app.put('/deletesetfromexercise', deleteSetFromExercise);
app.put('/updateset', updateSet);





//gets a default(template) workout, and can be found based on ID -- this *shouldn't*
//be used but will not be deleted yet, until client can change the route it pulls data from
app.get('/templateworkout:id', getWorkoutTemplate);//#FIXME

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
