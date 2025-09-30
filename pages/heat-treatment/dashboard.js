import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Flame, TrendingUp, Factory, Gauge, ArrowLeft, RefreshCw } from 'lucide-react'

export default function HeatTreatmentDashboard() {
  const [stats, setStats] = useState({
    totalTreatments: 0,
    todayTreatments: 0,
    activeFurnaces: 0,
    avgBHN: 0,
    totalWeight: 0,
    totalGas: 0
  })
  const [loadTypeData, setLoadTypeData] = useState([])
  const [furnaceData, setFurnaceData] = useState([])
  const [materialData, setMaterialData] = useState([])
  const [recentTreatments, setRecentTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30)

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - dateRange)
      const endDate = new Date()

      const start = startDate.toISOString().split('T')[0]
      const end = endDate.toISOString().split('T')[0]

      const statsResponse = await fetch(`/api/heat-treatment/stats?start_date=${start}&end_date=${end}`)

      if (!statsResponse.ok) {
        throw new Error('Failed to load dashboard statistics')
      }

      const statsPayload = await statsResponse.json()

      const stat = statsPayload?.stats || {}

      setStats({
        totalTreatments: stat.total_treatments || 0,
        todayTreatments: stat.today_treatments || 0,
        activeFurnaces: stat.active_furnaces || 0,
        avgBHN: stat.avg_bhn || 0,
        totalWeight: stat.total_weight || 0,
        totalGas: stat.total_gas || 0
      })

      const loadTypes = statsPayload?.load_types || []
      setLoadTypeData(loadTypes.map(item => ({
        name: item.load_type,
        treatments: item.total_treatments,
        avgWeight: parseFloat(item.avg_cast_weight || 0),
        avgGas: parseFloat(item.avg_gas_usage || 0)
      })))

      const furnaces = statsPayload?.furnaces || []
      setFurnaceData(furnaces.map(item => ({
        furnace: `Furnace ${item.furnace_number}`,
        treatments: item.total_treatments,
        avgTime: parseFloat(item.avg_total_time || 0),
        gas: parseFloat(item.total_gas_usage || 0)
      })))

      const materials = statsPayload?.materials || []
      setMaterialData(materials.map(item => ({
        name: item.material_type,
        treatments: item.total_treatments,
        avgBHN: parseFloat(item.avg_hot_bhn || 0)
      })))

      const recent = statsPayload?.recent_treatments || []
      setRecentTreatments(recent)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [dateRange])

  return (
    <>
      <Head>
        <title>Heat Treatment Dashboard | Manufacturing System</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-spuncast-sky via-white to-spuncast-sky/50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur border-b border-spuncast-navy/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="text-spuncast-navy hover:text-spuncast-navyDark transition">
                  <ArrowLeft size={24} />
                </Link>
                <div className="flex items-center gap-4">
                  <Flame className="h-10 w-10 text-spuncast-red" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-spuncast-red font-semibold">Analytics</p>
                    <h1 className="text-2xl font-bold text-spuncast-navy">Heat Treatment Dashboard</h1>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold focus:border-spuncast-navy focus:outline-none"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={180}>Last 6 months</option>
                </select>
                <button
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-spuncast-red px-5 py-2 text-sm font-semibold text-white shadow-brand transition hover:bg-spuncast-redDark disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-spuncast-slate">Total Treatments</p>
                  <p className="text-3xl font-bold text-spuncast-navy">{stats.totalTreatments}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-spuncast-navy" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-spuncast-slate">Today's Treatments</p>
                  <p className="text-3xl font-bold text-spuncast-red">{stats.todayTreatments}</p>
                </div>
                <Flame className="h-10 w-10 text-spuncast-red" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-spuncast-slate">Active Furnaces</p>
                  <p className="text-3xl font-bold text-spuncast-navy">{stats.activeFurnaces}</p>
                </div>
                <Factory className="h-10 w-10 text-spuncast-navy" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-spuncast-slate">Avg BHN</p>
                  <p className="text-3xl font-bold text-spuncast-red">{Math.round(stats.avgBHN)}</p>
                </div>
                <Gauge className="h-10 w-10 text-spuncast-red" />
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Load Type Distribution */}
            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="text-lg font-bold text-spuncast-navy mb-4">Treatments by Load Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loadTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="treatments" fill="#003865" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Furnace Utilization */}
            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="text-lg font-bold text-spuncast-navy mb-4">Furnace Utilization</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={furnaceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="furnace" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="treatments" fill="#E41E2B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Material Performance */}
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <h3 className="text-lg font-bold text-spuncast-navy mb-4">Material Performance (Top 10)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={materialData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="treatments" fill="#003865" name="Treatments" />
                <Bar dataKey="avgBHN" fill="#E41E2B" name="Avg BHN" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Treatments Table */}
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <h3 className="text-lg font-bold text-spuncast-navy mb-4">Recent Treatments</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-spuncast-navy/10">
                    <th className="text-left p-3 text-sm font-semibold text-spuncast-slate">Heat Number</th>
                    <th className="text-left p-3 text-sm font-semibold text-spuncast-slate">Furnace</th>
                    <th className="text-left p-3 text-sm font-semibold text-spuncast-slate">Load Type</th>
                    <th className="text-left p-3 text-sm font-semibold text-spuncast-slate">Part Number</th>
                    <th className="text-left p-3 text-sm font-semibold text-spuncast-slate">Material</th>
                    <th className="text-left p-3 text-sm font-semibold text-spuncast-slate">BHN</th>
                    <th className="text-left p-3 text-sm font-semibold text-spuncast-slate">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTreatments.map(treatment => (
                    <tr key={treatment.id} className="border-b border-gray-100 hover:bg-spuncast-sky/30">
                      <td className="p-3 text-sm font-medium text-spuncast-navy">{treatment.heat_number}</td>
                      <td className="p-3 text-sm">{treatment.furnace_number || '-'}</td>
                      <td className="p-3 text-sm">
                        <span className="inline-block rounded-full bg-spuncast-navy/10 px-3 py-1 text-xs font-semibold text-spuncast-navy">
                          {treatment.load_type || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{treatment.part_number || '-'}</td>
                      <td className="p-3 text-sm">{treatment.material_type || '-'}</td>
                      <td className="p-3 text-sm font-semibold text-spuncast-red">{treatment.hot_end_bhn || '-'}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(treatment.day_finished).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentTreatments.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No treatments found for the selected period
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-spuncast-navy to-spuncast-navyDark p-6 shadow-brand text-white">
              <p className="text-sm font-semibold opacity-90 mb-1">Total Weight Processed</p>
              <p className="text-3xl font-bold">{stats.totalWeight.toLocaleString()} lbs</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-spuncast-red to-spuncast-redDark p-6 shadow-brand text-white">
              <p className="text-sm font-semibold opacity-90 mb-1">Total Gas Usage</p>
              <p className="text-3xl font-bold">{stats.totalGas.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-spuncast-slate to-spuncast-navy p-6 shadow-brand text-white">
              <p className="text-sm font-semibold opacity-90 mb-1">Avg Weight per Treatment</p>
              <p className="text-3xl font-bold">
                {stats.totalTreatments > 0 
                  ? Math.round(stats.totalWeight / stats.totalTreatments).toLocaleString() 
                  : 0} lbs
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
