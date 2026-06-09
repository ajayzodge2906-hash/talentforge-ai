import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import axios from 'axios'
import { ServerUrl } from '../App'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import { BsBarChartLine, BsGraphUp, BsArrowRight, BsArrowLeft } from 'react-icons/bs'

function Analytics() {
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()

  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  // Route protection
  useEffect(() => {
    const checkUser = setTimeout(() => {
      if (!userData) navigate('/auth')
    }, 500)
    return () => clearTimeout(checkUser)
  }, [userData, navigate])

  // Fetch History
  useEffect(() => {
    if (userData) {
      const fetchHistory = async () => {
        try {
          const res = await axios.get(`${ServerUrl}/api/interviews/history`, { withCredentials: true })
          setInterviews(res.data.filter(i => i.isCompleted))
        } catch (err) {
          console.error("Failed to fetch history for analytics:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchHistory()
    }
  }, [userData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Calculate Aggregations
  const totalCompleted = interviews.length
  
  // 1. Radar Chart Data: Average Subscores
  const avgScores = {
    confidence: 0,
    communication: 0,
    correctness: 0,
    technicalAccuracy: 0,
    problemSolving: 0
  }

  if (totalCompleted > 0) {
    interviews.forEach(i => {
      const scores = i.analyticalScores || {}
      avgScores.confidence += scores.confidence || 0
      avgScores.communication += scores.communication || 0
      avgScores.correctness += scores.correctness || 0
      avgScores.technicalAccuracy += scores.technicalAccuracy || 0
      avgScores.problemSolving += scores.problemSolving || 0
    })

    Object.keys(avgScores).forEach(key => {
      avgScores[key] = Number((avgScores[key] / totalCompleted).toFixed(1))
    })
  }

  const radarData = [
    { subject: 'Confidence', value: avgScores.confidence },
    { subject: 'Communication', value: avgScores.communication },
    { subject: 'Correctness', value: avgScores.correctness },
    { subject: 'Tech Knowledge', value: avgScores.technicalAccuracy },
    { subject: 'Problem Solving', value: avgScores.problemSolving }
  ]

  // 2. Area Chart Data: Trend over time
  const trendData = [...interviews]
    .reverse() // Display chronological order
    .map(i => ({
      date: new Date(i.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: i.score,
      role: i.role
    }))

  // 3. Bar Chart Data: Strengths vs Weaknesses (0 to 10 scale mapped to label values)
  const strengthsData = [
    { name: 'Confidence', score: avgScores.confidence, color: '#3b82f6' },
    { name: 'Fluency', score: avgScores.communication, color: '#10b981' },
    { name: 'Correctness', score: avgScores.correctness, color: '#f59e0b' },
    { name: 'Tech Accuracy', score: avgScores.technicalAccuracy, color: '#8b5cf6' },
    { name: 'Problem Solving', score: avgScores.problemSolving, color: '#ec4899' }
  ].sort((a, b) => b.score - a.score) // Sort highest to lowest

  const topPerformance = strengthsData[0]
  const lowestPerformance = strengthsData[strengthsData.length - 1]

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans select-none pb-16 text-gray-150">
      <Navbar />

      <div className="w-full max-w-5xl mx-auto px-4 mt-8 flex-1 flex flex-col gap-6">
        {/* Navigation / Actions Header */}
        <div className="flex justify-between items-center w-full">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer backdrop-blur-md"
          >
            <BsArrowLeft size={14} className="text-gray-405" />
            <span>Back to Dashboard</span>
          </button>
        </div>
        {/* Banner */}
        <div className="bg-gray-900/40 rounded-3xl p-6 md:p-8 border border-gray-800/80 shadow-lg backdrop-blur-md">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-emerald-500/20">
            Analytics Module
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
            Performance Analytics
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gain recruiting-level insights. Identify core gaps in your communication, correctness, and problem-solving.
          </p>
        </div>

        {totalCompleted === 0 ? (
          <div className="bg-gray-900/40 rounded-3xl p-16 border border-gray-800/80 shadow-lg text-center flex flex-col items-center justify-center gap-4 backdrop-blur-md">
            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-gray-400 mb-2">
              <BsBarChartLine size={32} />
            </div>
            <h3 className="font-extrabold text-gray-300 text-lg">No analytical data available</h3>
            <p className="text-gray-455 text-xs max-w-sm leading-relaxed mb-6">
              Complete at least one mock interview to enable Recharts analytics, radar charts, and trend data comparisons.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-95 text-white text-xs font-semibold px-6 py-3.5 rounded-xl transition cursor-pointer shadow-sm shadow-emerald-500/10"
            >
              <span>Go to Dashboard</span>
              <BsArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800/80 shadow-xs flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Strongest Category</span>
                <span className="text-lg font-black text-emerald-400 mt-2 truncate">
                  {topPerformance.name} ({topPerformance.score}/10)
                </span>
              </div>
              <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800/80 shadow-xs flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recommended Focus Area</span>
                <span className="text-lg font-black text-red-400 mt-2 truncate">
                  {lowestPerformance.name} ({lowestPerformance.score}/10)
                </span>
              </div>
              <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800/80 shadow-xs flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Mock Practice Hours</span>
                <span className="text-lg font-black text-white mt-2">
                  {(totalCompleted * 0.5).toFixed(1)} hrs
                </span>
              </div>
            </div>

            {/* Layout Grid: Radar & Trend */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex flex-col gap-4 backdrop-blur-md">
                <h3 className="font-extrabold text-white text-sm md:text-base flex items-center gap-2">
                  <BsBarChartLine className="text-emerald-400" />
                  <span>Analytical Skill Comparison (Radar)</span>
                </h3>
                <div className="w-full h-[300px] mt-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" r="65%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '600' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#475569', fontSize: 9 }} />
                      <Radar name="Performance" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value) => [`${value} / 10`, 'Average Score']} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trend Area Chart */}
              <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex flex-col gap-4 backdrop-blur-md">
                <h3 className="font-extrabold text-white text-sm md:text-base flex items-center gap-2">
                  <BsGraphUp className="text-blue-400" />
                  <span>Performance Trend Over Time</span>
                </h3>
                <div className="w-full h-[300px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value) => [`${value}%`, 'Grade Score']}
                        labelFormatter={(label, items) => items[0] ? `${label} - ${items[0].payload.role}` : label}
                      />
                      <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Strengths Bar chart */}
            <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex flex-col gap-4 backdrop-blur-md">
              <h3 className="font-extrabold text-white text-sm md:text-base flex items-center gap-2">
                <BsBarChartLine className="text-emerald-450 text-emerald-400" />
                <span>Sub-Score Breakdowns (Highest to Lowest)</span>
              </h3>
              <div className="w-full h-[280px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strengthsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '500' }} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 9 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(value) => [`${value} / 10`, 'Grade']} 
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                      {strengthsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics;
