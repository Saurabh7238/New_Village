'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6 text-center">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!analytics) return null;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const applicationStatusData = [
    { name: 'Pending', value: analytics.applications.pending, color: '#f59e0b' },
    { name: 'Approved', value: analytics.applications.approved, color: '#10b981' },
    { name: 'Rejected', value: analytics.applications.rejected, color: '#ef4444' },
    { name: 'Need Docs', value: analytics.applications.needDocuments, color: '#8b5cf6' },
    { name: 'Completed', value: analytics.applications.completed, color: '#06b6d4' },
  ];

  const queryStatusData = [
    { name: 'Open', value: analytics.queries.open, color: '#f59e0b' },
    { name: 'In Progress', value: analytics.queries.inProgress, color: '#3b82f6' },
    { name: 'Resolved', value: analytics.queries.resolved, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 dark:bg-slate-800">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          icon={FileText}
          label="Total Applications"
          value={analytics.applications.total}
          color="bg-blue-100 text-blue-700 dark:bg-blue-900"
        />
        <MetricCard
          icon={AlertCircle}
          label="Pending Applications"
          value={analytics.applications.pending}
          color="bg-amber-100 text-amber-700 dark:bg-amber-900"
        />
        <MetricCard
          icon={CheckCircle}
          label="Total Queries"
          value={analytics.queries.total}
          color="bg-green-100 text-green-700 dark:bg-green-900"
        />
        <MetricCard
          icon={Clock}
          label="Open Queries"
          value={analytics.queries.open}
          color="bg-purple-100 text-purple-700 dark:bg-purple-900"
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg Processing Days"
          value={analytics.processingMetrics.avgDaysPerApplication.toFixed(1)}
          color="bg-cyan-100 text-cyan-700 dark:bg-cyan-900"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Application Status Pie Chart */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Application Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={applicationStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {applicationStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Query Status Pie Chart */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Query Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={queryStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {queryStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Application Trends */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Applications (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.trends.applications}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Query Trends */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Queries (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.trends.queries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10b981" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Applications by Type */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Applications by Type</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.applications.byType}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Query Categories */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Top Query Categories</h2>
        <div className="space-y-2">
          {analytics.queries.byCategory.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">{cat._id}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 rounded-full bg-slate-200 dark:bg-slate-600">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${(cat.count / analytics.queries.byCategory[0].count) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right font-bold text-slate-900 dark:text-white">{cat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointment Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryBox label="Total Appointments" value={analytics.appointments.total} />
        <SummaryBox label="Pending" value={analytics.appointments.pending} />
        <SummaryBox label="Approved" value={analytics.appointments.approved} />
        <SummaryBox label="Completed" value={analytics.appointments.completed} />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg p-4 ${color}`}>
      <Icon className="h-6 w-6" />
      <div>
        <p className="text-xs opacity-75">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-700">
      <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
