import { useState } from 'react'
import { addToolChange } from '../lib/supabase'

const initialState = {
  date: '',
  time: '',
  shift: '',
  operator: '',
  supervisor: '',
  work_center: '',
  machine_number: '',
  operation: '',
  part_number: '',
  job_number: '',
  tool_type: '',
  old_tool_id: '',
  new_tool_id: '',
  tool_position: '',
  insert_type: '',
  insert_grade: '',
  change_reason: '',
  old_tool_condition: '',
  pieces_produced: '',
  cycle_time: '',
  dimension_check: '',
  surface_finish: '',
  notes: ''
}

export default function ToolChangeForm() {
  const [form, setForm] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const payload = {
        ...form,
        shift: form.shift ? parseInt(form.shift) : null,
        pieces_produced: form.pieces_produced ? parseInt(form.pieces_produced) : null,
        cycle_time: form.cycle_time ? parseFloat(form.cycle_time) : null,
      }
      await addToolChange(payload)
      setMessage('Saved!')
      setForm(initialState)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input type="date" name="date" value={form.date} onChange={handleChange} required className="border p-2" />
        <input type="time" name="time" value={form.time} onChange={handleChange} required className="border p-2" />
        <input type="number" name="shift" placeholder="Shift" value={form.shift} onChange={handleChange} className="border p-2" />
        <input type="text" name="operator" placeholder="Operator" value={form.operator} onChange={handleChange} className="border p-2" />
        <input type="text" name="supervisor" placeholder="Supervisor" value={form.supervisor} onChange={handleChange} className="border p-2" />
        <input type="text" name="work_center" placeholder="Work Center" value={form.work_center} onChange={handleChange} className="border p-2" />
        <input type="text" name="machine_number" placeholder="Machine Number" value={form.machine_number} onChange={handleChange} className="border p-2" />
        <input type="text" name="operation" placeholder="Operation" value={form.operation} onChange={handleChange} className="border p-2" />
        <input type="text" name="part_number" placeholder="Part Number" value={form.part_number} onChange={handleChange} className="border p-2" />
        <input type="text" name="job_number" placeholder="Job Number" value={form.job_number} onChange={handleChange} className="border p-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input type="text" name="tool_type" placeholder="Tool Type" value={form.tool_type} onChange={handleChange} className="border p-2" />
        <input type="text" name="old_tool_id" placeholder="Old Tool ID" value={form.old_tool_id} onChange={handleChange} className="border p-2" />
        <input type="text" name="new_tool_id" placeholder="New Tool ID" value={form.new_tool_id} onChange={handleChange} className="border p-2" />
        <input type="text" name="tool_position" placeholder="Tool Position" value={form.tool_position} onChange={handleChange} className="border p-2" />
        <input type="text" name="insert_type" placeholder="Insert Type" value={form.insert_type} onChange={handleChange} className="border p-2" />
        <input type="text" name="insert_grade" placeholder="Insert Grade" value={form.insert_grade} onChange={handleChange} className="border p-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input type="text" name="change_reason" placeholder="Change Reason" value={form.change_reason} onChange={handleChange} className="border p-2" />
        <input type="text" name="old_tool_condition" placeholder="Old Tool Condition" value={form.old_tool_condition} onChange={handleChange} className="border p-2" />
        <input type="number" name="pieces_produced" placeholder="Pieces Produced" value={form.pieces_produced} onChange={handleChange} className="border p-2" />
        <input type="number" step="0.01" name="cycle_time" placeholder="Cycle Time" value={form.cycle_time} onChange={handleChange} className="border p-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input type="text" name="dimension_check" placeholder="Dimension Check" value={form.dimension_check} onChange={handleChange} className="border p-2" />
        <input type="text" name="surface_finish" placeholder="Surface Finish" value={form.surface_finish} onChange={handleChange} className="border p-2" />
      </div>

      <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} className="border p-2 w-full" />

      <button type="submit" className="px-4 py-2 bg-blue-600 text-white" disabled={loading}>
        {loading ? 'Saving...' : 'Submit'}
      </button>
      {message && <p>{message}</p>}
    </form>
  )
}
