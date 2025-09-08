import ToolChangeForm from '../components/ToolChangeForm'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tool Change Tracker</h1>
      <ToolChangeForm />
      <div className="mt-4">
        <Link href="/qr-generator" className="text-blue-600 underline">
          Generate equipment QR codes
        </Link>
      </div>
    </main>
  )
}
