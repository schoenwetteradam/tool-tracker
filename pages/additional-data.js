import { useState } from 'react'

export default function AdditionalData() {
  const [data, setData] = useState({
    old_tool_condition: '',
    failure_mode: '',
    pieces_produced: '',
    scrap_pieces: '',
    rework_pieces: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: integrate with backend
    alert('Additional data submitted')
    setData({
      old_tool_condition: '',
      failure_mode: '',
      pieces_produced: '',
      scrap_pieces: '',
      rework_pieces: ''
    })
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Additional Performance Data</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Old Tool Condition</label>
          <input
            type="text"
            name="old_tool_condition"
            value={data.old_tool_condition}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Failure Mode</label>
          <input
            type="text"
            name="failure_mode"
            value={data.failure_mode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pieces Produced</label>
          <input
            type="number"
            name="pieces_produced"
            value={data.pieces_produced}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scrap Pieces</label>
          <input
            type="number"
            name="scrap_pieces"
            value={data.scrap_pieces}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rework Pieces</label>
          <input
            type="number"
            name="rework_pieces"
            value={data.rework_pieces}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded-md">Submit</button>
        </div>
      </form>
    </main>
  )
}
