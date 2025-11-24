import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  RefreshCw,
  ClipboardList,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Users,
  Loader2,
  ChevronRight,
  Factory,
  Flame,
  Target,
  BarChart3
} from 'lucide-react'

export default function FoundryDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [production, setProduction] = useState([])
  const [syncStatus, setSyncStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch orders, products, and status in parallel
      const [ordersRes, productsRes, statusRes] = await Promise.all([
        fetch('/api/odyssey-erp/orders?limit=100'),
        fetch('/api/odyssey-erp/products?limit=50'),
        fetch('/api/odyssey-erp/status')
      ])

      const [ordersData, productsData, statusData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
        statusRes.json()
      ])

      setOrders(ordersData.orders || [])
      setProducts(productsData.products || [])
      setSyncStatus(statusData)

      // Try to fetch recent production
      try {
        const productionRes = await fetch('/api/odyssey-erp/production?limit=50')
        const productionData = await productionRes.json()
        setProduction(productionData.records || [])
      } catch (e) {
        console.log('Production data not available')
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const syncFromERP = async () => {
    try {
      setRefreshing(true)
      await fetch('/api/odyssey-erp/sync?type=shop-orders', { method: 'POST' })
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  // Calculate metrics
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueOrders = orders.filter(o => {
    if (!o.due_date) return false
    const dueDate = new Date(o.due_date)
    return dueDate < today && o.status !== 'Completed' && o.status !== 'Closed'
  })

  const dueTodayOrders = orders.filter(o => {
    if (!o.due_date) return false
    const dueDate = new Date(o.due_date)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate.getTime() === today.getTime() && o.status !== 'Completed'
  })

  const dueThisWeek = orders.filter(o => {
    if (!o.due_date) return false
    const dueDate = new Date(o.due_date)
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return dueDate >= today && dueDate <= weekFromNow && o.status !== 'Completed'
  })

  const openOrders = orders.filter(o =>
    o.status !== 'Completed' && o.status !== 'Closed' && o.status !== 'Cancelled'
  )

  const totalQuantityOrdered = openOrders.reduce((sum, o) => sum + (o.quantity_ordered || 0), 0)
  const totalQuantityCompleted = openOrders.reduce((sum, o) => sum + (o.quantity_completed || 0), 0)
  const overallProgress = totalQuantityOrdered > 0
    ? Math.round((totalQuantityCompleted / totalQuantityOrdered) * 100)
    : 0

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getUrgencyColor = (dueDate, status) => {
    if (status === 'Completed' || status === 'Closed') return 'text-gray-400'
    if (!dueDate) return 'text-gray-400'

    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    if (due < today) return 'text-red-500'
    if (due.getTime() === today.getTime()) return 'text-orange-500'

    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    if (due <= weekFromNow) return 'text-yellow-500'

    return 'text-green-500'
  }

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-900/50 text-red-300 border-red-700'
      case 'high':
        return 'bg-orange-900/50 text-orange-300 border-orange-700'
      case 'normal':
        return 'bg-blue-900/50 text-blue-300 border-blue-700'
      case 'low':
        return 'bg-gray-700 text-gray-300 border-gray-600'
      default:
        return 'bg-gray-700 text-gray-300 border-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading foundry dashboard...</p>
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
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Factory className="w-6 h-6 text-orange-500" />
                  Foundry Dashboard
                </h1>
                <p className="text-gray-400 text-sm">
                  Centrifugal Casting Operations Overview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={syncFromERP}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sync ERP
              </button>
              <Link
                href="/odyssey-erp"
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                Settings
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <ClipboardList className="w-4 h-4" />
              Open Orders
            </div>
            <p className="text-3xl font-bold">{openOrders.length}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
              <AlertTriangle className="w-4 h-4" />
              Overdue
            </div>
            <p className="text-3xl font-bold text-red-500">{overdueOrders.length}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Due Today
            </div>
            <p className="text-3xl font-bold text-orange-500">{dueTodayOrders.length}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Due This Week
            </div>
            <p className="text-3xl font-bold text-yellow-500">{dueThisWeek.length}</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Overall Production Progress
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">
                  {totalQuantityCompleted.toLocaleString()} / {totalQuantityOrdered.toLocaleString()} pieces
                </span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shop Orders Table */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-400" />
              Shop Orders
            </h2>
            <span className="text-sm text-gray-400">
              {orders.length} orders synced
            </span>
          </div>

          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-3 font-medium">Job #</th>
                    <th className="text-left py-3 px-3 font-medium">Part</th>
                    <th className="text-left py-3 px-3 font-medium">Customer</th>
                    <th className="text-center py-3 px-3 font-medium">Priority</th>
                    <th className="text-right py-3 px-3 font-medium">Qty Ordered</th>
                    <th className="text-right py-3 px-3 font-medium">Completed</th>
                    <th className="text-right py-3 px-3 font-medium">Remaining</th>
                    <th className="text-center py-3 px-3 font-medium">Progress</th>
                    <th className="text-left py-3 px-3 font-medium">Due Date</th>
                    <th className="text-left py-3 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .sort((a, b) => {
                      // Sort by: overdue first, then by due date
                      const aDate = a.due_date ? new Date(a.due_date) : new Date('2099-12-31')
                      const bDate = b.due_date ? new Date(b.due_date) : new Date('2099-12-31')
                      return aDate - bDate
                    })
                    .map((order) => {
                      const progress = order.quantity_ordered > 0
                        ? Math.round((order.quantity_completed / order.quantity_ordered) * 100)
                        : 0

                      return (
                        <tr key={order.id || order.job_number} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 px-3 font-mono font-medium">
                            {order.job_number}
                          </td>
                          <td className="py-3 px-3">
                            <div>
                              <p className="font-medium">{order.part_number}</p>
                              {order.description && (
                                <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                  {order.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-300">
                            {order.customer || '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs border ${getPriorityBadge(order.priority)}`}>
                              {order.priority || 'Normal'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {(order.quantity_ordered || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-green-400">
                            {(order.quantity_completed || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-yellow-400">
                            {(order.quantity_remaining || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden min-w-[60px]">
                                <div
                                  className={`h-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-8">
                                {progress}%
                              </span>
                            </div>
                          </td>
                          <td className={`py-3 px-3 font-medium ${getUrgencyColor(order.due_date, order.status)}`}>
                            {formatDate(order.due_date)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                              order.status === 'Completed' || order.status === 'Closed'
                                ? 'bg-green-900/50 text-green-300'
                                : order.status === 'In Progress'
                                ? 'bg-blue-900/50 text-blue-300'
                                : 'bg-gray-700 text-gray-300'
                            }`}>
                              {order.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                              {order.status || 'Open'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No shop orders synced yet</p>
              <button
                onClick={syncFromERP}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Sync from Odyssey ERP
              </button>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard"
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="font-medium">Tool Analytics</h3>
                <p className="text-sm text-gray-400">View tool change metrics</p>
              </div>
            </div>
          </Link>

          <Link
            href="/pour-report"
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-400" />
              <div>
                <h3 className="font-medium">Pour Reports</h3>
                <p className="text-sm text-gray-400">Record casting pours</p>
              </div>
            </div>
          </Link>

          <Link
            href="/odyssey-erp"
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="font-medium">ERP Sync Settings</h3>
                <p className="text-sm text-gray-400">Manage Odyssey connection</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Last Sync Info */}
        {syncStatus?.syncStatus?.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Last synced: {new Date(syncStatus.syncStatus[0]?.last_sync_time).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
