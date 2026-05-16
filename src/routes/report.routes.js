import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Report from "../models/Report.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const reports = await Report.find({ user: req.user._id })
      .select("role type overallScore recommendation createdAt")
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json({ report });
  } catch (error) {
    next(error);
  }
});

export default router;
