import Head from 'next/head'
import Link from 'next/link'
import { Flame, Plus, BarChart3, List, ArrowLeft } from 'lucide-react'

export default function HeatTreatmentIndex() {
  return (
    <>
      <Head>
        <title>Heat Treatment Management | Manufacturing System</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-spuncast-sky via-white to-spuncast-sky/50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur border-b border-spuncast-navy/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-spuncast-navy hover:text-spuncast-navyDark transition">
                <ArrowLeft size={24} />
              </Link>
              <div className="flex items-center gap-4">
                <img
                  src="/spuncast-logo.svg"
                  alt="Spuncast logo"
                  className="h-14 w-auto drop-shadow-sm"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-spuncast-red font-semibold">Quality Control</p>
                  <h1 className="text-3xl font-bold text-spuncast-navy">Heat Treatment Management</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-spuncast-red/10 mb-4">
              <Flame className="w-10 h-10 text-spuncast-red" />
            </div>
            <h2 className="text-2xl font-bold text-spuncast-navy mb-2">Heat Treatment Operations</h2>
            <p className="text-spuncast-slate max-w-2xl mx-auto">
              Track and analyze heat treatment cycles, furnace utilization, and quality metrics across all operations
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* New Entry */}
            <Link href="/heat-treatment/new">
              <div className="group rounded-2xl border-2 border-white/60 bg-white p-8 shadow-brand transition hover:shadow-xl hover:border-spuncast-red cursor-pointer">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-spuncast-red/10 mb-4 group-hover:bg-spuncast-red/20 transition">
                  <Plus className="w-8 h-8 text-spuncast-red" />
                </div>
                <h3 className="text-xl font-bold text-spuncast-navy mb-2">New Entry</h3>
                <p className="text-spuncast-slate mb-4">
                  Record a new heat treatment cycle with temperature stages, test results, and quality metrics
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-spuncast-red">
                  <span>Create Record</span>
                  <Plus size={16} />
                </div>
              </div>
            </Link>

            {/* Dashboard */}
            <Link href="/heat-treatment/dashboard">
              <div className="group rounded-2xl border-2 border-white/60 bg-white p-8 shadow-brand transition hover:shadow-xl hover:border-spuncast-navy cursor-pointer">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-spuncast-navy/10 mb-4 group-hover:bg-spuncast-navy/20 transition">
                  <BarChart3 className="w-8 h-8 text-spuncast-navy" />
                </div>
                <h3 className="text-xl font-bold text-spuncast-navy mb-2">Dashboard</h3>
                <p className="text-spuncast-slate mb-4">
                  View analytics, furnace utilization, material performance, and treatment trends
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-spuncast-navy">
                  <span>View Analytics</span>
                  <BarChart3 size={16} />
                </div>
              </div>
            </Link>

            {/* View All */}
            <Link href="/heat-treatment/list">
              <div className="group rounded-2xl border-2 border-white/60 bg-white p-8 shadow-brand transition hover:shadow-xl hover:border-spuncast-slate cursor-pointer">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-spuncast-slate/10 mb-4 group-hover:bg-spuncast-slate/20 transition">
                  <List className="w-8 h-8 text-spuncast-slate" />
                </div>
                <h3 className="text-xl font-bold text-spuncast-navy mb-2">View All Records</h3>
                <p className="text-spuncast-slate mb-4">
                  Browse, search, and filter all heat treatment records with detailed information
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-spuncast-slate">
                  <span>Browse Records</span>
                  <List size={16} />
                </div>
              </div>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mt-12 rounded-2xl border border-white/60 bg-white p-8 shadow-brand">
            <h3 className="text-xl font-bold text-spuncast-navy mb-6">System Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-spuncast-red/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-spuncast-red" />
                </div>
                <div>
                  <h4 className="font-bold text-spuncast-navy mb-1">Multi-Stage Tracking</h4>
                  <p className="text-sm text-spuncast-slate">
                    Record up to 4 temperature/time cycles per treatment for complete process documentation
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-spuncast-navy/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-spuncast-navy" />
                </div>
                <div>
                  <h4 className="font-bold text-spuncast-navy mb-1">Real-Time Analytics</h4>
                  <p className="text-sm text-spuncast-slate">
                    Monitor furnace utilization, material performance, and quality trends in real-time
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-spuncast-red/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-spuncast-red" />
                </div>
                <div>
                  <h4 className="font-bold text-spuncast-navy mb-1">Quality Metrics</h4>
                  <p className="text-sm text-spuncast-slate">
                    Track Brinell hardness numbers (BHN) and TIR measurements for quality assurance
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-spuncast-slate/10 flex items-center justify-center">
                  <List className="w-5 h-5 text-spuncast-slate" />
                </div>
                <div>
                  <h4 className="font-bold text-spuncast-navy mb-1">Resource Tracking</h4>
                  <p className="text-sm text-spuncast-slate">
                    Monitor gas usage and cycle times to optimize efficiency and reduce costs
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Load Types Reference */}
          <div className="mt-8 rounded-2xl border border-white/60 bg-gradient-to-br from-white to-spuncast-sky/20 p-8 shadow-brand">
            <h3 className="text-xl font-bold text-spuncast-navy mb-4">Supported Load Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { code: 'WQ', name: 'Water Quench' },
                { code: 'AC', name: 'Air Cool' },
                { code: 'F.C.A.', name: 'Furnace Cool Anneal' },
                { code: 'TEMPER', name: 'Tempering' },
                { code: 'NORM', name: 'Normalize' },
                { code: 'AQ', name: 'Air Quench' },
                { code: 'A.H.', name: 'Anneal Harden' },
                { code: 'S.R.', name: 'Stress Relief' }
              ].map(type => (
                <div key={type.code} className="rounded-lg bg-white border border-gray-200 p-3">
                  <div className="text-xs font-bold text-spuncast-red mb-1">{type.code}</div>
                  <div className="text-sm text-spuncast-slate">{type.name}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
