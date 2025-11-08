import React, { useEffect } from 'react';
import { Clock3, RefreshCw } from 'lucide-react';
import useAttendanceMonitorStore from '../../store/attendanceMonitorStore';

const formatDate = (value?: string) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString();
};

const formatTime = (value?: string) => {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const statusBadge = (status: string) => {
  if (status === 'checked_out') {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300">
        Checked out
      </span>
    );
  }
  if (status === 'checked_in') {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300">
        Checked in
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-1 rounded-full bg-slate-500/10 text-slate-300">
      Pending
    </span>
  );
};

const AttendanceMonitor: React.FC = () => {
  const { records, loading, fetchRecent } = useAttendanceMonitorStore();

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  return (
    <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock3 className="text-cyan-400" />
          <h3 className="text-white font-semibold">Attendance monitor</h3>
        </div>
        <button
          onClick={fetchRecent}
          className="text-xs text-cyan-300 hover:text-cyan-100 flex items-center gap-1"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading attendance records...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-slate-500">No check-ins recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {records.slice(0, 6).map((record) => (
            <div
              key={record.id}
              className="border border-gray-800 rounded-xl p-3 flex flex-col gap-1 bg-black/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{record.applicant_name}</p>
                  <p className="text-xs text-slate-400">{record.job_title || 'Intern'}</p>
                </div>
                {statusBadge(record.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>
                  <p className="uppercase text-slate-500 tracking-wide">Date</p>
                  <p className="text-slate-200">{formatDate(record.date)}</p>
                </div>
                <div>
                  <p className="uppercase text-slate-500 tracking-wide">Check-in</p>
                  <p className="text-slate-200">{formatTime(record.check_in)}</p>
                </div>
                <div>
                  <p className="uppercase text-slate-500 tracking-wide">Check-out</p>
                  <p className="text-slate-200">{formatTime(record.check_out)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceMonitor;
