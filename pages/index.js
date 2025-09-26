import ToolChangeForm from '../components/ToolChangeForm'
import Link from 'next/link'
import { Plus, QrCode, Ruler } from 'lucide-react'

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
        </section>

        <div className="rounded-3xl border border-white/60 bg-white shadow-brand">
          <ToolChangeForm />
        </div>
      </main>
    </div>
  )
}
