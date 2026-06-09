import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    skills: [String],
    projects: [
        {
            title: String,
            description: String
        }
    ],
    experience: [
        {
            company: String,
            role: String,
            duration: String
        }
    ],
    education: [
        {
            degree: String,
            school: String
        }
    ],
    atsScore: {
        type: Number,
        default: 0
    },
    feedback: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
