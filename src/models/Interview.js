import mongoose from "mongoose";

const InterviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true, trim: true },
    jobDescription: { type: String, default: "" },
    difficulty: { type: String, default: "Mid-Level" },
    focusAreas: [{ type: String }],
    aiInstructions: { type: String, default: "" },
    resumeName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "ready", "completed"],
      default: "ready",
    },
    scheduledFor: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", InterviewSchema);
