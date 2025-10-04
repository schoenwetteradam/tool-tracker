import ToolChangeForm from '../components/ToolChangeForm.js'
import Link from 'next/link'
import { BarChart3, Plus, QrCode, Ruler, Flame, Factory, LayoutDashboard, Upload } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header with Navigation */}
      <header className="bg-white/95 backdrop-blur border-b border-spuncast-navy/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/spuncast-logo.svg"
                alt="Spuncast logo"
                className="h-14 w-auto drop-shadow-sm"
              />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-spuncast-red font-semibold">Tooling Excellence</p>
                <h1 className="text-3xl font-bold text-spuncast-navy">Tool Change Tracker</h1>
              </div>
            </div>
            <nav className="flex flex-wrap gap-3 text-sm font-semibold" aria-label="Primary">
              <Link
                href="/after-blast-dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-spuncast-sky px-5 py-2.5 text-spuncast-navy shadow-brand transition hover:-translate-y-0.5 hover:bg-spuncast-sky/80"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-spuncast-navy">
                  <BarChart3 size={18} />
                </span>
                <span>After Blast Dashboard</span>
              </Link>
              <Link
                href="/blast-exit"
                className="group inline-flex items-center gap-2 rounded-full bg-spuncast-navy px-5 py-2.5 text-white shadow-brand transition hover:bg-spuncast-navyDark"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                  <Ruler size={18} />
                </span>
                <span>Blast Exit Measurements</span>
              </Link>
              <Link
                href="/qr-generator"
                className="group inline-flex items-center gap-2 rounded-full bg-spuncast-red px-5 py-2.5 text-white shadow-brand transition hover:bg-spuncast-redDark"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                  <QrCode size={18} />
                </span>
                <span>QR Generator</span>
              </Link>
              <Link
                href="/pour-report"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-spuncast-sky to-spuncast-navy px-5 py-2.5 text-white shadow-brand transition hover:from-spuncast-sky/90 hover:to-spuncast-navyDark"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                  <Factory size={18} />
                </span>
                <span>Melt &amp; Cast Entry</span>
              </Link>
              <Link
                href="/heat-treatment"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-spuncast-navy to-spuncast-red px-5 py-2.5 text-white shadow-brand transition hover:from-spuncast-navyDark hover:to-spuncast-redDark"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                  <Flame size={18} />
                </span>
                <span>Heat Treatment</span>
              </Link>
              <Link
                href="/bulk-upload"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-spuncast-red to-spuncast-sky px-5 py-2.5 text-white shadow-brand transition hover:from-spuncast-redDark hover:to-spuncast-sky/80"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                  <Upload size={18} />
                </span>
                <span>Bulk Upload</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-10">
        <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl bg-white shadow-brand border border-white/60 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-spuncast-red to-spuncast-redDark text-white shadow-brand">
                <Plus size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-spuncast-navy">Record Tool Change</h3>
                <p className="text-sm text-spuncast-slate/70">Log the details of your latest tool swap in the form below.</p>
              </div>
            </div>
          </div>

          <Link href="/blast-exit" className="group rounded-2xl bg-gradient-to-br from-spuncast-navy to-spuncast-navyDark p-6 text-white shadow-brand transition-transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Ruler size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Blast Exit Measurements</h3>
                <p className="text-sm text-white/80">Capture casting inspection data with brand-aligned visuals.</p>
              </div>
            </div>
          </Link>

          <Link href="/after-blast-dashboard" className="group rounded-2xl bg-gradient-to-br from-spuncast-sky to-spuncast-sky/70 p-6 text-spuncast-navy shadow-brand transition-transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-spuncast-navy">
                <BarChart3 size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">After Blast Dashboard</h3>
                <p className="text-sm text-spuncast-navy/70">Review dimensional trends and heat treat approvals in real time.</p>
              </div>
            </div>
          </Link>

          <Link href="/qr-generator" className="group rounded-2xl bg-gradient-to-br from-spuncast-red to-spuncast-redDark p-6 text-white shadow-brand transition-transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <QrCode size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Generate QR Codes</h3>
                <p className="text-sm text-white/80">Produce equipment QR codes that match Spuncast branding.</p>
              </div>
            </div>
          </Link>

          <Link href="/heat-treatment" className="group rounded-2xl bg-gradient-to-br from-spuncast-red to-spuncast-navy p-6 text-white shadow-brand transition-transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Flame size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Heat Treatment Management</h3>
                <p className="text-sm text-white/80">Record cycles, view analytics, and monitor furnace utilization.</p>
              </div>
            </div>
          </Link>

          <Link href="/pour-report-dashboard" className="group rounded-2xl bg-gradient-to-br from-spuncast-sky to-spuncast-red p-6 text-white shadow-brand transition-transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <LayoutDashboard size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Melt &amp; Pour Dashboard</h3>
                <p className="text-sm text-white/80">Monitor melt performance, pour activity, and production KPIs.</p>
              </div>
            </div>
          </Link>

          <Link href="/pour-report" className="group rounded-2xl bg-gradient-to-br from-spuncast-sky to-spuncast-navy p-6 text-white shadow-brand transition-transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Factory size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Melt &amp; Cast Data Entry</h3>
                <p className="text-sm text-white/80">Capture melt furnace, ladle, and casting metrics in one streamlined form.</p>
              </div>
            </div>
          </Link>
          <Link href="/bulk-upload" className="group rounded-2xl bg-gradient-to-br from-spuncast-red to-spuncast-sky p-6 text-white shadow-brand transition-transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Upload size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">📤 Bulk Upload</h3>
                <p className="text-sm text-white/80">Import Pour Report data from CSV files in minutes.</p>
              </div>
            </div>
          </Link>
        </section>

        <div className="rounded-3xl border border-white/60 bg-white shadow-brand">
          <ToolChangeForm />
        </div>
      </main>
    </div>
  )
}
