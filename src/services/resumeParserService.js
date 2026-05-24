import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { httpError } from "../utils/httpError.js";

export const parseResumeBuffer = async (file) => {
  if (!file) return "";

  if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const parsed = await parser.getText();
      return parsed.text || "";
    } finally {
      await parser.destroy();
    }
  }

  if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.originalname.toLowerCase().endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value || "";
  }

  if (file.mimetype === "text/plain" || file.originalname.toLowerCase().endsWith(".txt")) {
    return file.buffer.toString("utf8");
  }

  throw httpError(400, "Unsupported resume format. Upload a PDF, DOCX, or TXT file.");
};
