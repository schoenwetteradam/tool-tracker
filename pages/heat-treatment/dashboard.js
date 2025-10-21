import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Flame, TrendingUp, Factory, Gauge, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react'

export default function HeatTreatmentDashboard() {
  const [stats, setStats] = useState({
    totalTreatments: 0,
    totalWeight: 0,
    totalGas: 0,
    todayTreatments: 0,
    activeFurnaces: 0,
    avgBHN: 0,
    avgTIR: 0,
    avgCycle: 0,
    specificEnergy: 0,
    energyCost: 0
  })
  const [ytdMetrics, setYtdMetrics] = useState(null)
  const [temperatureTrend, setTemperatureTrend] = useState([])
  const [hardnessTrend, setHardnessTrend] = useState([])
  const [energyTrend, setEnergyTrend] = useState([])
  const [cycleTrend, setCycleTrend] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loadTypeData, setLoadTypeData] = useState([])
  const [furnaceData, setFurnaceData] = useState([])
  const [materialData, setMaterialData] = useState([])
  const [recentTreatments, setRecentTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30)

  const toNumber = (value) => {
    const num = Number.parseFloat(value)
    return Number.isFinite(num) ? num : 0
  }

  const toNullable = (value) => {
    const num = Number.parseFloat(value)
    return Number.isFinite(num) ? num : null
  }

  const poundsPerKilogram = 2.20462

  const toEnergyPerKg = (value) => {
    const num = Number.parseFloat(value)
    return Number.isFinite(num) ? num * poundsPerKilogram : null
  }

  const formatNumber = (value, options = {}) => {
    const num = Number.parseFloat(value)
    if (!Number.isFinite(num)) return '0'
    return num.toLocaleString(undefined, options)
  }

  const formatHours = (value) => {
    const num = Number.parseFloat(value)
    if (!Number.isFinite(num)) return '0.00 hrs'
    return `${num.toFixed(2)} hrs`
  }

  const formatOptionalHours = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    const num = Number.parseFloat(value)
    if (!Number.isFinite(num)) return '—'
    return `${num.toFixed(2)} hrs`
  }

  const formatCycleRange = (min, max) => {
    const minNum = Number.parseFloat(min)
    const maxNum = Number.parseFloat(max)
    const hasMin = Number.isFinite(minNum)
    const hasMax = Number.isFinite(maxNum)

    if (!hasMin && !hasMax) return '—'
    if (!hasMin && hasMax) return `≤ ${formatOptionalHours(maxNum)}`
    if (hasMin && !hasMax) return `≥ ${formatOptionalHours(minNum)}`
    return `${formatOptionalHours(minNum)} – ${formatOptionalHours(maxNum)}`
  }

  const formatTir = (value) => {
    const num = Number.parseFloat(value)
    if (!Number.isFinite(num)) return '0.000'
    return num.toFixed(3)
  }

  const formatEnergyKg = (value) => {
    const num = toEnergyPerKg(value)
    if (!Number.isFinite(num)) return '0.000'
    return num.toFixed(3)
  }

  const formatCurrency = (value) => {
    const num = Number.parseFloat(value)
    if (!Number.isFinite(num)) return '$0'
    return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }

  const formatEnergyKgDisplay = (value) => {
    const num = Number.parseFloat(value)
    if (!Number.isFinite(num)) return '0.000'
    return num.toFixed(3)
  }

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

      const payload = await statsResponse.json()

      const stat = payload?.stats || {}

      setStats({
        totalTreatments: stat.total_treatments || 0,
        totalWeight: stat.total_weight || 0,
        totalGas: stat.total_gas || 0,
        todayTreatments: stat.today_treatments || 0,
        activeFurnaces: stat.active_furnaces || 0,
        avgBHN: stat.avg_bhn || 0,
        avgTIR: stat.avg_tir || 0,
        avgCycle: stat.avg_cycle_time_hours || 0,
        specificEnergy: stat.specific_energy_consumption || 0,
        energyCost: stat.energy_cost || 0
      })

      const ytd = payload?.ytd
      setYtdMetrics(
        ytd
          ? {
              ...ytd,
              total_loads: toNumber(ytd.total_loads),
              total_cast_weight: toNumber(ytd.total_cast_weight),
              avg_cycle_time_hours: toNullable(ytd.avg_cycle_time_hours),
              total_cycle_hours: toNullable(ytd.total_cycle_hours),
              min_cycle_time_hours: toNullable(ytd.min_cycle_time_hours),
              max_cycle_time_hours: toNullable(ytd.max_cycle_time_hours),
              avg_stage1_time_hours: toNullable(ytd.avg_stage1_time_hours),
              avg_stage2_time_hours: toNullable(ytd.avg_stage2_time_hours),
              avg_stage3_time_hours: toNullable(ytd.avg_stage3_time_hours),
              avg_stage4_time_hours: toNullable(ytd.avg_stage4_time_hours),
              avg_bhn: toNullable(ytd.avg_bhn),
              avg_tir: toNullable(ytd.avg_tir),
              total_gas_usage: toNumber(ytd.total_gas_usage),
              specific_energy_consumption: toNullable(ytd.specific_energy_consumption),
              estimated_energy_cost: toNullable(ytd.estimated_energy_cost)
            }
          : null
      )
      setTemperatureTrend(
        (payload?.trends?.temperature || []).map((entry) => ({
          ...entry,
          stage1: toNullable(entry.stage1),
          stage2: toNullable(entry.stage2),
          stage3: toNullable(entry.stage3),
          stage4: toNullable(entry.stage4)
        }))
      )
      setHardnessTrend(
        (payload?.trends?.hardness || []).map((entry) => ({
          ...entry,
          hot: toNullable(entry.hot),
          cold: toNullable(entry.cold),
          delta: toNullable(entry.delta)
        }))
      )
      setEnergyTrend(
        (payload?.trends?.energy || []).map((entry) => ({
          ...entry,
          energy: toEnergyPerKg(entry.energy)
        }))
      )
      setCycleTrend(
        (payload?.trends?.cycle || []).map((entry) => ({
          ...entry,
          total: toNullable(entry.total),
          stage1: toNullable(entry.stage1),
          stage2: toNullable(entry.stage2),
          stage3: toNullable(entry.stage3),
          stage4: toNullable(entry.stage4),
          min: toNullable(entry.min),
          max: toNullable(entry.max)
        }))
      )
      setAlerts(payload?.alerts || [])

      setLoadTypeData(
        (payload?.load_types || []).map((item) => ({
          load_type: item.load_type || 'Unknown',
          total_loads: toNumber(item.total_loads),
          total_cast_weight: toNumber(item.total_cast_weight),
          total_gas_usage: toNumber(item.total_gas_usage),
          avg_cycle_time_hours: toNullable(item.avg_cycle_time_hours),
          avg_temperature_f: toNullable(item.avg_temperature_f),
          avg_bhn: toNullable(item.avg_bhn),
          avg_tir: toNullable(item.avg_tir),
          avg_delta_bhn: toNullable(item.avg_delta_bhn),
          avg_delta_tir: toNullable(item.avg_delta_tir),
          specific_energy_consumption: toNullable(item.specific_energy_consumption),
          avg_stage1_time_hours: toNullable(item.avg_stage1_time_hours),
          avg_stage2_time_hours: toNullable(item.avg_stage2_time_hours),
          avg_stage3_time_hours: toNullable(item.avg_stage3_time_hours),
          avg_stage4_time_hours: toNullable(item.avg_stage4_time_hours),
          min_cycle_time_hours: toNullable(item.min_cycle_time_hours),
          max_cycle_time_hours: toNullable(item.max_cycle_time_hours)
        }))
      )

      setFurnaceData(
        (payload?.furnaces || []).map((item) => ({
          furnace_number: item.furnace_number || 'Unknown',
          total_loads: toNumber(item.total_loads),
          total_cast_weight: toNumber(item.total_cast_weight),
          total_gas_usage: toNumber(item.total_gas_usage),
          avg_cycle_time_hours: toNullable(item.avg_cycle_time_hours),
          avg_temperature_f: toNullable(item.avg_temperature_f),
          avg_bhn: toNullable(item.avg_bhn),
          avg_tir: toNullable(item.avg_tir),
          utilization_rate: toNullable(item.utilization_rate),
          specific_energy_consumption: toNullable(item.specific_energy_consumption),
          avg_stage1_time_hours: toNullable(item.avg_stage1_time_hours),
          avg_stage2_time_hours: toNullable(item.avg_stage2_time_hours),
          avg_stage3_time_hours: toNullable(item.avg_stage3_time_hours),
          avg_stage4_time_hours: toNullable(item.avg_stage4_time_hours),
          min_cycle_time_hours: toNullable(item.min_cycle_time_hours),
          max_cycle_time_hours: toNullable(item.max_cycle_time_hours)
        }))
      )

      setMaterialData(
        (payload?.materials || []).map((item) => ({
          material_type: item.material_type,
          total_treatments: toNumber(item.total_treatments),
          avg_hot_bhn: toNullable(item.avg_hot_bhn)
        }))
      )

      setRecentTreatments(payload?.recent_treatments || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [dateRange])

  const ytdCardData = [
    {
      label: 'Loads Processed (YTD)',
      value: formatNumber(ytdMetrics?.total_loads, { maximumFractionDigits: 0 })
    },
    {
      label: 'Total Cast Weight (YTD)',
      value: `${formatNumber(ytdMetrics?.total_cast_weight, { maximumFractionDigits: 0 })} lbs`
    },
    {
      label: 'Average Cycle Time',
      value: formatHours(ytdMetrics?.avg_cycle_time_hours)
    },
    {
      label: 'Specific Energy (kWh/kg)',
      value: formatEnergyKg(ytdMetrics?.specific_energy_consumption)
    },
    {
      label: 'Average BHN',
      value: formatNumber(ytdMetrics?.avg_bhn, { maximumFractionDigits: 0 })
    },
    {
      label: 'Average TIR',
      value: formatTir(ytdMetrics?.avg_tir)
    },
    {
      label: 'Energy Cost (YTD)',
      value: formatCurrency(ytdMetrics?.estimated_energy_cost)
    }
  ]

  const stageTimeCards = [
    {
      label: 'Stage 1 Hold Time',
      value: formatOptionalHours(ytdMetrics?.avg_stage1_time_hours)
    },
    {
      label: 'Stage 2 Hold Time',
      value: formatOptionalHours(ytdMetrics?.avg_stage2_time_hours)
    },
    {
      label: 'Stage 3 Hold Time',
      value: formatOptionalHours(ytdMetrics?.avg_stage3_time_hours)
    },
    {
      label: 'Stage 4 Hold Time',
      value: formatOptionalHours(ytdMetrics?.avg_stage4_time_hours)
    },
    {
      label: 'Cycle Time Range',
      value: formatCycleRange(ytdMetrics?.min_cycle_time_hours, ytdMetrics?.max_cycle_time_hours)
    }
  ]

  const rangeCards = [
    {
      label: 'Total Treatments',
      value: formatNumber(stats.totalTreatments, { maximumFractionDigits: 0 }),
      Icon: TrendingUp,
      accent: 'text-spuncast-navy'
    },
    {
      label: "Today's Treatments",
      value: formatNumber(stats.todayTreatments, { maximumFractionDigits: 0 }),
      Icon: Flame,
      accent: 'text-spuncast-red'
    },
    {
      label: 'Active Furnaces',
      value: formatNumber(stats.activeFurnaces, { maximumFractionDigits: 0 }),
      Icon: Factory,
      accent: 'text-spuncast-navy'
    },
    {
      label: 'Avg Cycle Time',
      value: formatHours(stats.avgCycle),
      Icon: RefreshCw,
      accent: 'text-spuncast-navy'
    },
    {
      label: 'Average BHN',
      value: formatNumber(stats.avgBHN, { maximumFractionDigits: 0 }),
      Icon: Gauge,
      accent: 'text-spuncast-red'
    },
    {
      label: 'Specific Energy (kWh/kg)',
      value: formatEnergyKg(stats.specificEnergy),
      Icon: Flame,
      accent: 'text-spuncast-red'
    }
  ]

  const loadTypeChartData = loadTypeData.map((item) => ({
    name: item.load_type,
    loads: item.total_loads,
    avgCycle: item.avg_cycle_time_hours ?? 0,
    avgBhn: item.avg_bhn ?? 0,
    avgTir: item.avg_tir ?? 0,
    specificEnergyKg: toEnergyPerKg(item.specific_energy_consumption),
    stage1Time: item.avg_stage1_time_hours ?? null,
    stage2Time: item.avg_stage2_time_hours ?? null,
    stage3Time: item.avg_stage3_time_hours ?? null,
    stage4Time: item.avg_stage4_time_hours ?? null,
    minCycle: item.min_cycle_time_hours ?? null,
    maxCycle: item.max_cycle_time_hours ?? null
  }))

  const furnaceChartData = furnaceData.map((item) => {
    const label = item.furnace_number === 'Unknown' ? 'Unknown' : `Furnace ${item.furnace_number}`
    const utilisation = item.utilization_rate != null ? item.utilization_rate * 100 : 0
    return {
      name: label,
      utilisation,
      avgCycle: item.avg_cycle_time_hours ?? 0,
      avgBhn: item.avg_bhn ?? 0,
      avgTir: item.avg_tir ?? 0,
      specificEnergyKg: toEnergyPerKg(item.specific_energy_consumption),
      totalLoads: item.total_loads,
      stage1Time: item.avg_stage1_time_hours ?? null,
      stage2Time: item.avg_stage2_time_hours ?? null,
      stage3Time: item.avg_stage3_time_hours ?? null,
      stage4Time: item.avg_stage4_time_hours ?? null,
      minCycle: item.min_cycle_time_hours ?? null,
      maxCycle: item.max_cycle_time_hours ?? null
    }
  })

  const materialChartData = materialData.map((item) => ({
    material: item.material_type,
    treatments: item.total_treatments,
    avgBHN: item.avg_hot_bhn ?? 0
  }))

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
          {/* Year-to-Date KPIs */}
          <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-brand">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-bold text-spuncast-navy">Year-to-Date KPIs</h2>
              <p className="text-sm text-spuncast-slate">
                Aggregated from the heat_treat_dashboard_stats view.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ytdCardData.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-spuncast-sky/40 bg-white/90 p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-spuncast-slate">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-spuncast-navy">{card.value}</p>
                </div>
              ))}
            </div>
            {ytdMetrics && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {stageTimeCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl border border-spuncast-sky/40 bg-white/90 p-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-spuncast-slate">
                      {card.label}
                    </p>
                    <p className="mt-2 text-xl font-bold text-spuncast-navy">{card.value}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Alerts */}
          {alerts.length > 0 && (
            <section className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Process Alerts</h3>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={`${alert.metric}-${index}`}
                    className={`flex items-start gap-3 rounded-xl border p-4 ${
                      alert.severity === 'critical'
                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    <AlertTriangle className="mt-1 h-5 w-5" />
                    <div>
                      <p className="font-semibold">{alert.metric}</p>
                      <p className="text-sm leading-snug">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Range Overview */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {rangeCards.map(({ label, value, Icon, accent }) => (
              <div key={label} className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-spuncast-slate">{label}</p>
                    <p className="text-3xl font-bold text-spuncast-navy">{value}</p>
                  </div>
                  <Icon className={`h-10 w-10 ${accent}`} />
                </div>
              </div>
            ))}
          </section>

          {/* Trend Charts */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Temperature Profile Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={temperatureTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="stage1" stroke="#003865" name="Stage 1" dot={false} />
                  <Line type="monotone" dataKey="stage2" stroke="#0057a4" name="Stage 2" dot={false} />
                  <Line type="monotone" dataKey="stage3" stroke="#E41E2B" name="Stage 3" dot={false} />
                  <Line type="monotone" dataKey="stage4" stroke="#F59E0B" name="Stage 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Hardness Variation</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={hardnessTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hot" stroke="#E41E2B" name="Hot End" dot={false} />
                  <Line type="monotone" dataKey="cold" stroke="#003865" name="Cold End" dot={false} />
                  <Line
                    type="monotone"
                    dataKey="delta"
                    stroke="#F59E0B"
                    name="Δ BHN"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Specific Energy Consumption</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={energyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => (Number.isFinite(value) ? value.toFixed(3) : value)} />
                  <Tooltip formatter={(value) => (Number.isFinite(value) ? Number(value).toFixed(3) : value)} />
                  <Legend />
                  <Line type="monotone" dataKey="energy" stroke="#1D4ED8" name="kWh per kg" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Cycle Time Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={cycleTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => (Number.isFinite(value) ? value.toFixed(2) : value)} />
                  <Tooltip
                    formatter={(value) => (Number.isFinite(value) ? `${Number(value).toFixed(2)} hrs` : value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#0EA5E9" name="Total" dot={false} />
                  <Line type="monotone" dataKey="stage1" stroke="#1E3A8A" name="Stage 1" dot={false} />
                  <Line type="monotone" dataKey="stage2" stroke="#2563EB" name="Stage 2" dot={false} />
                  <Line type="monotone" dataKey="stage3" stroke="#DC2626" name="Stage 3" dot={false} />
                  <Line type="monotone" dataKey="stage4" stroke="#F97316" name="Stage 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Load Type KPIs */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Load Type Throughput</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loadTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="loads" fill="#003865" name="Total Loads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Load Type KPI Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-spuncast-slate">
                      <th className="p-3">Load Type</th>
                      <th className="p-3">Loads</th>
                      <th className="p-3">Avg Cycle</th>
                      <th className="p-3">Avg BHN</th>
                      <th className="p-3">Avg TIR</th>
                      <th className="p-3">Energy (kWh/kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadTypeChartData.map((item) => (
                      <tr key={item.name} className="border-b border-gray-100">
                        <td className="p-3 font-medium text-spuncast-navy">{item.name}</td>
                        <td className="p-3">{formatNumber(item.loads, { maximumFractionDigits: 0 })}</td>
                        <td className="p-3">{formatHours(item.avgCycle)}</td>
                        <td className="p-3">{formatNumber(item.avgBhn, { maximumFractionDigits: 0 })}</td>
                        <td className="p-3">{formatTir(item.avgTir)}</td>
                        <td className="p-3">{formatEnergyKgDisplay(item.specificEnergyKg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Furnace KPIs */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Furnace Utilisation</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={furnaceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                  <Tooltip formatter={(value, name) => (name === 'Utilisation' ? `${Number(value).toFixed(1)}%` : value)} />
                  <Legend />
                  <Bar dataKey="utilisation" fill="#E41E2B" name="Utilisation (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
              <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Furnace KPI Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-spuncast-slate">
                      <th className="p-3">Furnace</th>
                      <th className="p-3">Loads</th>
                      <th className="p-3">Utilisation</th>
                      <th className="p-3">Avg Cycle</th>
                      <th className="p-3">Avg TIR</th>
                      <th className="p-3">Energy (kWh/kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {furnaceChartData.map((item) => (
                      <tr key={item.name} className="border-b border-gray-100">
                        <td className="p-3 font-medium text-spuncast-navy">{item.name}</td>
                        <td className="p-3">{formatNumber(item.totalLoads, { maximumFractionDigits: 0 })}</td>
                        <td className="p-3">{`${item.utilisation.toFixed(1)}%`}</td>
                        <td className="p-3">{formatHours(item.avgCycle)}</td>
                        <td className="p-3">{formatTir(item.avgTir)}</td>
                        <td className="p-3">{formatEnergyKgDisplay(item.specificEnergyKg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Material Performance */}
          <section className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Material Performance (Top 10)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={materialChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="material" type="category" width={140} />
                <Tooltip />
                <Legend />
                <Bar dataKey="treatments" fill="#003865" name="Treatments" />
                <Bar dataKey="avgBHN" fill="#E41E2B" name="Avg BHN" />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Recent Treatments Table */}
          <section className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
            <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Recent Treatments</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-spuncast-navy/10 text-left text-xs font-semibold uppercase tracking-wide text-spuncast-slate">
                    <th className="p-3">Heat Number</th>
                    <th className="p-3">Furnace</th>
                    <th className="p-3">Load Type</th>
                    <th className="p-3">Part Number</th>
                    <th className="p-3">Material</th>
                    <th className="p-3">BHN</th>
                    <th className="p-3">Avg TIR</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTreatments.map((treatment) => {
                    const hotTir = toNullable(treatment.hot_str_tir)
                    const coldTir = toNullable(treatment.cold_str_tir)
                    const avgTir =
                      hotTir !== null && coldTir !== null
                        ? ((hotTir + coldTir) / 2).toFixed(3)
                        : hotTir !== null
                          ? hotTir.toFixed(3)
                          : coldTir !== null
                            ? coldTir.toFixed(3)
                            : '-'

                    return (
                      <tr key={treatment.id} className="border-b border-gray-100 hover:bg-spuncast-sky/30">
                        <td className="p-3 font-medium text-spuncast-navy">{treatment.heat_number}</td>
                        <td className="p-3">{treatment.furnace_number || '-'}</td>
                        <td className="p-3">
                          <span className="inline-block rounded-full bg-spuncast-navy/10 px-3 py-1 text-xs font-semibold text-spuncast-navy">
                            {treatment.load_type || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">{treatment.part_number || '-'}</td>
                        <td className="p-3">{treatment.material_type || '-'}</td>
                        <td className="p-3 font-semibold text-spuncast-red">{treatment.hot_end_bhn || '-'}</td>
                        <td className="p-3">{avgTir}</td>
                        <td className="p-3 text-gray-600">
                          {treatment.day_finished ? new Date(treatment.day_finished).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {recentTreatments.length === 0 && !loading && (
                <div className="py-8 text-center text-gray-500">No treatments found for the selected period</div>
              )}
            </div>
          </section>

          {/* Summary Stats */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-spuncast-navy to-spuncast-navyDark p-6 shadow-brand text-white">
              <p className="mb-1 text-sm font-semibold opacity-90">Total Weight Processed</p>
              <p className="text-3xl font-bold">{formatNumber(stats.totalWeight, { maximumFractionDigits: 0 })} lbs</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-spuncast-red to-spuncast-redDark p-6 shadow-brand text-white">
              <p className="mb-1 text-sm font-semibold opacity-90">Total Gas Usage</p>
              <p className="text-3xl font-bold">{formatNumber(stats.totalGas, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-spuncast-slate to-spuncast-navy p-6 shadow-brand text-white">
              <p className="mb-1 text-sm font-semibold opacity-90">Average TIR (Range)</p>
              <p className="text-3xl font-bold">{formatTir(stats.avgTIR)}</p>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}
