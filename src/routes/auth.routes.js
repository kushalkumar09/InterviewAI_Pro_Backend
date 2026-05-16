import express from "express";
import User from "../models/User.js";
import { createToken, hashPassword, verifyPassword } from "../utils/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { fullName = "", email, password } = req.body;
    if (!email || !password || !fullName.trim()) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const user = await User.create({
      firstName,
      lastName: rest.join(" "),
      email,
      passwordHash: hashPassword(password),
    });

    res.status(201).json({ token: createToken(user._id), user: user.toClient() });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ token: createToken(user._id), user: user.toClient() });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toClient() });
});

export default router;
