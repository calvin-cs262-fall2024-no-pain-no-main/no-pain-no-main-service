/**
 * no-pain-no-main Service:
 *This module implements a REST-inspired webservice for interacting with our database.
 *The database is hosted on Azure using PostgreSQL.
 *
 * The endpoints defined below are used by the client to interact with the database
 * in a structured manner and provide some layer of abstraction.
 *
 * This service assumes that the database connection variables are assigned
 * in the .env file. They are also initalized on Azure as environment variables.
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

//Importing functions from modules
const userAuth = require('./api/userAuth');
const userMetrics = require('./api/userMetrics');
const setsManagement = require('./api/setsManagement');
const quizzes = require('./api/quizFunctions');
const fetchExercises = require('./api/exerciseRetrieval');
const workoutManagement = require('./api/workoutManagement');
const exerciseManagement = require('./api/exerciseManagement');
const workoutInfo = require('./api/updateWorkoutProfile');

app.use(express.json());
app.use(cors({ origin: '*' })); // Adjust CORS settings as needed

// Handler for default route
const readHelloMessage = (req, res) => {
    res.send('Server is running!');
};

//default route for the server
app.get('/', readHelloMessage);

//functions to handle logging in a user, and signing them up
app.post('/login', userAuth.loginUser);
app.post('/signup', userAuth.signUpUser);

//get and update the logged-in value, so the wizard can be displayed or not
app.get('/hasuserloggedin:id', userAuth.hasUserLoggedIn);
app.put('/loginfirsttime:id', userAuth.updateFirstLogin);


//get all the exercises and quizzes we have in the DB
app.get('/exercises', fetchExercises.getAllExercises);
app.get('/quizzes', quizzes.getAllQuizzes);

//This returns a list of exercises and info about them, that are in a workout
//the id is the workout_id
app.get('/workout:id/exerciseData', fetchExercises.getExercisesInAWorkout);

//get, save, and delete workouts
app.get('/customworkout:id', workoutManagement.getCustomWorkouts); //ID is the user's id
app.post('/saveworkout', workoutManagement.saveWorkout);
app.delete('/deleteworkout', workoutManagement.deleteWorkout);

//get and update the user metrics (height, weight, and experience)
app.put('/setmetrics', userMetrics.updateUserMetrics);
app.get('/getmetrics', userMetrics.getUserMetrics);
app.delete('/deleteuser', userMetrics.deleteUserAccount);

//add and delete sets to an exercise
//the 'delete' route below is a PUT because we are just updating the field, not deleting any rows
app.put('/addsettoexercise', setsManagement.addSetToExercise);
app.put('/deletesetfromexercise', setsManagement.deleteSetFromExercise);
app.put('/updateset', setsManagement.updateSet);

//change the name or description of a workout
app.put('/updateworkoutprofile', workoutInfo.updateMainWorkoutTable);

//add and delete an exercise in a workout
app.post('/addexercisetoworkout', exerciseManagement.addExerciseToWorkout);
app.delete('/deleteexercisefromworkout', exerciseManagement.deleteExerciseFromWorkout);




//gets a default(template) workout, and can be found based on ID -- this *shouldn't*
//be used but will not be deleted yet, until client can change the route it pulls data from
app.get('/templateworkout:id', fetchExercises.getWorkoutTemplate);//#FIXME

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
