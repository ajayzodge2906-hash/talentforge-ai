# TalentForge AI — Next-Gen AI Interview Preparation & ATS Resume Analyzer

**TalentForge AI** is a premium, production-ready MERN SaaS platform integrated with Google Gemini AI, designed to help candidates prepare for domain-specific job interviews and analyze their resume ATS compatibility. It features voice-interactive mock sessions, real-time audio lip-synchronized avatars, deep semantic PDF analysis, and Razorpay-integrated subscription monetization.

---

## 🚀 Key Features

### 🎙️ 1. Interactive AI Mock Interviews
*   **Domain-Tailored Questions**: Dynamically generated mock questions based on the candidate's target job role, skills list, experience level, and question count via Google Gemini.
*   **Voice-Synchronized Event Flow**: Employs the browser Web Speech API for Text-to-Speech (TTS) questions and Speech-to-Text (STT) response dictation.
*   **Dynamic Speech Avatars**: Kiara (female avatar) and Kabir (male avatar) serve as the interviewer. Kiara dynamically swaps between an **idle smile** and a **speaking mouth-movement pose** in sync with the TTS utterance event loop.
*   **Anti-Race Condition Timer**: Implements robust callback triggers ensuring the 90-second response timer initiates only *after* the AI finishes asking the question aloud.

### 📄 2. AI Resume ATS Critique & History
*   **Deep Resume Parsing**: Utilizes `pdf-parse` ESM structure to digest uploaded resumes and extract key text streams.
*   **ATS Score Evaluation**: Gemini AI conducts a comprehensive analysis yielding overall scores, detailed **Positives**, **Negatives & Gaps**, **Score Reduction Reasons**, and an actionable **Improvement Checklist**.
*   **History Logs & Deletion**: A dual-column history interface allowing users to upload multiple resumes, select past reports, and securely delete past records.
*   **Semantic Guardrails**: Auto-detects and blocks non-resume documents (e.g. travel itineraries, text-books, recipe bills) with descriptive rejection reasons at the API gateway level.

### 💳 3. Payment Monetization & Sandbox Simulator
*   **Razorpay Integration**: A full credit-based flow where starting mock sessions consumes 10 credits.
*   **Custom Bank Overlay Simulator**: If API keys are missing, the client invokes a high-fidelity checkout mockup simulating card inputs, UPI portals, bank redirect processing, OTP verification screens, and transaction handlers.

### 🔒 4. Security & Administration
*   **Authentication**: Secure session-cookie authentication utilizing JWT with support for Google Firebase Auth login.
*   **Admin Console**: A designated admin portal showing global server stats, user counts, subscription tiers, and credit distributions.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, Vite 8, Redux Toolkit, Framer Motion, Vanilla Tailwind CSS
*   **Backend**: Node.js, Express.js, JWT Cookie Parser, `multer`
*   **Database**: MongoDB, Mongoose ODM
*   **Integrations**: Google Gemini API, Web Speech API (Browser Synthesis & Recognition), Razorpay SDK, Firebase SDK

---

## ⚙️ Local Setup and Configuration

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB Instance (Local or MongoDB Atlas)
*   Google Gemini API Key

### 1. Server Configuration
Navigate to the server folder and install dependencies:
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory (refer to `.env.example`):
```env
PORT=8000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
```
Start the backend server:
```bash
node index.js
```

### 2. Client Configuration
Navigate to the client folder and install dependencies:
```bash
cd ../client
npm install
```
Create a `.env` file in the `client` directory (refer to `.env.example`):
```env
VITE_FIREBASE_APIKEY=your_firebase_api_key
```
Start the development server:
```bash
npm run dev
```

To compile a production bundle:
```bash
npm run build
```

---

## 🎨 Cohesive Branding Monograms
The site's visual asset pipeline contains consistent personal branding with a custom-designed **AZ** monogram (emerald-to-blue gradient overlay) set on:
*   The browser tab favicon ([favicon.svg](client/public/favicon.svg))
*   The top navigation header brand logo ([Navbar.jsx](client/src/components/Navbar.jsx))
*   The entry Authentication Card headers ([Auth.jsx](client/src/pages/Auth.jsx))

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
