DROP TABLE IF EXISTS Quiz;
DROP TABLE IF EXISTS WorkoutExercises;
DROP TABLE IF EXISTS Exercise;
DROP TABLE IF EXISTS Workout;
DROP TABLE IF EXISTS Users;

-- User table
CREATE TABLE Users (
    UserID integer PRIMARY KEY,
    email varchar(50) NOT NULL,
    password varchar(50) NOT NULL,
    height integer,
    weight float,
    experienceType varchar(25)
);

-- Workout table
CREATE TABLE Workout (
    WorkoutID integer PRIMARY KEY,
    description text,
    name varchar(50),
    isPublic boolean,
    UserID integer REFERENCES Users(UserID)
);

-- Exercise table
CREATE TABLE Exercise (
    ExerciseID integer PRIMARY KEY,
    description text,
    name varchar(50),
    muscleGroup varchar(25)
);

-- WorkoutExercises table (association table between Workout and Exercise)
CREATE TABLE WorkoutExercises (
    WorkoutExercisesID integer PRIMARY KEY,
    sets integer,
    reps integer,
    restTime integer,
    ExerciseID integer REFERENCES Exercise(ExerciseID), 
    WorkoutID integer REFERENCES Workout(WorkoutID)
);

-- Quiz table
CREATE TABLE Quiz (
    QuizID integer PRIMARY KEY,
    question varchar(255),
    correctAnswer varchar(255),
    incorrectAnswers varchar(255),
    description text,
);



-- Our data for User table
INSERT INTO Users (UserID, username, password, height, weight, experienceType)
VALUES 
    (1, 'test@gmail.com', 'demo123', 75.5, 180, 'Intermediate'),
    (2, 'zmr7@calvin.com', 'zmr7', 76, 190, 'Advanced'),
    (3, 'bjs55@calvin.edu', 'bjs55', 74, 145, 'Beginner'),
    (4, 'kdr22@calvin.edu', 'kdr22', 72, 160, 'Intermediate'),
    (5, 'bak32@calvin.edu', 'bak32', 73, 170, 'Advanced'),
    (6, 'tld26@calvin.edu', 'tld26', 74, 175, 'Advanced'),
    (7, 'jk267@calvin.edu', 'jk267', 75, 180, 'Advanced');

-- Our data for the Exercise table
INSERT INTO Exercise (ExerciseID, description, name, muscleGroup)
VALUES
    (1, '', 'Barbell Bench Press', 'Chest'),
    (2, '', 'Machine Flys', 'Chest'),
    (3, '', 'Incline Bench Press', 'Chest'),
    (4, '', 'Dumbbell Bench Press', 'Chest'),
    (5, '', 'Push Ups', 'Chest'),

    (6, '', 'Dips', 'Triceps'),
    (7, '', 'Tricep Extension', 'Triceps'),
    (8, '', 'Skull Crushers', 'Triceps'),
    (9, '', 'Tricep Pushdown', 'Triceps'),
    (10, '', 'Close Grip Bench Press', 'Triceps'),

    (11, '', 'Bicep Curls', 'Biceps'),
    (12, '', 'Hammer Curls', 'Biceps'),
    (13, '', 'Preacher Curls', 'Biceps'),
    (14, '', 'Behind-the-back Cable Curls', 'Biceps'),
    (15, '', 'Seated Incline Dumbbell Curls', 'Biceps'),

    (16, '', 'Pull Ups', 'Back'),
    (17, '', 'Lat Pulldown', 'Back'),
    (18, '', 'Seated Row', 'Back'),
    (19, '', 'Rear Delt Flys', 'Back'),
    (20, '', 'Barbell Row', 'Back'),

    (21, '', 'Reverse Curl', 'Forearms'),
    (22, '', 'Wrist Curls', 'Forearms'),
    (23, '', 'Reverse Wrist Curls', 'Forearms'),
    (24, '', 'Wrist Roller', 'Forearms'),
    (25, '', 'Farmers Walk', 'Forearms'),

    (26, '', 'Dumbbell Shoulder Press', 'Shoulders'),
    (27, '', 'Lateral Raises', 'Shoulders'),
    (28, '', 'Front Raises', 'Shoulders'),
    (29, '', 'Cable Lateral Raise', 'Shoulders'),
    (30, '', 'Overhead Press', 'Shoulders'),

    (31, '', 'Squats', 'Quadriceps'),
    (32, '', 'Front Squats', 'Quadriceps'),
    (33, '', 'Leg Press', 'Quadriceps'),
    (34, '', 'Lunges', 'Quadriceps'),
    (35, '', 'Leg Extensions', 'Quadriceps'),

    (36, '', 'Deadlifts', 'Hamstrings'),
    (37, '', 'Romanian Deadlifts', 'Hamstrings'),
    (38, '', 'Leg Curls', 'Hamstrings'),
    (39, '', 'Good Mornings', 'Hamstrings'),
    (40, '', 'Glute Ham Raise', 'Hamstrings'),

    (41, '', 'Calf Raises', 'Calves'),
    (42, '', 'Seated Calf Raises', 'Calves'),
    (43, '', 'Cable Machine Kickback', 'Glutes'),
    (44, '', 'Hip Thrusts', 'Glutes'),
    (45, '', 'Bulgarian Split Squats', 'Glutes'),

    (46, '', 'Crunches', 'Abs'),
    (47, '', 'Leg Raises', 'Abs'),
    (48, '', 'Planks', 'Abs'),
    (49, '', 'Russian Twists', 'Abs'),
    (50, '', 'Hanging Leg Raises', 'Abs');


-- Our data for the Workout table
INSERT INTO Workout (WorkoutID, description, name, isPublic, userId)
VALUES 
    (1, 'A workout focused on using your pull muscles - biceps, back, and forearms.', 'Pull Day', TRUE, NULL),
    (2, 'A workout focused on using your push muscles - chest, triceps, and shoulders.', 'Push Day', TRUE, NULL),
    (3, 'A workout focused on using you legs - quadriceps, hamstrings, glutes, and calves.', 'Leg Day', TRUE, NULL),
    (4, 'A workout focused for beginners , using no weights and only bodyweight exercises.', 'Bodyweight', TRUE, NULL);


-- Sample data for WorkoutExercises table
INSERT INTO WorkoutExercises (WorkoutExercisesID, sets, reps, restTime, workoutId, exerciseId)
VALUES 
    (1, 4, 8, 90, 1, 11),
    (2, 4, 8, 90, 1, 13),
    (3, 4, 8, 90, 1, 17),
    (4, 4, 8, 90, 1, 18),
    (5, 4, 8, 90, 1, 21),
    (6, 4, 8, 90, 1, 22),

    (7, 4, 8, 90, 2, 1),
    (8, 4, 8, 90, 2, 2),
    (9, 4, 8, 90, 2, 7),
    (10, 4, 8, 90, 2, 8),
    (11, 4, 8, 90, 2, 27),
    (12, 4, 8, 90, 2, 30),

    (13, 4, 8, 90, 3, 31),
    (14, 4, 8, 90, 3, 41),
    (15, 4, 8, 90, 3, 35),
    (16, 4, 8, 90, 3, 38),
    (17, 4, 8, 90, 3, 37),
    (18, 4, 8, 90, 3, 45),

    (19, 4, 8, 90, 4, 5),
    (20, 4, 8, 90, 4, 16),
    (21, 4, 8, 90, 4, 41),
    (22, 4, 8, 90, 4, 46),
    (23, 4, 8, 90, 4, 47),
    (24, 4, 8, 90, 4, 49);


-- Sample data for Quiz table
INSERT INTO Quiz (QuizID, question, correctAnswer, incorrectAnswers, description)
VALUES 
    (1, 'What is the largest muscle in the human body?', 'Gluteus Maximus', 'Biceps, Quadriceps, Pectorals', 'The gluteus maximus is the largest muscle in the human body, responsible for movement of the hip and thigh.'),
    (2, 'What type of muscle is the heart?', 'Cardiac muscle', 'Smooth muscle, Skeletal muscle, Voluntary muscle', 'The heart is made of cardiac muscle, which is specialized for continuous rhythmic contractions.'),
    (3, 'Which muscle is primarily worked by doing push-ups?', 'Pectorals', 'Quadriceps, Triceps, Glutes', 'Push-ups primarily target the pectoral muscles, which are located in the chest.'),
    (4, 'What muscle group is located on the back of the thigh?', 'Hamstrings', 'Calves, Biceps, Lats', 'The hamstrings are a group of muscles located at the back of the thigh, responsible for bending the knee.'),
    (5, 'The “lat” muscle refers to which body part?', 'Latissimus Dorsi', 'Lateral Deltoid, Abdominals, Trapezius', 'The latissimus dorsi is a large muscle on the back that helps with shoulder and arm movements.'),
    (6, 'Which muscle is responsible for flexing the elbow?', 'Biceps', 'Triceps, Deltoids, Pectorals', 'The biceps muscle is responsible for flexing the elbow, allowing the arm to bend.'),
    (7, 'Where is the trapezius muscle located?', 'Neck and upper back', 'Lower back, Thighs, Chest', 'The trapezius muscle is located in the neck and upper back, helping with shoulder and neck movements.'),
    (8, 'What are the two main muscles in the calf?', 'Gastrocnemius and Soleus', 'Gluteus and Soleus, Biceps and Triceps, Quadriceps and Hamstrings', 'The gastrocnemius and soleus are the two main muscles in the calf, aiding in walking and running.'),
    (9, 'Which muscle runs along the side of your torso and helps with twisting?', 'Obliques', 'Rectus Abdominis, Quadriceps, Triceps', 'The obliques are muscles on the side of the torso that assist with twisting and bending movements.'),
    (10, 'How many muscles make up the quadriceps?', '4', '2, 3, 5', 'The quadriceps are a group of four muscles located at the front of the thigh, responsible for extending the knee.'),
    (11, 'What type of exercise is a deadlift?', 'Compound', 'Isolation, Aerobic, Cardiovascular', 'A deadlift is a compound exercise that works multiple muscle groups simultaneously.'),
    (12, 'Which exercise primarily targets the pectoral muscles?', 'Bench Press', 'Squat, Deadlift, Leg Press', 'The bench press primarily targets the pectoral muscles in the chest.'),
    (13, 'What is the purpose of a warm-up?', 'To improve flexibility and prepare muscles', 'To fatigue muscles, To increase muscle size, To burn calories', 'A warm-up improves flexibility and prepares muscles for exercise, reducing the risk of injury.'),
    (14, 'Which exercise is best for strengthening the glutes?', 'Squats', 'Bench Press, Tricep Dips, Bicep Curl', 'Squats are highly effective for strengthening the gluteal muscles.'),
    (15, 'What type of exercise is a plank?', 'Isometric', 'Aerobic, Dynamic, Plyometric', 'A plank is an isometric exercise that involves holding a position to strengthen the core.'),
    (16, 'What type of exercise is a bicep curl?', 'Isolation', 'Compound, Aerobic, Plyometric', 'A bicep curl is an isolation exercise that specifically targets the biceps.'),
    (17, 'Which exercise targets the latissimus dorsi?', 'Pull-Up', 'Bench Press, Squat, Plank', 'Pull-ups primarily target the latissimus dorsi muscles in the back.'),
    (18, 'Which exercise is best for strengthening the quadriceps?', 'Squat', 'Push-Up, Deadlift, Crunch', 'Squats are effective for strengthening the quadriceps muscles in the thighs.'),
    (19, 'Which exercise primarily targets the triceps?', 'Tricep Extension', 'Squat, Bicep Curl, Crunch', 'Tricep extensions specifically target the triceps muscles at the back of the upper arm.'),
    (20, 'What type of movement is a jump squat?', 'Plyometric', 'Static, Isometric, Flexion', 'A jump squat is a plyometric exercise that involves explosive movements to build power.'),
    (21, 'What macronutrient is primarily used for muscle repair?', 'Proteins', 'Fats, Carbohydrates, Vitamins', 'Proteins are essential for muscle repair and growth.'),
    (22, 'Which vitamin is primarily obtained from sunlight?', 'Vitamin D', 'Vitamin A, Vitamin C, Vitamin E', 'Vitamin D is synthesized in the skin upon exposure to sunlight.'),
    (23, 'What is the recommended amount of water intake per day for adults?', '2-3 liters', '1 liter, 5 liters, 500 ml', 'Adults are generally recommended to drink 2-3 liters of water per day for proper hydration.'),
    (24, 'Which macronutrient is the body’s primary energy source during high-intensity exercise?', 'Carbohydrates', 'Protein, Fat, Fiber', 'Carbohydrates are the primary energy source during high-intensity exercise.'),
    (25, 'Which nutrient helps with muscle contraction?', 'Calcium', 'Iron, Vitamin C, Vitamin D', 'Calcium is crucial for muscle contraction and overall muscle function.'),
    (26, 'What is the main function of dietary fiber?', 'Aid in digestion', 'Build muscle, Increase strength, Boost immunity', 'Dietary fiber aids in digestion and helps maintain bowel health.'),
    (27, 'Which nutrient is most important for hydration?', 'Water', 'Protein, Carbohydrates, Fat', 'Water is essential for maintaining hydration and overall bodily functions.'),
    (28, 'Which food is a good source of healthy fats?', 'Almonds', 'Chicken breast, Spinach, Apples', 'Almonds are rich in healthy fats, which are beneficial for heart health.'),
    (29, 'Which of the following foods is highest in protein?', 'Chicken breast', 'Apple, Rice, Lettuce', 'Chicken breast is high in protein, which is essential for muscle repair and growth.'),
    (30, 'How many calories make up 1 pound of body weight?', '3,500 calories', '1,500 calories, 2,000 calories, 5,000 calories', 'One pound of body weight is equivalent to approximately 3,500 calories.');



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
WHERE w.UserID = 2;

-- 6. Find all exercises and their muscle groups
SELECT name AS exerciseName, muscleGroup
FROM Exercise;

-- 7. Retrieve all quiz questions related to "Chest" exercises
SELECT q.question, q.correctAnswer, q.incorrectAnswers
FROM Quiz q
JOIN Exercise e ON q.ExerciseId = e.ExerciseId
WHERE e.muscleGroup = 'Chest';