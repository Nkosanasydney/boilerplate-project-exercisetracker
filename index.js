const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const User = require("./models/User");
const Exercise = require("./models/Exercise");

const app = express();

/* ======================
   MIDDLEWARE
====================== */
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/* ======================
   DATABASE CONNECTION
====================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

/* ======================
   HOME
====================== */
app.get("/", (req, res) => {
  res.send("Exercise Tracker API running");
});

/* ======================
   CREATE USER
====================== */
app.post("/api/users", async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.save();

    res.json({
      username: user.username,
      _id: user._id
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

/* ======================
   GET USERS
====================== */
app.get("/api/users", async (req, res) => {
  const users = await User.find({}, { __v: 0 });
  res.json(users);
});

/* ======================
   ADD EXERCISE
====================== */
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.json({ error: "User not found" });

    const dateValue = req.body.date
      ? new Date(req.body.date)
      : new Date();

    const exercise = new Exercise({
      userId: user._id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: dateValue
    });

    await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: dateValue.toDateString()
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

/* ======================
   GET LOGS
====================== */
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.json({ error: "User not found" });

    let exercises = await Exercise.find({ userId: user._id });

    // FILTER FROM / TO
    if (req.query.from || req.query.to) {
      const from = req.query.from ? new Date(req.query.from) : null;
      const to = req.query.to ? new Date(req.query.to) : null;

      exercises = exercises.filter(ex => {
        const d = new Date(ex.date);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    // LIMIT
    if (req.query.limit) {
      exercises = exercises.slice(0, Number(req.query.limit));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: new Date(ex.date).toDateString()
      }))
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

/* ======================
   START SERVER (IMPORTANT)
====================== */
const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});