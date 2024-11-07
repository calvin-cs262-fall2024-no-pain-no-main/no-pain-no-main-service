DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Workout;
DROP TABLE IF EXISTS Exercise;
DROP TABLE IF EXISTS WorkoutExercises;
DROP TABLE IF EXISTS Quiz;

-- User table
CREATE TABLE Users (
    UserID integer PRIMARY KEY,
    email varchar(50) NOT NULL,
    password varchar(50) NOT NULL,
    height integer,
    weight float,
    experienceType varchar(10)
);

-- Workout table
CREATE TABLE Workout (
    WorkoutID integer PRIMARY KEY,
    description text,
    name varchar(50),
    isPublic boolean,
    UserID integer REFERENCES Users(ID), 
);

-- Exercise table
CREATE TABLE Exercise (
    ExerciseID integer PRIMARY KEY,
    description text,
    name varchar(50),
    muscleGroup varchar(10)
);

-- WorkoutExercises table (association table between Workout and Exercise)
CREATE TABLE WorkoutExercises (
    WorkoutExercisesID integer PRIMARY KEY,
    sets integer,
    reps integer,
    restTime integer,
    ExerciseID integer REFERENCES Exercise(ID), 
    WorkoutID integer REFERENCES Workout(ID), 
);

-- Quiz table
CREATE TABLE Quiz (
    QuizID integer PRIMARY KEY,
    question varchar(255),
    correctAnswer varchar(100),
    incorrectAnswers varchar(255),
    description text,
    ExerciseID integer REFERENCES Exercise(ID), 
);

-- Sample data for User table
INSERT INTO Users (email, password, height, weight, experienceType)
VALUES 
    ('john.doe@example.com', 'password', 180, 75.5, 'Intermediate'),
    ('jane.smith@example.com', 'securepassword', 165, 60.2, 'Beginner');

-- Sample data for Workout table
INSERT INTO Workout (description, name, isPublic, userId)
VALUES 
    ('A day using your pull muscles, biceps and back.', 'Pull Day', TRUE, 1),
    ('A day using you push muscles, chest and triceps.', 'Push Day', FALSE, 2);

-- Sample data for Exercise table
INSERT INTO Exercise (description, name, muscleGroup)
VALUES 
    ('Push-up exercise to strengthen chest and triceps', 'Push-Up', 'Chest'),
    ('Bicep curls with dumbbells', 'Bicep Curl', 'Biceps');

-- Sample data for WorkoutExercises table
INSERT INTO WorkoutExercises (sets, reps, restTime, workoutId, exerciseId)
VALUES 
    (3, 15, 60, 2, 1),  -- Push Day includes Push-Ups
    (3, 10, 45, 1, 2);  -- Pull Day includes Bicep Curls

-- Sample data for Quiz table
INSERT INTO Quiz (question, correctAnswer, incorrectAnswers, description, exerciseId)
VALUES 
    ('What muscle group do push-ups primarily work?', 'Chest', 'Legs,Back,Arms', 'Focus on chest and triceps.', 1),
    ('What is the correct form for a bicep curl?', 'Keep elbows close to body', 'Swing arms,Use heavy weights,Bend knees', 'Proper form for optimal results.', 3);


-- Sample Queries

-- 1. Retrieve all users and their workouts
SELECT u.UserId, u.email, w.name AS workoutName, w.description, w.isPublic
FROM Users u
JOIN Workout w ON u.UserId = w.UserId;

-- 2. Find all exercises in a specific workout (e.g., "Push Day")
SELECT w.name AS workoutName, e.name AS exerciseName, we.sets, we.reps, we.restTime
FROM Workout w
JOIN WorkoutExercises we ON w.WorkoutId = we.WorkoutId
JOIN Exercise e ON we.ExerciseId = e.ExerciseId
WHERE w.name = 'Push Day';

-- 3. Retrieve all quizzes for a specific exercise (e.g., "Push-Up")
SELECT e.name AS exerciseName, q.question, q.correctAnswer, q.incorrectAnswers
FROM Exercise e
JOIN Quiz q ON e.ExerciseId = q.ExerciseId
WHERE e.name = 'Push-Up';

-- 4. List all public workouts with their exercises
SELECT w.name AS workoutName, e.name AS exerciseName, we.sets, we.reps
FROM Workout w
JOIN WorkoutExercises we ON w.WorkoutId = we.WorkoutId
JOIN Exercise e ON we.ExerciseId = e.ExerciseId
WHERE w.isPublic = TRUE;

-- 5. Get all workouts created by a specific user (e.g., userId = 2)
SELECT w.name AS workoutName, w.description
FROM Workout w
WHERE w.UserId = 2;

-- 6. Find all exercises and their muscle groups
SELECT name AS exerciseName, muscleGroup
FROM Exercise;

-- 7. Retrieve all quiz questions related to "Legs" exercises
SELECT q.question, q.correctAnswer, q.incorrectAnswers
FROM Quiz q
JOIN Exercise e ON q.ExerciseId = e.ExerciseId
WHERE e.muscleGroup = 'Chest';