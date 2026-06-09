import { GoogleGenerativeAI } from "@google/generative-ai";
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";

// Helper function to extract JSON block safely from Gemini response
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

export const createInterview = async (req, res) => {
    try {
        const { role, description, experience, questionCount, roundType } = req.body;
        const userId = req.userId;

        if (!role || !description || experience === undefined) {
            return res.status(400).json({ message: "Missing required fields: role, description, and experience" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.credits < 10) {
            return res.status(400).json({ message: "Insufficient credits. You need at least 10 credits to start an interview." });
        }

        const count = Number(questionCount) || 5;
        if (![5, 10, 15].includes(count)) {
            return res.status(400).json({ message: "Invalid question count. Choose 5, 10, or 15." });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "Gemini API key is not configured on the server." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = roundType === 'hr' ? `
Generate exactly ${count} HR, behavioral, situational, and cultural fit interview questions for a candidate applying for: "${role}".
Candidate's Years of Experience: ${experience} years.
Target Company / Culture Context: "${description}".

Return the questions STRICTLY in JSON format as a JSON array of objects. Do not wrap in Markdown formatting, do not write any explaining text. 
Each object in the array MUST have exactly these two fields:
- "questionId": a number starting from 1 to ${count}
- "questionText": the question itself as a string

Ensure the questions are challenging, suitable for the experience level, and cover teamwork, problem resolution, culture fit, career aspiration, and situational scenarios.
` : `
Generate exactly ${count} technical, project-based, behavioral, and HR interview questions for a candidate applying for: "${role}".
Candidate's Years of Experience: ${experience} years.
Job Description / Required Skills: "${description}".

Return the questions STRICTLY in JSON format as a JSON array of objects. Do not wrap in Markdown formatting, do not write any explaining text. 
Each object in the array MUST have exactly these two fields:
- "questionId": a number starting from 1 to ${count}
- "questionText": the question itself as a string

Ensure the questions are challenging, suitable for the experience level, and cover coding, core concepts, and behavioral aspects.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        let questionsList;
        try {
            questionsList = parseJSONResponse(responseText);
            if (!Array.isArray(questionsList) || questionsList.length === 0) {
                throw new Error("Response is not a valid non-empty array");
            }
        } catch (parseError) {
            console.error("Failed to parse questions JSON:", responseText, parseError);
            return res.status(500).json({ message: "Failed to generate interview questions. Please try again." });
        }

        // Deduct credits
        user.credits -= 10;
        await user.save();

        const interview = await Interview.create({
            userId,
            role,
            description,
            experience,
            roundType: roundType || 'technical',
            questionCount: count,
            questions: questionsList,
            answers: [],
            feedback: [],
            analyticalScores: {
                confidence: 0,
                communication: 0,
                correctness: 0,
                technicalAccuracy: 0,
                problemSolving: 0
            },
            recommendations: {
                strengths: [],
                weaknesses: [],
                improvementAreas: "",
                learningTopics: [],
                prepPlan: ""
            },
            score: 0,
            isCompleted: false
        });

        return res.status(201).json(interview);

    } catch (error) {
        console.error("createInterview error:", error);
        return res.status(500).json({ message: `Failed to start interview: ${error.message}` });
    }
};

export const submitInterview = async (req, res) => {
    try {
        const { interviewId, answers } = req.body;
        const userId = req.userId;

        if (!interviewId || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: "Missing required fields: interviewId and answers" });
        }

        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        if (interview.userId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized access to this interview" });
        }

        if (interview.isCompleted) {
            return res.status(400).json({ message: "This interview has already been submitted and graded" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "Gemini API key is not configured on the server." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Map questions and answers for prompt input
        const evaluationPayload = interview.questions.map(q => {
            const userAnswerObj = answers.find(a => a.questionId === q.questionId);
            return {
                questionId: q.questionId,
                questionText: q.questionText,
                userAnswer: userAnswerObj ? userAnswerObj.answerText : "[No answer provided]"
            };
        });

        const prompt = `
You are an expert interviewer and hiring manager.
Role applied for: "${interview.role}"
Years of experience: ${interview.experience}
Job Description / Context: "${interview.description}"
${interview.roundType === 'hr' ? 'This is an HR & Behavioral interview round. Focus your evaluation and grading feedback on communication fluency, behavioral correctness, emotional intelligence, teamwork alignment, and situational responses.' : 'This is a Technical & Coding interview round. Focus on technical correctness, language concepts, system details, coding practices, and problem solving.'}

Evaluate the candidate's answers to the following questions:
${JSON.stringify(evaluationPayload, null, 2)}

Grade overall performance out of 100, calculate five core analytical sub-scores out of 10, provide question-wise feedback, and make career preparation recommendations.
Return your response STRICTLY as a single JSON object. Do not wrap the JSON in Markdown formatting, do not write any explaining text.

The JSON object MUST have exactly these fields:
1. "score": a number from 0 to 100 (overall rating)
2. "analyticalScores": a JSON object containing:
   - "confidence": number from 0 to 10
   - "communication": number from 0 to 10
   - "correctness": number from 0 to 10
   - "technicalAccuracy": number from 0 to 10
   - "problemSolving": number from 0 to 10
3. "feedback": a JSON array of objects, one for each question, containing:
   - "questionId": a number matching the questionId
   - "rating": a number from 1 to 10 for the user's answer quality
   - "feedbackText": constructive feedback string (what was good, what was missing, how to improve)
   - "idealAnswer": a brief, optimal answer guide or code snippet
4. "recommendations": a JSON object containing:
   - "strengths": a JSON array of strings (e.g. ["Good JavaScript loops", "Clear behavioral articulation"])
   - "weaknesses": a JSON array of strings (e.g. ["Missed database indexes", "Lacks React Hooks details"])
   - "improvementAreas": a string summarizing key focus areas
   - "learningTopics": a JSON array of strings (suggested topics to study)
   - "prepPlan": a string outlining a personalized interview preparation roadmap

Do not include extra text, annotations, or formatting.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        let evaluationResult;
        try {
            evaluationResult = parseJSONResponse(responseText);
            if (evaluationResult.score === undefined || 
                !evaluationResult.analyticalScores || 
                !Array.isArray(evaluationResult.feedback) || 
                !evaluationResult.recommendations) {
                throw new Error("Missing key evaluation fields in response");
            }
        } catch (parseError) {
            console.error("Failed to parse evaluation JSON:", responseText, parseError);
            return res.status(500).json({ message: "Failed to evaluate interview answers. Please try again." });
        }

        // Save progress, answers and feedback
        interview.answers = answers.map(a => ({
            questionId: a.questionId,
            answerText: a.answerText
        }));
        
        interview.feedback = evaluationResult.feedback.map(f => ({
            questionId: f.questionId,
            rating: f.rating,
            feedbackText: f.feedbackText,
            idealAnswer: f.idealAnswer
        }));

        interview.analyticalScores = {
            confidence: evaluationResult.analyticalScores.confidence || 0,
            communication: evaluationResult.analyticalScores.communication || 0,
            correctness: evaluationResult.analyticalScores.correctness || 0,
            technicalAccuracy: evaluationResult.analyticalScores.technicalAccuracy || 0,
            problemSolving: evaluationResult.analyticalScores.problemSolving || 0
        };

        interview.recommendations = {
            strengths: evaluationResult.recommendations.strengths || [],
            weaknesses: evaluationResult.recommendations.weaknesses || [],
            improvementAreas: evaluationResult.recommendations.improvementAreas || "",
            learningTopics: evaluationResult.recommendations.learningTopics || [],
            prepPlan: evaluationResult.recommendations.prepPlan || ""
        };

        interview.score = evaluationResult.score;
        interview.isCompleted = true;

        await interview.save();

        return res.status(200).json(interview);

    } catch (error) {
        console.error("submitInterview error:", error);
        return res.status(500).json({ message: `Failed to submit interview: ${error.message}` });
    }
};

export const getInterviews = async (req, res) => {
    try {
        const userId = req.userId;
        const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json(interviews);
    } catch (error) {
        console.error("getInterviews error:", error);
        return res.status(500).json({ message: `Failed to fetch interviews: ${error.message}` });
    }
};

export const getInterviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const interview = await Interview.findById(id);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        if (interview.userId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized access to this interview" });
        }

        return res.status(200).json(interview);
    } catch (error) {
        console.error("getInterviewById error:", error);
        return res.status(500).json({ message: `Failed to fetch interview details: ${error.message}` });
    }
};
