import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import axios from 'axios'
import { ServerUrl } from '../App'
import { BsCloudUpload, BsFileEarmarkPdf, BsFileEarmarkText, BsCheck2Circle, BsLightbulb, BsArrowRight, BsTrash, BsArrowLeft } from 'react-icons/bs'
import { FaGraduationCap, FaBriefcase, FaCode } from 'react-icons/fa'

function ResumeUpload() {
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [resumeData, setResumeData] = useState(null)
  const [loadingResume, setLoadingResume] = useState(true)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState('profile') // 'profile' or 'feedback'

  // Route protection
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!userData) navigate('/auth')
    }, 500)
    return () => clearTimeout(timer)
  }, [userData, navigate])

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${ServerUrl}/api/resumes/history`, { withCredentials: true })
      setHistory(res.data)
    } catch (err) {
      console.error("Failed to load resume history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Load existing resume analysis & history on mount
  useEffect(() => {
    if (userData) {
      const fetchResume = async () => {
        try {
          const res = await axios.get(`${ServerUrl}/api/resumes`, { withCredentials: true })
          setResumeData(res.data)
        } catch (err) {
          // If 404, it means user has not uploaded any resume yet. That's fine.
          if (err.response?.status !== 404) {
            console.error("Error loading resume:", err)
          }
        } finally {
          setLoadingResume(false)
        }
      }
      
      const loadTimer = setTimeout(() => {
        fetchResume()
        fetchHistory()
      }, 0)
      
      return () => clearTimeout(loadTimer)
    }
  }, [userData])

  const handleFileChange = (e) => {
    setErrorMsg('')
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setErrorMsg("Only PDF files are supported.")
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setErrorMsg("Please choose a file first.")
      return
    }

    setErrorMsg('')
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post(`${ServerUrl}/api/resumes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      })
      setResumeData(res.data)
      setFile(null)
      fetchHistory() // Refresh history list
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || "Failed to analyze resume. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleSelectPastResume = async (id) => {
    try {
      setLoadingResume(true)
      const res = await axios.get(`${ServerUrl}/api/resumes/${id}`, { withCredentials: true })
      setResumeData(res.data)
      setActiveTab('profile')
    } catch (err) {
      console.error("Failed to load past resume details:", err)
      setErrorMsg("Failed to fetch past resume details.")
    } finally {
      setLoadingResume(false)
    }
  }

  const handleDeleteResume = async (e, id) => {
    e.stopPropagation()
    const confirmDelete = window.confirm("Are you sure you want to delete this resume analysis from your history?")
    if (!confirmDelete) return

    try {
      await axios.delete(`${ServerUrl}/api/resumes/${id}`, { withCredentials: true })
      if (resumeData && resumeData._id === id) {
        setResumeData(null)
      }
      fetchHistory()
    } catch (err) {
      console.error("Failed to delete resume analysis:", err)
      setErrorMsg("Failed to delete the resume analysis.")
    }
  }

  const getATSColor = (score) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-500'
    if (score >= 50) return 'text-amber-405 stroke-amber-500'
    return 'text-red-400 stroke-red-500'
  }

  if (loadingResume) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans select-none pb-16 text-gray-150">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto px-4 mt-8 flex-1 flex flex-col gap-6">
        {/* Navigation / Actions Header */}
        <div className="flex justify-between items-center w-full">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition cursor-pointer"
          >
            <BsArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
        {/* Banner */}
        <div className="bg-gray-900/40 rounded-3xl p-6 md:p-8 border border-gray-800/80 shadow-lg backdrop-blur-md">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-emerald-500/20">
            Resume Module
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
            AI Resume Analyzer
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Upload your resume to calculate ATS compatibility, parse skills, and receive structured career guidance.
          </p>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT COLUMN: Upload Box & History List */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Upload Form Panel */}
            <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg backdrop-blur-md">
              <h3 className="font-extrabold text-gray-400 text-xs uppercase tracking-widest mb-4">
                Upload PDF Resume
              </h3>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl p-3 mb-4">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleUpload} className="flex flex-col gap-4">
                <div className="border-2 border-dashed border-gray-800 rounded-2xl p-6 text-center bg-gray-950/40 hover:bg-gray-900/40 transition relative flex flex-col items-center justify-center gap-3">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <BsCloudUpload size={32} className="text-gray-400" />
                  {file ? (
                    <div className="flex items-center gap-2 text-xs text-gray-200 font-semibold max-w-[200px] overflow-hidden">
                      <BsFileEarmarkPdf className="text-red-400 shrink-0" size={14} />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-gray-300 block">Drag & drop resume PDF here</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">or click to browse (max 5MB)</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                    file && !uploading
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-95 text-white shadow-emerald-500/10 cursor-pointer'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <BsCloudUpload size={13} />
                      <span>Analyze Resume</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Resume Analysis History Panel */}
            <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg backdrop-blur-md">
              <h3 className="font-extrabold text-gray-400 text-xs uppercase tracking-widest mb-4">
                Analysis History
              </h3>

              {loadingHistory ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-4">No past analyses found.</p>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1 text-gray-150">
                  {history.map((h) => {
                    const isSelected = resumeData && resumeData._id === h._id;
                    return (
                      <div
                        key={h._id}
                        onClick={() => handleSelectPastResume(h._id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer group/item ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/35 text-white'
                            : 'bg-gray-950/30 border-gray-800/60 hover:bg-gray-900/45 text-gray-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs truncate leading-snug">{h.fileName}</h5>
                          <span className="text-[10px] text-gray-500 block mt-0.5">
                            {new Date(h.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className={`text-xs font-black ${
                            h.atsScore >= 80 ? 'text-emerald-400' : h.atsScore >= 60 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {h.atsScore}%
                          </span>
                          <button
                            onClick={(e) => handleDeleteResume(e, h._id)}
                            className="text-gray-500 hover:text-red-450 transition p-1 hover:bg-gray-800/60 rounded-lg cursor-pointer"
                            title="Delete analysis"
                          >
                            <BsTrash size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Details & Critique reports */}
          <div className="lg:col-span-2">
            
            {resumeData ? (
              <motion.div
                key={resumeData._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg backdrop-blur-md flex flex-col gap-6"
              >
                {/* ATS Score Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-800 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-2xl border border-red-500/10">
                      <BsFileEarmarkText size={24} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-lg leading-snug">{resumeData.fileName}</h3>
                      <span className="text-xs text-gray-405 font-semibold block mt-0.5">
                        Analyzed on {new Date(resumeData.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Gauge */}
                  <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 px-5 py-3 rounded-2xl self-start sm:self-auto">
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" className="stroke-gray-800 fill-transparent" strokeWidth="4" />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          className={`fill-transparent ${getATSColor(resumeData.atsScore)}`}
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 20}
                          strokeDashoffset={2 * Math.PI * 20 - (resumeData.atsScore / 100) * (2 * Math.PI * 20)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-white">{resumeData.atsScore}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider block">ATS Score</span>
                      <span className="text-xs font-extrabold text-emerald-400">
                        {resumeData.atsScore >= 80 ? 'Excellent Match' : resumeData.atsScore >= 60 ? 'Good Match' : 'Revision Suggested'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab Selector */}
                <div className="flex border-b border-gray-800 gap-6">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 text-sm font-bold transition cursor-pointer relative ${
                      activeTab === 'profile' ? 'text-emerald-450' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>Parsed Profile</span>
                    {activeTab === 'profile' && (
                      <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('feedback')}
                    className={`pb-3 text-sm font-bold transition cursor-pointer relative ${
                      activeTab === 'feedback' ? 'text-emerald-450' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>ATS Critique & Gaps</span>
                    {activeTab === 'feedback' && (
                      <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex flex-col gap-6">
                  {activeTab === 'profile' ? (
                    <>
                      {/* Skills */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                          <FaCode size={12} />
                          <span>Extracted Skills</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills?.length > 0 ? (
                            resumeData.skills.map((skill, sIdx) => (
                              <span key={sIdx} className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-xs font-semibold border border-emerald-500/20">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500 italic">No skills parsed.</p>
                          )}
                        </div>
                      </div>

                      {/* Work Experience */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                          <FaBriefcase size={12} />
                          <span>Professional Experience</span>
                        </h4>
                        {resumeData.experience && resumeData.experience.length > 0 ? (
                          <div className="flex flex-col gap-4 border-l-2 border-gray-800 pl-4 ml-1">
                            {resumeData.experience.map((exp, eIdx) => (
                              <div key={eIdx} className="relative">
                                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-900"></span>
                                <h5 className="font-bold text-gray-200 text-sm leading-snug">{exp.role}</h5>
                                <p className="text-xs text-gray-400 font-semibold">{exp.company} • {exp.duration}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No experience records parsed.</p>
                        )}
                      </div>

                      {/* Projects */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                          <BsFileEarmarkText size={12} />
                          <span>Key Projects</span>
                        </h4>
                        {resumeData.projects && resumeData.projects.length > 0 ? (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {resumeData.projects.map((proj, pIdx) => (
                              <div key={pIdx} className="bg-gray-950/60 border border-gray-800/80 p-4 rounded-xl">
                                <h5 className="font-bold text-gray-200 text-sm leading-snug">{proj.title}</h5>
                                <p className="text-xs text-gray-400 leading-relaxed mt-1">{proj.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No project records parsed.</p>
                        )}
                      </div>

                      {/* Education */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                          <FaGraduationCap size={14} />
                          <span>Education Details</span>
                        </h4>
                        {resumeData.education && resumeData.education.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            {resumeData.education.map((edu, edIdx) => (
                              <div key={edIdx} className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-bold text-gray-200 text-sm leading-snug">{edu.degree}</h5>
                                  <p className="text-xs text-gray-400 font-semibold">{edu.school}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No education records parsed.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Feedback Critique */}
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex gap-3 text-sm leading-relaxed">
                        <BsLightbulb className="text-emerald-450 shrink-0 mt-0.5" size={18} />
                        <div className="w-full">
                          <h4 className="font-bold text-white mb-2">ATS Optimization Checklist</h4>
                          <p className="whitespace-pre-line text-xs md:text-sm text-gray-300 leading-relaxed">{resumeData.feedback}</p>
                        </div>
                      </div>

                      <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl flex gap-3 text-sm leading-relaxed mt-2">
                        <BsCheck2Circle className="text-blue-400 shrink-0 mt-0.5" size={18} />
                        <div>
                          <h4 className="font-bold text-white mb-1">Unlock AI Mock Prep</h4>
                          <p className="text-xs text-gray-400 leading-relaxed mb-4">
                            TalentForge uses your parsed resume profile contexts to customize interview question prompts!
                          </p>
                          <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-90 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer"
                          >
                            <span>Start Mock Interview</span>
                            <BsArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-900/40 rounded-3xl p-8 border border-gray-800/80 shadow-lg backdrop-blur-md text-center flex flex-col items-center justify-center min-h-[400px]">
                <BsFileEarmarkText size={48} className="text-gray-700 mb-4 animate-pulse" />
                <h4 className="font-extrabold text-white text-base">No Resume Selected</h4>
                <p className="text-gray-405 text-xs mt-1 max-w-xs leading-relaxed">
                  Upload a new resume PDF on the left or select a past analysis from your history log to view detailed breakdowns.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}

export default ResumeUpload;
