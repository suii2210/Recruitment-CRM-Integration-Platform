import React, { useEffect } from 'react';
import { Bell, FileText, CheckCircle, XCircle, Clock3 } from 'lucide-react';
import { useNotificationStore, NotificationEvent } from '../store/notificationStore';

const iconForType = (type: string) => {
  if (type.includes('shortlist')) return <CheckCircle className="text-emerald-500" size={16} />;
  if (type.includes('documents')) return <FileText className="text-cyan-400" size={16} />;
  if (type.includes('declined')) return <XCircle className="text-rose-400" size={16} />;
  if (type.includes('attendance')) return <Clock3 className="text-amber-300" size={16} />;
  return <Bell size={16} />;
};

interface NotificationBellProps {
  onNavigateToApplicant?: (applicationId: string) => Promise<void> | void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateToApplicant }) => {
  const { notifications, unreadCount, dropdownOpen, fetchNotifications, toggleDropdown, markNotificationRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (note: NotificationEvent) => {
    if (note.meta?.applicationId && onNavigateToApplicant) {
      try {
        await onNavigateToApplicant(note.meta.applicationId);
      } catch (error) {
        console.error('Failed to navigate to applicant from notification', error);
      }
    }
    markNotificationRead(note.id);
    if (dropdownOpen) {
      toggleDropdown();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative bg-[#0d0e0a] border border-gray-800 rounded-full p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[#15170f] border border-gray-800 rounded-2xl shadow-2xl shadow-black/30 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Candidate activity</p>
            <button
              onClick={fetchNotifications}
              className="text-xs text-cyan-400 hover:text-cyan-200"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {notifications.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No recent activity.</p>
            )}
            {notifications.map((note) => (
              <button
                key={note.id}
                onClick={() => handleNotificationClick(note)}
                className={`w-full text-left flex items-start gap-3 text-sm p-2 rounded-xl border border-gray-800 transition-colors ${
                  note.read ? 'bg-transparent' : 'bg-cyan-500/10'
                }`}
              >
                {iconForType(note.type)}
                <div>
                  <p className="text-white">
                    <span className="font-semibold">{note.applicant_name}</span>{' '}
                    {note.message.replace(note.applicant_name, '').trim()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(note.timestamp).toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
