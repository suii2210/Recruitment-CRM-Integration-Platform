import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export type JobStatus = 'draft' | 'published' | 'closed';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship' | 'freelance' | 'unpaid';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

export interface JobPublishTarget {
  id: string;
  label: string;
  url?: string | null;
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  department?: string;
  location: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  salary_range?: string;
  summary?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  application_url?: string;
  application_email?: string;
  publish_targets: string[];
  status: JobStatus;
  published_at?: string | null;
  closing_date?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

interface JobFilters {
  status?: JobStatus | 'all';
  department?: string;
  location?: string;
  employment_type?: EmploymentType;
  experience_level?: ExperienceLevel;
  search?: string;
  page?: number;
  limit?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  publishTargets: JobPublishTarget[];

  fetchJobs: (filters?: JobFilters) => Promise<void>;
  fetchJobById: (id: string) => Promise<Job | null>;
  fetchPublishTargets: () => Promise<JobPublishTarget[]>;
  createJob: (jobData: Partial<Job>) => Promise<Job>;
  updateJob: (id: string, jobData: Partial<Job>) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  publishJob: (id: string, publishTargets?: string[]) => Promise<Job>;
  unpublishJob: (id: string) => Promise<Job>;
  closeJob: (id: string) => Promise<Job>;
  setCurrentJob: (job: Job | null) => void;
  clearError: () => void;
}

const buildQuery = (filters: JobFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.append(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const normalizeJob = (job: any): Job => ({
  ...job,
  id: job._id || job.id,
  responsibilities: job.responsibilities || [],
  requirements: job.requirements || [],
  benefits: job.benefits || [],
  publish_targets: job.publish_targets || [],
});

const formatPayload = (data: Partial<Job>) => {
  const payload: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      payload[key] = value;
    } else {
      payload[key] = value;
    }
  });
  return payload;
};

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  currentJob: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  publishTargets: [],

  fetchJobs: async (filters) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(`${API_ENDPOINTS.JOBS.BASE}${buildQuery(filters)}`);
      const jobs = (response.jobs || []).map(normalizeJob);
      set({
        jobs,
        pagination: response.pagination || {
          page: 1,
          limit: jobs.length,
          total: jobs.length,
          totalPages: 1,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchJobById: async (id) => {
    set({ loading: true, error: null });
    try {
      const job = await apiRequest(API_ENDPOINTS.JOBS.BY_ID(id));
      const normalized = normalizeJob(job);
      set({ currentJob: normalized, loading: false });
      return normalized;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchPublishTargets: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.JOBS.TARGETS);
      const targets: JobPublishTarget[] = (response.targets || []).map((target: any) => ({
        id: target?.id || target,
        label: target?.label || target?.id || String(target),
        url: target?.url ?? null,
      }));
      set({ publishTargets: targets });
      return targets;
    } catch (error) {
      console.error('Error fetching publish targets:', error);
      return get().publishTargets;
    }
  },

  createJob: async (jobData) => {
    set({ loading: true, error: null });
    try {
      const payload = formatPayload(jobData);
      const job = await apiRequest(API_ENDPOINTS.JOBS.BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const normalized = normalizeJob(job);
      set((state) => ({
        jobs: [normalized, ...state.jobs],
        loading: false,
      }));
      return normalized;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateJob: async (id, jobData) => {
    set({ loading: true, error: null });
    try {
      const payload = formatPayload(jobData);
      const job = await apiRequest(API_ENDPOINTS.JOBS.BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const normalized = normalizeJob(job);
      set((state) => ({
        jobs: state.jobs.map((item) => (item.id === id ? normalized : item)),
        currentJob: state.currentJob?.id === id ? normalized : state.currentJob,
        loading: false,
      }));
      return normalized;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteJob: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.JOBS.BY_ID(id), {
        method: 'DELETE',
      });
      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id),
        currentJob: state.currentJob?.id === id ? null : state.currentJob,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  publishJob: async (id, publishTargets = []) => {
    set({ loading: true, error: null });
    try {
      const job = await apiRequest(API_ENDPOINTS.JOBS.PUBLISH(id), {
        method: 'PATCH',
        body: JSON.stringify({ publish_targets: publishTargets }),
      });
      const normalized = normalizeJob(job);
      set((state) => ({
        jobs: state.jobs.map((item) => (item.id === id ? normalized : item)),
        currentJob: state.currentJob?.id === id ? normalized : state.currentJob,
        loading: false,
      }));
      return normalized;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  unpublishJob: async (id) => {
    set({ loading: true, error: null });
    try {
      const job = await apiRequest(API_ENDPOINTS.JOBS.UNPUBLISH(id), {
        method: 'PATCH',
      });
      const normalized = normalizeJob(job);
      set((state) => ({
        jobs: state.jobs.map((item) => (item.id === id ? normalized : item)),
        currentJob: state.currentJob?.id === id ? normalized : state.currentJob,
        loading: false,
      }));
      return normalized;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  closeJob: async (id) => {
    set({ loading: true, error: null });
    try {
      const job = await apiRequest(API_ENDPOINTS.JOBS.CLOSE(id), {
        method: 'PATCH',
      });
      const normalized = normalizeJob(job);
      set((state) => ({
        jobs: state.jobs.map((item) => (item.id === id ? normalized : item)),
        currentJob: state.currentJob?.id === id ? normalized : state.currentJob,
        loading: false,
      }));
      return normalized;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setCurrentJob: (job) => {
    set({ currentJob: job });
  },

  clearError: () => {
    set({ error: null });
  },
}));
