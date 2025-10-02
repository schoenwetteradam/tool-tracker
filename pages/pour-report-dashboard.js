import Head from 'next/head'
import PourReportDashboard from '../components/PourReportDashboard'

const PourReportDashboardPage = () => {
  return (
    <>
      <Head>
        <title>Pour Report Dashboard | Tool Tracker</title>
        <meta
          name="description"
          content="Review pour report performance, production metrics, and recent activity."
        />
      </Head>
      <main
        id="main-content"
        className="min-h-screen bg-gradient-to-b from-spuncast-navy/10 via-white to-spuncast-sky/30 py-12"
      >
        <PourReportDashboard />
      </main>
    </>
  )
}

export default PourReportDashboardPage
