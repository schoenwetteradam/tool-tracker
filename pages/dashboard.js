import { useEffect, useState } from 'react'
import {
  getToolChanges,
  getRealTimeToolStatus,
  getCostAnalysis,
  getToolChangeCorrelation,
} from '../lib/supabase'
import { predictToolLife } from '../lib/analytics'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

export default function Dashboard() {
  const [data, setData] = useState([])
  const [statusData, setStatusData] = useState([])
  const [costData, setCostData] = useState([])
  const [correlationData, setCorrelationData] = useState([])
  const [prediction, setPrediction] = useState(null)

  useEffect(() => {
    const load = async () => {
      const changes = await getToolChanges()
      setData(changes)
      setStatusData(await getRealTimeToolStatus())
      setCostData(await getCostAnalysis())
      setCorrelationData(await getToolChangeCorrelation())
      if (changes.length > 0) {
        setPrediction(
          predictToolLife(
            changes[0].tool_type,
            changes[0].insert_type,
            changes
          )
        )
      }
    }
    load().catch(console.error)
  }, [])

  const chartData = data.map((item) => ({
    date: item.date,
    pieces: item.pieces_produced || 0,
  }))

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">
          Real-Time Tool Status by Machine
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Machine</th>
                <th className="p-2 text-left">Tool</th>
                <th className="p-2 text-left">Change Reason</th>
              </tr>
            </thead>
            <tbody>
              {statusData.map((row) => (
                <tr key={row.machine_number}>
                  <td className="p-2">{row.machine_number}</td>
                  <td className="p-2">{row.tool_type}</td>
                  <td className="p-2">{row.change_reason || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Insert Performance Trending</h2>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="pieces" stroke="#2563eb" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Cost Analysis by Tool Type</h2>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData}>
              <XAxis dataKey="tool_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_cost" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">
          Correlation with Tool Changes
        </h2>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={correlationData}>
              <XAxis dataKey="tool_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pieces" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {prediction && (
        <section>
          <h2 className="text-xl font-semibold mb-2">
            Predictive Maintenance Indicators
          </h2>
          <p className="text-sm">
            Predicted life: {prediction.predictedLife} pieces ({prediction.confidence}
            {' '}
            confidence). Recommendation: {prediction.recommendation}.
          </p>
        </section>
      )}
    </div>
  )
}
