import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import HeatTreatmentForm from '../../components/HeatTreatmentForm.js'
import { ArrowLeft, Flame } from 'lucide-react'

export default function NewHeatTreatment() {
  const router = useRouter()

  const handleSuccess = (data) => {
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/heat-treatment/dashboard')
    }, 2000)
  }

  return (
    <>
      <Head>
        <title>New Heat Treatment Entry | Manufacturing System</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-spuncast-sky via-white to-spuncast-sky/50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur border-b border-spuncast-navy/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex items-center gap-4">
              <Link href="/heat-treatment" className="text-spuncast-navy hover:text-spuncast-navyDark transition">
                <ArrowLeft size={24} />
              </Link>
              <div className="flex items-center gap-4">
                <Flame className="h-10 w-10 text-spuncast-red" />
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-spuncast-red font-semibold">Data Entry</p>
                  <h1 className="text-2xl font-bold text-spuncast-navy">New Heat Treatment Entry</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">
          <HeatTreatmentForm onSuccess={handleSuccess} />
        </main>
      </div>
    </>
  )
}
