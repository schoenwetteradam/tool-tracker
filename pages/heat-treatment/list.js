import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, List, Search } from 'lucide-react'
import { formatDate, formatLoadType } from '../../lib/heatTreatmentUtils'

export default function HeatTreatmentList() {
  const [treatments, setTreatments] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTreatments = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('heat_treatment_log')
          .select('*')
          .order('day_finished', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(200)

        if (error) throw error
        setTreatments(data || [])
        setFiltered(data || [])
      } catch (error) {
        console.error('Failed to load heat treatments:', error)
        setTreatments([])
        setFiltered([])
      } finally {
        setLoading(false)
      }
    }

    loadTreatments()
  }, [])

  useEffect(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      setFiltered(treatments)
      return
    }

    setFiltered(
      treatments.filter(treatment =>
        [
          treatment.heat_number,
          treatment.part_number,
          treatment.material_type,
          treatment.load_type,
          treatment.job_number
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(term))
      )
    )
  }, [search, treatments])

  return (
    <>
      <Head>
        <title>Heat Treatment Records | Manufacturing System</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-spuncast-sky via-white to-spuncast-sky/50">
        <header className="bg-white/95 backdrop-blur border-b border-spuncast-navy/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex items-center gap-4">
              <Link href="/heat-treatment" className="text-spuncast-navy hover:text-spuncast-navyDark transition">
                <ArrowLeft size={24} />
              </Link>
              <div className="flex items-center gap-4">
                <List className="h-10 w-10 text-spuncast-slate" />
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-spuncast-slate font-semibold">Records</p>
                  <h1 className="text-2xl font-bold text-spuncast-navy">Heat Treatment History</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-spuncast-navy">All Treatment Records</h2>
              <p className="text-sm text-spuncast-slate">
                Browse the most recent heat treatment cycles and export data for reporting
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 shadow-sm">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by heat number, part, material, or load type"
                className="w-64 bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white shadow-brand">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-spuncast-sky/40 text-left text-xs font-semibold uppercase tracking-wide text-spuncast-slate">
                  <th className="p-3">Date</th>
                  <th className="p-3">Heat #</th>
                  <th className="p-3">Furnace</th>
                  <th className="p-3">Load</th>
                  <th className="p-3">Load Type</th>
                  <th className="p-3">Part #</th>
                  <th className="p-3">Material</th>
                  <th className="p-3">Cast Weight</th>
                  <th className="p-3">Hot BHN</th>
                  <th className="p-3">Cold BHN</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((treatment) => (
                  <tr key={treatment.id} className="border-t border-gray-100 text-sm hover:bg-spuncast-sky/30">
                    <td className="p-3 text-spuncast-slate">{formatDate(treatment.day_finished)}</td>
                    <td className="p-3 font-semibold text-spuncast-navy">{treatment.heat_number}</td>
                    <td className="p-3">{treatment.furnace_number || '-'}</td>
                    <td className="p-3">{treatment.load_number || '-'}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center rounded-full bg-spuncast-navy/10 px-2.5 py-1 text-xs font-semibold text-spuncast-navy">
                        {formatLoadType(treatment.load_type) || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">{treatment.part_number || '-'}</td>
                    <td className="p-3">{treatment.material_type || '-'}</td>
                    <td className="p-3">{treatment.cast_weight ? `${treatment.cast_weight} lbs` : '-'}</td>
                    <td className="p-3 text-spuncast-red font-semibold">{treatment.hot_end_bhn || '-'}</td>
                    <td className="p-3 text-spuncast-red font-semibold">{treatment.cold_end_bhn || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-spuncast-slate">
                No heat treatments found for your search.
              </div>
            )}

            {loading && (
              <div className="p-8 text-center text-sm text-spuncast-slate">
                Loading heat treatment records...
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
