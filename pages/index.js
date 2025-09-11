import ToolChangeForm from '../components/ToolChangeForm'
import Link from 'next/link'
import { Plus, QrCode } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">🔧 Tool Change Tracker</h1>
            <nav className="flex space-x-4">
              <Link
                href="/qr-generator"
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <QrCode size={20} />
                <span>QR Generator</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
            <div className="flex items-center space-x-3">
              <Plus size={32} />
              <div>
                <h3 className="text-xl font-semibold">Record Tool Change</h3>
                <p className="text-green-100">Log new tool changes below</p>
              </div>
            </div>
          </div>

          <Link href="/qr-generator" className="group">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white hover:from-purple-600 hover:to-purple-700 transition-all transform group-hover:scale-105">
              <div className="flex items-center space-x-3">
                <QrCode size={32} />
                <div>
                  <h3 className="text-xl font-semibold">Generate QR Codes</h3>
                  <p className="text-purple-100">Create equipment QR codes</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Tool Change Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <ToolChangeForm />
        </div>
      </div>
    </div>
  )
}
