const skillCatalog = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "REST",
  "Python",
  "Java",
  "C++",
  "System Design",
  "Microservices",
  "Redis",
  "CI/CD",
  "Testing",
  "Leadership",
  "Communication",
];

const seniorityTerms = [
  { label: "Staff / Lead", pattern: /\b(staff|principal|lead|architect)\b/i },
  { label: "Senior", pattern: /\bsenior|sr\.\b/i },
  { label: "Mid-Level", pattern: /\bmid[- ]?level|intermediate\b/i },
  { label: "Junior", pattern: /\bjunior|entry[- ]?level|graduate\b/i },
];

const cleanText = (text = "") => text.replace(/\s+/g, " ").trim();

const unique = (items) => [...new Set(items.filter(Boolean))];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const extractSkills = (text = "") => {
  const normalized = text.toLowerCase();
  return skillCatalog.filter((skill) => {
    const value = escapeRegex(skill.toLowerCase());
    return new RegExp(`(?<![a-z0-9])${value}(?![a-z0-9])`, "i").test(normalized);
  });
};

const getFirstMatchingLines = (text, patterns, limit = 4) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 24 && line.length < 220);

  return lines.filter((line) => patterns.some((pattern) => pattern.test(line))).slice(0, limit);
};

export const buildResumeInsights = (text = "") => {
  const cleaned = cleanText(text);
  const skills = extractSkills(cleaned);
  const experienceSignals = getFirstMatchingLines(text, [
    /\b(built|created|developed|implemented|designed|led|owned|launched|improved|optimized)\b/i,
    /\b\d+%|\b\d+\+|\b\d+ years?\b/i,
  ]);

  return {
    extractedText: cleaned.slice(0, 20000),
    summary: cleaned
      ? cleaned.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2).join(" ").slice(0, 500)
      : "",
    skills,
    experienceSignals,
    highlights: experienceSignals,
    extractionSource: "fallback",
  };
};

export const buildJobInsights = (text = "", fallbackRole = "") => {
  const cleaned = cleanText(text);
  const skills = extractSkills(cleaned);
  const responsibilities = getFirstMatchingLines(text, [
    /\b(responsible|build|develop|design|lead|own|collaborate|implement|maintain|scale)\b/i,
  ]);
  const seniority = seniorityTerms.find((item) => item.pattern.test(`${fallbackRole} ${cleaned}`))?.label || "";

  return {
    title: fallbackRole,
    company: "",
    skills,
    responsibilities,
    seniority,
    summary: cleaned
      ? cleaned.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2).join(" ").slice(0, 500)
      : "",
    suggestedFocusAreas: skills.includes("System Design") ? ["System Design", "Technical"] : ["Technical"],
    extractionSource: "fallback",
  };
};

export const buildInterviewContext = (interview) => {
  const resumeSkills = interview.resume?.skills || [];
  const jobSkills = interview.jobInsights?.skills || [];
  const matchedSkills = unique(resumeSkills.filter((skill) => jobSkills.includes(skill)));
  const missingSkills = unique(jobSkills.filter((skill) => !resumeSkills.includes(skill)));

  return {
    role: interview.role,
    difficulty: interview.difficulty,
    focusAreas: interview.focusAreas || [],
    matchedSkills,
    missingSkills,
    resumeSummary: interview.resume?.summary || "",
    jobSummary: interview.jobInsights?.summary || "",
    suggestedFocusAreas: interview.jobInsights?.suggestedFocusAreas || [],
    customInstructions: interview.aiInstructions || "",
  };
};
