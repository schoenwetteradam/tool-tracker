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

const toNumber = value => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

const mapToolChangeForDisplay = (toolChange) => {
  const operatorDisplay =
    toolChange.operator ||
    toolChange.operator_details?.full_name ||
    (toolChange.operator_employee_id ? `Employee ${toolChange.operator_employee_id}` : null) ||
    'N/A'

  const equipmentDisplay =
    toolChange.machine_number || toolChange.equipment_number || toolChange.work_center || 'N/A'

  const firstRougherDisplay =
    toolChange.new_first_rougher ||
    toolChange.old_first_rougher ||
    toolChange.first_rougher ||
    toolChange.new_tool_id ||
    toolChange.old_tool_id ||
    'N/A'
  const finishToolDisplay =
    toolChange.new_finish_tool ||
    toolChange.old_finish_tool ||
    toolChange.finish_tool ||
    toolChange.new_tool_id ||
    toolChange.old_tool_id ||
    'N/A'

  const changeReasonDisplay =
    toolChange.change_reason ||
    toolChange.first_rougher_change_reason ||
    toolChange.finish_tool_change_reason ||
    'N/A'

  const downtimeSource =
    toolChange.downtime_minutes ?? toolChange.tool_change_duration_minutes
  const downtimeValue =
    downtimeSource === null || downtimeSource === undefined
      ? 'N/A'
      : toNumber(downtimeSource)

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
    piecesProduced:
      toolChange.pieces_produced === null || toolChange.pieces_produced === undefined
        ? 'N/A'
        : toNumber(toolChange.pieces_produced),
    totalCost: Number.isFinite(totalCostValue) ? totalCostValue : 0,
    notes: toolChange.notes || '',
    rawData: toolChange
  }
}

const ToolChangesTable = ({ toolChanges = [] }) => {
  const mappedData = toolChanges.map(mapToolChangeForDisplay)

  return (
    <div className="rounded-3xl border border-white/60 bg-white shadow-brand overflow-hidden">
      <div className="border-b border-spuncast-navy/10 px-6 py-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-spuncast-navy">Recent Tool Changes</h3>
        <span className="text-sm text-spuncast-slate/70">{toolChanges.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-spuncast-navy/10">
          <thead className="bg-spuncast-sky">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-spuncast-slate/70 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-spuncast-slate/70 uppercase tracking-wider">
                Operator
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-spuncast-slate/70 uppercase tracking-wider">
                Equipment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-spuncast-slate/70 uppercase tracking-wider">
                1st Rougher
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-spuncast-slate/70 uppercase tracking-wider">
                Finish Tool
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-spuncast-slate/70 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-spuncast-slate/70 uppercase tracking-wider">
                Downtime
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-spuncast-slate/70 uppercase tracking-wider">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-spuncast-navy/10">
            {mappedData.map((change, index) => (
              <tr key={change.id || index} className="hover:bg-spuncast-sky">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-spuncast-navy">
                  <div>
                    <div className="font-medium">{change.date}</div>
                    <div className="text-spuncast-slate/70">{change.time}</div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className={`font-medium ${change.operator !== 'N/A' ? 'text-spuncast-navy' : 'text-spuncast-slate/50'}`}>
                    {change.operator}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className={`font-medium ${change.equipment !== 'N/A' ? 'text-spuncast-navy' : 'text-spuncast-slate/50'}`}>
                    {change.equipment}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      change.firstRougher !== 'N/A'
                        ? 'bg-spuncast-navy/10 text-spuncast-navy'
                        : 'bg-spuncast-sky text-spuncast-slate/70'
                    }`}
                  >
                    {change.firstRougher}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      change.finishTool !== 'N/A'
                        ? 'bg-spuncast-red/10 text-spuncast-red'
                        : 'bg-spuncast-sky text-spuncast-slate/70'
                    }`}
                  >
                    {change.finishTool}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-spuncast-navy max-w-xs truncate">
                  {change.changeReason}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-spuncast-navy">
                  {change.downtime !== 'N/A' ? `${change.downtime} min` : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-spuncast-navy">
                  {change.totalCost > 0 ? `$${change.totalCost.toFixed(2)}` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toolChanges.length === 0 && (
        <div className="text-center py-12 text-spuncast-slate/70">
          <div className="text-lg mb-2">No tool changes recorded yet</div>
          <Link href="/tool-change-form" className="text-spuncast-navy hover:text-spuncast-red">
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
        original_new_first_rougher: latest.new_first_rougher,
        original_old_first_rougher: latest.old_first_rougher,
        original_new_finish_tool: latest.new_finish_tool,
        original_old_finish_tool: latest.old_finish_tool,
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
  const colors = ['#003865', '#E41E2B', '#5A7AA4', '#B0171F', '#7A94B8', '#F36F6F']

  useEffect(() => {
    debugToolChangeData()
    loadDashboardData()
  }, [selectedDateRange])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [changes, analyticsData] = await Promise.all([
        getToolChanges(),
        getInsertUsageAnalytics(selectedDateRange)
      ])

      const costData = await getToolCostAnalysis(selectedDateRange, {
        preloadedChanges: changes
      })

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
        downtime: dayChanges.reduce(
          (sum, change) => sum + toNumber(change.downtime_minutes ?? change.tool_change_duration_minutes),
          0
        )
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
        operatorStats[change.operator].totalPieces += toNumber(change.pieces_produced)
        operatorStats[change.operator].totalDowntime += toNumber(
          change.downtime_minutes ?? change.tool_change_duration_minutes
        )
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
      <div className="flex min-h-screen items-center justify-center bg-spuncast-sky">
        <div className="flex items-center space-x-3 rounded-full bg-white/80 px-6 py-3 shadow-brand">
          <RefreshCw className="h-6 w-6 animate-spin text-spuncast-navy" />
          <span className="text-lg font-medium text-spuncast-slate">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-spuncast-navy/10 via-spuncast-sky to-white">
      {/* Header */}
      <header className="border-b border-spuncast-navy/10 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-spuncast-navy/20 px-4 py-2 text-sm font-medium text-spuncast-navy transition hover:border-spuncast-red/40 hover:text-spuncast-red"
            >
              <ArrowLeft size={18} />
              <span>Back to Tool Change Form</span>
            </Link>
            <h1 className="text-2xl font-bold text-spuncast-navy sm:text-3xl">📊 Manufacturing Analytics Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(Number(e.target.value))}
              aria-label="Select dashboard date range"
              className="rounded-full border border-spuncast-navy/10 bg-white px-4 py-2 text-sm font-medium text-spuncast-slate focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              type="button"
              onClick={loadDashboardData}
              className="inline-flex items-center gap-2 rounded-full bg-spuncast-red px-5 py-2 text-sm font-semibold text-white shadow-brand transition hover:bg-spuncast-redDark"
            >
              <RefreshCw size={16} className="animate-spin" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-spuncast-slate">Tool Changes Today</p>
                <p className="text-2xl font-bold text-spuncast-navy">{stats.todayChanges}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-spuncast-navy" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-spuncast-slate">Active Machines</p>
                <p className="text-2xl font-bold text-spuncast-navy">{stats.activeMachines}</p>
              </div>
              <Settings className="h-8 w-8 text-spuncast-red" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-spuncast-slate">Cost Savings</p>
                <p className="text-2xl font-bold text-spuncast-navy">${stats.costSavings}</p>
              </div>
              <Database className="h-8 w-8 text-spuncast-navy" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-spuncast-slate">Efficiency</p>
                <p className="text-2xl font-bold text-spuncast-navy">{stats.efficiency}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-spuncast-red" />
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-spuncast-slate">Total Tool Changes</p>
                <p className="text-3xl font-bold text-spuncast-navy">{analytics?.totalChanges || 0}</p>
                <p className="text-sm text-spuncast-slate/70">Last {selectedDateRange} days</p>
              </div>
              <Wrench className="h-12 w-12 text-spuncast-navy" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-spuncast-slate">Average Downtime</p>
                <p className="text-3xl font-bold text-spuncast-navy">{analytics?.averageDowntime || 0}</p>
                <p className="text-sm text-spuncast-slate/70">Minutes per change</p>
              </div>
              <Clock className="h-12 w-12 text-spuncast-red" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-spuncast-slate">Total Cost Impact</p>
                <p className="text-3xl font-bold text-spuncast-navy">${costAnalysis?.totalCost || 0}</p>
                <p className="text-sm text-spuncast-slate/70">Insert + downtime costs</p>
              </div>
              <DollarSign className="h-12 w-12 text-spuncast-red" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-spuncast-slate">Active Operators</p>
                <p className="text-3xl font-bold text-spuncast-navy">{Object.keys(analytics?.operatorPerformance || {}).length}</p>
                <p className="text-sm text-spuncast-slate/70">Recording changes</p>
              </div>
              <Users className="h-12 w-12 text-spuncast-navy" />
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
          <h2 className="text-xl font-semibold text-spuncast-navy mb-4">Tool Changes Over Time</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="changes" fill="#003865" name="Tool Changes" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="downtime" 
                  stroke="#E41E2B" 
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
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <h2 className="text-xl font-semibold text-spuncast-navy mb-4">Change Reasons</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="reason" type="category" width={100} />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullReason]} />
                  <Bar dataKey="count" fill="#E41E2B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insert Usage */}
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <h2 className="text-xl font-semibold text-spuncast-navy mb-4">Insert Usage Distribution</h2>
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
                    fill="#003865"
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
        <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
          <h2 className="text-xl font-semibold text-spuncast-navy mb-4">Operator Performance Analysis</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operator" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="changes" fill="#003865" name="Total Changes" />
                <Bar yAxisId="left" dataKey="avgPieces" fill="#E41E2B" name="Avg Pieces per Change" />
                <Bar yAxisId="right" dataKey="avgDowntime" fill="#7A94B8" name="Avg Downtime (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Analysis */}
        {costAnalysis && (
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <h2 className="text-xl font-semibold text-spuncast-navy mb-4">Cost Analysis Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-spuncast-sky rounded-lg">
                <p className="text-sm text-spuncast-slate">Insert Costs</p>
                <p className="text-2xl font-bold text-spuncast-navy">${costAnalysis.totalInsertCost}</p>
              </div>
              <div className="text-center p-4 bg-spuncast-red/10 rounded-lg">
                <p className="text-sm text-spuncast-slate">Downtime Costs</p>
                <p className="text-2xl font-bold text-spuncast-red">${costAnalysis.totalDowntimeCost}</p>
              </div>
              <div className="text-center p-4 bg-spuncast-navy/10 rounded-lg">
                <p className="text-sm text-spuncast-slate">Avg Cost/Change</p>
                <p className="text-2xl font-bold text-spuncast-red">${costAnalysis.averageCostPerChange}</p>
              </div>
              <div className="text-center p-4 bg-spuncast-sky rounded-lg">
                <p className="text-sm text-spuncast-slate">Total Changes</p>
                <p className="text-2xl font-bold text-spuncast-navy">{costAnalysis.totalChanges}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Tool Changes Table */}
        <ToolChangesTable toolChanges={toolChanges} />
      </main>
    </div>
  )
}

export { ToolChangesTable, debugToolChangeData, mapToolChangeForDisplay }
