import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Interview from "../models/Interview.js";
import Report from "../models/Report.js";
import { buildReportPayload } from "../services/reportService.js";

const router = express.Router();

const editableFields = ["role", "jobDescription", "difficulty", "focusAreas", "aiInstructions", "resumeName"];
const allowedSaveStatuses = ["draft", "ready"];

const getInterviewForUser = (id, userId) => Interview.findOne({ _id: id, user: userId });

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { role, jobDescription, difficulty, focusAreas, aiInstructions, resumeName, status = "ready" } = req.body;
    const cleanRole = role?.trim();

    if (!cleanRole) {
      return res.status(400).json({ message: "Target role is required" });
    }
    if (!allowedSaveStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid interview status" });
    }

    const interview = await Interview.create({
      user: req.user._id,
      role: cleanRole,
      jobDescription,
      difficulty,
      focusAreas,
      aiInstructions,
      resumeName,
      status,
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

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const interview = await getInterviewForUser(req.params.id, req.user._id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json({ interview });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const interview = await getInterviewForUser(req.params.id, req.user._id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    if (interview.status === "completed") {
      return res.status(400).json({ message: "Completed interviews cannot be edited" });
    }

    editableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        interview[field] = req.body[field];
      }
    });

    if (req.body.status) {
      if (!allowedSaveStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid interview status" });
      }
      interview.status = req.body.status;
    }

    if (!interview.role?.trim()) {
      return res.status(400).json({ message: "Target role is required" });
    }
    interview.role = interview.role.trim();

    await interview.save();
    res.json({ interview });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/start", requireAuth, async (req, res, next) => {
  try {
    const interview = await getInterviewForUser(req.params.id, req.user._id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    if (interview.status === "completed") {
      return res.status(400).json({ message: "Interview is already completed" });
    }

    interview.status = "in_progress";
    interview.startedAt = interview.startedAt || new Date();
    await interview.save();

    res.json({ interview });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/complete", requireAuth, async (req, res, next) => {
  try {
    const interview = await getInterviewForUser(req.params.id, req.user._id);
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
