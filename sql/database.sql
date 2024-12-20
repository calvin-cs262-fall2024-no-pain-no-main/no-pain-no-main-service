DROP TABLE IF EXISTS Quiz;
DROP TABLE IF EXISTS UserWorkoutPerformance;
DROP TABLE IF EXISTS WorkoutExercises;
DROP TABLE IF EXISTS Exercise;
DROP TABLE IF EXISTS Workout;
DROP TABLE IF EXISTS Users;

-- User table
CREATE TABLE Users (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username varchar(50) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
    height integer,
    weight float,
    experience_type varchar(25),
    has_logged_in boolean DEFAULT FALSE
);

-- Workout table
CREATE TABLE Workout (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    description text,
    name varchar(50),
    is_public boolean,
    user_id integer REFERENCES Users(id)
);

-- Exercise table
CREATE TABLE Exercise (
    id integer PRIMARY KEY,
    description text,
    name varchar(50),
    muscle_group varchar(25)
);

-- WorkoutExercises table (association table between Workout and Exercise)
-- ex: if a user creates a workout with 3 exercises, 3 rows will be added to this table
CREATE TABLE WorkoutExercises (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exercise_id integer REFERENCES Exercise(id),
    workout_id integer REFERENCES Workout(id)
);

CREATE TABLE UserWorkoutPerformance(
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer REFERENCES Users(id),
    exercise_id integer REFERENCES Exercise(id),
    workout_id integer REFERENCES Workout(id),
    performance_data JSONB
);

ALTER TABLE UserWorkoutPerformance
ADD CONSTRAINT unique_user_exercise_workout
UNIQUE (user_id, exercise_id, workout_id);

-- Quiz table
CREATE TABLE Quiz (
    id integer PRIMARY KEY,
    question varchar(255),
    correct_answer varchar(255),
    incorrect_answers varchar(255),
    description text
);


-- Our data for the Exercise table
INSERT INTO Exercise (id, description, name, muscle_group)
VALUES
    (1, '', 'Barbell Bench Press', 'Chest'),
    (2, '', 'Machine Flys', 'Chest'),
    (3, '', 'Incline Bench Press', 'Chest'),
    (4, '', 'Dumbbell Bench Press', 'Chest'),
    (5, '', 'Push Ups', 'Chest'),

    (6, '', 'Dips', 'Triceps'),
    (7, '', 'Tricep Extension', 'Triceps'),
    (8, '', 'Skull Crushers', 'Triceps'),
    (9, '', 'Tricep Bar Pushdown', 'Triceps'),
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
    (50, '', 'Hanging Leg Raises', 'Abs'),

    (51, '', 'Decline Bench Press', 'Chest'),
    (52, '', 'Dumbbell Flys', 'Chest'),

    (53, '', 'Tricep Dumbbell Kickbacks', 'Triceps'),
    (54, '', 'Tricep Rope Pushdown', 'Triceps'),
    (55, '', 'Overhead Tricep Press', 'Triceps'),

    (56, '', 'Concentration Curls', 'Biceps'),
    (57, '', 'Spider Curls', 'Biceps'),
    (58, '', 'Cable Bar Curls', 'Biceps'),
    (59, '', 'Zottman Curls', 'Biceps'),

    (60, '', 'T-Bar Row', 'Back'),
    (61, '', 'One-Arm Dumbbell Row', 'Back'),
    (62, '', 'Face Pulls', 'Back'),

    (63, '', 'Arnold Press', 'Shoulders'),
    (64, '', 'Upright Rows', 'Shoulders'),
    (65, '', 'Shoulder Shrugs', 'Shoulders'),

    (66, '', 'Hack Squats', 'Quadriceps'),
    (67, '', 'Goblet Squats', 'Quadriceps'),

    (68, '', 'Mountain Climbers', 'Abs'),
    (69, '', 'Side Planks', 'Abs'),
    (70, '', 'Bicycle Crunches', 'Abs'),
    (71, '', 'Flutter Kicks', 'Abs'),
    (72, '', 'V-Ups', 'Abs');


-- Our data for the Workout table
INSERT INTO Workout ( description, name, is_public, user_id)
VALUES
    ('A workout focused on using your pull muscles - biceps, back, and forearms.', 'Pull Day', TRUE, NULL),
    ('A workout focused on using your push muscles - chest, triceps, and shoulders.', 'Push Day', TRUE, NULL),
    ('A workout focused on using you legs - quadriceps, hamstrings, glutes, and calves.', 'Leg Day', TRUE, NULL),
    ('A workout focused for beginners , using no weights and only bodyweight exercises.', 'Bodyweight', TRUE, NULL);


-- Sample data for WorkoutExercises table
INSERT INTO WorkoutExercises (workout_id, exercise_id)
VALUES
    (1, 11),
    (1, 13),
    (1, 17),
    (1, 18),
    (1, 21),
    (1, 22),

    (2, 1),
    (2, 2),
    (2, 7),
    (2, 8),
    (2, 27),
    (2, 30),

    (3, 31),
    (3, 41),
    (3, 35),
    (3, 38),
    (3, 37),
    (3, 45),

    (4, 5),
    (4, 16),
    (4, 41),
    (4, 46),
    (4, 47),
    (4, 49);

-- Sample data for Quiz table
INSERT INTO Quiz (id, question, correct_answer, incorrect_answers, description)
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
    (30, 'How many calories make up 1 pound of body weight?', '3,500 calories', '1,500 calories, 2,000 calories, 5,000 calories', 'One pound of body weight is equivalent to approximately 3,500 calories.'),
    (31, 'What is the principle of "progressive overload"?', 'Increasing weight consistently', 'Decreasing workout time, Avoiding all heavy lifts, Stretching regularly', 'Progressive overload involves gradually increasing the weight or resistance to build muscle strength.'),
    (32, 'What is the minimum recommended time for a cardio session for heart health?', '30 minutes', '5 minutes, 10 minutes, 20 minutes', 'A minimum of 30 minutes of cardio is recommended for maintaining heart health.'),
    (33, 'How often should adults perform muscle-strengthening activities per week?', 'Twice', 'Once, Three times, Every day', 'Adults should engage in muscle-strengthening activities at least twice a week.'),
    (34, 'What does “DOMS” stand for in fitness?', 'Delayed Onset Muscle Soreness', 'Dynamic Overload Muscle Strain, Development of Muscle Strength, Determination of Muscle Soreness', 'DOMS refers to the muscle soreness experienced after intense exercise.'),
    (35, 'What type of stretching is recommended before a workout?', 'Dynamic', 'Static, Isometric, Plyometric', 'Dynamic stretching is recommended before a workout to prepare muscles for activity.'),
    (36, 'Which training method involves short, intense bursts followed by rest?', 'HIIT (High-Intensity Interval Training)', 'LISS (Low-Intensity Steady State), Strength Training, Pilates', 'HIIT involves alternating between short, intense bursts of exercise and rest periods.'),
    (37, 'How many sets per exercise is generally recommended for muscle growth?', '3-5 sets', '1-2 sets, 6-7 sets, 8-10 sets', 'Performing 3-5 sets per exercise is generally recommended for muscle growth.'),
    (38, 'What is the ideal rest time between sets for muscle growth?', '30-90 seconds', '5 seconds, 10 seconds, 5 minutes', 'Resting for 30-90 seconds between sets is ideal for muscle growth.'),
    (39, 'What type of exercise is yoga considered?', 'Flexibility', 'Aerobic, Anaerobic, Isometric', 'Yoga is primarily considered a flexibility exercise.'),
    (40, 'What is the “FITT” principle used for?', 'Setting exercise goals', 'Nutrition planning, Tracking progress, Weight loss', 'The FITT principle (Frequency, Intensity, Time, Type) is used for setting exercise goals.'),
    (41, 'What device is commonly used to measure body fat percentage?', 'Caliper', 'Scale, Barometer, Pedometer', 'A caliper is commonly used to measure body fat percentage by pinching the skin.'),
    (42, 'What does BMI stand for?', 'Body Mass Index', 'Bone Mass Index, Basal Metabolic Intake, Body Muscle Intake', 'BMI stands for Body Mass Index, a measure of body fat based on height and weight.'),
    (43, 'Which component is NOT part of physical fitness?', 'Agility', 'Flexibility, Speed, Muscular endurance', 'Agility is not typically considered a component of physical fitness.'),
    (44, 'What is a safe weight loss goal per week?', '1-2 pounds', '3-4 pounds, 5-6 pounds, 7-8 pounds', 'A safe weight loss goal is 1-2 pounds per week to ensure healthy and sustainable weight loss.'),
    (45, 'What is the RPE scale used for?', 'Rating Perceived Exertion', 'Monitoring heart rate, Calculating BMI, Measuring strength', 'The RPE scale is used to measure the intensity of exercise based on how hard you feel you are working.'),
    (46, 'Which is an example of a low-impact exercise?', 'Swimming', 'Running, Jumping Rope, Sprinting', 'Swimming is a low-impact exercise that is gentle on the joints.'),
    (47, 'What type of exercise is rock climbing?', 'Anaerobic', 'Aerobic, Flexibility, Endurance', 'Rock climbing is an anaerobic exercise that involves short bursts of intense effort.'),
    (48, 'What does “reps” stand for?', 'Repetitions', 'Rest periods, Reductions, Rests', 'Reps stands for repetitions, referring to the number of times an exercise is performed.'),
    (49, 'What is a common goal of aerobic exercise?', 'Cardiovascular endurance', 'Muscle building, Flexibility, Balance', 'Aerobic exercise aims to improve cardiovascular endurance.'),
    (50, 'Which of the following is NOT a form of cardio?', 'Bicep Curl', 'Treadmill Running, Rowing, Swimming', 'A bicep curl is a strength training exercise, not a form of cardio.'),
    (51, 'Which exercise is best for improving balance?', 'Single-Leg Squat', 'Bicep Curl, Deadlift, Plank', 'Single-leg squats are effective for improving balance and stability.'),
    (52, 'What does a pedometer measure?', 'Steps taken', 'Heart rate, Body fat percentage, Calories burned', 'A pedometer measures the number of steps taken.'),
    (53, 'What is VO2 max?', 'The maximum volume of oxygen your body can use during exercise', 'The speed at which you can run a mile, The maximum weight you can lift, Your heart rate during rest', 'VO2 max is a measure of the maximum volume of oxygen the body can use during exercise.'),
    (54, 'Which is NOT a component of cardiovascular fitness?', 'Flexibility', 'Heart health, Endurance, Lung capacity', 'Flexibility is not a component of cardiovascular fitness.'),
    (55, 'What is the primary focus of Pilates?', 'Core strength and flexibility', 'Speed and power, Cardiovascular endurance, Weight loss', 'Pilates focuses on improving core strength and flexibility.'),
    (56, 'What is the safest way to increase flexibility?', 'Static stretching after a workout', 'Dynamic stretching before a workout, Ballistic stretching, Using weights', 'Static stretching after a workout is the safest way to increase flexibility.'),
    (57, 'What muscle group does the bench press primarily target?', 'Chest', 'Shoulders, Back, Legs', 'The bench press primarily targets the chest muscles.'),
    (58, 'Which exercise can help improve core strength?', 'Plank', 'Deadlift, Bench Press, Bicep Curl', 'Planks are effective for improving core strength.'),
    (59, 'What is the main benefit of interval training?', 'Higher calorie burn in shorter time', 'Increased flexibility, Improved bone density, Enhanced joint mobility', 'Interval training burns more calories in a shorter amount of time.'),
    (60, 'Which nutrient is stored in the muscles for energy during exercise?', 'Carbohydrate (glycogen)', 'Protein, Fat, Fiber', 'Carbohydrates are stored as glycogen in muscles for energy during exercise.'),
    (61, 'What is the purpose of the "cool-down" phase in a workout?', 'Reduce heart rate gradually', 'Build muscle, Prevent muscle soreness, Burn extra calories', 'The cool-down phase helps reduce heart rate gradually after exercise.'),
    (62, 'Which of the following can help prevent muscle soreness?', 'Gradual warm-up and cool-down', 'Static stretching before a workout, Skipping rest days, Only performing high-intensity exercises', 'A gradual warm-up and cool-down can help prevent muscle soreness.'),
    (63, 'What should you do if you experience pain during exercise?', 'Stop and assess the pain', 'Push through it, Speed up, Increase the weight', 'If you experience pain during exercise, you should stop and assess the pain to avoid injury.'),
    (64, 'Which of these is a sign of overtraining?', 'Decreased performance', 'Increased energy levels, Improved sleep, Stronger appetite', 'Decreased performance is a common sign of overtraining.'),
    (65, 'How often should you replace running shoes to prevent injuries?', 'Every 300-500 miles', 'Every 100 miles, Every 200 miles, Once a year', 'Running shoes should be replaced every 300-500 miles to prevent injuries.'),
    (66, 'What does RICE stand for in injury treatment?', 'Rest, Ice, Compression, Elevation', 'Run, Increase, Contract, Elevate, Rotate, Ice, Cool, Elevate, Relax, Include, Contract, Extend', 'RICE stands for Rest, Ice, Compression, Elevation, a common method for treating injuries.'),
    (67, 'What is the purpose of a foam roller?', 'Self-myofascial release', 'Increase speed, Stretch the muscles, Cardio training', 'A foam roller is used for self-myofascial release to relieve muscle tightness.'),
    (68, 'Which of the following is a common cause of muscle strain?', 'Overstretching a muscle', 'Proper warm-up, Lifting with good form, Controlled breathing', 'Overstretching a muscle can lead to muscle strain.'),
    (69, 'How many rest days are recommended per week for general fitness?', '1-2', '0, 3-4, 5-6', '1-2 rest days per week are recommended for general fitness to allow for recovery.'),
    (70, 'What is the main purpose of cross-training?', 'Enhance recovery through varied exercises', 'Avoid all cardio exercises, Only focus on strength training, Only perform high-intensity workouts', 'Cross-training enhances recovery by incorporating varied exercises.'),
    (71, 'What does "AMRAP" stand for?', 'As Many Reps As Possible', 'As Many Rounds As Possible, Always Move Rapidly And Powerfully, Accelerate Muscle Recovery And Performance', 'AMRAP stands for As Many Reps As Possible, a workout style where you perform as many repetitions as possible in a set time.'),
    (72, 'Which training style focuses on working to muscle fatigue with lighter weights?', 'High-Volume Training', 'Strength Training, Endurance Training, Low Reps, High Weight', 'High-volume training involves working to muscle fatigue with lighter weights.'),
    (73, 'What is a “superset”?', 'Two exercises performed back-to-back without rest', 'A rest period between exercises, The highest set of weights, A stretching routine', 'A superset involves performing two exercises back-to-back without rest.'),
    (74, 'Which term describes muscle building through lifting weights?', 'Hypertrophy', 'Aerobic exercise, Cardio, Endurance', 'Hypertrophy refers to muscle building through lifting weights.'),
    (75, 'Which is an example of plyometric training?', 'Jump Squat', 'Squat, Deadlift, Push-Up', 'A jump squat is a plyometric exercise that involves explosive movements.'),
    (76, 'Which piece of equipment is best for targeting balance?', 'BOSU Ball', 'Treadmill, Bench, Dumbbell', 'A BOSU ball is used to target and improve balance.'),
    (77, 'What is the main purpose of using resistance bands?', 'Strengthen muscles', 'Increase mobility, Reduce flexibility, Add weight for cardio', 'Resistance bands are used to strengthen muscles.'),
    (78, 'Which exercise best targets the obliques?', 'Bicycle Crunch', 'Crunch, Deadlift, Push-Up', 'Bicycle crunches are effective for targeting the oblique muscles.'),
    (79, 'What does "PR" stand for in weightlifting?', 'Personal Record', 'Progressive Resistance, Push Repetitions, Performance Rest', 'PR stands for Personal Record, referring to the best performance in a specific exercise.'),
    (80, 'What is circuit training?', 'Performing multiple exercises in succession with minimal rest', 'Resting between each exercise, Only lifting heavy weights, Running on a track', 'Circuit training involves performing multiple exercises in succession with minimal rest.'),
    (81, 'What is the primary benefit of consuming protein post-workout?', 'Speed muscle recovery', 'Increase fat storage, Boost metabolism, Improve flexibility', 'Consuming protein post-workout helps speed muscle recovery.'),
    (82, 'Which nutrient is most important for long-distance runners?', 'Carbohydrates', 'Protein, Fat, Vitamins', 'Carbohydrates are crucial for long-distance runners as they provide sustained energy.'),
    (83, 'What should a person prioritize after a workout to aid recovery?', 'Carbs and protein', 'Fats and vitamins, Sugars only, Fiber and protein', 'Consuming carbs and protein after a workout aids in recovery and muscle repair.');



-- Sample Queries

-- 1. Retrieve all users and their workouts
SELECT u.id, u.email, w.name AS workout_name, w.description, w.is_public
FROM Users u
JOIN Workout w ON u.id = w.id;

-- 2. Find all exercises in a specific workout (e.g., "Push Day")
SELECT w.name AS workout_name, e.name AS exercise_name, we.sets, we.reps, we.rest_time
FROM Workout w
JOIN WorkoutExercises we ON w.id = we.id
JOIN Exercise e ON we.id = e.id
WHERE w.name = 'Push Day';

-- 3. Retrieve all quizzes for a specific exercise (e.g., "Push-Up")
SELECT e.name AS exercise_name, q.question, q.correct_answer, q.incorrect_answers
FROM Exercise e
JOIN Quiz q ON e.id = q.id
WHERE e.name = 'Push-Up';

-- 4. List all public workouts with their exercises
SELECT w.name AS workout_name, e.name AS exercise_name, we.sets, we.reps
FROM Workout w
JOIN WorkoutExercises we ON w.id = we.id
JOIN Exercise e ON we.id = e.id
WHERE w.is_public = TRUE;

-- 5. Get all workouts created by a specific user (e.g., userId = 2)
SELECT w.name AS workout_name, w.description
FROM Workout w
WHERE w.id = 2;

-- 6. Find all exercises and their muscle groups
SELECT name AS exercise_name, muscle_group
FROM Exercise;

-- 7. Retrieve all quiz questions related to "Chest" exercises
SELECT q.question, q.correct_answer, q.incorrect_answers
FROM Quiz q
JOIN Exercise e ON q.id = e.id
WHERE e.muscle_group = 'Chest';