import React from 'react';
import { ArrowLeft, Edit3, Send, PauseCircle, Archive } from 'lucide-react';
import { Job, JobPublishTarget } from '../../store/jobStore';

interface JobPreviewProps {
  job: Job;
  onBack: () => void;
  onEdit: (job: Job) => void;
  onPublish: (job: Job) => void;
  onUnpublish: (job: Job) => void;
  onClose: (job: Job) => void;
  targetOptions: Record<string, JobPublishTarget>;
  hasPermission: (permission: string) => boolean;
}

const JobPreview: React.FC<JobPreviewProps> = ({
  job,
  onBack,
  onEdit,
  onPublish,
  onUnpublish,
  onClose,
  targetOptions,
  hasPermission,
}) => {
  const renderList = (items: string[], fallback: string) => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-slate-500">{fallback}</p>;
    }
    return (
      <ul className="list-disc list-inside text-sm text-slate-200 space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[#0d0e0a] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-800 text-slate-200 hover:border-cyan-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Careers
        </button>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-[#15170f] border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{job.title}</h1>
            <span className="px-3 py-1 text-xs font-semibold border border-emerald-400/40 rounded-full uppercase tracking-wide text-emerald-200">
              {job.status}
            </span>
            <div className="flex flex-wrap gap-2">
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            {job.department && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Department</p>
                <p>{job.department}</p>
              </div>
            )}
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Location</p>
              <p>{job.location}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Employment Type</p>
              <p>{job.employment_type}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Experience Level</p>
              <p>{job.experience_level}</p>
            </div>
            {job.salary_range && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Salary Range</p>
                <p>{job.salary_range}</p>
              </div>
            )}
            {job.closing_date && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Closing Date</p>
                <p>{new Date(job.closing_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          {job.summary && <p className="text-slate-200 text-sm leading-relaxed">{job.summary}</p>}
        </div>

        <div className="bg-[#15170f] border border-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Job Description</h2>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Responsibilities</h3>
              {renderList(job.responsibilities, 'Responsibilities not specified.')}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Requirements</h3>
              {renderList(job.requirements, 'Requirements not specified.')}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Benefits</h3>
              {renderList(job.benefits, 'Benefits not specified.')}
            </div>
          </div>
        </div>

        <div className="bg-[#15170f] border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Apply</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-200">
            {job.application_url && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Application URL</p>
                <a href={job.application_url} className="text-cyan-300 hover:text-cyan-200 break-all" target="_blank" rel="noreferrer">
                  {job.application_url}
                </a>
              </div>
            )}
            {job.application_email && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Application Email</p>
                <a href={`mailto:${job.application_email}`} className="text-cyan-300 hover:text-cyan-200">
                  {job.application_email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPreview;


