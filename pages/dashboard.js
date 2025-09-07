import { useEffect, useState } from 'react'
import { getToolChanges } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [data, setData] = useState([])

  useEffect(() => {
    getToolChanges().then(setData).catch(console.error)
  }, [])

  const chartData = data.map((item) => ({
    date: item.date,
    pieces: item.pieces_produced || 0,
  }))

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
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
    </div>
  )
}
