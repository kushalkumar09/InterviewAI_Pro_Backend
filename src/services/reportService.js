const clamp = (value, min = 55, max = 96) => Math.max(min, Math.min(max, value));

const scoreFromInterview = (interview) => {
  const focusBoost = Math.min((interview.focusAreas?.length || 0) * 3, 12);
  const jdBoost = interview.jobDescription?.length > 120 ? 6 : 0;
  const difficultyPenalty = {
    Junior: 0,
    "Mid-Level": 4,
    Senior: 8,
    "Staff / Lead": 12,
  }[interview.difficulty] || 4;

  return clamp(76 + focusBoost + jdBoost - difficultyPenalty);
};

export const buildReportPayload = (interview) => {
  const overallScore = scoreFromInterview(interview);
  const hasSystemDesign = interview.focusAreas?.includes("System Design");
  const hasBehavioral = interview.focusAreas?.includes("Behavioral");

  return {
    role: interview.role,
    type: interview.focusAreas?.length === 1 ? `${interview.focusAreas[0]} Only` : "Full Mock",
    overallScore,
    recommendation: overallScore >= 85 ? "Strong Hire" : overallScore >= 72 ? "Hire" : "Needs Practice",
    pillars: [
      { name: "Technical Depth", score: clamp(overallScore + 5), color: "bg-emerald-500" },
      { name: "System Design", score: clamp(overallScore + (hasSystemDesign ? 2 : -8)), color: "bg-blue-500" },
      { name: "Communication", score: clamp(overallScore + (hasBehavioral ? 4 : -2)), color: "bg-purple-500" },
      { name: "Problem Solving", score: clamp(overallScore - 1), color: "bg-amber-500" },
    ],
    feedback: {
      strengths: [
        `Clear alignment with the ${interview.role} role expectations.`,
        "Structured answers with useful trade-off discussion.",
        "Good ability to connect experience with practical implementation details.",
      ],
      improvements: [
        "Add more concrete metrics when describing past project impact.",
        "Tighten long answers into a situation, action, result format.",
        hasSystemDesign
          ? "Go deeper on failure modes, bottlenecks, and operational trade-offs."
          : "Practice one system design prompt to round out the session.",
      ],
    },
    roadmap: [
      {
        area: hasSystemDesign ? "Distributed System Trade-offs" : "Interview Answer Structure",
        priority: "High",
        reason: hasSystemDesign
          ? "The setup emphasized system design, so the next best gain is sharper discussion of scale, consistency, and recovery."
          : "Your answers will score higher when they are concise, measurable, and easy for the interviewer to evaluate.",
        resources: [
          {
            title: "System Design Interview Basics",
            channel: "Interview Prep",
            duration: "8m",
            url: "https://www.youtube.com/results?search_query=system+design+interview+basics",
            thumb: "https://img.youtube.com/vi/dGAgxozNWFE/mqdefault.jpg",
          },
        ],
        exercises: [
          "Record a two-minute answer and remove every repeated phrase.",
          "Write three project impact bullets with numbers and constraints.",
        ],
      },
    ],
    transcript: [
      { role: "ai", text: `Tell me about your experience relevant to a ${interview.role} position.` },
      { role: "user", text: "I walked through my recent work, the technical decisions I owned, and the impact those choices had." },
      { role: "ai", text: "What would you improve if you had more time?" },
      { role: "user", text: "I would add stronger observability, document the trade-offs, and validate the design with load testing." },
    ],
  };
};
