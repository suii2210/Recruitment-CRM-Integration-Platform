import React from 'react';
import { 
  User, 
  FileText, 
  Shield, 
  LogIn, 
  Key, 
  Edit,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

const RecentActivity: React.FC = () => {
  const { recentActivities, fetchRecentActivities } = useDashboardStore();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login': return LogIn;
      case 'user_created': return User;
      case 'blog_created': return FileText;
      case 'blog_published': return FileText;
      case 'role_created': return Shield;
      case 'password_changed': return Key;
      case 'profile_updated': return Edit;
      default: return User;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_login': return 'text-blue-400 bg-blue-400/10';
      case 'user_created': return 'text-green-400 bg-green-400/10';
      case 'blog_created': return 'text-purple-400 bg-purple-400/10';
      case 'blog_published': return 'text-green-400 bg-green-400/10';
      case 'role_created': return 'text-orange-400 bg-orange-400/10';
      case 'password_changed': return 'text-yellow-400 bg-yellow-400/10';
      case 'profile_updated': return 'text-indigo-400 bg-indigo-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const formatActivityDescription = (activity: any) => {
    switch (activity.type) {
      case 'user_login':
        return `${activity.user.name} logged into the system`;
      case 'user_created':
        return `${activity.user.name} created a new user account`;
      case 'blog_created':
        return `${activity.user.name} created a new blog post${activity.metadata?.title ? `: "${activity.metadata.title}"` : ''}`;
      case 'blog_published':
        return `${activity.user.name} published a blog post`;
      case 'role_created':
        return `${activity.user.name} created a new role`;
      case 'password_changed':
        return `${activity.user.name} changed their password`;
      case 'profile_updated':
        return `${activity.user.name} updated their profile`;
      default:
        return activity.description;
    }
  };

  return (
    <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-gray-200 light:shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">Recent Activity</h3>
        <button
          onClick={fetchRecentActivities}
          className="p-2 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-slate-300 dark:text-slate-300 light:text-gray-600 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
          title="Refresh activities"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto hide-scrollbar">
        {recentActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-400 dark:text-slate-400 light:text-gray-400 mx-auto mb-3" />
            <p className="text-slate-400 dark:text-slate-400 light:text-gray-500">No recent activity</p>
          </div>
        ) : (
          recentActivities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                  <ActivityIcon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white dark:text-white light:text-gray-900 text-sm font-medium">
                    {formatActivityDescription(activity)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-xs">
                      {activity.user.role}
                    </span>
                    <span className="text-slate-600 dark:text-slate-600 light:text-gray-300">•</span>
                    <span className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-xs">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs">
                      {activity.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {recentActivities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700 dark:border-slate-700 light:border-gray-200">
          <button className="w-full text-center text-slate-400 dark:text-slate-400 light:text-gray-500 hover:text-white dark:hover:text-white light:hover:text-gray-900 text-sm transition-colors">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;