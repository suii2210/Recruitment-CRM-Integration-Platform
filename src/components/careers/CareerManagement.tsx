import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, Filter, Globe } from 'lucide-react';
import { useJobStore, Job, JobStatus, EmploymentType, ExperienceLevel, JobPublishTarget } from '../../store/jobStore';
import { useUserStore } from '../../store/userStore';
import JobList from './JobList';
import JobForm from './JobForm';
import JobPreview from './JobPreview';

type ViewState = 'list' | 'form' | 'preview';

const statusOptions = [
  { id: 'all', label: 'All status' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'closed', label: 'Closed' },
];

const employmentOptions = [
  { id: 'all', label: 'All types' },
  { id: 'full-time', label: 'Full Time' },
  { id: 'part-time', label: 'Part Time' },
  { id: 'contract', label: 'Contract' },
  { id: 'temporary', label: 'Temporary' },
  { id: 'internship', label: 'Internship' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'unpaid', label: 'Unpaid' },
];

const experienceOptions = [
  { id: 'all', label: 'All experience' },
  { id: 'entry', label: 'Entry' },
  { id: 'mid', label: 'Mid' },
  { id: 'senior', label: 'Senior' },
  { id: 'lead', label: 'Lead' },
  { id: 'executive', label: 'Executive' },
];

const CareerManagement: React.FC = () => {
  // ----- Zustand stores -----
  const jobs = useJobStore((state) => state.jobs);
  const currentJob = useJobStore((state) => state.currentJob);
  const loading = useJobStore((state) => state.loading);
  const pagination = useJobStore((state) => state.pagination);
  const publishTargets = useJobStore((state) => state.publishTargets);
  const fetchJobs = useJobStore((state) => state.fetchJobs);
  const fetchPublishTargets = useJobStore((state) => state.fetchPublishTargets);
  const createJob = useJobStore((state) => state.createJob);
  const updateJob = useJobStore((state) => state.updateJob);
  const deleteJob = useJobStore((state) => state.deleteJob);
  const publishJob = useJobStore((state) => state.publishJob);
  const unpublishJob = useJobStore((state) => state.unpublishJob);
  const closeJob = useJobStore((state) => state.closeJob);
  const setCurrentJob = useJobStore((state) => state.setCurrentJob);

  const hasPermission = useUserStore((state) => state.hasPermission);

  const publishTargetMap = useMemo(
    () =>
      publishTargets.reduce<Record<string, JobPublishTarget>>((acc, target) => {
        acc[target.id] = target;
        return acc;
      }, {}),
    [publishTargets]
  );


  // ----- Local state -----
  const [view, setView] = useState<ViewState>('list');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | JobStatus>('all');
  const [selectedEmployment, setSelectedEmployment] = useState<'all' | EmploymentType>('all');
  const [selectedExperience, setSelectedExperience] = useState<'all' | ExperienceLevel>('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [publishModalJob, setPublishModalJob] = useState<Job | null>(null);
  const [modalTargets, setModalTargets] = useState<string[]>([]);

  // load publish endpoints once
  useEffect(() => {
    fetchPublishTargets();
  }, [fetchPublishTargets]);

  // build filters
  const filterParams = useMemo(
    () => ({
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      employment_type: selectedEmployment === 'all' ? undefined : selectedEmployment,
      experience_level: selectedExperience === 'all' ? undefined : selectedExperience,
      department: departmentFilter || undefined,
      location: locationFilter || undefined,
      search: searchQuery || undefined,
      page: 1,
    }),
    [
      selectedStatus,
      selectedEmployment,
      selectedExperience,
      departmentFilter,
      locationFilter,
      searchQuery,
    ]
  );

  const filtersRef = useRef(filterParams);

  // fetch jobs when filters change
  useEffect(() => {
    filtersRef.current = filterParams;
    fetchJobs(filterParams);
  }, [fetchJobs, filterParams]);

  // ----- Handlers -----
  const handleCreateNew = () => {
    setCurrentJob(null);
    setView('form');
  };

  const handleSubmit = async (formData: Partial<Job>, _status: string) => {
    try {
      if (currentJob) {
        await updateJob(currentJob.id, formData);
      } else {
        await createJob(formData);
      }
      await fetchJobs(filtersRef.current);
      setView('list');
      setCurrentJob(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save job');
    }
  };

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete ${job.title}? This cannot be undone.`)) return;
    try {
      await deleteJob(job.id);
      await fetchJobs(filtersRef.current);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete job');
    }
  };

  const handlePublishClick = (job: Job) => {
    setPublishModalJob(job);
    setModalTargets(job.publish_targets.length ? job.publish_targets : publishTargets.map((target) => target.id));
  };

  const handleConfirmPublish = async () => {
    if (!publishModalJob) return;
    if (modalTargets.length === 0) {
      alert('Select at least one endpoint to publish this job.');
      return;
    }
    try {
      await publishJob(publishModalJob.id, modalTargets);
      setPublishModalJob(null);
      setModalTargets([]);
      await fetchJobs(filtersRef.current);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to publish job');
    }
  };

  const handleUnpublish = async (job: Job) => {
    if (!confirm(`Unpublish ${job.title}? It will return to draft.`)) return;
    try {
      await unpublishJob(job.id);
      await fetchJobs(filtersRef.current);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to unpublish job');
    }
  };

  const handleCloseJob = async (job: Job) => {
    if (!confirm(`Close ${job.title}? It will no longer appear in listings.`)) return;
    try {
      await closeJob(job.id);
      await fetchJobs(filtersRef.current);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to close job');
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    return jobs.filter((job) => {
      const target = `${job.title} ${job.summary || ''} ${job.department || ''} ${job.location}`.toLowerCase();
      return target.includes(searchQuery.toLowerCase());
    });
  }, [jobs, searchQuery]);

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput.trim());
  };

  const publishModalActive = publishModalJob !== null;

  // ----- Conditional renders -----
  if (view === 'form') {
    return (
      <div className="h-full overflow-y-auto bg-[#0d0e0a]">
        <JobForm
          job={currentJob || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setView('list');
            setCurrentJob(null);
          }}
          availableTargets={publishTargets}
        />
      </div>
    );
  }

  if (view === 'preview' && currentJob) {
    return (
      <JobPreview
        job={currentJob}
        targetOptions={publishTargetMap}
        onBack={() => setView('list')}
        onEdit={(job) => {
          setCurrentJob(job);
          setView('form');
        }}
        onPublish={handlePublishClick}
        onUnpublish={handleUnpublish}
        onClose={handleCloseJob}
        hasPermission={hasPermission}
      />
    );
  }

  // ----- Main render -----
  return (
    <div className="flex flex-col h-full bg-[#0d0e0a]">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Careers</h1>
          <p className="text-sm text-slate-400">Manage open roles and publish them across your endpoints.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center bg-[#15170f] border border-gray-800 rounded-lg px-3">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Search job title, department or location"
              className="bg-transparent border-none outline-none px-3 py-2 text-sm text-white w-60"
            />
            <button
              onClick={handleSearchSubmit}
              className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              Search
            </button>
          </div>
          {hasPermission('jobs.create') && (
            <button
              onClick={handleCreateNew}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
            >
              <Plus size={16} />
              New Job
            </button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-800 bg-[#0d0e0a]">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="col-span-1 flex items-center gap-2 text-slate-400">
            <Filter size={16} />
            Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | JobStatus)}
              className="bg-[#15170f] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedEmployment}
              onChange={(e) => setSelectedEmployment(e.target.value as 'all' | EmploymentType)}
              className="bg-[#15170f] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            >
              {employmentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value as 'all' | ExperienceLevel)}
              className="bg-[#15170f] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            >
              {experienceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              placeholder="Department"
              className="bg-[#15170f] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />

            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location"
              className="bg-[#15170f] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Job List */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredJobs.length > 0 ? (
          <>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Globe size={16} />
                Showing {filteredJobs.length} roles
              </div>
              <div>
                Page {pagination.page} · {pagination.total} total
              </div>
            </div>

            <JobList
              jobs={filteredJobs}
              onEdit={(job) => {
                setCurrentJob(job);
                setView('form');
              }}
              onDelete={handleDelete}
              onPublish={handlePublishClick}
              onUnpublish={handleUnpublish}
              onClose={handleCloseJob}
              onView={(job) => {
                setCurrentJob(job);
                setView('preview');
              }}
              hasPermission={hasPermission}
              targetOptions={publishTargetMap}
            />
          </>
        ) : (
          <div className="bg-[#15170f] border border-dashed border-gray-700 rounded-xl p-16 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Plus className="text-cyan-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">No job postings yet</h3>
              <p className="text-sm text-slate-400">Create your first role and publish it to the endpoints you need.</p>
            </div>
            {hasPermission('jobs.create') && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
              >
                <Plus size={16} />
                Create a Job
              </button>
            )}
          </div>
        )}
      </main>

      {/* Floating Create Button */}
      {hasPermission('jobs.create') && (
        <button
          onClick={handleCreateNew}
          className="fixed bottom-8 right-8 flex items-center justify-center gap-3 px-5 py-3 rounded-full bg-[#0d0e0a] border-2 border-cyan-400 text-slate-100 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
        >
          <Plus size={18} className="text-cyan-300" />
          <span className="text-sm font-semibold">New Job</span>
        </button>
      )}

      {/* Publish Modal */}
      {publishModalActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#15170f] border border-gray-800 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-xl font-semibold text-white">Publish job</h3>
              <p className="text-sm text-slate-400">
                Choose the endpoints where <span className="text-white">{publishModalJob?.title}</span> should appear.
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {publishTargets.map((target) => {
                const checked = modalTargets.includes(target.id);
                return (
                  <label
                    key={target.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                      checked ? 'border-cyan-400 bg-cyan-500/10' : 'border-gray-800 hover:border-cyan-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setModalTargets((prev) =>
                          prev.includes(target.id)
                            ? prev.filter((t) => t !== target.id)
                            : [...prev, target.id]
                        )
                      }
                      className="form-checkbox h-4 w-4 text-cyan-400 border-gray-600"
                    />
                    <span className="text-sm text-slate-100">
                      {target.label}
                      {target.url && (
                        <span className="block text-xs text-slate-500">{target.url}</span>
                      )}
                    </span>
                  </label>
                );
              })}
              {publishTargets.length === 0 && (
                <p className="text-sm text-slate-500">Define publish endpoints to use this workflow.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setPublishModalJob(null);
                  setModalTargets([]);
                }}
                className="px-4 py-2 rounded-lg border border-gray-800 text-slate-200 hover:border-cyan-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPublish}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                disabled={publishTargets.length === 0}
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerManagement;









