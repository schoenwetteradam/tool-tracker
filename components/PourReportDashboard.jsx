import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Thermometer,
  Gauge,
  Calendar,
  Users,
  ArrowLeft,
  FileText,
  ThermometerSun,
  TimerReset,
  BarChart3
} from 'lucide-react';

const PourReportDashboard = ({ onNavigate = null }) => {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [shiftPerformance, setShiftPerformance] = useState([]);
  const [recentPours, setRecentPours] = useState([]);
  const [dieUtilization, setDieUtilization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const credentialsAvailable = Boolean(supabaseUrl && supabaseKey);
  const canNavigate = typeof onNavigate === 'function';

  const fetchDashboardData = useCallback(async () => {
    if (!credentialsAvailable) {
      setError('Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      };

      const fetchJson = async (url, { method = 'GET', body = null } = {}) => {
        const requestHeaders = { ...headers };

        const options = { method, headers: requestHeaders };

        if (body !== null && body !== undefined) {
          options.body = JSON.stringify(body);
          options.headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
          let errorMessage = `Request failed with status ${response.status}`;

          if (contentType.includes('application/json')) {
            const body = await response.json();
            errorMessage = body?.message || body?.error || errorMessage;
          } else {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            }
          }

          throw new Error(errorMessage);
        }

        if (contentType.includes('application/json')) {
          return response.json();
        }

        return [];
      };

      const statsPromise = fetchJson(`${supabaseUrl}/rest/v1/pour_reports_dashboard_stats?select=*`);
      const shiftPromise = fetchJson(`${supabaseUrl}/rest/v1/rpc/get_shift_performance`, {
        method: 'POST',
        body: {
          start_date: dateRange.start,
          end_date: dateRange.end
        }
      });
      const recentPromise = fetchJson(`${supabaseUrl}/rest/v1/rpc/get_recent_pours`, {
        method: 'POST',
        body: { days: 7 }
      });

      const fetchMonthlyKpi = async () => {
        const viewUrl = `${supabaseUrl}/rest/v1/pour_reports_kpi?select=*&order=month.desc`;
        const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_pour_reports_kpi`;

        try {
          return await fetchJson(viewUrl);
        } catch (viewError) {
          const message = (viewError?.message || '').toLowerCase();

          if (message.includes('could not find the table') || message.includes('schema cache')) {
            console.warn('View pour_reports_kpi unavailable, falling back to RPC function.', viewError);
            return fetchJson(rpcUrl, { method: 'POST' });
          }

          throw viewError;
        }
      };

      const fetchDieUtilization = async () => {
        const viewUrl = `${supabaseUrl}/rest/v1/die_utilization_stats?select=*&order=total_pours.desc`;
        const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_die_utilization`;

        try {
          return await fetchJson(viewUrl);
        } catch (viewError) {
          const message = (viewError?.message || '').toLowerCase();

          if (message.includes('could not find the table') || message.includes('schema cache')) {
            console.warn('View die_utilization_stats unavailable, falling back to RPC function.', viewError);
            return fetchJson(rpcUrl, {
              method: 'POST',
              body: {
                start_date: dateRange.start,
                end_date: dateRange.end,
                limit: 10
              }
            });
          }

          throw viewError;
        }
      };

      const [statsData, monthlyKpi, shiftData, recentData, dieUtilData] = await Promise.all([
        statsPromise,
        fetchMonthlyKpi(),
        shiftPromise,
        recentPromise,
        fetchDieUtilization()
      ]);

      setStats(Array.isArray(statsData) ? statsData[0] ?? null : statsData ?? null);
      setMonthlyData(Array.isArray(monthlyKpi) ? monthlyKpi : []);
      setShiftPerformance(Array.isArray(shiftData) ? shiftData : []);
      setRecentPours(Array.isArray(recentData) ? recentData : []);
      setDieUtilization(Array.isArray(dieUtilData) ? dieUtilData : []);
    } catch (fetchError) {
      console.error('Error fetching dashboard data:', fetchError);
      setError(fetchError.message || 'Failed to fetch dashboard data.');
      setStats(null);
      setMonthlyData([]);
      setShiftPerformance([]);
      setRecentPours([]);
    } finally {
      setLoading(false);
    }
  }, [credentialsAvailable, supabaseKey, supabaseUrl, dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleNavigate = (destination) => {
    if (canNavigate) {
      onNavigate(destination);
    }
  };

  const KpiCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      green: "bg-green-50 text-green-600 border-green-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200",
      red: "bg-red-50 text-red-600 border-red-200"
    };

    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            {trend > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+{trend}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-red-600 font-medium">{trend}%</span>
              </>
            )}
            <span className="text-gray-500 ml-2">vs last month</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-gray-800">Pour Report Dashboard</h1>
            <p className="text-gray-600">Real-time production metrics and performance indicators</p>
          </div>
          {canNavigate && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate('home')}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Menu
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('form')}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <FileText className="h-4 w-4" />
                Enter New Pour
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Unable to load dashboard data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="mb-6 flex items-center gap-4 rounded-lg bg-white p-4 shadow">
          <Calendar className="h-5 w-5 text-gray-600" />
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loading || !credentialsAvailable}
              className={`mt-2 rounded-lg px-6 py-2 text-white transition-colors sm:mt-0 ${
                loading || !credentialsAvailable
                  ? 'cursor-not-allowed bg-blue-300'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Key Metrics Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
            <KpiCard
              title="Total Pours YTD"
              value={stats.total_pours_ytd?.toLocaleString() || '0'}
              subtitle={`${stats.current_month_pours || 0} this month`}
              icon={Activity}
              color="blue"
            />
            <KpiCard
              title="Total Weight"
              value={`${(stats.total_weight_ytd || 0).toLocaleString()} lbs`}
              subtitle={`${(stats.current_month_weight || 0).toLocaleString()} lbs this month`}
              icon={Gauge}
              color="green"
            />
            <KpiCard
              title="Avg Pour Temp"
              value={`${Math.round(stats.avg_pour_temp || 0)}°F`}
              subtitle={`±${Math.round(stats.stddev_pour_temp || 0)}°F std dev`}
              icon={Thermometer}
              color="orange"
            />
            <KpiCard
              title="Total Cost YTD"
              value={`$${(stats.total_cost_ytd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subtitle={`Avg ${(stats.avg_weight_per_pour_ytd || 0).toFixed(1)} lbs/pour`}
              icon={DollarSign}
              color="purple"
            />
            <KpiCard
              title="Avg Die Temp Before Pour"
              value={`${Math.round(stats.avg_die_temp_before_pour || 0)}°F`}
              subtitle="Tool readiness & consistency"
              icon={ThermometerSun}
              color="orange"
            />
            <KpiCard
              title="Spin Time Avg"
              value={`${(stats.avg_spin_time_minutes || 0).toFixed(1)} min`}
              subtitle="Density & porosity control"
              icon={TimerReset}
              color="red"
            />
          </div>
        )}

        {/* Shift Performance */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Shift Performance
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shiftPerformance.map((shift) => (
                <div key={shift.shift} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">Shift {shift.shift}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {shift.total_pours} pours
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Weight:</span>
                      <span className="font-semibold">{(shift.total_weight || 0).toLocaleString()} lbs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Pour Temp:</span>
                      <span className="font-semibold">{Math.round(shift.avg_pour_temp || 0)}°F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efficiency:</span>
                      <span className="font-semibold">{(shift.avg_efficiency || 0).toFixed(2)} lbs/min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Shift Productivity (Total Cast Weight)
              </h3>
              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                {shiftPerformance.map((shift) => (
                  <div key={`shift-prod-${shift.shift}`} className="flex items-center justify-between rounded bg-white px-3 py-2 shadow-sm">
                    <span className="text-gray-600">Shift {shift.shift}</span>
                    <span className="font-semibold text-gray-800">{(shift.total_weight || 0).toLocaleString()} lbs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Die Utilization */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800">Die Utilization</h2>
            <p className="text-sm text-gray-500">Count of pours by die number</p>
          </div>
          <div className="p-6">
            {dieUtilization.length === 0 ? (
              <p className="text-sm text-gray-500">No die utilization data available for the selected range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Die Number</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Pours</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Weight (lbs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dieUtilization.slice(0, 10).map((die, idx) => (
                      <tr key={`${die.die_number || 'unknown'}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{die.die_number || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">{die.total_pours || die.pour_count || 0}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{Math.round(die.total_weight || die.weight_sum || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Monthly Trends</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Month</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Pours</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Weight (lbs)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Avg Temp (°F)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Cost</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unique Grades</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.slice(0, 6).map((month, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(month.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{month.total_pours}</td>
                      <td className="px-4 py-3 text-sm text-right">{Math.round(month.total_weight || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right">{Math.round(month.avg_pour_temp || 0)}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                        ${(month.total_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{month.unique_grades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Pours */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Recent Pours (Last 7 Days)</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Heat Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grade</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Weight (lbs)</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Shift</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cost/lb</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPours.slice(0, 10).map((pour, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">{pour.heat_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(pour.pour_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{pour.grade_name}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{pour.cast_weight?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {pour.shift}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        ${pour.cost_per_pound?.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PourReportDashboard;
