import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Thermometer, Gauge, Calendar, Users } from 'lucide-react';

const PourReportDashboard = () => {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [shiftPerformance, setShiftPerformance] = useState([]);
  const [recentPours, setRecentPours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Replace these with your actual Supabase credentials
  const supabaseUrl = 'YOUR_SUPABASE_URL';
  const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsRes = await fetch(`${supabaseUrl}/rest/v1/pour_reports_dashboard_stats?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const statsData = await statsRes.json();
      setStats(statsData[0]);

      // Fetch monthly KPI data
      const monthlyRes = await fetch(`${supabaseUrl}/rest/v1/pour_reports_kpi?select=*&order=month.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const monthlyKpi = await monthlyRes.json();
      setMonthlyData(monthlyKpi);

      // Fetch shift performance using RPC
      const shiftRes = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_shift_performance?start_date=${dateRange.start}&end_date=${dateRange.end}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      const shiftData = await shiftRes.json();
      setShiftPerformance(shiftData);

      // Fetch recent pours
      const recentRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_recent_pours?days=7`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const recentData = await recentRes.json();
      setRecentPours(recentData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pour Report Dashboard</h1>
          <p className="text-gray-600">Real-time production metrics and performance indicators</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div className="flex items-center gap-4 flex-1">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchDashboardData}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
