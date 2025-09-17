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
  Clock,
  Users,
  Wrench,
  ArrowLeft,
  RefreshCw,
  Database,
  BarChart3,
  Package
} from 'lucide-react'

const mapToolChangeForDisplay = (toolChange) => {
  const operatorDisplay =
    toolChange.operator ||
    toolChange.operator_details?.full_name ||
    (toolChange.operator_employee_id ? `Employee ${toolChange.operator_employee_id}` : null) ||
    'N/A'

  const equipmentDisplay =
    toolChange.machine_number || toolChange.equipment_number || toolChange.work_center || 'N/A'

  const firstRougherDisplay = toolChange.first_rougher || toolChange.new_tool_id || 'N/A'
  const finishToolDisplay = toolChange.finish_tool || toolChange.new_tool_id || 'N/A'

  const changeReasonDisplay =
    toolChange.change_reason ||
    toolChange.first_rougher_change_reason ||
    toolChange.finish_tool_change_reason ||
    'N/A'

  const downtimeValue =
    toolChange.downtime_minutes ?? toolChange.tool_change_duration_minutes ?? 'N/A'

  const totalCostValue = Number(toolChange.total_tool_cost ?? 0)

  return {
    id: toolChange.id,
    date: toolChange.date || 'N/A',
    time: toolChange.time || 'N/A',
    operator: operatorDisplay,
    equipment: equipmentDisplay,
    firstRougher: firstRougherDisplay,
    finishTool: finishToolDisplay,
    changeReason: changeReasonDisplay,
    downtime: downtimeValue,
    partNumber: toolChange.part_number || 'N/A',
    jobNumber: toolChange.job_number || 'N/A',
    heatNumber: toolChange.heat_number || 'N/A',
    piecesProduced: toolChange.pieces_produced ?? 'N/A',
    totalCost: Number.isFinite(totalCostValue) ? totalCostValue : 0,
    notes: toolChange.notes || '',
    rawData: toolChange
  }
}

const ToolChangesTable = ({ toolChanges = [] }) => {
  const mappedData = toolChanges.map(mapToolChangeForDisplay)

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Recent Tool Changes</h3>
        <span className="text-sm text-gray-500">{toolChanges.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operator
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                1st Rougher
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Finish Tool
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Downtime
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mappedData.map((change, index) => (
              <tr key={change.id || index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{change.date}</div>
                    <div className="text-gray-500">{change.time}</div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className={`font-medium ${change.operator !== 'N/A' ? 'text-gray-900' : 'text-gray-400'}`}>
                    {change.operator}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className={`font-medium ${change.equipment !== 'N/A' ? 'text-gray-900' : 'text-gray-400'}`}>
                    {change.equipment}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      change.firstRougher !== 'N/A'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {change.firstRougher}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      change.finishTool !== 'N/A'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {change.finishTool}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                  {change.changeReason}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {change.downtime !== 'N/A' ? `${change.downtime} min` : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {change.totalCost > 0 ? `$${change.totalCost.toFixed(2)}` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toolChanges.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">No tool changes recorded yet</div>
          <Link href="/tool-change-form" className="text-blue-600 hover:text-blue-500">
            Add your first tool change →
          </Link>
        </div>
      )}
    </div>
  )
}

const debugToolChangeData = async () => {
  try {
    const changes = await getToolChanges()
    console.log('=== TOOL CHANGES DEBUG INFO ===')
    console.log('Total records:', changes?.length || 0)

    if (changes && changes.length > 0) {
      const latest = changes[0]
      console.log('Latest record structure:', latest)
      console.log('Available fields:', Object.keys(latest))

      // Test the mapping function
      const mapped = mapToolChangeForDisplay(latest)
      console.log('Mapped display data:', mapped)

      // Check specific fields that were showing N/A
      console.log('Field check:', {
        original_operator: latest.operator,
        original_machine: latest.machine_number,
        original_equipment: latest.equipment_number,
        original_first_rougher: latest.first_rougher,
        original_finish_tool: latest.finish_tool,
        original_change_reason: latest.change_reason,
        mapped_operator: mapped.operator,
        mapped_equipment: mapped.equipment,
        mapped_firstRougher: mapped.firstRougher,
        mapped_finishTool: mapped.finishTool,
        mapped_changeReason: mapped.changeReason
      })
    }
  } catch (error) {
    console.error('Debug error:', error)
  }
}

export default function Dashboard() {
  const [toolChanges, setToolChanges] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [costAnalysis, setCostAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDateRange, setSelectedDateRange] = useState(30)
  const [stats, setStats] = useState({
    todayChanges: 0,
    activeMachines: 0,
    costSavings: 0,
    efficiency: 0
  })

  // Chart colors
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  useEffect(() => {
    debugToolChangeData()
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

      // Calculate quick stats
      const todayStr = new Date().toISOString().split('T')[0]
      const todayChanges = (changes || []).filter(c => c.date === todayStr).length
      const activeMachines = new Set((changes || []).map(c => c.equipment_number)).size
      const reactiveChanges = (changes || []).filter(c =>
        c.change_reason === 'Tool Breakage' || c.change_reason === 'Chipped Edge'
      ).length
      const avgChangesPerDay = (changes || []).length / selectedDateRange
      const efficiency = Math.min(Math.round(avgChangesPerDay * 20), 100)
      const costSavings = reactiveChanges * 25
      setStats({ todayChanges, activeMachines, costSavings, efficiency })
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
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tool Changes Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayChanges}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Machines</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeMachines}</p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.costSavings}</p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">{stats.efficiency}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

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
        <ToolChangesTable toolChanges={toolChanges} />
      </div>
    </div>
  )
}

export { ToolChangesTable, debugToolChangeData, mapToolChangeForDisplay }
