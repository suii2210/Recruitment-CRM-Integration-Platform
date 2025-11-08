import React, { useEffect } from 'react';
import { Calendar, CheckCircle, FileText } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useAttendanceStore } from '../../store/attendanceStore';

const CandidateDashboard: React.FC = () => {
  const { myTasks, fetchMyTasks, submitTask } = useTaskStore();
  const { records, fetchMyAttendance, checkIn, checkOut } = useAttendanceStore();

  useEffect(() => {
    fetchMyTasks();
    fetchMyAttendance();
  }, [fetchMyTasks, fetchMyAttendance]);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
        <h2 className="text-white font-semibold text-lg">Attendance</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={checkIn}
            className="bg-emerald-500 text-black font-semibold px-4 py-2 rounded-xl hover:bg-emerald-400"
          >
            Check in
          </button>
          <button
            onClick={checkOut}
            className="bg-rose-500 text-black font-semibold px-4 py-2 rounded-xl hover:bg-rose-400"
          >
            Check out
          </button>
        </div>
        <div className="text-xs text-slate-500">
          <p>Recent days:</p>
          <div className="mt-2 grid sm:grid-cols-2 gap-2">
            {records.slice(0, 6).map((record) => (
              <div key={record._id} className="border border-gray-800 rounded-xl p-2 text-slate-300">
                <p className="text-white font-semibold">
                  {new Date(record.date).toLocaleDateString()}
                </p>
                <p>In: {record.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}</p>
                <p>Out: {record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <FileText className="text-cyan-400" />
          <h2 className="text-white text-lg font-semibold">My tasks</h2>
        </div>
        {myTasks.length === 0 && (
          <p className="text-sm text-slate-500">No tasks assigned yet.</p>
        )}
        <div className="space-y-3">
          {myTasks.map((task) => (
            <div key={task.id} className="border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">{task.title}</p>
                  <p className="text-xs text-slate-400">
                    Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className="text-xs uppercase text-cyan-300">{task.status}</span>
              </div>
              <p className="text-sm text-slate-300 mt-2">{task.description}</p>
              {task.submission ? (
                <div className="mt-3 bg-black/30 border border-gray-800 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
                  <CheckCircle className="text-emerald-400" size={14} />
                  Submitted {new Date(task.submission.submitted_at || '').toLocaleString()}
                </div>
              ) : (
                <button
                  onClick={() =>
                    submitTask(task.id, {
                      note: 'Completed',
                    })
                  }
                  className="mt-3 bg-cyan-500 text-black font-semibold px-4 py-2 rounded-xl text-sm hover:bg-cyan-400"
                >
                  Mark as submitted
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
