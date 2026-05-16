import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Interview from "../models/Interview.js";
import Report from "../models/Report.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [reportsCount, reports, upcoming] = await Promise.all([
      Report.countDocuments({ user: req.user._id }),
      Report.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
      Interview.find({ user: req.user._id, status: { $ne: "completed" } }).sort({ createdAt: -1 }).limit(4),
    ]);

    const topScore = reports.reduce((best, report) => Math.max(best, report.overallScore), 0);
    const averageScore = reports.length
      ? Math.round(reports.reduce((sum, report) => sum + report.overallScore, 0) / reports.length)
      : 0;

    res.json({
      user: req.user.toClient(),
      stats: {
        streak: req.user.streak,
        level: req.user.level,
        currentXP: req.user.currentXP,
        nextLevelXP: req.user.nextLevelXP,
        interviewsCompleted: reportsCount,
        badgesUnlocked: Math.min(8, Math.max(1, reportsCount + (topScore >= 85 ? 2 : 0))),
        topScore,
        averageScore,
      },
      upcoming,
      recentReports: reports,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
