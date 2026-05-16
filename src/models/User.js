import mongoose from "mongoose";

const PreferencesSchema = new mongoose.Schema(
  {
    strictMode: { type: Boolean, default: true },
    aiVoice: { type: String, default: "Nova (Female, Professional)" },
    language: { type: String, default: "English (US)" },
    playbackSpeed: { type: String, default: "Normal (1.0x)" },
  },
  { _id: false }
);

const NotificationsSchema = new mongoose.Schema(
  {
    emailSummaries: { type: Boolean, default: true },
    streakReminders: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: "", trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    targetRole: { type: String, default: "Software Engineer" },
    experience: { type: String, default: "Mid Level (3-5 Yrs)" },
    level: { type: Number, default: 1 },
    currentXP: { type: Number, default: 0 },
    nextLevelXP: { type: Number, default: 1000 },
    streak: { type: Number, default: 1 },
    rankTitle: { type: String, default: "Rising Candidate" },
    preferences: { type: PreferencesSchema, default: () => ({}) },
    notifications: { type: NotificationsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

UserSchema.methods.toClient = function toClient() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    targetRole: this.targetRole,
    experience: this.experience,
    level: this.level,
    currentXP: this.currentXP,
    nextLevelXP: this.nextLevelXP,
    streak: this.streak,
    rankTitle: this.rankTitle,
    preferences: this.preferences,
    notifications: this.notifications,
  };
};

export default mongoose.model("User", UserSchema);
