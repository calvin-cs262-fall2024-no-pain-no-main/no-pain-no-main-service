const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

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


const saveWorkout = async (req, res) => {
    const { name, description, exercises, userId } = req.body;
    if (!name || !description || !exercises || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Insert workout and get new workout ID
        const workoutResult = await pool.query(
            'INSERT INTO workout (name, description, is_public, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, description, true, userId]
        );
        const workoutId = workoutResult.rows[0].id;

        console.log(`New workout created with ID: ${workoutId}`);

        // Insert into WorkoutExercises
        const workoutExercisesPromises = exercises.map(({ exercise_id }) => {
            return pool.query(
                'INSERT INTO WorkoutExercises (exercise_id, workout_id) VALUES ($1, $2)',
                [exercise_id, workoutId]
            );
        });

        // Insert into UserWorkoutPerformance
        const userWorkoutPerformancePromises = exercises.map(({ exercise_id, performanceData }) => {
            return pool.query(
                'INSERT INTO UserWorkoutPerformance (user_id, exercise_id, workout_id, performance_data) VALUES ($1, $2, $3, $4)',
                [userId, exercise_id, workoutId, JSON.stringify(performanceData)]
            );
        });

        // Await all promises
        await Promise.all([...workoutExercisesPromises, ...userWorkoutPerformancePromises]);

        res.status(201).json({ message: 'Workout created successfully', workoutId });
    } catch (error) {
        console.error('Error saving workout:', error);

        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({ error: 'Invalid user or exercise reference' });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};


const deleteWorkout = async (req, res) => {
    const { workoutId, userId } = req.body; // Expect workoutId and userId in the request body

    if (!workoutId || !userId) {
        return res.status(400).json({ error: 'Missing required fields: workoutId or userId' });
    }

    try {
        // Step 1: Check if the workout exists and belongs to the user
        const workoutCheckResult = await pool.query(
            'SELECT id FROM workout WHERE id = $1 AND user_id = $2',
            [workoutId, userId]
        );

        if (workoutCheckResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workout not found or does not belong to this user' });
        }

        // Step 2: Delete associated records in UserWorkoutPerformance table
        await pool.query(
            'DELETE FROM UserWorkoutPerformance WHERE workout_id = $1 AND user_id = $2',
            [workoutId, userId]
        );

        console.log(`Deleted UserWorkoutPerformance entries for workout ID: ${workoutId}`);

        // Step 3: Delete associated records in WorkoutExercises table
        await pool.query(
            'DELETE FROM workoutexercises WHERE workout_id = $1',
            [workoutId]
        );

        console.log(`Deleted WorkoutExercises entries for workout ID: ${workoutId}`);

        // Step 4: Delete the workout from the workout table
        await pool.query(
            'DELETE FROM workout WHERE id = $1 AND user_id = $2',
            [workoutId, userId]
        );

        console.log(`Deleted workout with ID: ${workoutId}`);

        res.status(200).json({ message: 'Workout and associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getCustomWorkouts = async (req, res) => {
    const userId = req.params.id; // Extract id from the URL parameter

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Step 1: Get all workouts for the user
        const workoutsResult = await pool.query(
            `SELECT w.id, w.name, w.description, w.is_public
             FROM workout w
             WHERE w.user_id = $1`,
            [userId]
        );

        const workouts = workoutsResult.rows;

        if (workouts.length === 0) {
            return res.status(404).json({ message: 'No workouts found for the user' });
        }

        // Step 2: Get performance data for each workout
        const workoutIds = workouts.map(workout => workout.id);
        const performanceResult = await pool.query(
            `SELECT uwp.workout_id, uwp.exercise_id, uwp.performance_data
             FROM UserWorkoutPerformance uwp
             WHERE uwp.user_id = $1 AND uwp.workout_id = ANY($2::int[])`,
            [userId, workoutIds]
        );

        const performanceData = performanceResult.rows;

        // Step 3: Attach performance data to each workout
        const workoutsWithPerformance = workouts.map(workout => {
            const performance = performanceData.filter(
                pd => pd.workout_id === workout.id
            );
            return {
                ...workout,
                exercises: performance.map(pd => ({
                    exercise_id: pd.exercise_id,
                    performance_data: pd.performance_data
                }))
            };
        });

        res.status(200).json(workoutsWithPerformance);
    } catch (error) {
        console.error('Error fetching user workouts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateExerciseData = async (req, res) => {
    const { user_id, workout_id, exercise_id, operation, set_number, reps, weight } = req.body;

    if (!user_id || !workout_id || !exercise_id || !operation) {
        return res.status(400).json({ message: "Missing required parameters" });
    }

    try {
        // Get the current performance data
        const result = await pool.query(
            `SELECT performance_data
            FROM UserWorkoutPerformance
            WHERE user_id = $1 AND workout_id = $2 AND exercise_id = $3`,
            [user_id, workout_id, exercise_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No performance data found for this user, exercise, and workout." });
        }

        let performance_data = result.rows[0].performance_data;

        // Perform the operation based on the type
        switch (operation) {
            case 'add_set':
                if (!set_number || !reps || !weight) {
                    return res.status(400).json({ message: "Missing set_number, reps, or weight for add_set operation" });
                }
                // Add a new set
                performance_data = {
                    ...performance_data,
                    sets: [
                        ...performance_data.sets,
                        { set: set_number, reps, weight }
                    ]
                };
                break;

            case 'delete_set':
                if (!set_number) {
                    return res.status(400).json({ message: "Missing set_number for delete_set operation" });
                }
                // Delete the set by filtering out the specified set_number
                performance_data = {
                    ...performance_data,
                    sets: performance_data.sets.filter(set => set.set !== set_number)
                };
                break;

            case 'update_set':
                if (!set_number || (reps === undefined && weight === undefined)) {
                    return res.status(400).json({ message: "Missing set_number, reps or weight for update_set operation" });
                }
                // Update a set (modify reps or weight based on input)
                performance_data = {
                    ...performance_data,
                    sets: performance_data.sets.map(set => {
                        if (set.set === set_number) {
                            return {
                                ...set,
                                reps: reps !== undefined ? reps : set.reps,
                                weight: weight !== undefined ? weight : set.weight
                            };
                        }
                        return set;
                    })
                };
                break;

            default:
                return res.status(400).json({ message: "Invalid operation. Allowed operations: add_set, delete_set, update_set." });
        }

        // Update the performance data in the database
        await pool.query(
            `UPDATE UserWorkoutPerformance
            SET performance_data = $1
            WHERE user_id = $2 AND workout_id = $3 AND exercise_id = $4`,
            [performance_data, user_id, workout_id, exercise_id]
        );

        return res.status(200).json({ message: "Performance data updated successfully", performance_data });

    } catch (error) {
        console.error("Error updating performance data:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { saveWorkout, deleteWorkout, getCustomWorkouts, updateExerciseData };