import React from 'react';
import { Eye, Edit3, Trash2, Send, PauseCircle, Archive } from 'lucide-react';
import { Job, JobPublishTarget } from '../../store/jobStore';

interface JobListProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onPublish: (job: Job) => void;
  onUnpublish: (job: Job) => void;
  onClose: (job: Job) => void;
  onView: (job: Job) => void;
  hasPermission: (permission: string) => boolean;
  targetOptions: Record<string, JobPublishTarget>;
}

const statusBadgeStyles: Record<Job['status'], string> = {
  published: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  draft: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  closed: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
};

const JobList: React.FC<JobListProps> = ({
  jobs,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  onClose,
  onView,
  hasPermission,
  targetOptions,
}) => {
  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-[#15170f] border border-gray-800 rounded-xl p-6 shadow-lg shadow-black/20 transition-transform hover:-translate-y-1"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                <span
                  className={`px-3 py-1 text-xs font-semibold border rounded-full uppercase tracking-wide ${statusBadgeStyles[job.status]}`}
                >
                  {job.status}
                </span>
                {job.publish_targets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {job.publish_targets.map((target) => {
                      const targetInfo = targetOptions[target];
                      return (
                        <span
                          key={target}
                          className="px-2 py-1 text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full"
                          title={targetInfo?.url || undefined}
                        >
                          {targetInfo?.label || target}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                {job.department && (
                  <span>
                    <strong className="text-slate-200">Department:</strong> {job.department}
                  </span>
                )}
                <span>
                  <strong className="text-slate-200">Location:</strong> {job.location}
                </span>
                <span>
                  <strong className="text-slate-200">Type:</strong> {job.employment_type}
                </span>
                <span>
                  <strong className="text-slate-200">Experience:</strong> {job.experience_level}
                </span>
                {job.salary_range && (
                  <span>
                    <strong className="text-slate-200">Salary:</strong> {job.salary_range}
                  </span>
                )}
              </div>
              {job.summary && <p className="text-slate-300 text-sm leading-relaxed">{job.summary}</p>}
              <div className="text-xs text-slate-500 flex gap-4">
                <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
                {job.published_at && <span>Published {new Date(job.published_at).toLocaleDateString()}</span>}
                {job.closing_date && <span>Closing {new Date(job.closing_date).toLocaleDateString()}</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onView(job)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-800 text-slate-200 hover:border-cyan-400 hover:text-white transition-colors"
              >
                <Eye size={16} />
                View
              </button>

              {hasPermission('jobs.edit') && (
                <button
                  onClick={() => onEdit(job)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-800 text-slate-200 hover:border-cyan-400 hover:text-white transition-colors"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
              )}

              {job.status === 'draft' && hasPermission('jobs.publish') && (
                <button
                  onClick={() => onPublish(job)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  <Send size={16} />
                  Publish
                </button>
              )}

              {job.status === 'published' && hasPermission('jobs.publish') && (
                <>
                  <button
                    onClick={() => onUnpublish(job)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-400/60 text-amber-200 hover:bg-amber-500/10 transition-colors"
                  >
                    <PauseCircle size={16} />
                    Unpublish
                  </button>
                  <button
                    onClick={() => onClose(job)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-500/60 text-rose-200 hover:bg-rose-500/10 transition-colors"
                  >
                    <Archive size={16} />
                    Close
                  </button>
                </>
              )}

              {hasPermission('jobs.delete') && (
                <button
                  onClick={() => onDelete(job)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-800 text-rose-300 hover:border-rose-500 hover:text-white transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobList;


