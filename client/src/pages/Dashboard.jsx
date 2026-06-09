import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import axios from 'axios'
import { ServerUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import { BsPlusCircle, BsArrowRight, BsChatText, BsHourglassSplit, BsPlayCircle, BsCpu, BsFileEarmarkText, BsBarChartLine, BsCoin } from 'react-icons/bs'
import { FaGraduationCap } from 'react-icons/fa'

function Dashboard() {
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [interviews, setInterviews] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    role: '',
    description: '',
    experience: '',
    questionCount: '5'
  })
  const [generating, setGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Route protection
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!userData) {
        navigate('/auth')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [userData, navigate])

  // Fetch Interview History
  useEffect(() => {
    if (userData) {
      const fetchHistory = async () => {
        try {
          const res = await axios.get(ServerUrl + '/api/interviews/history', { withCredentials: true })
          setInterviews(res.data)
        } catch (err) {
          console.error("Failed to load interview history:", err)
        } finally {
          setLoadingHistory(false)
        }
      }
      fetchHistory()
    }
  }, [userData])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCreateInterview = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    
    if (!formData.role || !formData.description || formData.experience === '') {
      setErrorMsg('Please fill out all fields.')
      return
    }

    if (userData.credits < 10) {
      setErrorMsg('Insufficient credits. You need at least 10 credits to start a mock interview.')
      return
    }

    try {
      setGenerating(true)
      const res = await axios.post(
        ServerUrl + '/api/interviews/create',
        {
          role: formData.role,
          description: formData.description,
          experience: Number(formData.experience),
          questionCount: Number(formData.questionCount)
        },
        { withCredentials: true }
      )
      
      dispatch(setUserData({ ...userData, credits: userData.credits - 10 }))
      navigate(`/interview/${res.data._id}`)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || 'Something went wrong while generating questions. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Calculate profile metrics
  const completedCount = interviews.filter(i => i.isCompleted).length
  const avgScore = completedCount > 0 
    ? Math.round(interviews.filter(i => i.isCompleted).reduce((sum, curr) => sum + curr.score, 0) / completedCount)
    : 0

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20'
    if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-red-400 bg-red-500/10 border-red-500/20'
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans select-none pb-12 text-gray-150">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto px-4 mt-8 flex-1 flex flex-col gap-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/40 rounded-3xl p-6 md:p-8 border border-gray-800/80 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md"
        >
          <div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-emerald-500/20">
              Prep Dashboard
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
              Welcome back, {userData.name}!
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Analyze your performance gaps and prep for domain-specific interviews today.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-gray-950/60 hover:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 font-bold px-6 py-3.5 rounded-2xl transition cursor-pointer self-start md:self-auto shrink-0 text-sm shadow-xs backdrop-blur-md"
          >
            <BsPlusCircle size={16} />
            <span>New Mock Interview</span>
          </button>
        </motion.div>

        {/* Analytics Highlights Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-gray-900/40 rounded-2xl p-5 border border-gray-800/80 shadow-xs flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Available Credits</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-2 flex items-center gap-2">
              <BsCoin className="text-emerald-400" size={20} />
              <span>{userData.credits}</span>
            </span>
          </div>
          <div className="bg-gray-900/40 rounded-2xl p-5 border border-gray-800/80 shadow-xs flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Completed Sessions</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-2">{completedCount}</span>
          </div>
          <div className="bg-gray-900/40 rounded-2xl p-5 border border-gray-800/80 shadow-xs flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Average Score</span>
            <span className={`text-xl sm:text-2xl font-black mt-2 ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-gray-200'}`}>
              {avgScore}%
            </span>
          </div>
          <div className="bg-gray-900/40 rounded-2xl p-5 border border-gray-800/80 shadow-xs flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Subscription Tier</span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-400 mt-2 uppercase tracking-wide truncate">
              {userData.subscriptionPlan || 'free'}
            </span>
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-xs flex flex-col gap-4"
        >
          <h2 className="text-sm font-bold text-gray-450 uppercase tracking-widest text-gray-400">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/resume')}
              className="flex items-center gap-4 border border-gray-800/80 hover:bg-emerald-500/5 hover:border-emerald-500/25 p-4 rounded-2xl text-left transition cursor-pointer group"
            >
              <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <BsFileEarmarkText size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Upload Resume</h4>
                <p className="text-[11px] text-gray-450 mt-0.5">ATS compatibility score & AI feedback</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-4 border border-gray-800/80 hover:bg-blue-500/5 hover:border-blue-500/25 p-4 rounded-2xl text-left transition cursor-pointer group"
            >
              <div className="bg-blue-500/10 text-blue-450 p-3 rounded-xl border border-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <BsBarChartLine size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Analytics Board</h4>
                <p className="text-[11px] text-gray-450 mt-0.5">Radar charts & skill gap analysis</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-4 border border-gray-800/80 hover:bg-purple-500/5 hover:border-purple-500/25 p-4 rounded-2xl text-left transition cursor-pointer group"
            >
              <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl border border-purple-500/20 group-hover:scale-105 transition-transform duration-200">
                <BsCoin size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Pricing Plans</h4>
                <p className="text-[11px] text-gray-450 mt-0.5">Top-up credits & subscription details</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* History Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-sm flex-1 flex flex-col"
        >
          <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
            <FaGraduationCap size={20} className="text-gray-400" />
            <span>Interview Practice History</span>
          </h2>

          {loadingHistory ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-400">Loading your history...</span>
            </div>
          ) : interviews.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-800/80 rounded-2xl bg-gray-950/20 px-4">
              <div className="bg-gray-900/80 p-4 rounded-2xl shadow-xs border border-gray-800 text-gray-400 mb-4">
                <BsChatText size={32} />
              </div>
              <h3 className="font-extrabold text-gray-300 text-lg">No interviews taken yet</h3>
              <p className="text-gray-400 text-xs max-w-sm mt-1 mb-6 leading-relaxed">
                Start your first interview session to evaluate confidence, technical correctness, and speech fluency.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-gray-950/60 hover:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-xs font-bold px-6 py-3 rounded-xl transition cursor-pointer shadow-xs backdrop-blur-md"
              >
                <span>Start Practice</span>
                <BsArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {interviews.map((interview) => (
                <motion.div
                  key={interview._id}
                  whileHover={{ y: -3, boxShadow: "0 8px 30px -10px rgba(16, 185, 129, 0.08)" }}
                  className="bg-gray-900/60 border border-gray-800/80 p-5 rounded-2xl flex flex-col justify-between gap-5 relative transition shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">
                        {new Date(interview.createdAt).toLocaleDateString()}
                      </span>
                      {interview.isCompleted ? (
                        <div className={`px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold ${getScoreColor(interview.score)}`}>
                          Score: {interview.score}%
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 text-[11px] font-extrabold">
                          <BsHourglassSplit className="animate-spin text-orange-400" size={10} />
                          <span>In Progress</span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-extrabold text-white text-base line-clamp-1">{interview.role}</h3>
                    <div className="flex gap-3 text-[11px] text-gray-400 mt-1 font-semibold">
                      <span>Exp: {interview.experience} {interview.experience === 1 ? 'yr' : 'yrs'}</span>
                      <span>•</span>
                      <span>Questions: {interview.questionCount || 5}</span>
                    </div>
                    <p className="text-xs text-gray-450 line-clamp-2 mt-2 leading-relaxed italic">
                      "{interview.description}"
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (interview.isCompleted) {
                        navigate(`/interview/feedback/${interview._id}`)
                      } else {
                        navigate(`/interview/${interview._id}`)
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer border transition ${
                      interview.isCompleted
                        ? 'border-gray-800 hover:bg-gray-800 text-gray-300 bg-transparent'
                        : 'border-emerald-500 bg-emerald-500 text-white hover:opacity-95'
                    }`}
                  >
                    {interview.isCompleted ? (
                      <>
                        <BsChatText size={13} />
                        <span>View Feedback</span>
                      </>
                    ) : (
                      <>
                        <BsPlayCircle size={13} />
                        <span>Resume Interview</span>
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* New Interview Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg p-5 sm:p-8 shadow-2xl relative text-gray-150 max-h-[90vh] overflow-y-auto"
            >
              {!generating && (
                <button
                  onClick={() => {
                    setShowModal(false)
                    setErrorMsg('')
                  }}
                  className="absolute right-6 top-6 text-gray-400 hover:text-white font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              )}

              {generating ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <BsCpu size={28} className="absolute inset-0 m-auto text-emerald-450 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-white">Generating Questions...</h3>
                    <p className="text-gray-400 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                      TalentForge AI is scanning requirements and building targeted coding, behavioral, and HR questions.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateInterview} className="flex flex-col gap-5">
                  <div>
                    <h3 className="font-extrabold text-xl text-white">Configure Mock Interview</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Enter parameters to start your mock session (deducts 10 credits).
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-500/10 text-red-400 text-xs border border-red-500/20 rounded-xl p-3 font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400">Target Job Title</label>
                    <input
                      required
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      placeholder="e.g. MERN Developer, Frontend Engineer, Data Analyst"
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Years of Experience</label>
                      <input
                        required
                        type="number"
                        name="experience"
                        min="0"
                        max="40"
                        value={formData.experience}
                        onChange={handleInputChange}
                        placeholder="e.g. 2"
                        className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-400">Total Questions</label>
                      <select
                        name="questionCount"
                        value={formData.questionCount}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white transition"
                      >
                        <option value="5">5 Questions</option>
                        <option value="10">10 Questions</option>
                        <option value="15">15 Questions</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400">Skills / Job Description</label>
                    <textarea
                      required
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Paste primary skills or job description details (e.g. Node.js, Express, React, MongoDB, RESTful APIs, JavaScript)..."
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white resize-none transition leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-95 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md shadow-emerald-500/10 cursor-pointer mt-2"
                  >
                    Generate AI Questions & Begin
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard;
