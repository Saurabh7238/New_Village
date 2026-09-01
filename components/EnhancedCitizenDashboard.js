'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Download, Filter } from 'lucide-react';
import ServiceStatusTimeline from './ServiceStatusTimeline';
import { useSocket } from '@/app/socket-provider';

export default function EnhancedCitizenDashboard() {
  const { data: session } = useSession();
  const { unreadCount, markAsRead, isConnected } = useSocket();
  const [applications, setApplications] = useState([]);
  const [queries, setQueries] = useState([]);
  const [documentHistory, setDocumentHistory] = useState([]);
  const [communicationHistory, setCommunicationHistory] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [appRes, queryRes] = await Promise.all([
          fetch('/api/applications'),
          fetch('/api/queries'),
        ]);

        if (appRes.ok) {
          const appData = await appRes.json();
          setApplications(appData);

          // Extract document history
          const docHistory = [];
          appData.forEach((app) => {
            app.documents?.forEach((doc) => {
              docHistory.push({
                id: `${app._id}-${doc.filename}`,
                type: 'document',
                applicationId: app._id,
                filename: doc.filename,
                uploadedAt: doc.uploadedAt,
                url: doc.url,
                uploadedBy: 'You',
              });
            });
            app.adminDocuments?.forEach((doc) => {
              docHistory.push({
                id: `${app._id}-admin-${doc.filename}`,
                type: 'admin-document',
                applicationId: app._id,
                filename: doc.filename,
                uploadedAt: doc.uploadedAt,
                url: doc.url,
                uploadedBy: 'Admin',
              });
            });
          });
          setDocumentHistory(docHistory.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
        }

        if (queryRes.ok) {
          const queryData = await queryRes.json();
          setQueries(queryData);

          // Extract communication history
          const commHistory = [];
          queryData.forEach((query) => {
            query.messages?.forEach((msg) => {
              commHistory.push({
                id: msg._id,
                queryId: query._id,
                title: query.title,
                message: msg.message,
                senderRole: msg.senderRole,
                createdAt: msg.createdAt,
              });
            });
          });
          setCommunicationHistory(commHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    markAsRead();
  }, [session, markAsRead]);

  const getStats = () => {
    const completed = applications.filter((a) => a.status === 'Completed').length;
    const pending = applications.filter((a) => a.status === 'Under Review' || a.status === 'Submitted').length;
    const needDocs = applications.filter((a) => a.status === 'Need Documents').length;
    const openQueries = queries.filter((q) => q.status === 'Open').length;

    return { completed, pending, needDocs, openQueries };
  };

  const getServiceRecommendations = () => {
    const usedServices = new Set(applications.map((a) => a.type));
    const availableServices = [
      { type: 'birth-certificate', label: 'Birth Certificate', icon: '👶' },
      { type: 'death-certificate', label: 'Death Certificate', icon: '📋' },
      { type: 'aadhaar-request', label: 'Aadhaar Request', icon: '🆔' },
      { type: 'voter-list', label: 'Voter List', icon: '🗳️' },
    ];

    return availableServices.filter((s) => !usedServices.has(s.type)).slice(0, 3);
  };

  const stats = getStats();
  const recommendations = getServiceRecommendations();

  if (loading) {
    return <div className="text-center py-12">Loading your dashboard...</div>;
  }

  const filteredApplications =
    filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-amber-100 border border-amber-300 text-amber-800 p-3 rounded-lg">
          ⚠️ Real-time updates unavailable - you&apos;ll be notified when connection is restored
        </div>
      )}

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completed}
          color="green"
        />
        <DashboardCard
          icon={Clock}
          label="In Progress"
          value={stats.pending}
          color="blue"
        />
        <DashboardCard
          icon={AlertCircle}
          label="Need Docs"
          value={stats.needDocs}
          color="amber"
        />
        <DashboardCard
          icon={MessageCircle}
          label="Open Queries"
          value={stats.openQueries}
          color="purple"
        />
      </div>

      {/* Quick Service Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <p className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Suggested Services
          </p>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((service) => (
              <a
                key={service.type}
                href={
                  service.type === 'birth-certificate'
                    ? '/birth'
                    : service.type === 'death-certificate'
                    ? '/death'
                    : service.type === 'aadhaar-request'
                    ? '/aadhar'
                    : '/voter'
                }
                className="inline-block bg-white dark:bg-slate-800 px-3 py-2 rounded-lg hover:shadow-md transition text-sm font-medium"
              >
                {service.icon} {service.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applications List */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Applications</h2>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-sm dark:border-slate-600 dark:bg-slate-700"
                >
                  <option value="all">All</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {filteredApplications.length > 0 ? (
              <div className="space-y-3">
                {filteredApplications.map((app) => (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      selectedApp?._id === app._id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white capitalize">{app.type}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Submitted: {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${
                          app.status === 'Completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : app.status === 'Approved'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : app.status === 'Need Documents'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                No applications found. Start by submitting a request!
              </p>
            )}
          </div>

          {/* Selected Application Timeline */}
          {selectedApp && <ServiceStatusTimeline application={selectedApp} />}

          {/* Document History */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document History
            </h3>
            {documentHistory.length > 0 ? (
              <div className="space-y-2">
                {documentHistory.slice(0, 10).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{doc.filename}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {doc.uploadedBy} · {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {doc.url && (
                      <a
                        href={doc.url}
                        download
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-center py-6">No documents yet</p>
            )}
          </div>
        </div>

        {/* Right Column: Communication & Recommendations */}
        <div className="space-y-6">
          {/* Communication History */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </h3>
            {communicationHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {communicationHistory.slice(0, 15).map((comm) => (
                  <div key={comm.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{comm.title}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 line-clamp-2">{comm.message}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {new Date(comm.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-center py-6">No messages yet</p>
            )}
          </div>

          {/* Performance Stats */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Your Performance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Completion Rate</span>
                <span className="font-bold">
                  {applications.length > 0
                    ? Math.round((stats.completed / applications.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${
                      applications.length > 0
                        ? (stats.completed / applications.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between pt-2">
                <span>Average Wait Time</span>
                <span className="font-bold">
                  {applications.length > 0
                    ? Math.round(
                        applications.reduce((sum, app) => {
                          const days = Math.floor(
                            (new Date() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24)
                          );
                          return sum + days;
                        }, 0) / applications.length
                      )
                    : 0}{' '}
                  days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  return (
    <div className={`${colorMap[color]} rounded-lg p-4 text-center`}>
      <Icon className="h-6 w-6 mx-auto mb-1" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}
