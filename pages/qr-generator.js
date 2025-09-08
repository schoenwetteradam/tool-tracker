import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const machines = [
  { value: '1689', label: '1689 - DOOSAN PUMA 2600SY' },
  { value: '1717', label: '1717 - DOOSAN PUMA 5100LYB' },
  { value: '1747', label: '1747 - DOOSAN PUMA (Large)' },
  { value: '1759', label: '1759 - DOOSAN PUMA 4100LB' },
  { value: '1760', label: '1760 - DOOSAN PUMA 3100XLY' },
  { value: '1770', label: '1770 - DOOSAN PUMA 5100B #1' },
  { value: '1771', label: '1771 - DOOSAN PUMA 5100B #2' },
  { value: '1781', label: '1781 - CLAUSING CL 35160' },
  { value: '1405', label: '1405 - CNC CRAWFORD' },
  { value: '1411', label: '1411 - CINCINNATI 18U060' },
  { value: '1419', label: '1419 - CINCINNATI 21U100' },
  { value: '1473', label: '1473 - CNC 24U' },
  { value: '1528', label: '1528 - MAZAK CNC' },
  { value: '1531', label: '1531 - CNC 18U UNIV' },
  { value: '1549', label: '1549 - CINCINNATI 28U' },
  { value: '1577', label: '1577 - CINCINNATI 24U TWIN DISC' },
  { value: '1681', label: '1681 - CINTURN 28U (29U)' },
  { value: '1254', label: '1254 - LEBLOND BORING #1' },
  { value: '1340', label: '1340 - NILES BORING #2' },
  { value: '1383', label: '1383 - NILES BORING #3' },
  { value: '1389', label: '1389 - NILES BORING #4' },
  { value: 'CUSTOM', label: 'Custom Machine Name' }
]

const QRGeneratorPage = () => {
  const [selected, setSelected] = useState('')
  const [customMachine, setCustomMachine] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://tool-tracker-eight.vercel.app')
  const [qrUrl, setQrUrl] = useState('')
  const [machineDisplay, setMachineDisplay] = useState('')
  const [generated, setGenerated] = useState(false)

  const handleGenerate = () => {
    const equipment = selected === 'CUSTOM' ? customMachine.trim() : selected
    if (!equipment) return

    const url = `${baseUrl.replace(/\/$/, '')}/?equipment=${encodeURIComponent(equipment)}&workcenter=${encodeURIComponent(equipment)}`
    const display = selected === 'CUSTOM'
      ? customMachine.trim()
      : machines.find(m => m.value === selected)?.label || ''

    setQrUrl(url)
    setMachineDisplay(display)
    setGenerated(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrUrl)}`
    link.download = `QR_${machineDisplay.replace(/\s+/g, '_')}.png`
    link.click()
  }

  return (
    <>
      <Head>
        <title>QR Code Generator</title>
      </Head>
      <main className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">QR Code Generator</h1>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Select Machine:</label>
          <select
            className="w-full border p-2 rounded"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            <option value="">Choose a machine...</option>
            {machines.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {selected === 'CUSTOM' && (
          <div className="mb-4">
            <label htmlFor="customMachine" className="block mb-1 font-medium">Custom Machine Name:</label>
            <input
              id="customMachine"
              className="w-full border p-2 rounded"
              value={customMachine}
              onChange={e => setCustomMachine(e.target.value)}
            />
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="baseUrl" className="block mb-1 font-medium">Form URL (where you host the form):</label>
          <input
            id="baseUrl"
            className="w-full border p-2 rounded"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
          />
        </div>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleGenerate}
        >
          Generate QR Code
        </button>

        {generated && (
          <div className="mt-6 text-center">
            <div className="font-medium mb-2">{machineDisplay}</div>
            <div className="inline-block p-4 bg-white">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code"
              />
            </div>
            <div className="mt-2 text-sm break-all">{qrUrl}</div>
            <div className="mt-4 space-x-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handlePrint}
              >
                Print
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleDownload}
              >
                Download
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/" className="text-blue-600 underline">
            &larr; Back to form
          </Link>
        </div>
      </main>
    </>
  )
}

export default QRGeneratorPage

