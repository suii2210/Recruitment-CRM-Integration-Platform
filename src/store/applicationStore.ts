import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export type ApplicationStatus =
  | 'new'
  | 'in_review'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  in_review: 'In review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

interface JobSummary {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  department?: string;
  location?: string;
  employment_type?: string;
}

export interface ApplicationTimelineEntry {
  status: ApplicationStatus;
  note?: string;
  changed_at: string;
  changed_by?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface ApplicantAttachment {
  label?: string;
  name?: string;
  url?: string;
  type?: string;
  size?: number;
}

export interface ApplicantAnswer {
  question?: string;
  answer?: string;
}

export interface WorkflowStage {
  sent_at?: string;
  response_status: 'pending' | 'accepted' | 'declined';
  responded_at?: string;
  candidate_message?: string;
}

export interface DocumentRequest {
  sent_at?: string;
  completed_at?: string | null;
}

export interface CandidateDocument {
  filename: string;
  label?: string;
  url: string;
  uploaded_at: string;
  uploaded_by_candidate?: boolean;
}

export interface EmailLog {
  subject: string;
  body: string;
  sent_at: string;
  recipient: string;
  sent_by?: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
}

export interface JobApplication {
  id: string;
  job?: JobSummary | null;
  job_title?: string;
  job_slug?: string;
  job_department?: string;
  job_location?: string;
  applicant_name: string;
  email: string;
  phone?: string;
  status: ApplicationStatus;
  source?: string;
  submitted_from?: string;
  resume_url?: string;
  cover_letter?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  location?: string;
  experience_years?: number;
  expected_salary?: string;
  notice_period?: string;
  current_company?: string;
  tags: string[];
  rating?: number;
  internal_notes?: string;
  attachments?: ApplicantAttachment[];
  answers?: ApplicantAnswer[];
  timeline?: ApplicationTimelineEntry[];
  processed_by?: {
    _id: string;
    name: string;
    email: string;
  };
  onboarding_status?: string;
  shortlist?: WorkflowStage | null;
  document_request?: DocumentRequest | null;
  document_uploads?: CandidateDocument[];
  offer?: (WorkflowStage & {
    user?: {
      _id: string;
      name?: string;
      email?: string;
      role?: string;
      status?: string;
    } | null;
  }) | null;
  created_at: string;
  updated_at: string;
  email_logs?: EmailLog[];
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  jobId?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApplicationStats {
  byStatus: Record<string, number>;
  byJob: Array<{ job: JobSummary | null; count: number }>;
}

interface ApplicationState {
  applications: JobApplication[];
  currentApplication: JobApplication | null;
  stats: ApplicationStats;
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  fetchApplications: (filters?: ApplicationFilters) => Promise<void>;
  fetchApplicationById: (id: string) => Promise<JobApplication | null>;
  updateApplication: (
    id: string,
    payload: Partial<JobApplication> & Record<string, unknown>
  ) => Promise<JobApplication>;
  deleteApplication: (id: string) => Promise<void>;
  sendEmail: (id: string, payload: { subject: string; message: string }) => Promise<JobApplication>;
  sendWorkflowEmail: (
    id: string,
    payload: { template: '001' | '002' | '003'; note?: string; offerLetterPath?: string }
  ) => Promise<JobApplication>;
  setCurrentApplication: (application: JobApplication | null) => void;
  clearError: () => void;
}

const buildQuery = (filters: ApplicationFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.append(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

const toIdString = (value: any): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    if (typeof value.toString === 'function') {
      const str = value.toString();
      return str && str !== '[object Object]' ? str : undefined;
    }
    if (value._id) {
      return toIdString(value._id);
    }
  }
  return undefined;
};

const normalizeJob = (job: any): JobSummary | null => {
  if (!job) return null;
  const jobId = toIdString(job._id) ?? toIdString(job.id);
  return {
    ...job,
    id: jobId,
    _id: jobId,
  };
};

const normalizeApplication = (application: any): JobApplication => ({
  ...application,
  id: toIdString(application._id) ?? toIdString(application.id) ?? '',
  job: normalizeJob(application.job),
  tags: application.tags || [],
  attachments: application.attachments || [],
  answers: application.answers || [],
  timeline: application.timeline || [],
  onboarding_status: application.onboarding_status || 'new',
  shortlist: application.shortlist
    ? {
        sent_at: application.shortlist.sent_at,
        response_status: application.shortlist.response_status || 'pending',
        responded_at: application.shortlist.responded_at,
        candidate_message: application.shortlist.candidate_message,
      }
    : null,
  document_request: application.document_request
    ? {
        sent_at: application.document_request.sent_at,
        completed_at: application.document_request.completed_at,
      }
    : null,
  document_uploads: (application.document_uploads || []).map((doc: any) => ({
    filename: doc.filename,
    label: doc.label,
    url: doc.url,
    uploaded_at: doc.uploaded_at,
    uploaded_by_candidate: doc.uploaded_by_candidate,
  })),
  offer: application.offer
    ? {
        sent_at: application.offer.sent_at,
        response_status: application.offer.response_status || 'pending',
        responded_at: application.offer.responded_at,
        candidate_message: application.offer.candidate_message,
        user: application.offer.user
          ? typeof application.offer.user === 'object'
            ? {
                ...application.offer.user,
                _id:
                  toIdString(application.offer.user._id) ??
                  toIdString(application.offer.user.id) ??
                  application.offer.user._id ??
                  application.offer.user.id ??
                  '',
              }
            : { _id: application.offer.user }
          : null,
      }
    : null,
  email_logs: (application.email_logs || []).map((log: any) => ({
    subject: log.subject,
    body: log.body,
    sent_at: log.sent_at || log.sentAt || new Date().toISOString(),
    recipient: log.recipient || application.email,
    sent_by: log.sent_by || log.sentBy || null,
  })),
});

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  currentApplication: null,
  stats: {
    byStatus: {},
    byJob: [],
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,

  fetchApplications: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(
        `${API_ENDPOINTS.JOB_APPLICATIONS.BASE}${buildQuery(filters)}`
      );
      const applications = (response.applications || []).map(
        normalizeApplication
      );

      set((state) => ({
        applications,
        loading: false,
        pagination: response.pagination || state.pagination,
        stats: response.stats || state.stats || { byStatus: {}, byJob: [] },
        currentApplication:
          applications.find(
            (item) => item.id === state.currentApplication?.id
          ) || applications[0] || null,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchApplicationById: async (id: string) => {
    try {
      const application = await apiRequest(
        API_ENDPOINTS.JOB_APPLICATIONS.BY_ID(id)
      );
      const normalized = normalizeApplication(application);
      set({ currentApplication: normalized });
      return normalized;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },

  updateApplication: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await apiRequest(
        API_ENDPOINTS.JOB_APPLICATIONS.BY_ID(id),
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );
      const normalized = normalizeApplication(updated);
      set((state) => ({
        applications: state.applications.map((application) =>
          application.id === id ? normalized : application
        ),
        currentApplication:
          state.currentApplication?.id === id
            ? normalized
            : state.currentApplication,
        loading: false,
      }));
      return normalized;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteApplication: async (id: string) => {
    const targetId = id?.toString?.().trim?.() || '';
    if (!targetId || targetId === '[object Object]') {
      throw new Error('Invalid application identifier');
    }
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.JOB_APPLICATIONS.BY_ID(targetId), {
        method: 'DELETE',
      });
      set((state) => ({
        applications: state.applications.filter(
          (application) => application.id !== targetId
        ),
        currentApplication:
          state.currentApplication?.id === targetId
            ? state.applications.find((app) => app.id !== targetId) || null
            : state.currentApplication,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  sendEmail: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.JOB_APPLICATIONS.EMAIL(id), {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const normalized = normalizeApplication(response.application);
      set((state) => ({
        applications: state.applications.map((application) =>
          application.id === normalized.id ? normalized : application
        ),
        currentApplication:
          state.currentApplication?.id === normalized.id ? normalized : state.currentApplication,
        loading: false,
      }));
      return normalized;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  sendWorkflowEmail: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.JOB_APPLICATIONS.WORKFLOW_EMAIL(id), {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const normalized = normalizeApplication(response.application);
      set((state) => ({
        applications: state.applications.map((application) =>
          application.id === normalized.id ? normalized : application
        ),
        currentApplication:
          state.currentApplication?.id === normalized.id ? normalized : state.currentApplication,
        loading: false,
      }));
      return normalized;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setCurrentApplication: (application) => {
    set({ currentApplication: application });
  },

  clearError: () => {
    set({ error: null });
  },
}));
