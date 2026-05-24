import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { buildJobInsights, buildResumeInsights } from "./textInsightService.js";

const modelName = process.env.GEMINI_TEXT_MODEL || "gemini-1.5-flash";
const maxInputChars = 18000;

const stringArraySchema = {
  type: SchemaType.ARRAY,
  items: { type: SchemaType.STRING },
};

const resumeSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    skills: stringArraySchema,
    experienceSignals: stringArraySchema,
    highlights: stringArraySchema,
  },
  required: ["summary", "skills", "experienceSignals", "highlights"],
};

const jobSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    company: { type: SchemaType.STRING },
    skills: stringArraySchema,
    responsibilities: stringArraySchema,
    seniority: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    suggestedFocusAreas: stringArraySchema,
  },
  required: ["title", "company", "skills", "responsibilities", "seniority", "summary", "suggestedFocusAreas"],
};

const getModel = (responseSchema) => {
  if (!process.env.GEMINI_API_KEY) return null;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1200,
      responseMimeType: "application/json",
      responseSchema,
    },
  });
};

const compactText = (text = "") => text.replace(/\s+/g, " ").trim().slice(0, maxInputChars);

const safeArray = (value, limit = 12) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, limit);
};

const safeString = (value, limit = 700) => String(value || "").trim().slice(0, limit);

const parseModelJson = (text = "") => {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
};

const generateJson = async (prompt, schema) => {
  const model = getModel(schema);
  if (!model) return null;

  const result = await model.generateContent(prompt);
  return parseModelJson(result.response.text());
};

export const buildAiResumeInsights = async (text = "") => {
  const fallback = buildResumeInsights(text);
  if (!fallback.extractedText) return fallback;

  try {
    const ai = await generateJson(
      [
        "Extract structured interview-prep insights from this resume.",
        "Return only JSON matching the schema.",
        "Keep skills normalized and concise. Do not invent facts.",
        `Resume text: ${compactText(text)}`,
      ].join("\n\n"),
      resumeSchema
    );

    if (!ai) return fallback;

    return {
      ...fallback,
      summary: safeString(ai.summary) || fallback.summary,
      skills: safeArray(ai.skills),
      experienceSignals: safeArray(ai.experienceSignals, 8),
      highlights: safeArray(ai.highlights, 8),
      extractionSource: "ai",
    };
  } catch (error) {
    console.warn("[AI Insights] Resume extraction fallback:", error.message);
    return fallback;
  }
};

export const buildAiJobInsights = async (text = "", fallbackRole = "") => {
  const fallback = buildJobInsights(text, fallbackRole);
  if (!compactText(`${text} ${fallbackRole}`)) return fallback;

  try {
    const ai = await generateJson(
      [
        "Extract structured interview-prep insights from this job description.",
        "Return only JSON matching the schema.",
        "Use the provided fallback role if the job title is unclear. Do not invent a company.",
        `Fallback role: ${fallbackRole}`,
        `Job description: ${compactText(text)}`,
      ].join("\n\n"),
      jobSchema
    );

    if (!ai) return fallback;

    return {
      title: safeString(ai.title, 160) || fallback.title,
      company: safeString(ai.company, 160),
      skills: safeArray(ai.skills),
      responsibilities: safeArray(ai.responsibilities, 8),
      seniority: safeString(ai.seniority, 80) || fallback.seniority,
      summary: safeString(ai.summary) || fallback.summary,
      suggestedFocusAreas: safeArray(ai.suggestedFocusAreas, 6),
      extractionSource: "ai",
    };
  } catch (error) {
    console.warn("[AI Insights] Job extraction fallback:", error.message);
    return fallback;
  }
};
