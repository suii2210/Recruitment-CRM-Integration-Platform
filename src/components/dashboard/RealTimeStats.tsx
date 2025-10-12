import React from 'react';
import { 
  Users, 
  FileText, 
  Shield, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Server,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

const RealTimeStats: React.FC = () => {
  const { stats, systemMetrics, lastUpdated } = useDashboardStore();

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400 bg-green-400/10';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10';
      case 'critical': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      default: return Activity;
    }
  };

  const formatLastUpdated = (timestamp: string) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 animate-pulse">
            <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const HealthIcon = getHealthIcon(stats.systemHealth);

  return (
    <div className="space-y-6">
      {/* Last Updated Indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white dark:text-white light:text-gray-900">Real-time Dashboard</h2>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Updated {formatLastUpdated(lastUpdated)}</span>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs">+12% this month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{stats.activeUsers.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs">+8% today</span>
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Blogs */}
        <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Total Blogs</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{stats.totalBlogs.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs">+5% this week</span>
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Published Blogs */}
        <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Published Blogs</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{stats.publishedBlogs.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-xs">
                  {Math.round((stats.publishedBlogs / stats.totalBlogs) * 100)}% of total
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        {/* Pending Blogs */}
        <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{stats.pendingBlogs.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400 text-xs">Needs attention</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">System Health</p>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(stats.systemHealth)}`}>
                <HealthIcon className="w-4 h-4" />
                {stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Server className="w-3 h-3 text-slate-400 dark:text-slate-400 light:text-gray-500" />
                <span className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-xs">Uptime: {stats.serverUptime}</span>
              </div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <Server className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>

        {/* Recent Logins */}
        <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Recent Logins</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{stats.recentLogins.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-xs">Last 24 hours</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-lg">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Total Roles */}
        <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Total Roles</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{stats.totalRoles.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-xs">Permission groups</span>
              </div>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
          <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900 mb-4">System Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{systemMetrics.cpu}%</div>
              <div className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">CPU Usage</div>
              <div className="w-full bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${systemMetrics.cpu}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{systemMetrics.memory}%</div>
              <div className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Memory</div>
              <div className="w-full bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${systemMetrics.memory}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{systemMetrics.storage}%</div>
              <div className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Storage</div>
              <div className="w-full bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${systemMetrics.storage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{systemMetrics.activeConnections}</div>
              <div className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Connections</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{systemMetrics.requestsPerMinute}</div>
              <div className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Req/Min</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{systemMetrics.responseTime}ms</div>
              <div className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">Response</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeStats;