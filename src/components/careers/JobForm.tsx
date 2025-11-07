import React, { useEffect, useMemo, useState } from 'react';
import { Job, JobStatus, EmploymentType, ExperienceLevel, JobPublishTarget } from '../../store/jobStore';
import { XCircle } from 'lucide-react';

interface JobFormProps {
  job?: Job | null;
  onSubmit: (data: Partial<Job>, status: JobStatus) => Promise<void> | void;
  onCancel: () => void;
  availableTargets: JobPublishTarget[];
}

const employmentTypeOptions: { value: EmploymentType; label: string }[] = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'unpaid', label: 'Unpaid' },
];

const experienceOptions: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

const JobForm: React.FC<JobFormProps> = ({ job, onSubmit, onCancel, availableTargets }) => {
  const [title, setTitle] = useState(job?.title || '');
  const [slug, setSlug] = useState(job?.slug || '');
  const [department, setDepartment] = useState(job?.department || '');
  const [location, setLocation] = useState(job?.location || '');
  const [employmentType, setEmploymentType] = useState<EmploymentType>(job?.employment_type || 'full-time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(job?.experience_level || 'entry');
  const [salaryRange, setSalaryRange] = useState(job?.salary_range || '');
  const [summary, setSummary] = useState(job?.summary || '');
  const [description, setDescription] = useState(job?.description || '');
  const [responsibilities, setResponsibilities] = useState((job?.responsibilities || []).join('\n'));
  const [requirements, setRequirements] = useState((job?.requirements || []).join('\n'));
  const [benefits, setBenefits] = useState((job?.benefits || []).join('\n'));
  const [applicationUrl, setApplicationUrl] = useState(job?.application_url || '');
  const [applicationEmail, setApplicationEmail] = useState(job?.application_email || '');
  const [selectedTargets, setSelectedTargets] = useState<string[]>(job?.publish_targets || []);
  const [closingDate, setClosingDate] = useState(() => (job?.closing_date ? job.closing_date.substring(0, 10) : ''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!job && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title, job]);

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setSlug(job.slug);
      setDepartment(job.department || '');
      setLocation(job.location);
      setEmploymentType(job.employment_type);
      setExperienceLevel(job.experience_level);
      setSalaryRange(job.salary_range || '');
      setSummary(job.summary || '');
      setDescription(job.description);
      setResponsibilities((job.responsibilities || []).join('\n'));
      setRequirements((job.requirements || []).join('\n'));
      setBenefits((job.benefits || []).join('\n'));
      setApplicationUrl(job.application_url || '');
      setApplicationEmail(job.application_email || '');
      setSelectedTargets(job.publish_targets || []);
      setClosingDate(job.closing_date ? job.closing_date.substring(0, 10) : '');
    }
  }, [job]);

  const isValid = useMemo(() => {
    return Boolean(title && slug && location && description);
  }, [title, slug, location, description]);

  const toggleTarget = (target: string) => {
    setSelectedTargets((prev) =>
      prev.includes(target) ? prev.filter((item) => item !== target) : [...prev, target]
    );
  };

  const buildPayload = (): Partial<Job> => {
    const toList = (value: string) =>
      value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

    return {
      title: title.trim(),
      slug: slug.trim(),
      department: department.trim() || undefined,
      location: location.trim(),
      employment_type: employmentType,
      experience_level: experienceLevel,
      salary_range: salaryRange.trim() || undefined,
      summary: summary.trim() || undefined,
      description,
      responsibilities: toList(responsibilities),
      requirements: toList(requirements),
      benefits: toList(benefits),
      application_url: applicationUrl.trim() || undefined,
      application_email: applicationEmail.trim() || undefined,
      publish_targets: selectedTargets,
      closing_date: closingDate || undefined,
    };
  };

  const handleSubmit = async (status: JobStatus) => {
    if (!isValid || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onSubmit(
        {
          ...buildPayload(),
          status,
        },
        status
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{job ? 'Edit Job Posting' : 'Create Job Posting'}</h2>
          <p className="text-sm text-slate-400 mt-1">Publish open roles to one or multiple endpoints in a few clicks.</p>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <XCircle size={20} />
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                placeholder="Senior Video Editor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                placeholder="senior-video-editor"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Production"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Leicester, UK"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                >
                  {employmentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                >
                  {experienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Salary Range</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                  placeholder="£35,000 - £42,000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Role Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full h-28 bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 resize-none"
                placeholder="One paragraph summary of the role."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-48 bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 resize-none"
                placeholder="Provide a detailed description of the role, team, and expectations."
              />
            </div>
          </div>

          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Expectations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Responsibilities
                </label>
                <textarea
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  className="w-full h-40 bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 resize-none"
                  placeholder="One responsibility per line"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Requirements
                </label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full h-40 bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 resize-none"
                  placeholder="One requirement per line"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Benefits
                </label>
                <textarea
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  className="w-full h-40 bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 resize-none"
                  placeholder="One benefit per line"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Publishing</h3>
            <p className="text-sm text-slate-400">
              Select where you want this job to appear. You can publish to multiple endpoints at once.
            </p>
            <div className="space-y-3">
              {availableTargets.map((target) => (
                <label
                  key={target.id}
                  className="flex items-center gap-3 bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 cursor-pointer hover:border-cyan-400 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTargets.includes(target.id)}
                    onChange={() => toggleTarget(target.id)}
                    className="form-checkbox h-4 w-4 text-cyan-400 border-gray-600"
                  />
                  <span className="text-sm text-slate-100">
                    {target.label}
                    {target.url && (
                      <span className="block text-xs text-slate-500">
                        {target.url}
                      </span>
                    )}
                  </span>
                </label>
              ))}
              {availableTargets.length === 0 && (
                <p className="text-sm text-slate-500">No publish endpoints defined yet.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Closing Date</label>
              <input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Application Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Application URL</label>
                <input
                  type="url"
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Application Email</label>
                <input
                  type="email"
                  value={applicationEmail}
                  onChange={(e) => setApplicationEmail(e.target.value)}
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                  placeholder="talent@company.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Save & Publish</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSubmit('published')}
                disabled={!isValid || isSubmitting || selectedTargets.length === 0}
                className="w-full py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {job?.status === 'published' ? 'Update Published Job' : 'Publish Now'}
              </button>
              <button
                onClick={() => handleSubmit('draft')}
                disabled={!isValid || isSubmitting}
                className="w-full py-3 rounded-lg bg-[#0d0e0a] border border-gray-800 text-slate-200 font-semibold hover:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save as Draft
              </button>
            </div>
            {!isValid && <p className="text-xs text-amber-400">Fill in the required fields marked with *</p>}
            {selectedTargets.length === 0 && (
              <p className="text-xs text-slate-500">
                Publish Now requires picking at least one endpoint. You can still save as draft.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobForm;
