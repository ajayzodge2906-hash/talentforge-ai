import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import axios from 'axios'
import { ServerUrl } from '../App'
import { BsShieldLock, BsPeople, BsCoin, BsPlayCircle, BsCashCoin, BsPencilSquare, BsArrowRepeat } from 'react-icons/bs'

function AdminDashboard() {
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Edit credits state
  const [editingUserId, setEditingUserId] = useState(null)
  const [editingCredits, setEditingCredits] = useState(0)

  // Route protection
  useEffect(() => {
    const checkUser = setTimeout(() => {
      if (!userData) {
        navigate('/auth')
      } else if (userData.role !== 'admin') {
        navigate('/dashboard')
      }
    }, 500)
    return () => clearTimeout(checkUser)
  }, [userData, navigate])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${ServerUrl}/api/admin/stats`, { withCredentials: true })
      setStats(res.data.stats)
      setUsers(res.data.users)
      setTransactions(res.data.transactions)
    } catch (err) {
      console.error(err)
      setErrorMsg("Failed to load administrative details. Verify admin access.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userData && userData.role === 'admin') {
      fetchAdminData()
    }
  }, [userData])

  const handleUpdateCredits = async (targetUserId) => {
    try {
      await axios.post(
        `${ServerUrl}/api/admin/update-credits`,
        { targetUserId, credits: editingCredits },
        { withCredentials: true }
      )
      
      // Update local state list
      setUsers(users.map(u => u._id === targetUserId ? { ...u, credits: editingCredits } : u))
      setEditingUserId(null)
    } catch (err) {
      alert("Failed to update credits: " + (err.response?.data?.message || err.message))
    }
  }

  const handleToggleRole = async (targetUserId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin'
    if (!window.confirm(`Are you sure you want to change this user's role to ${nextRole}?`)) {
      return
    }
    try {
      await axios.post(
        `${ServerUrl}/api/admin/update-role`,
        { targetUserId, role: nextRole },
        { withCredentials: true }
      )
      setUsers(users.map(u => u._id === targetUserId ? { ...u, role: nextRole } : u))
    } catch (err) {
      alert("Failed to toggle user role: " + (err.response?.data?.message || err.message))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans text-gray-150">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl max-w-md">
            <h3 className="font-extrabold text-lg text-red-400 mb-2">Access Denied</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-semibold px-6 py-3 rounded-xl hover:opacity-90 cursor-pointer transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans select-none pb-16 text-gray-150">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto px-4 mt-8 flex-1 flex flex-col gap-6">
        {/* Banner */}
        <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex items-center justify-between gap-6 backdrop-blur-md">
          <div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-emerald-500/20">
              Admin Area
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
              <BsShieldLock className="text-emerald-400" />
              <span>Admin Console</span>
            </h1>
          </div>
          <button
            onClick={fetchAdminData}
            className="p-3 bg-gray-950 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-2xl transition cursor-pointer"
            title="Refresh statistics"
          >
            <BsArrowRepeat size={16} />
          </button>
        </div>

        {/* Metrics Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800/80 shadow-xs flex flex-col">
              <span className="text-[10px] font-bold text-gray-405 uppercase tracking-widest flex items-center gap-1.5">
                <BsPeople size={12} /> Registered Users
              </span>
              <span className="text-2xl font-black text-white mt-2">{stats.totalUsers}</span>
            </div>
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800/80 shadow-xs flex flex-col">
              <span className="text-[10px] font-bold text-gray-405 uppercase tracking-widest flex items-center gap-1.5">
                <BsPlayCircle size={12} /> Total Interviews
              </span>
              <span className="text-2xl font-black text-white mt-2">{stats.totalInterviews}</span>
            </div>
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800/80 shadow-xs flex flex-col">
              <span className="text-[10px] font-bold text-gray-405 uppercase tracking-widest flex items-center gap-1.5">
                <BsPlayCircle size={12} /> Graded Sessions
              </span>
              <span className="text-2xl font-black text-white mt-2">{stats.completedInterviews}</span>
            </div>
            <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800/80 shadow-xs flex flex-col">
              <span className="text-[10px] font-bold text-gray-405 uppercase tracking-widest flex items-center gap-1.5">
                <BsCashCoin size={12} /> Total Revenue
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-2">
                ₹{stats.totalRevenue?.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Layout Split: Users & Transactions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* User Management Table */}
          <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg lg:col-span-2 flex flex-col gap-4 backdrop-blur-md">
            <h3 className="font-extrabold text-white text-sm md:text-base flex items-center gap-2">
              <BsPeople className="text-emerald-400" />
              <span>User Database Management</span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-805 border-gray-800 text-gray-400 font-bold">
                    <th className="pb-3 pr-2">Candidate Details</th>
                    <th className="pb-3 px-2">Role</th>
                    <th className="pb-3 px-2">Plan</th>
                    <th className="pb-3 px-2">Credits</th>
                    <th className="pb-3 pl-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-805 divide-gray-800">
                  {users.map((u) => (
                    <tr key={u._id} className="text-gray-300">
                      <td className="py-3.5 pr-2">
                        <div className="font-bold text-gray-200">{u.name}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[140px]">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-2">
                        <button
                          onClick={() => handleToggleRole(u._id, u.role)}
                          className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider cursor-pointer border ${
                            u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-gray-950 text-gray-500 border-gray-800'
                          }`}
                        >
                          {u.role}
                        </button>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="font-bold uppercase tracking-wide text-[10px] text-emerald-400">{u.subscriptionPlan}</span>
                      </td>
                      <td className="py-3.5 px-2">
                        {editingUserId === u._id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={editingCredits}
                              onChange={(e) => setEditingCredits(Number(e.target.value))}
                              className="w-14 px-1.5 py-0.5 bg-gray-950 border border-gray-800 text-white rounded text-center focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateCredits(u._id)}
                              className="bg-emerald-500 hover:opacity-90 text-white font-semibold px-2 py-0.5 rounded text-[9px] cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="font-bold">{u.credits}</span>
                            <button
                              onClick={() => {
                                setEditingUserId(u._id)
                                setEditingCredits(u.credits)
                              }}
                              className="text-gray-400 hover:text-emerald-400 cursor-pointer"
                            >
                              <BsPencilSquare size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <span className="text-gray-600">-</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Panel: Top Roles & Transactions */}
          <div className="flex flex-col gap-6">
            {/* Top Roles Practiced */}
            {stats && (
              <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex flex-col gap-4 backdrop-blur-md">
                <h3 className="font-extrabold text-white text-sm">Top Practiced Roles</h3>
                <div className="flex flex-col gap-3">
                  {stats.topRoles?.map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-950 text-gray-400 w-5 h-5 rounded-full flex items-center justify-center font-bold border border-gray-800">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-300 truncate max-w-[150px]">{r.role}</span>
                      </div>
                      <span className="font-bold text-gray-500">{r.count} sessions</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Log */}
            <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 shadow-lg flex-1 flex flex-col gap-4 backdrop-blur-md">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <BsCoin className="text-emerald-450 text-emerald-400" />
                <span>Recent Transactions</span>
              </h3>
              
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx._id} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0 flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between items-start font-bold">
                      <span className="text-gray-200 truncate max-w-[120px]">{tx.userId?.name || 'N/A'}</span>
                      <span className="text-emerald-455 text-emerald-450 text-emerald-400">₹{tx.amount}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500">
                      <span className="uppercase tracking-wider">Plan: {tx.plan}</span>
                      <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[9px] text-gray-650 text-gray-500 truncate">
                      ID: {tx.razorpayPaymentId || 'Simulated'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminDashboard;
