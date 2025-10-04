import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  GaugeCircle,
  RefreshCw,
  Ruler
} from 'lucide-react'
import { getAfterBlastMeasurements } from '../lib/supabase.js'

const statusThemes = {
  PASS: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pill: 'bg-emerald-500/10 text-emerald-600',
    indicator: 'bg-emerald-500',
    label: 'Pass'
  },
  MARGINAL: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    pill: 'bg-amber-500/10 text-amber-600',
    indicator: 'bg-amber-500',
    label: 'Marginal'
  },
  FAIL: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    pill: 'bg-rose-500/10 text-rose-600',
    indicator: 'bg-rose-500',
    label: 'Fail'
  },
  default: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    pill: 'bg-slate-500/10 text-slate-500',
    indicator: 'bg-slate-400',
    label: 'Pending'
  }
}

const getStatusTheme = (status) => {
  if (!status) {
    return statusThemes.default
  }

  const normalized = String(status).trim().toUpperCase()
  return statusThemes[normalized] || statusThemes.default
}

const formatDateTime = (dateValue, timeValue) => {
  if (!dateValue && !timeValue) {
    return '—'
  }

  const date = dateValue ? new Date(dateValue) : null
  const formattedDate = date?.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  if (!timeValue) {
    return formattedDate || '—'
  }

  return `${formattedDate || dateValue} · ${timeValue}`
}

const formatDimension = (actual, target, tolerance) => {
  if (actual === null || actual === undefined || actual === '') {
    return '—'
  }

  const numericActual = Number(actual)
  if (!Number.isFinite(numericActual)) {
    return '—'
  }

  const numericTarget = Number(target)
  const numericTolerance = Number(tolerance)

  const pieces = [numericActual.toFixed(3)]

  if (Number.isFinite(numericTarget)) {
    const toleranceText = Number.isFinite(numericTolerance)
      ? `±${numericTolerance.toFixed(3)}`
      : 'target'

    pieces.push(`target ${numericTarget.toFixed(3)} ${toleranceText}`)
  }

  return pieces.join(' · ')
}

export default function AfterBlastDashboard() {
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMeasurements = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAfterBlastMeasurements({ limit: 120 })
      setMeasurements(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load after blast measurements:', err)
      setError(
        err?.message ||
          'Unable to load measurements. Verify Supabase credentials or table access.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMeasurements()
  }, [])

  const summary = useMemo(() => {
    if (!measurements.length) {
      return {
        total: 0,
        pass: 0,
        marginal: 0,
        fail: 0,
        heatTreatApproved: 0
      }
    }

    return measurements.reduce(
      (accumulator, measurement) => {
        const statusKey = String(measurement?.dimensional_status || '')
          .trim()
          .toUpperCase()

        if (statusKey === 'PASS') {
          accumulator.pass += 1
        } else if (statusKey === 'MARGINAL') {
          accumulator.marginal += 1
        } else if (statusKey === 'FAIL') {
          accumulator.fail += 1
        }

        if (measurement?.heat_treat_approved === true) {
          accumulator.heatTreatApproved += 1
        }

        accumulator.total += 1
        return accumulator
      },
      { total: 0, pass: 0, marginal: 0, fail: 0, heatTreatApproved: 0 }
    )
  }, [measurements])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-spuncast-sky/30">
      <Head>
        <title>After Blast Measurement Dashboard • Spuncast</title>
      </Head>

      <header className="border-b border-white/60 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-spuncast-red">
              Measurement Quality
            </p>
            <h1 className="mt-2 text-3xl font-bold text-spuncast-navy">
              After Blast Dashboard
            </h1>
            <p className="mt-1 text-sm text-spuncast-slate/70">
              Live overview of dimensional checks submitted at the blast exit station.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-spuncast-navy/20 bg-white px-4 py-2 text-sm font-semibold text-spuncast-navy shadow-sm transition hover:-translate-y-0.5 hover:shadow-brand"
            >
              <ArrowLeft size={16} />
              Back to tools
            </Link>
            <button
              type="button"
              onClick={loadMeasurements}
              className="inline-flex items-center gap-2 rounded-full bg-spuncast-navy px-4 py-2 text-sm font-semibold text-white shadow-brand transition hover:bg-spuncast-navyDark disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin text-white/70' : ''}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-rose-700 shadow-brand">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load measurements</p>
                <p className="text-sm text-rose-600/80">{error}</p>
              </div>
            </div>
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spuncast-slate/70">
                  Total measurements
                </p>
                <p className="mt-3 text-3xl font-bold text-spuncast-navy">
                  {loading ? '—' : summary.total}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-spuncast-navy/10 text-spuncast-navy">
                <ClipboardList size={26} />
              </div>
            </div>
            <p className="mt-4 text-sm text-spuncast-slate/70">
              Most recent {measurements.length} submissions shown.
            </p>
          </article>

          <article className="rounded-3xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spuncast-slate/70">
                  Passing status
                </p>
                <p className="mt-3 text-3xl font-bold text-emerald-600">
                  {loading ? '—' : summary.pass}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 size={26} />
              </div>
            </div>
            <p className="mt-4 text-sm text-spuncast-slate/70">
              Includes measurements recorded as full PASS.
            </p>
          </article>

          <article className="rounded-3xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spuncast-slate/70">
                  Marginal alerts
                </p>
                <p className="mt-3 text-3xl font-bold text-amber-600">
                  {loading ? '—' : summary.marginal}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <BarChart3 size={26} />
              </div>
            </div>
            <p className="mt-4 text-sm text-spuncast-slate/70">
              Monitor parts trending toward corrective action.{' '}
              {loading
                ? ''
                : summary.fail
                ? `${summary.fail} fail status${summary.fail === 1 ? ' is' : 'es are'} awaiting review.`
                : ''}
            </p>
          </article>

          <article className="rounded-3xl border border-white/60 bg-white p-6 shadow-brand">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spuncast-slate/70">
                  Heat treat approved
                </p>
                <p className="mt-3 text-3xl font-bold text-spuncast-navy">
                  {loading ? '—' : summary.heatTreatApproved}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-spuncast-navy/10 text-spuncast-navy">
                <GaugeCircle size={26} />
              </div>
            </div>
            <p className="mt-4 text-sm text-spuncast-slate/70">
              Castings cleared to proceed after inspection.
              {loading
                ? ''
                : summary.fail
                ? ` ${summary.fail} submission${summary.fail === 1 ? ' requires' : 's require'} immediate follow-up.`
                : ''}
            </p>
          </article>
        </section>

        <section className="mt-10 rounded-3xl border border-white/60 bg-white shadow-brand">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-spuncast-navy/10 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-spuncast-navy">
                Recent after blast submissions
              </h2>
              <p className="text-sm text-spuncast-slate/70">
                Displays the latest dimensional_measurements records captured via the blast exit app.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-spuncast-slate/60">
              <Ruler size={14} />
              dimensional_measurements
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-spuncast-navy/10 text-sm">
              <thead className="bg-spuncast-sky/60">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-spuncast-slate/70">
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Heat</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Heat Treat</th>
                  <th className="px-4 py-3">Surface / Material</th>
                  <th className="px-4 py-3">Barrel Ø</th>
                  <th className="px-4 py-3">Flange Ø</th>
                  <th className="px-4 py-3">Overall L</th>
                  <th className="px-4 py-3">Length to Flange</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-spuncast-navy/5">
                {loading ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-10 text-center text-sm text-spuncast-slate/70"
                    >
                      Loading measurements…
                    </td>
                  </tr>
                ) : measurements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-10 text-center text-sm text-spuncast-slate/70"
                    >
                      No after blast submissions found. Submit a measurement from the blast exit app to see it appear here.
                    </td>
                  </tr>
                ) : (
                  measurements.map((measurement) => {
                    const theme = getStatusTheme(measurement?.dimensional_status)

                    return (
                      <tr key={measurement.id} className="align-top">
                        <td className="px-4 py-4 text-spuncast-navy">
                          {formatDateTime(
                            measurement?.measurement_date,
                            measurement?.measurement_time
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-spuncast-navy">
                            {measurement?.product_number || '—'}
                          </div>
                          <div className="text-xs uppercase tracking-[0.25em] text-spuncast-slate/50">
                            {measurement?.product_family || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-spuncast-navy">
                          {measurement?.heat_number || '—'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-spuncast-navy">
                            {measurement?.operator || '—'}
                          </div>
                          <div className="text-xs text-spuncast-slate/60">
                            Shift {measurement?.shift ?? '—'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${theme.indicator}`} />
                            {theme.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              measurement?.heat_treat_approved
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-spuncast-slate/10 text-spuncast-slate/80'
                            }`}
                          >
                            {measurement?.heat_treat_approved ? 'Approved' : 'Hold'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-spuncast-slate/70">
                          <div>{measurement?.surface_condition || '—'}</div>
                          <div className="mt-1">{measurement?.material_appearance || '—'}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-spuncast-navy">
                          {formatDimension(
                            measurement?.barrel_diameter_actual,
                            measurement?.barrel_diameter_target,
                            measurement?.barrel_diameter_tolerance
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-spuncast-navy">
                          {formatDimension(
                            measurement?.flange_diameter_actual,
                            measurement?.flange_diameter_target,
                            measurement?.flange_diameter_tolerance
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-spuncast-navy">
                          {formatDimension(
                            measurement?.overall_length_actual,
                            measurement?.overall_length_target,
                            measurement?.overall_length_tolerance
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-spuncast-navy">
                          {formatDimension(
                            measurement?.length_to_flange_actual,
                            measurement?.length_to_flange_target,
                            measurement?.length_to_flange_tolerance
                          )}
                        </td>
                        <td className="px-4 py-4 max-w-xs text-sm text-spuncast-slate/80">
                          {measurement?.notes || '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
