import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        required: true
    },
    roundType: {
        type: String,
        enum: ['technical', 'hr'],
        default: 'technical'
    },
    questionCount: {
        type: Number,
        default: 5
    },
    questions: [
        {
            questionId: { type: Number, required: true },
            questionText: { type: String, required: true }
        }
    ],
    answers: [
        {
            questionId: { type: Number, required: true },
            answerText: { type: String, required: true }
        }
    ],
    feedback: [
        {
            questionId: { type: Number, required: true },
            rating: { type: Number, required: true },
            feedbackText: { type: String, required: true },
            idealAnswer: { type: String, required: true }
        }
    ],
    analyticalScores: {
        confidence: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        correctness: { type: Number, default: 0 },
        technicalAccuracy: { type: Number, default: 0 },
        problemSolving: { type: Number, default: 0 }
    },
    recommendations: {
        strengths: [String],
        weaknesses: [String],
        improvementAreas: { type: String, default: "" },
        learningTopics: [String],
        prepPlan: { type: String, default: "" }
    },
    score: {
        type: Number,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
