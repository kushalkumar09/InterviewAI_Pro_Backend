import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    interview: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", required: true },
    role: { type: String, required: true },
    type: { type: String, default: "Full Mock" },
    overallScore: { type: Number, required: true },
    recommendation: { type: String, required: true },
    pillars: [
      {
        name: String,
        score: Number,
        color: String,
      },
    ],
    feedback: {
      strengths: [String],
      improvements: [String],
    },
    roadmap: [
      {
        area: String,
        priority: String,
        reason: String,
        resources: [
          {
            title: String,
            channel: String,
            duration: String,
            url: String,
            thumb: String,
          },
        ],
        exercises: [String],
      },
    ],
    transcript: [
      {
        role: { type: String, enum: ["ai", "user"] },
        text: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Report", ReportSchema);
