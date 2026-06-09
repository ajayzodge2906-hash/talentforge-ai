import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import axios from 'axios'
import { ServerUrl } from '../App'
import Navbar from '../components/Navbar'
import { BsMic, BsMicFill, BsArrowRight, BsArrowLeft, BsVolumeUp, BsVolumeMute, BsCpu } from 'react-icons/bs'
import { FaRegCompass, FaRegHourglass, FaRobot } from 'react-icons/fa'
import femaleAvatar from '../assets/female_avatar.png'
import femaleAvatarSpeaking from '../assets/female_avatar_speaking.png'

const MaleAvatarSVG = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full rounded-full" xmlns="http://www.w3.org/2000/svg">
    {/* Background */}
    <defs>
      <linearGradient id="maleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffdbb5" />
        <stop offset="100%" stopColor="#e0a97c" />
      </linearGradient>
      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#2d3748" />
        <stop offset="100%" stopColor="#1a202c" />
      </linearGradient>
      <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    
    <circle cx="60" cy="60" r="60" fill="url(#maleGrad)" />
    
    {/* Suit / Collar */}
    <path d="M25 105 C25 90, 40 85, 60 85 C80 85, 95 90, 95 105" fill="url(#suitGrad)" />
    {/* Shirt */}
    <path d="M50 85 L70 85 L60 100 Z" fill="#ffffff" />
    {/* Tie */}
    <path d="M58 92 L62 92 L64 105 L56 105 Z" fill="#ef4444" />
    
    {/* Neck */}
    <path d="M52 70 L68 70 L64 88 L56 88 Z" fill="url(#skinGrad)" />
    
    {/* Face */}
    <circle cx="60" cy="54" r="22" fill="url(#skinGrad)" />
    
    {/* Hair */}
    <path d="M38 52 C38 32, 82 32, 82 52 C82 46, 75 42, 60 42 C45 42, 38 46, 38 52 Z" fill="url(#hairGrad)" />
    <path d="M42 42 C50 35, 70 35, 78 42 C72 38, 48 38, 42 42 Z" fill="#4a5568" />

    {/* Eyes */}
    <circle cx="52" cy="52" r="2.5" fill="#1e293b" />
    <circle cx="68" cy="52" r="2.5" fill="#1e293b" />
    <circle cx="53" cy="51" r="0.8" fill="#ffffff" />
    <circle cx="69" cy="51" r="0.8" fill="#ffffff" />
    
    {/* Eyebrows */}
    <path d="M47 47 C50 46, 54 47, 56 49" stroke="#1a202c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M73 47 C70 46, 66 47, 64 49" stroke="#1a202c" strokeWidth="1.5" strokeLinecap="round" fill="none" />

    {/* Glasses */}
    <rect x="45" y="48" width="13" height="9" rx="2" stroke="#f59e0b" strokeWidth="1.5" fill="none" opacity="0.8" />
    <rect x="62" y="48" width="13" height="9" rx="2" stroke="#f59e0b" strokeWidth="1.5" fill="none" opacity="0.8" />
    <line x1="58" y1="52" x2="62" y2="52" stroke="#f59e0b" strokeWidth="1.5" />
    <path d="M45 52 L39 51" stroke="#f59e0b" strokeWidth="1" />
    <path d="M75 52 L81 51" stroke="#f59e0b" strokeWidth="1" />

    {/* Nose */}
    <path d="M60 52 L60 59 L58 59" stroke="#d97706" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
    
    {/* Smile */}
    <path d="M53 64 C56 67, 64 67, 67 64" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
)

function InterviewSession() {
  const { id } = useParams()
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()

  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([]) // Array of { questionId, answerText }
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Speech Recognition API (Speech-to-Text)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  // Speech Synthesis API (Text-to-Speech)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  // Timer per question (60 seconds)
  const [timer, setTimer] = useState(90)
  const [timerActive, setTimerActive] = useState(false)
  const timerIntervalRef = useRef(null)
  const activeUtteranceRef = useRef(null)

  // ==========================================
  // HELPER / HANDLER FUNCTIONS (Declared first)
  // ==========================================

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      // 1. Clear callbacks on the old utterance to prevent cancel() from firing them
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current.onstart = null
        activeUtteranceRef.current.onend = null
        activeUtteranceRef.current.onerror = null
      }

      window.speechSynthesis.cancel() // Stop any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      
      // Select voice based on candidate's gender (Interviewer is opposite gender)
      const interviewerGender = userData?.gender === 'female' ? 'male' : 'female'
      const voices = window.speechSynthesis.getVoices()
      let selectedVoice = null
      
      if (interviewerGender === 'male') {
        selectedVoice = voices.find(v => 
          v.name.toLowerCase().includes('david') || 
          v.name.toLowerCase().includes('male') || 
          v.name.toLowerCase().includes('google uk english male')
        )
      } else {
        selectedVoice = voices.find(v => 
          v.name.toLowerCase().includes('zira') || 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('google us english') || 
          v.name.toLowerCase().includes('google uk english female')
        )
      }
      
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0]
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        setTimerActive(true) // Start countdown after AI finishes reading
        activeUtteranceRef.current = null
      }
      utterance.onerror = (e) => {
        console.error("SpeechSynthesis utterance error:", e)
        setIsSpeaking(false)
        setTimerActive(true) // Fallback: start countdown on error
        activeUtteranceRef.current = null
      }
      
      activeUtteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    } else {
      setTimerActive(true) // If TTS is not supported, start countdown immediately
    }
  }

  const handleNext = () => {
    const questionId = interview.questions[currentIndex].questionId
    const updatedAnswers = [...answers]
    const existingIndex = updatedAnswers.findIndex(a => a.questionId === questionId)

    if (existingIndex !== -1) {
      updatedAnswers[existingIndex].answerText = currentAnswer
    } else {
      updatedAnswers.push({ questionId, answerText: currentAnswer })
    }

    setAnswers(updatedAnswers)

    const nextQuestionId = interview.questions[currentIndex + 1].questionId
    const nextAnswerObj = updatedAnswers.find(a => a.questionId === nextQuestionId)
    
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
    }

    setCurrentAnswer(nextAnswerObj ? nextAnswerObj.answerText : '')
    setCurrentIndex(prev => prev + 1)
  }

  const handleBack = () => {
    const questionId = interview.questions[currentIndex].questionId
    const updatedAnswers = [...answers]
    const existingIndex = updatedAnswers.findIndex(a => a.questionId === questionId)

    if (existingIndex !== -1) {
      updatedAnswers[existingIndex].answerText = currentAnswer
    } else {
      updatedAnswers.push({ questionId, answerText: currentAnswer })
    }

    setAnswers(updatedAnswers)

    const prevQuestionId = interview.questions[currentIndex - 1].questionId
    const prevAnswerObj = updatedAnswers.find(a => a.questionId === prevQuestionId)
    
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
    }

    setCurrentAnswer(prevAnswerObj ? prevAnswerObj.answerText : '')
    setCurrentIndex(prev => prev - 1)
  }

  const handleSubmit = async () => {
    const questionId = interview.questions[currentIndex].questionId
    const finalAnswers = [...answers]
    const existingIndex = finalAnswers.findIndex(a => a.questionId === questionId)

    if (existingIndex !== -1) {
      finalAnswers[existingIndex].answerText = currentAnswer
    } else {
      finalAnswers.push({ questionId, answerText: currentAnswer })
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
    }

    try {
      setSubmitting(true)
      await axios.post(
        `${ServerUrl}/api/interviews/submit`,
        {
          interviewId: id,
          answers: finalAnswers
        },
        { withCredentials: true }
      )
      navigate(`/interview/feedback/${id}`)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || 'Error submitting interview. Please try again.')
      setSubmitting(false)
    }
  }

  const handleAutoAdvance = () => {
    if (currentIndex < (interview?.questions.length - 1)) {
      handleNext()
    } else {
      handleSubmit()
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        if (isSpeaking) {
          if (activeUtteranceRef.current) {
            activeUtteranceRef.current.onstart = null
            activeUtteranceRef.current.onend = null
            activeUtteranceRef.current.onerror = null
            activeUtteranceRef.current = null
          }
          window.speechSynthesis.cancel()
          setIsSpeaking(false)
          setTimerActive(true)
        }
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error("Failed to start speech recognition:", err)
      }
    }
  }

  // ==========================================
  // SIDE EFFECTS & REACT HOOKS
  // ==========================================

  // Auth protection
  useEffect(() => {
    const checkUser = setTimeout(() => {
      if (!userData) navigate('/auth')
    }, 500)
    return () => clearTimeout(checkUser)
  }, [userData, navigate])

  // Fetch Interview Details
  useEffect(() => {
    if (userData) {
      const fetchDetails = async () => {
        try {
          const res = await axios.get(`${ServerUrl}/api/interviews/${id}`, { withCredentials: true })
          setInterview(res.data)
          
          if (res.data.isCompleted) {
            navigate(`/interview/feedback/${id}`)
          }
          
          // Pre-populate answers if exists
          if (res.data.answers && res.data.answers.length > 0) {
            setAnswers(res.data.answers)
            const activeAnswerObj = res.data.answers.find(a => a.questionId === res.data.questions[0].questionId)
            setCurrentAnswer(activeAnswerObj ? activeAnswerObj.answerText : '')
          }
        } catch (err) {
          console.error("Failed to load interview:", err)
          setErrorMsg("Could not fetch interview session. Verify the URL or your permissions.")
        } finally {
          setLoading(false)
        }
      }
      fetchDetails()
    }
  }, [id, userData, navigate])

  // Speech Recognition configuration
  useEffect(() => {
    // Warm up speechSynthesis voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices()
        }
      }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
        setCurrentAnswer(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + transcript.trim())
      }

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e)
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Trigger speaking or start timer when active question shifts
  useEffect(() => {
    if (interview && interview.questions[currentIndex]) {
      // Reset timer to 90 seconds and stop counting down in next tick to avoid synchronous setState warning
      const timerTimeout = setTimeout(() => {
        setTimer(90)
        setTimerActive(false)
        if (voiceEnabled) {
          speakQuestion(interview.questions[currentIndex].questionText)
        } else {
          setTimerActive(true)
        }
      }, 0)
      return () => clearTimeout(timerTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, interview, voiceEnabled])

  // Separate countdown timer triggered by timerActive state
  useEffect(() => {
    if (timerActive) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current)
            setTimerActive(false)
            handleAutoAdvance() // Autoadvance when timer hits 0
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive])

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
            <h3 className="font-extrabold text-lg text-red-400 mb-2">Error</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">{errorMsg || "Session unavailable."}</p>
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

  const activeQuestionObj = interview.questions[currentIndex]
  const questionCount = interview.questions.length

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans select-none pb-12 relative overflow-hidden text-gray-150">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto px-4 mt-8 flex-1 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* LEFT PANEL: AI Interviewer Avatar & Status */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex flex-col items-center text-center gap-6 backdrop-blur-md"
          >
            {/* Speaker Control */}
            <button
              onClick={() => {
                if (voiceEnabled) {
                  if (activeUtteranceRef.current) {
                    activeUtteranceRef.current.onstart = null
                    activeUtteranceRef.current.onend = null
                    activeUtteranceRef.current.onerror = null
                    activeUtteranceRef.current = null
                  }
                  window.speechSynthesis.cancel()
                  setIsSpeaking(false)
                  setTimerActive(true) // Start the countdown immediately if they mute voice while speaking
                }
                setVoiceEnabled(!voiceEnabled)
              }}
              className="self-end text-gray-400 hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-gray-800 transition"
              title={voiceEnabled ? "Mute AI voice" : "Unmute AI voice"}
            >
              {voiceEnabled ? <BsVolumeUp size={20} className="text-emerald-450" /> : <BsVolumeMute size={20} />}
            </button>

            {/* Glowing AI Avatar */}
            <div className="relative">
              {/* Outer Speaking Glow */}
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.2, scale: 1.3 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 bg-emerald-500 rounded-full blur-md"
                  ></motion.div>
                )}
              </AnimatePresence>
              <div className={`w-28 h-28 rounded-full overflow-hidden border-2 ${
                isSpeaking ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105 animate-pulse' : 'border-gray-800 bg-gray-950'
              } text-white flex items-center justify-center shadow-md relative z-10 transition duration-300`}>
                {userData?.gender === 'female' ? (
                  <MaleAvatarSVG />
                ) : (
                  <img src={isSpeaking ? femaleAvatarSpeaking : femaleAvatar} alt="Interviewer Kiara" className="w-full h-full object-cover rounded-full" />
                )}
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-white text-lg">
                {userData?.gender === 'female' ? 'Interviewer Kabir' : 'Interviewer Kiara'}
              </h3>
              {/* Status badges */}
              <div className="flex justify-center mt-2">
                {isSpeaking ? (
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
                    AI Speaking...
                  </span>
                ) : isListening ? (
                  <span className="text-[10px] bg-red-550/10 text-red-400 border border-red-550/20 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
                    Listening to you...
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-950 text-gray-500 border border-gray-800 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                    Waiting response
                  </span>
                )}
              </div>
            </div>

            {/* Stepper stats */}
            <div className="w-full grid grid-cols-2 gap-4 border-t border-gray-800 pt-6 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-550 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <FaRegCompass /> Question
                </span>
                <span className="text-base font-extrabold text-white">
                  {currentIndex + 1} of {questionCount}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-550 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <FaRegHourglass /> Time Limit
                </span>
                <span className={`text-base font-extrabold ${timer <= 15 ? 'text-red-405 animate-pulse' : 'text-white'}`}>
                  {timer}s
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT PANEL: Question Prompt & Response Input */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/40 rounded-3xl p-6 md:p-8 border border-gray-800/80 shadow-lg flex-1 flex flex-col justify-between gap-6 backdrop-blur-md"
          >
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                  ACTIVE QUESTION {currentIndex + 1}
                </span>
                <h3 className="font-extrabold text-white text-lg md:text-xl mt-1 leading-relaxed">
                  {activeQuestionObj?.questionText}
                </h3>
              </div>

              {/* Textarea Answer */}
              <div className="flex flex-col gap-3 relative">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your response here or click the microphone to dictate your answer aloud..."
                  className="w-full min-h-[220px] p-5 bg-gray-950 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 text-white resize-none transition leading-relaxed"
                />

                {/* Voice recording indicators */}
                <div className="absolute right-4 bottom-4 flex items-center gap-3 bg-gray-900/90 rounded-full p-1.5 border border-gray-800">
                  {isListening && (
                    <div className="flex items-center gap-1.5 px-3">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                      <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest hidden sm:inline">Dictating</span>
                      {/* sound wave animation */}
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 h-1 bg-red-400 rounded-full wave-bar"></span>
                        <span className="w-0.5 h-2 bg-red-400 rounded-full wave-bar-fast"></span>
                        <span className="w-0.5 h-1.5 bg-red-400 rounded-full wave-bar-slow"></span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={toggleListening}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer shadow-sm ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-650 text-white animate-pulse'
                        : 'bg-gray-800 hover:bg-gray-750 text-gray-300'
                    }`}
                  >
                    {isListening ? <BsMicFill size={16} /> : <BsMic size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Stepper Navigation Actions */}
            <div className="flex items-center justify-between border-t border-gray-800 pt-6 mt-6">
              <button
                onClick={handleBack}
                disabled={currentIndex === 0}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold border transition ${
                  currentIndex === 0
                    ? 'border-gray-800 text-gray-500 bg-transparent cursor-not-allowed'
                    : 'border-gray-800 text-gray-350 bg-gray-950 hover:bg-gray-850 cursor-pointer'
                }`}
              >
                <BsArrowLeft size={14} />
                <span>Previous</span>
              </button>

              {currentIndex < (questionCount - 1) ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-95 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <span>Save & Next</span>
                  <BsArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <span>Submit Interview</span>
                  <BsArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        </div>

      </div>

      {/* Submitting Loading screen */}
      <AnimatePresence>
        {submitting && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <BsCpu size={28} className="absolute inset-0 m-auto text-emerald-450 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-white">Evaluating Your Answers...</h3>
                <p className="text-gray-400 text-xs mt-2 leading-relaxed max-w-xs mx-auto">
                  TalentForge AI is evaluating your correctness, communication quality, and confidence indicators. This may take up to 15 seconds.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InterviewSession;
