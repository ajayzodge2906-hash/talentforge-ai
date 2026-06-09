import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { BsCheckCircle, BsChevronDown, BsChevronUp, BsArrowLeft, BsChatQuote, BsLightbulb, BsFilePdf } from 'react-icons/bs'
import { FaGraduationCap, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import { jsPDF } from 'jspdf'
import { ServerUrl } from '../App'

function InterviewFeedback() {
  const { id } = useParams()
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()

  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [expandedIndex, setExpandedIndex] = useState(0)

  // Auth protection
  useEffect(() => {
    const checkUser = setTimeout(() => {
      if (!userData) navigate('/auth')
    }, 500)
    return () => clearTimeout(checkUser)
  }, [userData, navigate])

  // Fetch Details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`${ServerUrl}/api/interviews/${id}`, { withCredentials: true })
        setInterview(res.data)
        
        if (!res.data.isCompleted) {
          navigate(`/interview/${id}`)
        }
      } catch (err) {
        console.error("Failed to load feedback:", err)
        setErrorMsg("Could not fetch feedback details. Verify your connection or URL.")
      } finally {
        setLoading(false)
      }
    }
    if (userData) {
      fetchDetails()
    }
  }, [id, userData, navigate])

  const getVerdict = (score) => {
    if (score >= 80) return { title: "Excellent Performance", desc: "You demonstrated deep domain knowledge and structured thinking. You are well prepared for live interviews!", color: "text-emerald-400" }
    if (score >= 50) return { title: "Solid Attempt", desc: "You have a good grasp of the fundamentals, but there are a few gaps to fill. Revise the ideal answers to improve.", color: "text-amber-400" }
    return { title: "Practice Needed", desc: "Use this session as a learning baseline. Review the suggestions and code snippets, then try another mock session to improve.", color: "text-red-400" }
  }

  const getCircleColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const generateReportPDF = () => {
    if (!interview) return

    const doc = new jsPDF()

    // Title & Branding Header
    doc.setFillColor(11, 15, 25) // Dark background
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.text("TalentForge AI — Performance Report", 15, 23)
    
    // Candidate Card Details
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Candidate Name: ${userData?.name || 'N/A'}`, 15, 48)
    doc.text(`Email Address: ${userData?.email || 'N/A'}`, 15, 54)
    doc.text(`Target Job Role: ${interview.role}`, 15, 60)
    doc.text(`Experience Level: ${interview.experience} years`, 15, 66)
    doc.text(`Session Date: ${new Date(interview.createdAt).toLocaleDateString()}`, 15, 72)
    
    // Overall score block
    doc.setFillColor(243, 244, 246)
    doc.rect(145, 43, 50, 31, 'F')
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("OVERALL GRADE", 150, 52)
    doc.setFontSize(26)
    doc.setTextColor(16, 185, 129) // Emerald
    doc.text(`${interview.score}%`, 150, 66)
    
    // Horizontal divider
    doc.setDrawColor(229, 231, 235)
    doc.line(15, 80, 195, 80)
    
    // Analytical Sub-Scores
    doc.setTextColor(50, 50, 50)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text("Analytical Performance Scores", 15, 90)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    const subscores = interview.analyticalScores || {}
    doc.text(`Confidence Indicator: ${subscores.confidence || 0} / 10`, 15, 100)
    doc.text(`Communication Fluency: ${subscores.communication || 0} / 10`, 15, 106)
    doc.text(`Correctness Quality: ${subscores.correctness || 0} / 10`, 15, 112)
    doc.text(`Technical Accuracy: ${subscores.technicalAccuracy || 0} / 10`, 15, 118)
    doc.text(`Problem Solving Skills: ${subscores.problemSolving || 0} / 10`, 15, 124)
    
    // Divider
    doc.line(15, 132, 195, 132)

    // Career recommendations
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text("AI Career Recommendations", 15, 142)
    
    const recommendations = interview.recommendations || {}
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`Key Strengths: ${recommendations.strengths?.slice(0, 3).join(', ') || 'N/A'}`, 15, 152)
    doc.text(`Key Weaknesses: ${recommendations.weaknesses?.slice(0, 3).join(', ') || 'N/A'}`, 15, 160)
    
    // Multi-line roadmap text
    const roadmapText = doc.splitTextToSize(`Preparation Roadmap: ${recommendations.prepPlan || 'Review ideal answers.'}`, 180)
    doc.text(roadmapText, 15, 168)
    
    // Add page break for Question Answers
    doc.addPage()
    doc.setFillColor(11, 15, 25)
    doc.rect(0, 0, 210, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Performance Report — Detailed Question Breakdown", 15, 14)
    
    doc.setTextColor(50, 50, 50)
    let yPos = 32
    interview.questions.forEach((q, idx) => {
      if (yPos > 260) {
        doc.addPage()
        yPos = 25
      }

      const answerObj = interview.answers.find(a => a.questionId === q.questionId)
      const feedObj = interview.feedback.find(f => f.questionId === q.questionId)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text(`Question ${idx + 1}: ${q.questionText}`, 15, yPos)
      yPos += 6

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text(`Score: ${feedObj ? feedObj.rating : 0}/10`, 15, yPos)
      yPos += 5

      const ansText = doc.splitTextToSize(`Your Answer: "${answerObj ? answerObj.answerText : 'N/A'}"`, 175)
      doc.text(ansText, 15, yPos)
      yPos += (ansText.length * 4) + 2

      const feedText = doc.splitTextToSize(`Feedback: ${feedObj ? feedObj.feedbackText : 'N/A'}`, 175)
      doc.text(feedText, 15, yPos)
      yPos += (feedText.length * 4) + 6
    })

    // Save document
    doc.save(`talentforge_${interview.role.toLowerCase().replace(/[^a-z0-9]/g, '_')}_report.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (errorMsg || !interview) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans text-gray-150">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl max-w-md">
            <h3 className="font-extrabold text-lg text-red-650 mb-2">Error</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">{errorMsg || "Feedback details unavailable."}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-semibold px-6 py-3 rounded-xl hover:opacity-90 cursor-pointer transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const verdict = getVerdict(interview.score)
  const strokeColor = getCircleColor(interview.score)
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (interview.score / 100) * circumference

  const analyticalScores = interview.analyticalScores || { confidence: 0, communication: 0, correctness: 0, technicalAccuracy: 0, problemSolving: 0 }
  const recommendations = interview.recommendations || { strengths: [], weaknesses: [], improvementAreas: "", learningTopics: [], prepPlan: "" }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans select-none pb-16 text-gray-150">
      <Navbar />

      <div className="w-full max-w-5xl mx-auto px-4 mt-8 flex-1 flex flex-col gap-6">
        
        {/* Navigation / Actions Header */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer backdrop-blur-md"
          >
            <BsArrowLeft size={14} className="text-gray-405" />
            <span>Back to Dashboard</span>
          </button>
          
          <button
            onClick={generateReportPDF}
            className="flex items-center gap-2 bg-gray-950/60 hover:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-xs font-bold px-5 py-3 rounded-xl transition cursor-pointer shadow-xs backdrop-blur-md"
          >
            <BsFilePdf size={14} />
            <span>Download PDF Report</span>
          </button>
        </div>

        {/* Score & Summary Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/40 rounded-3xl p-6 md:p-8 border border-gray-800/80 shadow-lg flex flex-col md:flex-row items-center gap-8 backdrop-blur-md"
        >
          {/* Circular SVG Progress */}
          <div className="relative w-32 h-32 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r={radius} className="stroke-gray-800 fill-transparent" strokeWidth="8" />
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                className="fill-transparent"
                strokeWidth="8"
                stroke={strokeColor}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-extrabold text-2xl text-white">
              <span>{interview.score}%</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Overall</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-emerald-500/20">
              Grading Summary
            </span>
            <h2 className={`font-extrabold text-xl md:text-2xl mt-2 ${verdict.color}`}>
              {verdict.title}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mt-2">
              {verdict.desc}
            </p>
          </div>
        </motion.div>

        {/* Layout Split: Subscores & Recommendations */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Subscores */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex flex-col gap-5 backdrop-blur-md"
          >
            <h3 className="font-extrabold text-white text-base">Core Analytical Sub-Scores</h3>
            <div className="flex flex-col gap-4">
              {Object.entries({
                "Confidence": analyticalScores.confidence,
                "Communication Fluency": analyticalScores.communication,
                "Correctness Accuracy": analyticalScores.correctness,
                "Technical Accuracy": analyticalScores.technicalAccuracy,
                "Problem Solving": analyticalScores.problemSolving
              }).map(([label, val]) => (
                <div key={label} className="flex flex-col gap-1.5 text-xs text-gray-400">
                  <div className="flex justify-between items-center font-semibold text-gray-300">
                    <span>{label}</span>
                    <span>{val || 0} / 10</span>
                  </div>
                  <div className="w-full bg-gray-950 border border-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-blue-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(val || 0) * 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Career Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex flex-col gap-5 backdrop-blur-md"
          >
            <h3 className="font-extrabold text-white text-base">AI Preparation Roadmap</h3>
            
            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                <span className="font-extrabold text-emerald-400 block flex items-center gap-1.5 mb-1.5">
                  <FaCheckCircle /> Strengths
                </span>
                <ul className="list-disc list-inside flex flex-col gap-1 text-gray-300">
                  {recommendations.strengths?.slice(0, 3).map((s, idx) => (
                    <li key={idx} className="truncate">{s}</li>
                  )) || <li>N/A</li>}
                </ul>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                <span className="font-extrabold text-red-400 block flex items-center gap-1.5 mb-1.5">
                  <FaExclamationTriangle /> Weaknesses
                </span>
                <ul className="list-disc list-inside flex flex-col gap-1 text-gray-300">
                  {recommendations.weaknesses?.slice(0, 3).map((w, idx) => (
                    <li key={idx} className="truncate">{w}</li>
                  )) || <li>N/A</li>}
                </ul>
              </div>
            </div>

            {/* Preparation Roadmap plan */}
            <div className="text-xs text-gray-400 flex flex-col gap-1">
              <span className="font-bold text-gray-400 uppercase tracking-widest">Improvement Plan</span>
              <p className="leading-relaxed bg-gray-950 border border-gray-800 p-4 rounded-xl mt-1 text-gray-300">
                {recommendations.prepPlan || "Review ideal answers to correct core syntax and architectural gaps."}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Detailed Questions breakdowns */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex flex-col gap-4 backdrop-blur-md"
        >
          <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-2">
            <FaGraduationCap size={20} className="text-gray-450" />
            <span>Question-wise Performance Analysis</span>
          </h3>

          <div className="flex flex-col gap-4">
            {interview.questions.map((q, idx) => {
              const userAnswerObj = interview.answers.find(a => a.questionId === q.questionId)
              const feedbackObj = interview.feedback.find(f => f.questionId === q.questionId)
              const isExpanded = expandedIndex === idx

              return (
                <div key={q.questionId} className="border border-gray-800 rounded-2xl overflow-hidden transition">
                  {/* Header */}
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left bg-gray-950/60 hover:bg-gray-900/40 transition cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <span className="bg-emerald-500 text-white w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-250 text-sm pr-4">{q.questionText}</h4>
                        {!isExpanded && feedbackObj && (
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-405 font-semibold">
                            <span>Rating:</span>
                            <span className={feedbackObj.rating >= 8 ? 'text-emerald-400' : feedbackObj.rating >= 5 ? 'text-amber-400' : 'text-red-400'}>
                              {feedbackObj.rating} / 10
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <BsChevronUp size={16} /> : <BsChevronDown size={16} />}
                  </button>

                  {/* Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-gray-800 bg-gray-950/20"
                      >
                        <div className="p-5 flex flex-col gap-4 text-sm leading-relaxed">
                          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                            <span className="text-xs font-bold text-gray-400 block mb-1">Your Answer:</span>
                            <p className="text-gray-300 italic">
                              {userAnswerObj?.answerText ? `"${userAnswerObj.answerText}"` : "[No answer provided]"}
                            </p>
                          </div>

                          {feedbackObj && (
                            <>
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-bold text-gray-400">AI Score:</span>
                                <span className={`text-xs font-bold border px-2 py-0.5 rounded-md ${
                                  feedbackObj.rating >= 8 ? 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20' :
                                  feedbackObj.rating >= 5 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                  'text-red-400 bg-red-500/10 border-red-500/20'
                                }`}>
                                  {feedbackObj.rating} / 10
                                </span>
                              </div>

                              <div className="flex items-start gap-3 mt-1">
                                <BsChatQuote className="text-emerald-450 shrink-0 mt-1" size={16} />
                                <div>
                                  <span className="text-xs font-bold text-gray-400 block">AI Feedback:</span>
                                  <p className="text-gray-300 text-sm mt-0.5">{feedbackObj.feedbackText}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 border-t border-gray-800 pt-4 mt-2">
                                <BsLightbulb className="text-amber-400 shrink-0 mt-1" size={16} />
                                <div className="w-full">
                                  <span className="text-xs font-bold text-gray-400 block">Optimal Answer / Guideline:</span>
                                  <pre className="text-gray-300 text-xs mt-1 bg-gray-950 p-4 rounded-xl border border-gray-800 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                    {feedbackObj.idealAnswer}
                                  </pre>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default InterviewFeedback;
