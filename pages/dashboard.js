import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getToolChanges,
  getToolInventory,
  getEquipment,
  getInsertUsageAnalytics,
  getToolCostAnalysis
} from '../lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Wrench,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'

export default function Dashboard() {
  const [toolChanges, setToolChanges] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [costAnalysis, setCostAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDateRange, setSelectedDateRange] = useState(30)

  // Chart colors
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  useEffect(() => {
    loadDashboardData()
  }, [selectedDateRange])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [changes, analyticsData, costData] = await Promise.all([
        getToolChanges(),
        getInsertUsageAnalytics(selectedDateRange),
        getToolCostAnalysis(selectedDateRange)
      ])
      
      setToolChanges(changes || [])
      setAnalytics(analyticsData)
      setCostAnalysis(costData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Process data for charts
  const processChartData = () => {
    if (!toolChanges.length) return { timelineData: [], reasonData: [], operatorData: [] }

    // Timeline data (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const timelineData = last30Days.map(date => {
      const dayChanges = toolChanges.filter(change => change.date === date)
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        changes: dayChanges.length,
        downtime: dayChanges.reduce((sum, change) => sum + (change.downtime_minutes || 0), 0)
      }
    })

    // Change reasons
    const reasonCounts = {}
    toolChanges.forEach(change => {
      if (change.change_reason) {
        reasonCounts[change.change_reason] = (reasonCounts[change.change_reason] || 0) + 1
      }
    })

    const reasonData = Object.entries(reasonCounts).map(([reason, count]) => ({
      reason: reason.length > 15 ? reason.substring(0, 15) + '...' : reason,
      count,
      fullReason: reason
    }))

    // Operator performance
    const operatorStats = {}
    toolChanges.forEach(change => {
      if (change.operator) {
        if (!operatorStats[change.operator]) {
          operatorStats[change.operator] = {
            changes: 0,
            totalPieces: 0,
            totalDowntime: 0
          }
        }
        operatorStats[change.operator].changes++
        operatorStats[change.operator].totalPieces += change.pieces_produced || 0
        operatorStats[change.operator].totalDowntime += change.downtime_minutes || 0
      }
    })

    const operatorData = Object.entries(operatorStats).map(([operator, stats]) => ({
      operator: operator.split(' ')[0], // First name only for chart
      changes: stats.changes,
      avgPieces: stats.changes > 0 ? Math.round(stats.totalPieces / stats.changes) : 0,
      avgDowntime: stats.changes > 0 ? Math.round(stats.totalDowntime / stats.changes) : 0
    }))

    return { timelineData, reasonData, operatorData }
  }

  const { timelineData, reasonData, operatorData } = processChartData()

  // Insert usage data for pie charts
  const insertData = analytics ? [
    ...Object.entries(analytics.rougherUsage || {}).map(([insert, count]) => ({
      name: insert,
      value: count,
      type: 'Rougher'
    })),
    ...Object.entries(analytics.finishUsage || {}).map(([insert, count]) => ({
      name: insert,
      value: count,
      type: 'Finish'
    }))
  ] : []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="animate-spin h-6 w-6 text-blue-600" />
          <span className="text-lg text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={20} />
                <span>Back to Form</span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">📊 Manufacturing Analytics Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={loadDashboardData}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tool Changes</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.totalChanges || 0}</p>
                <p className="text-sm text-gray-500">Last {selectedDateRange} days</p>
              </div>
              <Wrench className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Downtime</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.averageDowntime || 0}</p>
                <p className="text-sm text-gray-500">Minutes per change</p>
              </div>
              <Clock className="h-12 w-12 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost Impact</p>
                <p className="text-3xl font-bold text-gray-900">${costAnalysis?.totalCost || 0}</p>
                <p className="text-sm text-gray-500">Insert + downtime costs</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Operators</p>
                <p className="text-3xl font-bold text-gray-900">{Object.keys(analytics?.operatorPerformance || {}).length}</p>
                <p className="text-sm text-gray-500">Recording changes</p>
              </div>
              <Users className="h-12 w-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tool Changes Over Time</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="changes" fill="#3B82F6" name="Tool Changes" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="downtime" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Total Downtime (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Change Reasons */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Reasons</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="reason" type="category" width={100} />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullReason]} />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insert Usage */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Insert Usage Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insertData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {insertData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Operator Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Operator Performance Analysis</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operator" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="changes" fill="#3B82F6" name="Total Changes" />
                <Bar yAxisId="left" dataKey="avgPieces" fill="#10B981" name="Avg Pieces per Change" />
                <Bar yAxisId="right" dataKey="avgDowntime" fill="#F59E0B" name="Avg Downtime (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Analysis */}
        {costAnalysis && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost Analysis Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Insert Costs</p>
                <p className="text-2xl font-bold text-blue-600">${costAnalysis.totalInsertCost}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Downtime Costs</p>
                <p className="text-2xl font-bold text-red-600">${costAnalysis.totalDowntimeCost}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Cost/Change</p>
                <p className="text-2xl font-bold text-green-600">${costAnalysis.averageCostPerChange}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Changes</p>
                <p className="text-2xl font-bold text-purple-600">{costAnalysis.totalChanges}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Tool Changes Table */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Tool Changes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1st Rougher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finish Tool</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Downtime</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {toolChanges.slice(0, 10).map((change, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {change.date} {change.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {change.operator || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {change.equipment_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {change.first_rougher || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {change.finish_tool || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {change.change_reason || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {change.downtime_minutes ? `${change.downtime_minutes} min` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
