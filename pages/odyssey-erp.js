import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Package,
  ClipboardList,
  BarChart3,
  Boxes,
  Wifi,
  WifiOff,
  Play,
  Loader2
} from 'lucide-react'

export default function OdysseyERPPage() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState({})
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState(null)
  const [syncResults, setSyncResults] = useState({})
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch status on mount
  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/odyssey-erp/status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      setTestingConnection(true)
      setConnectionResult(null)
      const response = await fetch('/api/odyssey-erp/test-connection', {
        method: 'POST'
      })
      const data = await response.json()
      setConnectionResult(data)
    } catch (error) {
      setConnectionResult({
        success: false,
        message: error.message || 'Connection test failed'
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const syncData = async (type) => {
    try {
      setSyncing(prev => ({ ...prev, [type]: true }))
      setSyncResults(prev => ({ ...prev, [type]: null }))

      const response = await fetch(`/api/odyssey-erp/sync?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      setSyncResults(prev => ({ ...prev, [type]: data }))

      // Refresh status after sync
      await fetchStatus()
    } catch (error) {
      setSyncResults(prev => ({
        ...prev,
        [type]: { success: false, errors: [error.message] }
      }))
    } finally {
      setSyncing(prev => ({ ...prev, [type]: false }))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatDuration = (ms) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const syncTypes = [
    {
      key: 'products',
      label: 'Products',
      icon: Package,
      description: 'Sync product/item master data'
    },
    {
      key: 'shop-orders',
      label: 'Shop Orders',
      icon: ClipboardList,
      description: 'Sync work orders and job information'
    },
    {
      key: 'production-history',
      label: 'Production History',
      icon: BarChart3,
      description: 'Sync production records and labor tracking'
    },
    {
      key: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      description: 'Sync inventory levels and quantities'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Odyssey ERP status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Odyssey ERP Integration</h1>
                <p className="text-gray-400 text-sm">
                  Sync data with B&L Information Systems Odyssey ERP
                </p>
              </div>
            </div>
            <button
              onClick={fetchStatus}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Configuration Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Configuration Status
          </h2>

          {status?.config ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded p-4">
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {status.config.configured ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-medium">Configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-500 font-medium">Not Configured</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-700 rounded p-4">
                <p className="text-gray-400 text-sm mb-1">API URL</p>
                <p className="font-mono text-sm truncate">{status.config.apiUrl || '-'}</p>
              </div>

              <div className="bg-gray-700 rounded p-4">
                <p className="text-gray-400 text-sm mb-1">Company ID</p>
                <p className="font-mono text-sm">{status.config.companyId || '-'}</p>
              </div>

              <div className="bg-gray-700 rounded p-4">
                <p className="text-gray-400 text-sm mb-1">Authentication</p>
                <p className="text-sm">
                  {status.config.hasApiKey
                    ? 'API Key'
                    : status.config.hasCredentials
                    ? 'Username/Password'
                    : 'Not Set'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Unable to load configuration</p>
          )}

          {/* Test Connection Button */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={testConnection}
              disabled={testingConnection || !status?.config?.configured}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                status?.config?.configured
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {testingConnection ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              Test Connection
            </button>

            {connectionResult && (
              <div
                className={`mt-3 p-3 rounded ${
                  connectionResult.success ? 'bg-green-900/50' : 'bg-red-900/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span>{connectionResult.message}</span>
                </div>
                {connectionResult.workCentersFound !== undefined && (
                  <p className="text-sm text-gray-400 mt-1">
                    Found {connectionResult.workCentersFound} work centers
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sync Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Data Synchronization
          </h2>

          {/* Sync All Button */}
          <div className="mb-6">
            <button
              onClick={() => syncData('all')}
              disabled={syncing.all || !status?.config?.configured}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-medium ${
                status?.config?.configured
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {syncing.all ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Sync All Data
            </button>

            {syncResults.all && (
              <div
                className={`mt-3 p-4 rounded ${
                  syncResults.all.errors?.length > 0 ? 'bg-yellow-900/50' : 'bg-green-900/50'
                }`}
              >
                <p className="font-medium">
                  Synced {syncResults.all.totalSynced || 0} items
                  {syncResults.all.totalFailed > 0 && `, ${syncResults.all.totalFailed} failed`}
                </p>
                {syncResults.all.errors?.length > 0 && (
                  <ul className="text-sm text-yellow-300 mt-2">
                    {syncResults.all.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Individual Sync Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {syncTypes.map((syncType) => {
              const Icon = syncType.icon
              const result = syncResults[syncType.key]
              const isSyncing = syncing[syncType.key]

              return (
                <div key={syncType.key} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-blue-400" />
                      <div>
                        <h3 className="font-medium">{syncType.label}</h3>
                        <p className="text-sm text-gray-400">{syncType.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => syncData(syncType.key)}
                      disabled={isSyncing || !status?.config?.configured}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                        status?.config?.configured
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isSyncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Sync
                    </button>
                  </div>

                  {result && (
                    <div
                      className={`text-sm p-2 rounded ${
                        result.success && result.errors?.length === 0
                          ? 'bg-green-900/50 text-green-300'
                          : result.errors?.length > 0
                          ? 'bg-yellow-900/50 text-yellow-300'
                          : 'bg-red-900/50 text-red-300'
                      }`}
                    >
                      {result.synced !== undefined
                        ? `Synced ${result.synced} items`
                        : result.errors?.[0] || 'Sync completed'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sync History */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Sync History
          </h2>

          {/* Current Status */}
          {status?.syncStatus?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Current Status by Entity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {status.syncStatus.map((item) => (
                  <div key={item.entity_type} className="bg-gray-700 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">
                        {item.entity_type.replace(/_/g, ' ')}
                      </span>
                      {item.last_status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : item.last_status === 'partial' ? (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {item.last_synced_count} items synced
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(item.last_sync_time)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Table */}
          {status?.recentHistory?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3">Entity Type</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">Synced</th>
                    <th className="text-right py-2 px-3">Failed</th>
                    <th className="text-right py-2 px-3">Duration</th>
                    <th className="text-left py-2 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {status.recentHistory.map((item) => (
                    <tr key={item.id} className="border-b border-gray-700/50">
                      <td className="py-2 px-3 capitalize">
                        {item.entity_type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                            item.status === 'success'
                              ? 'bg-green-900/50 text-green-300'
                              : item.status === 'partial'
                              ? 'bg-yellow-900/50 text-yellow-300'
                              : 'bg-red-900/50 text-red-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-green-400">
                        {item.synced_items}
                      </td>
                      <td className="py-2 px-3 text-right text-red-400">
                        {item.failed_items}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-400">
                        {formatDuration(item.duration_ms)}
                      </td>
                      <td className="py-2 px-3 text-gray-400">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No sync history available. Run a sync to see results here.
            </p>
          )}
        </div>

        {/* Help Section */}
        {!status?.config?.configured && (
          <div className="mt-6 bg-yellow-900/30 border border-yellow-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Configuration Required
            </h3>
            <p className="text-gray-300 mb-4">
              To connect to your Odyssey ERP system, you need to configure the following
              environment variables:
            </p>
            <div className="bg-gray-900 rounded p-4 font-mono text-sm">
              <p className="text-gray-400"># Required</p>
              <p>ODYSSEY_ERP_API_URL=https://api.blinfo.com</p>
              <p>ODYSSEY_ERP_COMPANY_ID=SPUNCAST</p>
              <p className="mt-2 text-gray-400"># Authentication (Option 1: API Key)</p>
              <p>ODYSSEY_ERP_API_KEY=your_api_key</p>
              <p>ODYSSEY_ERP_API_SECRET=your_api_secret</p>
              <p className="mt-2 text-gray-400"># Authentication (Option 2: Credentials)</p>
              <p>ODYSSEY_ERP_USERNAME=your_username</p>
              <p>ODYSSEY_ERP_PASSWORD=your_password</p>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Contact B&L Information Systems support or your Odyssey ERP administrator to
              obtain API credentials.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
