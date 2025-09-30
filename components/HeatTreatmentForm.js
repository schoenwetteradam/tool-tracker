import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Flame, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'

const LOAD_TYPES = [
  { value: 'WQ', label: 'Water Quench (WQ)' },
  { value: 'AC', label: 'Air Cool (AC)' },
  { value: 'F.C.A.', label: 'Furnace Cool Anneal (F.C.A.)' },
  { value: 'TEMPER', label: 'Tempering (TEMPER)' },
  { value: 'NORM', label: 'Normalize (NORM)' },
  { value: 'AQ', label: 'Air Quench (AQ)' },
  { value: 'A.H.', label: 'Anneal Harden (A.H.)' },
  { value: 'S.R.', label: 'Stress Relief (S.R.)' }
]

const MATERIAL_TYPES = [
  'CAT3', 'CAT4', 'CAT4 MOD', 'CF8', 'CF3', 'CF8M', 'CF3M', 'CF10SMNN', 
  'CA-15', 'CA-40', 'CA-40 ROLL', 'CB7CU-1', 'DUPLEX 4A', 'C-5',
  '52100-IC', '440-A', '440-C', 'LW4330', '8630-IC', '10B', 'CH-13',
  'SC15-3MO', 'HC250', 'DUC-IRON', 'LEWMET 115', 'CK20-1', 'CA6MN-1'
]

export default function HeatTreatmentForm({ initialData = null, onSuccess = () => {} }) {
  const [formData, setFormData] = useState(initialData || {
    heat_number: '',
    furnace_number: '',
    load_number: '',
    load_type: '',
    job_number: '',
    part_number: '',
    material_type: '',
    cast_weight: '',
    test_material: '',
    temp1_fahrenheit: '',
    time1_hours: '',
    temp2_fahrenheit: '',
    time2_hours: '',
    temp3_fahrenheit: '',
    time3_hours: '',
    temp4_fahrenheit: '',
    time4_hours: '',
    hot_str_tir: '',
    cold_str_tir: '',
    hot_end_bhn: '',
    cold_end_bhn: '',
    gas_usage: '',
    notes: '',
    day_finished: new Date().toISOString().split('T')[0]
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFormData({
      heat_number: '',
      furnace_number: '',
      load_number: '',
      load_type: '',
      job_number: '',
      part_number: '',
      material_type: '',
      cast_weight: '',
      test_material: '',
      temp1_fahrenheit: '',
      time1_hours: '',
      temp2_fahrenheit: '',
      time2_hours: '',
      temp3_fahrenheit: '',
      time3_hours: '',
      temp4_fahrenheit: '',
      time4_hours: '',
      hot_str_tir: '',
      cold_str_tir: '',
      hot_end_bhn: '',
      cold_end_bhn: '',
      gas_usage: '',
      notes: '',
      day_finished: new Date().toISOString().split('T')[0]
    })
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Validate required fields
      if (!formData.heat_number || !formData.day_finished) {
        throw new Error('Heat Number and Day Finished are required')
      }

      // Prepare data - convert empty strings to null for numeric fields
      const dataToSubmit = {
        ...formData,
        furnace_number: formData.furnace_number || null,
        load_number: formData.load_number || null,
        job_number: formData.job_number || null,
        cast_weight: formData.cast_weight || null,
        temp1_fahrenheit: formData.temp1_fahrenheit || null,
        time1_hours: formData.time1_hours || null,
        temp2_fahrenheit: formData.temp2_fahrenheit || null,
        time2_hours: formData.time2_hours || null,
        temp3_fahrenheit: formData.temp3_fahrenheit || null,
        time3_hours: formData.time3_hours || null,
        temp4_fahrenheit: formData.temp4_fahrenheit || null,
        time4_hours: formData.time4_hours || null,
        hot_str_tir: formData.hot_str_tir || null,
        cold_str_tir: formData.cold_str_tir || null,
        hot_end_bhn: formData.hot_end_bhn || null,
        cold_end_bhn: formData.cold_end_bhn || null,
        gas_usage: formData.gas_usage || null
      }

      let result
      if (initialData?.id) {
        // Update existing record
        result = await supabase
          .from('heat_treatment_log')
          .update(dataToSubmit)
          .eq('id', initialData.id)
          .select()
      } else {
        // Insert new record
        result = await supabase
          .from('heat_treatment_log')
          .insert([dataToSubmit])
          .select()
      }

      if (result.error) throw result.error

      setMessage({ 
        type: 'success', 
        text: `Heat treatment ${initialData?.id ? 'updated' : 'recorded'} successfully!` 
      })
      
      if (!initialData?.id) {
        handleReset()
      }
      
      onSuccess(result.data[0])
    } catch (error) {
      console.error('Error saving heat treatment:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to save heat treatment record' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Message */}
      {message.text && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 ${
          message.type === 'success' 
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
            : 'border-rose-200 bg-rose-50 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Heat Identification */}
      <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-spuncast-navy">
          <Flame size={20} />
          Heat Identification
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="heat_number" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Heat Number <span className="text-spuncast-red">*</span>
            </label>
            <input
              type="text"
              id="heat_number"
              name="heat_number"
              value={formData.heat_number}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="e.g., 25H2323"
            />
          </div>
          <div>
            <label htmlFor="furnace_number" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Furnace Number
            </label>
            <input
              type="number"
              id="furnace_number"
              name="furnace_number"
              value={formData.furnace_number}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="e.g., 2"
            />
          </div>
          <div>
            <label htmlFor="load_number" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Load Number
            </label>
            <input
              type="number"
              id="load_number"
              name="load_number"
              value={formData.load_number}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="e.g., 3691"
            />
          </div>
          <div>
            <label htmlFor="load_type" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Load Type
            </label>
            <select
              id="load_type"
              name="load_type"
              value={formData.load_type}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            >
              <option value="">Select Load Type</option>
              {LOAD_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="day_finished" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Day Finished <span className="text-spuncast-red">*</span>
            </label>
            <input
              type="date"
              id="day_finished"
              name="day_finished"
              value={formData.day_finished}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            />
          </div>
        </div>
      </div>

      {/* Job & Part Information */}
      <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
        <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Job & Part Information</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="job_number" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Job Number
            </label>
            <input
              type="number"
              id="job_number"
              name="job_number"
              value={formData.job_number}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="e.g., 159683"
            />
          </div>
          <div>
            <label htmlFor="part_number" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Part Number
            </label>
            <input
              type="text"
              id="part_number"
              name="part_number"
              value={formData.part_number}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="e.g., CAT536-6768"
            />
          </div>
          <div>
            <label htmlFor="material_type" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Material Type
            </label>
            <select
              id="material_type"
              name="material_type"
              value={formData.material_type}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            >
              <option value="">Select Material</option>
              {MATERIAL_TYPES.map(material => (
                <option key={material} value={material}>{material}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cast_weight" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Cast Weight (lbs)
            </label>
            <input
              type="number"
              step="0.01"
              id="cast_weight"
              name="cast_weight"
              value={formData.cast_weight}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="e.g., 1330"
            />
          </div>
          <div>
            <label htmlFor="test_material" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Test Material
            </label>
            <input
              type="text"
              id="test_material"
              name="test_material"
              value={formData.test_material}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="e.g., 25"
            />
          </div>
        </div>
      </div>

      {/* Temperature Cycles */}
      <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
        <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Temperature Cycles</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(cycle => (
            <div key={cycle} className="grid gap-4 md:grid-cols-2 border-l-4 border-spuncast-red pl-4">
              <div>
                <label htmlFor={`temp${cycle}_fahrenheit`} className="block text-sm font-semibold text-spuncast-slate mb-1">
                  Stage {cycle} - Temperature (°F)
                </label>
                <input
                  type="number"
                  id={`temp${cycle}_fahrenheit`}
                  name={`temp${cycle}_fahrenheit`}
                  value={formData[`temp${cycle}_fahrenheit`]}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
                  placeholder="e.g., 1850"
                />
              </div>
              <div>
                <label htmlFor={`time${cycle}_hours`} className="block text-sm font-semibold text-spuncast-slate mb-1">
                  Stage {cycle} - Time (hours)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id={`time${cycle}_hours`}
                  name={`time${cycle}_hours`}
                  value={formData[`time${cycle}_hours`]}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
                  placeholder="e.g., 7"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
        <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Test Results</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="hot_str_tir" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Hot Str TIR
            </label>
            <input
              type="number"
              step="0.01"
              id="hot_str_tir"
              name="hot_str_tir"
              value={formData.hot_str_tir}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            />
          </div>
          <div>
            <label htmlFor="cold_str_tir" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Cold Str TIR
            </label>
            <input
              type="number"
              step="0.01"
              id="cold_str_tir"
              name="cold_str_tir"
              value={formData.cold_str_tir}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            />
          </div>
          <div>
            <label htmlFor="hot_end_bhn" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Hot End BHN
            </label>
            <input
              type="number"
              id="hot_end_bhn"
              name="hot_end_bhn"
              value={formData.hot_end_bhn}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="e.g., 415"
            />
          </div>
          <div>
            <label htmlFor="cold_end_bhn" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Cold End BHN
            </label>
            <input
              type="number"
              id="cold_end_bhn"
              name="cold_end_bhn"
              value={formData.cold_end_bhn}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="e.g., 302"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-brand">
        <h3 className="mb-4 text-lg font-bold text-spuncast-navy">Additional Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="gas_usage" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Gas Usage
            </label>
            <input
              type="number"
              step="0.01"
              id="gas_usage"
              name="gas_usage"
              value={formData.gas_usage}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-semibold text-spuncast-slate mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-spuncast-navy focus:outline-none focus:ring-2 focus:ring-spuncast-navy/20"
              placeholder="Additional notes or observations..."
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border-2 border-spuncast-navy px-6 py-2.5 text-sm font-semibold text-spuncast-navy transition hover:bg-spuncast-navy hover:text-white disabled:opacity-50"
        >
          <RotateCcw size={18} />
          Reset
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-spuncast-red px-6 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-spuncast-redDark disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Save'} Heat Treatment
        </button>
      </div>
    </form>
  )
}
