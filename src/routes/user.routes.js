import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/settings", requireAuth, (req, res) => {
  res.json({ user: req.user.toClient() });
});

router.put("/settings", requireAuth, async (req, res, next) => {
  try {
    const { profileData = {}, preferences = {}, notifications = {} } = req.body;

    Object.assign(req.user, {
      firstName: profileData.firstName ?? req.user.firstName,
      lastName: profileData.lastName ?? req.user.lastName,
      targetRole: profileData.targetRole ?? req.user.targetRole,
      experience: profileData.experience ?? req.user.experience,
      preferences: { ...req.user.preferences.toObject(), ...preferences },
      notifications: { ...req.user.notifications.toObject(), ...notifications },
    });

    await req.user.save();
    res.json({ user: req.user.toClient() });
  } catch (error) {
    next(error);
  }
});

router.get("/achievements", requireAuth, async (req, res, next) => {
  try {
    const reportsCount = await req.app.locals.models.Report.countDocuments({ user: req.user._id });
    const topReport = await req.app.locals.models.Report.findOne({ user: req.user._id }).sort({ overallScore: -1 });
    const topScore = topReport?.overallScore || 0;

    const achievements = [
      {
        id: 1,
        title: "First Steps",
        description: "Complete your first AI mock interview.",
        unlocked: reportsCount >= 1,
        date: topReport?.createdAt,
      },
      {
        id: 2,
        title: "On Fire",
        description: "Maintain a 5-day interview practice streak.",
        unlocked: req.user.streak >= 5,
        date: req.user.updatedAt,
      },
      {
        id: 3,
        title: "System Design Guru",
        description: "Score over 85% in a System Design specific session.",
        unlocked: topScore >= 85,
        date: topReport?.createdAt,
      },
      {
        id: 4,
        title: "Perfectionist",
        description: "Achieve an overall score of 95% or higher.",
        unlocked: topScore >= 95,
        date: topReport?.createdAt,
      },
    ];

    res.json({
      stats: {
        level: req.user.level,
        currentXP: req.user.currentXP,
        nextLevelXP: req.user.nextLevelXP,
        streak: req.user.streak,
        interviewsCompleted: reportsCount,
        topScore,
        rankTitle: req.user.rankTitle,
      },
      achievements,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
