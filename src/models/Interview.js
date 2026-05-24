import mongoose from "mongoose";

const InterviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true, trim: true },
    jobDescription: { type: String, default: "" },
    difficulty: { type: String, default: "Mid-Level" },
    focusAreas: [{ type: String }],
    aiInstructions: { type: String, default: "" },
    resume: {
      originalName: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      size: { type: Number, default: 0 },
      uploadedAt: { type: Date },
      extractedText: { type: String, default: "" },
      summary: { type: String, default: "" },
      skills: [{ type: String }],
      experienceSignals: [{ type: String }],
      highlights: [{ type: String }],
      extractionSource: { type: String, default: "fallback" },
    },
    jobInsights: {
      title: { type: String, default: "" },
      company: { type: String, default: "" },
      skills: [{ type: String }],
      responsibilities: [{ type: String }],
      seniority: { type: String, default: "" },
      summary: { type: String, default: "" },
      suggestedFocusAreas: [{ type: String }],
      extractionSource: { type: String, default: "fallback" },
    },
    status: {
      type: String,
      enum: ["draft", "ready", "in_progress", "completed"],
      default: "ready",
    },
    scheduledFor: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", InterviewSchema);
