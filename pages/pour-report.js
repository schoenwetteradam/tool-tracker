import Head from 'next/head'
import PourReportForm from '../components/PourReportForm.js'

const PourReportPage = () => {
  return (
    <>
      <Head>
        <title>Pour Report Entry | Tool Tracker</title>
        <meta name="description" content="Record centrifugal pour reports directly into the Tool Tracker." />
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-spuncast-navy/10 via-white to-spuncast-sky/30 py-12">
        <PourReportForm />
      </main>
    </>
  )
}

export default PourReportPage
