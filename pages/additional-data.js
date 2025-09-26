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
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-spuncast-navy/10 via-spuncast-sky to-white py-12">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/60 bg-white px-6 py-8 shadow-brand">
        <h1 className="text-3xl font-bold text-spuncast-navy mb-6">Additional Performance Data</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="old_tool_condition" className="mb-1 block text-sm font-semibold text-spuncast-slate">
              Old Tool Condition
            </label>
            <input
              type="text"
              id="old_tool_condition"
              name="old_tool_condition"
              value={data.old_tool_condition}
              onChange={handleChange}
              className="w-full rounded-xl border border-spuncast-navy/10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            />
          </div>
          <div>
            <label htmlFor="failure_mode" className="mb-1 block text-sm font-semibold text-spuncast-slate">
              Failure Mode
            </label>
            <input
              type="text"
              id="failure_mode"
              name="failure_mode"
              value={data.failure_mode}
              onChange={handleChange}
              className="w-full rounded-xl border border-spuncast-navy/10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            />
          </div>
          <div>
            <label htmlFor="pieces_produced" className="mb-1 block text-sm font-semibold text-spuncast-slate">
              Pieces Produced
            </label>
            <input
              type="number"
              id="pieces_produced"
              name="pieces_produced"
              value={data.pieces_produced}
              onChange={handleChange}
              className="w-full rounded-xl border border-spuncast-navy/10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            />
          </div>
          <div>
            <label htmlFor="scrap_pieces" className="mb-1 block text-sm font-semibold text-spuncast-slate">
              Scrap Pieces
            </label>
            <input
              type="number"
              id="scrap_pieces"
              name="scrap_pieces"
              value={data.scrap_pieces}
              onChange={handleChange}
              className="w-full rounded-xl border border-spuncast-navy/10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            />
          </div>
          <div>
            <label htmlFor="rework_pieces" className="mb-1 block text-sm font-semibold text-spuncast-slate">
              Rework Pieces
            </label>
            <input
              type="number"
              id="rework_pieces"
              name="rework_pieces"
              value={data.rework_pieces}
              onChange={handleChange}
              className="w-full rounded-xl border border-spuncast-navy/10 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-spuncast-red px-6 py-3 font-semibold uppercase tracking-wide text-white shadow-brand transition hover:bg-spuncast-redDark"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
