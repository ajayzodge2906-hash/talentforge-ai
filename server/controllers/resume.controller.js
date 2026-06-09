import { PDFParse } from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Resume from "../models/resume.model.js";

// Helper to clean/parse JSON from Gemini
const parseJSONResponse = (text) => {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
        const firstLineBreak = cleaned.indexOf("\n");
        if (firstLineBreak !== -1) {
            cleaned = cleaned.substring(firstLineBreak + 1);
        } else {
            cleaned = cleaned.replace(/^```[a-zA-Z]*/, "");
        }
    }
    if (cleaned.endsWith("```")) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
};

export const uploadResume = async (req, res) => {
    try {
        const userId = req.userId;
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded. Please upload a PDF resume." });
        }

        // Verify file is PDF
        if (req.file.mimetype !== "application/pdf") {
            return res.status(400).json({ message: "Invalid file type. Only PDF files are supported." });
        }

        // Parse PDF buffer
        let pdfText = "";
        const parser = new PDFParse({ data: req.file.buffer });
        try {
            const textResult = await parser.getText();
            pdfText = textResult.text;
        } catch (parseErr) {
            console.error("PDF Parsing error:", parseErr);
            return res.status(400).json({ message: "Failed to parse PDF file. Ensure the file is not password protected." });
        } finally {
            await parser.destroy();
        }

        if (!pdfText.trim()) {
            return res.status(400).json({ message: "The uploaded PDF appears to be empty or contains non-scannable scanned images." });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "Gemini API key is not configured on the server." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
You are an expert ATS (Applicant Tracking System) parser and technical recruiter.
First, determine if the following text represents a professional resume, curriculum vitae (CV), or career profile.
Text to check:
"${pdfText}"

Return the parsed details STRICTLY in JSON format. Do not wrap in Markdown formatting, do not write explaining text.
The JSON object MUST have exactly these fields:
1. "isResume": boolean (strictly true if the text represents a professional resume or curriculum vitae, and false if it represents something else like a travel itinerary, recipe, invoice, general textbook page, book, flight booking etc.)
2. "rejectionReason": string (if isResume is false, provide a polite, specific explanation of what the document appears to be instead of a resume. If isResume is true, this can be an empty string.)
3. "skills": a JSON array of strings containing technical/professional skills (return empty array if isResume is false)
4. "projects": a JSON array of objects, each containing "title" and "description" (return empty array if isResume is false)
5. "experience": a JSON array of objects, each containing "company", "role", and "duration" (return empty array if isResume is false)
6. "education": a JSON array of objects, each containing "degree" and "school" (return empty array if isResume is false)
7. "atsScore": a number from 0 to 100 representing standard ATS compatibility score. Base this score on keyword density, standard section headers, presence of contact details, and role descriptions (return 0 if isResume is false).
8. "feedback": a single detailed string outlining a comprehensive ATS evaluation. You must structure this string with clear, readable bulleted sections (return empty string if isResume is false):
   
   POSITIVES:
   - Highlight the strong aspects of the resume (e.g. modern skill sets, clear font styles, solid educational credentials).
   
   NEGATIVES & GAPS:
   - Highlight what was weak or missing (e.g. lack of quantified achievements like percentages or revenue, brief project explanations).
   
   ATS SCORE REDUCTIONS:
   - Explain why the ATS score was reduced (e.g. non-standard section names, missing keywords, low description density).
   
   IMPROVEMENT ACTION PLAN:
   - Provide concrete, step-by-step tips to raise the score (e.g. use action verbs, add links to GitHub/LinkedIn, align formatting).
   
   Please use bullet points, capitalization, and clear line breaks in this string to make it easy to read.

Do not include any extra fields or text.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        let parsedJSON;
        try {
            parsedJSON = parseJSONResponse(responseText);
        } catch (jsonErr) {
            console.error("Failed to parse Gemini resume response:", responseText, jsonErr);
            return res.status(500).json({ message: "AI failed to analyze your resume text. Please try again with a cleaner format." });
        }

        // Strictly check if document is actually a resume
        if (parsedJSON.isResume === false) {
            return res.status(400).json({ 
                message: parsedJSON.rejectionReason || "The uploaded document does not appear to be a professional resume or curriculum vitae." 
            });
        }

        // Create new resume analysis to keep history log
        const resume = await Resume.create({
            userId,
            fileName: req.file.originalname,
            skills: parsedJSON.skills || [],
            projects: parsedJSON.projects || [],
            experience: parsedJSON.experience || [],
            education: parsedJSON.education || [],
            atsScore: parsedJSON.atsScore || 0,
            feedback: parsedJSON.feedback || ""
        });

        return res.status(200).json(resume);

    } catch (error) {
        console.error("uploadResume error:", error);
        return res.status(500).json({ message: `Failed to analyze resume: ${error.message}` });
    }
};

export const getResume = async (req, res) => {
    try {
        const userId = req.userId;
        // Return latest resume analysis
        const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
        if (!resume) {
            return res.status(404).json({ message: "No resume analysis found. Upload a resume to start." });
        }
        return res.status(200).json(resume);
    } catch (error) {
        console.error("getResume error:", error);
        return res.status(500).json({ message: `Failed to fetch resume: ${error.message}` });
    }
};

export const getResumeHistory = async (req, res) => {
    try {
        const userId = req.userId;
        // Fetch all resumes, only returning required metadata for history listing
        const history = await Resume.find({ userId }).select("fileName atsScore createdAt").sort({ createdAt: -1 });
        return res.status(200).json(history);
    } catch (error) {
        console.error("getResumeHistory error:", error);
        return res.status(500).json({ message: `Failed to fetch resume history: ${error.message}` });
    }
};

export const getResumeById = async (req, res) => {
    try {
        const { id } = req.params;
        const resume = await Resume.findById(id);
        if (!resume) {
            return res.status(404).json({ message: "Resume analysis not found." });
        }
        // Access security: Ensure the resume belongs to the user
        if (resume.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized access to this resume analysis." });
        }
        return res.status(200).json(resume);
    } catch (error) {
        console.error("getResumeById error:", error);
        return res.status(500).json({ message: `Failed to fetch resume details: ${error.message}` });
    }
};

export const deleteResume = async (req, res) => {
    try {
        const { id } = req.params;
        const resume = await Resume.findById(id);
        if (!resume) {
            return res.status(404).json({ message: "Resume analysis not found." });
        }
        // Access security: Ensure the resume belongs to the user
        if (resume.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized to delete this resume analysis." });
        }
        await Resume.findByIdAndDelete(id);
        return res.status(200).json({ message: "Resume analysis deleted successfully." });
    } catch (error) {
        console.error("deleteResume error:", error);
        return res.status(500).json({ message: `Failed to delete resume: ${error.message}` });
    }
};
