import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Interview from "../models/Interview.js";
import Report from "../models/Report.js";
import { buildReportPayload } from "../services/reportService.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { role, jobDescription, difficulty, focusAreas, aiInstructions, resumeName } = req.body;
    if (!role?.trim()) {
      return res.status(400).json({ message: "Target role is required" });
    }

    const interview = await Interview.create({
      user: req.user._id,
      role,
      jobDescription,
      difficulty,
      focusAreas,
      aiInstructions,
      resumeName,
      status: "ready",
    });

    res.status(201).json({ interview });
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ interviews });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/complete", requireAuth, async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    let report = await Report.findOne({ interview: interview._id, user: req.user._id });
    if (!report) {
      report = await Report.create({
        user: req.user._id,
        interview: interview._id,
        ...buildReportPayload(interview),
      });
    }

    interview.status = "completed";
    interview.completedAt = new Date();
    await interview.save();

    req.user.currentXP += 250;
    if (req.user.currentXP >= req.user.nextLevelXP) {
      req.user.level += 1;
      req.user.currentXP -= req.user.nextLevelXP;
      req.user.nextLevelXP += 500;
    }
    req.user.rankTitle = req.user.level >= 10 ? "Lead Architect Candidate" : "Rising Candidate";
    await req.user.save();

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

export default router;
