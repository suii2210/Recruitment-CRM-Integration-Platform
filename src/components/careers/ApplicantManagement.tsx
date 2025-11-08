import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Star,
  Trash2,
  UserCheck,
  CalendarClock,
  Tag as TagIcon,
  Notebook,
  Clock3,
  Send,
  Activity,
} from 'lucide-react';
import {
  APPLICATION_STATUS_LABELS,
  ApplicationStatus,
  JobApplication,
  useApplicationStore,
} from '../../store/applicationStore';
import { useJobStore } from '../../store/jobStore';
import { useUserStore } from '../../store/userStore';
import API_ENDPOINTS, { getAuthHeaders } from '../../config/api';
import AttendanceMonitor from './AttendanceMonitor';

const statusOrder: ApplicationStatus[] = [
  'new',
  'in_review',
  'shortlisted',
  'interview',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
];

const statusStyles: Record<ApplicationStatus, string> = {
  new: 'bg-indigo-500/10 text-indigo-200 border-indigo-500/40',
  in_review: 'bg-amber-500/10 text-amber-200 border-amber-500/40',
  shortlisted: 'bg-cyan-500/10 text-cyan-200 border-cyan-500/40',
  interview: 'bg-blue-500/10 text-blue-200 border-blue-500/40',
  offered: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/40',
  hired: 'bg-lime-500/10 text-lime-200 border-lime-500/40',
  rejected: 'bg-rose-500/10 text-rose-200 border-rose-500/40',
  withdrawn: 'bg-gray-600/10 text-gray-200 border-gray-600/30',
};

type WorkflowTemplateCode = '001' | '002' | '003';

interface WorkflowBucketCandidate {
  id: string;
  applicant_name: string;
  email: string;
  job_title?: string;
  status?: ApplicationStatus;
  shortlist?: JobApplication['shortlist'];
  document_request?: JobApplication['document_request'];
  offer?: JobApplication['offer'];
  onboarding_status?: string;
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const ApplicantManagement: React.FC = () => {
  const {
    applications,
    currentApplication,
    pagination,
    stats,
    loading,
    fetchApplications,
    updateApplication,
    deleteApplication,
    setCurrentApplication,
    sendEmail,
    sendWorkflowEmail,
    hiredApplicants,
    fetchHiredApplicants,
  } = useApplicationStore();
  const jobs = useJobStore((state) => state.jobs);
  const fetchJobs = useJobStore((state) => state.fetchJobs);
  const hasPermission = useUserStore((state) => state.hasPermission);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>(
    'all'
  );
  const [jobFilter, setJobFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [shortlistNote, setShortlistNote] = useState('');
  const [documentsNote, setDocumentsNote] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [offerLetterPath, setOfferLetterPath] = useState('');
  const [offerLetterName, setOfferLetterName] = useState('');
  const [offerUploadLoading, setOfferUploadLoading] = useState(false);
  const [offerUploadError, setOfferUploadError] = useState<string | null>(null);
  const offerFileInputRef = useRef<HTMLInputElement | null>(null);
  const [workflowNotice, setWorkflowNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [workflowSending, setWorkflowSending] = useState<'001' | '002' | '003' | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [offerGenerateLoading, setOfferGenerateLoading] = useState(false);
  const [offerGenerateMessage, setOfferGenerateMessage] = useState<string | null>(null);
  const [workflowBuckets, setWorkflowBuckets] = useState<{
    shortlist: WorkflowBucketCandidate[];
    documents: WorkflowBucketCandidate[];
    offers: WorkflowBucketCandidate[];
  }>({ shortlist: [], documents: [], offers: [] });
  const [bucketSelections, setBucketSelections] = useState<Record<WorkflowTemplateCode, string[]>>({
    '001': [],
    '002': [],
    '003': [],
  });
  const [bucketNotes, setBucketNotes] = useState<Record<WorkflowTemplateCode, string>>({
    '001': '',
    '002': '',
    '003': '',
  });
  const [bulkWorkflowMessage, setBulkWorkflowMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkWorkflowError, setBulkWorkflowError] = useState<string | null>(null);
  const [bulkWorkflowLoading, setBulkWorkflowLoading] = useState(false);
  const [bulkWorkflowSending, setBulkWorkflowSending] = useState<WorkflowTemplateCode | null>(null);
  const [autoGenerateOfferLetters, setAutoGenerateOfferLetters] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSearchValue(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchJobs({ status: 'all', limit: 100 });
    fetchHiredApplicants();
  }, [fetchJobs, fetchHiredApplicants]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, jobFilter, searchValue]);

  useEffect(() => {
    fetchApplications({
      status: statusFilter === 'all' ? undefined : statusFilter,
      jobId: jobFilter === 'all' ? undefined : jobFilter,
      search: searchValue || undefined,
      page,
    });
  }, [statusFilter, jobFilter, searchValue, page, fetchApplications]);

  const fetchWorkflowBuckets = useCallback(async () => {
    if (!hasPermission('job-applications.manage')) return;
    setBulkWorkflowLoading(true);
    setBulkWorkflowError(null);
    try {
      const response = await fetch(API_ENDPOINTS.JOB_APPLICATIONS.WORKFLOW_BUCKETS, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load workflow buckets.');
      }
      setWorkflowBuckets({
        shortlist: data.shortlist || [],
        documents: data.documents || [],
        offers: data.offers || [],
      });
      setBucketSelections((prev) => ({
        '001': prev['001'].filter((id) =>
          (data.shortlist || []).some((candidate: WorkflowBucketCandidate) => candidate.id === id)
        ),
        '002': prev['002'].filter((id) =>
          (data.documents || []).some((candidate: WorkflowBucketCandidate) => candidate.id === id)
        ),
        '003': prev['003'].filter((id) =>
          (data.offers || []).some((candidate: WorkflowBucketCandidate) => candidate.id === id)
        ),
      }));
    } catch (error: any) {
      setBulkWorkflowError(
        error?.message || 'Failed to load workflow buckets.'
      );
    } finally {
      setBulkWorkflowLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    fetchWorkflowBuckets();
  }, [fetchWorkflowBuckets]);

  useEffect(() => {
    if (!currentApplication && applications.length) {
      setCurrentApplication(applications[0]);
    }
  }, [applications, currentApplication, setCurrentApplication]);

  useEffect(() => {
    if (!currentApplication) {
      setTagsInput('');
      setNotesInput('');
      setShortlistNote('');
      setDocumentsNote('');
      setOfferNote('');
      setOfferLetterPath('');
      setWorkflowNotice(null);
      setEmailSubject('');
      setEmailBody('');
      setEmailNotice(null);
      return;
    }
    setTagsInput((currentApplication.tags || []).join(', '));
    setNotesInput(currentApplication.internal_notes || '');
    setShortlistNote('');
    setDocumentsNote('');
    setOfferNote('');
    setOfferLetterPath('');
    setOfferLetterName('');
    setOfferUploadError(null);
    setOfferGenerateMessage(null);
    setOfferGenerateLoading(false);
    setWorkflowNotice(null);
    setEmailSubject('');
    setEmailBody('');
    setEmailNotice(null);
  }, [currentApplication]);

  const refetchWithFilters = () =>
    fetchApplications({
      status: statusFilter === 'all' ? undefined : statusFilter,
      jobId: jobFilter === 'all' ? undefined : jobFilter,
      search: searchValue || undefined,
      page,
    });

  const toggleBucketSelection = (template: WorkflowTemplateCode, id: string) => {
    setBucketSelections((prev) => {
      const exists = prev[template].includes(id);
      const updated = exists
        ? prev[template].filter((item) => item !== id)
        : [...prev[template], id];
      return { ...prev, [template]: updated };
    });
  };

  const handleBucketNoteChange = (template: WorkflowTemplateCode, value: string) => {
    setBucketNotes((prev) => ({ ...prev, [template]: value }));
  };

  const handleBulkWorkflowSend = async (template: WorkflowTemplateCode) => {
    if (!hasPermission('job-applications.manage')) return;
    if (bucketSelections[template].length === 0) {
      setBulkWorkflowMessage({
        type: 'error',
        text: `Select at least one candidate for template ${template}.`,
      });
      return;
    }
    setBulkWorkflowSending(template);
    setBulkWorkflowMessage(null);
    try {
      const payload: Record<string, any> = {
        template,
        applicationIds: bucketSelections[template],
        note: bucketNotes[template] || undefined,
      };
      if (template === '003') {
        payload.autoGenerateOffer = autoGenerateOfferLetters
          ? { enabled: true, format: 'pdf' }
          : false;
      }
      const response = await fetch(API_ENDPOINTS.JOB_APPLICATIONS.WORKFLOW_BATCH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to send template ${template}.`);
      }
      const sentCount = (data.results || []).filter(
        (item: { status: string }) => item.status === 'sent'
      ).length;
      setBulkWorkflowMessage({
        type: 'success',
        text:
          sentCount > 0
            ? `Sent template ${template} to ${sentCount} candidate${sentCount === 1 ? '' : 's'}.`
            : data.message || 'No emails were sent.',
      });
      setBucketSelections((prev) => ({ ...prev, [template]: [] }));
      fetchWorkflowBuckets();
    } catch (error: any) {
      setBulkWorkflowMessage({
        type: 'error',
        text: error?.message || `Failed to send template ${template}.`,
      });
    } finally {
      setBulkWorkflowSending(null);
    }
  };

  const statusSummary = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        label: APPLICATION_STATUS_LABELS[status],
        count: stats.byStatus?.[status] || 0,
      })),
    [stats.byStatus]
  );

  const renderWorkflowBucket = (
    template: WorkflowTemplateCode,
    title: string,
    description: string,
    candidates: WorkflowBucketCandidate[]
  ) => (
    <div className="border border-gray-800 rounded-2xl p-4 bg-black/30 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-white font-semibold">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className="text-xs text-slate-400">{candidates.length} ready</span>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {candidates.length === 0 && (
          <p className="text-xs text-slate-500 py-2">No candidates ready.</p>
        )}
        {candidates.map((candidate) => (
          <label
            key={candidate.id}
            className={`flex items-center gap-3 text-xs border rounded-xl px-3 py-2 ${
              bucketSelections[template].includes(candidate.id)
                ? 'border-cyan-400 text-white'
                : 'border-gray-800 text-slate-400'
            }`}
          >
            <input
              type="checkbox"
              className="accent-cyan-400"
              checked={bucketSelections[template].includes(candidate.id)}
              onChange={() => toggleBucketSelection(template, candidate.id)}
            />
            <div>
              <p className="text-white text-sm">{candidate.applicant_name}</p>
              <p className="text-[11px] text-slate-500">
                {candidate.job_title || candidate.email}
              </p>
            </div>
          </label>
        ))}
      </div>
      <textarea
        value={bucketNotes[template]}
        onChange={(e) => handleBucketNoteChange(template, e.target.value)}
        placeholder="Optional note to include..."
        rows={2}
        className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
      />
      {template === '003' && (
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            className="accent-cyan-400"
            checked={autoGenerateOfferLetters}
            onChange={(e) => setAutoGenerateOfferLetters(e.target.checked)}
          />
          Auto-generate PDF offer letters
        </label>
      )}
      <button
        onClick={() => handleBulkWorkflowSend(template)}
        disabled={
          bulkWorkflowSending === template ||
          bucketSelections[template].length === 0 ||
          bulkWorkflowLoading
        }
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={16} />
        {bulkWorkflowSending === template ? 'Sending…' : `Send ${template}`}
      </button>
    </div>
  );

  const handleStatusUpdate = async (status: ApplicationStatus) => {
    if (!currentApplication || !hasPermission('job-applications.manage')) return;
    try {
      await updateApplication(currentApplication.id, { status });
      await refetchWithFilters();
    } catch (error) {
      console.error(error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleTagsSave = async () => {
    if (!currentApplication || !hasPermission('job-applications.manage')) return;
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    try {
      await updateApplication(currentApplication.id, { tags });
    } catch (error) {
      console.error(error);
      alert('Failed to save tags.');
    }
  };

  const handleNotesSave = async () => {
    if (!currentApplication || !hasPermission('job-applications.manage')) return;
    try {
      await updateApplication(currentApplication.id, {
        internal_notes: notesInput,
      });
    } catch (error) {
      console.error(error);
      alert('Failed to save notes.');
    }
  };

  const handleRatingChange = async (rating: number) => {
    if (!currentApplication || !hasPermission('job-applications.manage')) return;
    try {
      await updateApplication(currentApplication.id, { rating });
    } catch (error) {
      console.error(error);
      alert('Failed to update rating.');
    }
  };

  const handleWorkflowEmailSend = async (template: '001' | '002' | '003') => {
    if (!currentApplication || !hasPermission('job-applications.manage')) return;
    try {
      setWorkflowSending(template);
      setWorkflowNotice(null);
      const payload: {
        template: '001' | '002' | '003';
        note?: string;
        offerLetterPath?: string;
      } = { template };

      if (template === '001' && shortlistNote.trim()) {
        payload.note = shortlistNote.trim();
      }
      if (template === '002' && documentsNote.trim()) {
        payload.note = documentsNote.trim();
      }
      if (template === '003') {
        if (offerNote.trim()) {
          payload.note = offerNote.trim();
        }
        if (offerLetterPath.trim()) {
          payload.offerLetterPath = offerLetterPath.trim();
        }
      }

      await sendWorkflowEmail(currentApplication.id, payload);
      setWorkflowNotice({
        type: 'success',
        message: `Workflow email ${template} sent successfully.`,
      });
    } catch (error: any) {
      console.error(error);
      setWorkflowNotice({
        type: 'error',
        message:
          error?.message ||
          `Failed to send workflow email ${template}. Please try again.`,
      });
    } finally {
      setWorkflowSending(null);
    }
  };

  const handleOfferLetterUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentApplication || !event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setOfferUploadError(null);
    setOfferUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('offerLetter', file);
      const response = await fetch(
        API_ENDPOINTS.JOB_APPLICATIONS.OFFER_UPLOAD(currentApplication.id),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload offer letter.');
      }
      const data = await response.json();
      setOfferLetterPath(data.path);
      setOfferLetterName(file.name);
      setWorkflowNotice({
        type: 'success',
        message: 'Offer letter uploaded successfully.',
      });
    } catch (error: any) {
      console.error(error);
      setOfferUploadError(error.message || 'Failed to upload offer letter.');
    } finally {
      setOfferUploadLoading(false);
      if (offerFileInputRef.current) {
        offerFileInputRef.current.value = '';
      }
    }
  };

  const handleOfferLetterGenerate = async (format: 'pdf' | 'pptx' = 'pdf') => {
    if (!currentApplication) return;
    setOfferGenerateMessage(null);
    setOfferUploadError(null);
    setOfferGenerateLoading(true);
    try {
      const response = await fetch(
        API_ENDPOINTS.JOB_APPLICATIONS.OFFER_GENERATE(currentApplication.id),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ format }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate offer letter.');
      }
      setOfferLetterPath(data.path);
      setOfferLetterName(data.filename);
      const formatLabel = (data.format || 'pdf').toUpperCase();
      let successMessage = `Generated ${formatLabel} offer letter (${data.filename})`;
      if (data.warning === 'pdf_fallback') {
        successMessage += ' — PDF export unavailable, attached PPTX instead.';
      }
      setOfferGenerateMessage(successMessage);
      setWorkflowNotice({
        type: 'success',
        message: 'Offer letter generated and ready to send.',
      });
    } catch (error: any) {
      console.error(error);
      setOfferUploadError(error?.message || 'Failed to generate offer letter.');
      setOfferGenerateMessage(null);
    } finally {
      setOfferGenerateLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!currentApplication || !hasPermission('job-applications.manage')) return;
    if (!currentApplication.email) {
      setEmailNotice({ type: 'error', message: 'This applicant does not have an email address.' });
      return;
    }
    const subject = emailSubject.trim();
    const message = emailBody.trim();
    if (!subject || !message) {
      setEmailNotice({ type: 'error', message: 'Subject and message cannot be empty.' });
      return;
    }
    try {
      setSendingEmail(true);
      setEmailNotice(null);
      await sendEmail(currentApplication.id, { subject, message });
      setEmailNotice({ type: 'success', message: 'Email sent successfully.' });
      setEmailSubject('');
      setEmailBody('');
    } catch (error) {
      console.error(error);
      setEmailNotice({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to send email. Please try again.',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async (application: JobApplication) => {
    if (!hasPermission('job-applications.manage')) return;
    const confirmed = confirm(
      `Delete application from ${application.applicant_name}?`
    );
    if (!confirmed) return;
    try {
      await deleteApplication(application.id);
      await refetchWithFilters();
    } catch (error) {
      console.error(error);
      alert('Failed to delete application.');
    }
  };

  const StatusBadge = ({ status }: { status: ApplicationStatus }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wide ${
        statusStyles[status] || 'bg-gray-700/30 text-gray-300'
      }`}
    >
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );

  const describeWorkflowStage = (stage: JobApplication['shortlist']): string => {
    if (!stage) return 'Not started';
    const responded = stage.responded_at ? ` on ${formatDate(stage.responded_at)}` : '';
    if (stage.response_status === 'accepted') {
      return `Accepted${responded}`;
    }
    if (stage.response_status === 'declined') {
      return `Declined${responded}`;
    }
    return stage.sent_at ? `Awaiting response (sent ${formatDate(stage.sent_at)})` : 'Pending';
  };

  const renderListItem = (application: JobApplication) => {
    const isActive = currentApplication?.id === application.id;
    return (
      <button
        key={application.id}
        onClick={() => setCurrentApplication(application)}
        className={`w-full text-left p-4 rounded-xl border transition-colors ${
          isActive
            ? 'border-cyan-400 bg-cyan-500/5'
            : 'border-gray-800 hover:border-gray-600'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-white font-medium">{application.applicant_name}</p>
            <p className="text-xs text-slate-400">{application.email}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <UserCheck size={14} /> {application.job_title || 'Unassigned'}
          </span>
          {application.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {application.location}
            </span>
          )}
          <span>{formatDate(application.created_at)}</span>
        </div>
      </button>
    );
  };

  const renderDetail = () => {
    if (!currentApplication) {
      return (
        <div className="p-6 text-center text-slate-400">
          Select an application to see more details.
        </div>
      );
    }

    const timeline = currentApplication.timeline || [];
    const activityFeed = timeline
      .slice()
      .sort(
        (a, b) =>
          new Date(b.changed_at || '').getTime() -
          new Date(a.changed_at || '').getTime()
      )
      .slice(0, 6);
    const answers = currentApplication.answers || [];
    const documentUploads = currentApplication.document_uploads || [];
    const shortlistStageText = describeWorkflowStage(currentApplication.shortlist || null);
    const documentsStatus = currentApplication.document_request?.completed_at
      ? `Received on ${formatDate(currentApplication.document_request.completed_at)}`
      : 'Awaiting upload';
    const offerStageText = describeWorkflowStage(currentApplication.offer || null);
    const offerUser = currentApplication.offer?.user || null;
    const canSend001 = hasPermission('job-applications.manage');
    const canSend002 =
      hasPermission('job-applications.manage') &&
      currentApplication.shortlist?.response_status === 'accepted';
    const canSend003 =
      hasPermission('job-applications.manage') &&
      Boolean(currentApplication.document_request?.completed_at) &&
      (currentApplication.offer?.response_status === 'pending' || !currentApplication.offer);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">
              {currentApplication.applicant_name}
            </h3>
            <p className="text-sm text-slate-400">
              Applied for{' '}
              <span className="text-cyan-300">
                {currentApplication.job_title || 'N/A'}
              </span>
            </p>
          </div>
          <StatusBadge status={currentApplication.status} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail size={16} /> Contact
            </h4>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <Mail size={14} /> {currentApplication.email}
              </p>
              {currentApplication.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={14} /> {currentApplication.phone}
                </p>
              )}
              {currentApplication.location && (
                <p className="flex items-center gap-2">
                  <MapPin size={14} /> {currentApplication.location}
                </p>
              )}
            </div>
          </div>
          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarClock size={16} /> Submission
            </h4>
            <div className="text-sm text-slate-300 space-y-2">
              <p>
                Submitted: <span className="text-white">{formatDate(currentApplication.created_at)}</span>
              </p>
              <p>
                Source:{' '}
                <span className="text-white">
                  {currentApplication.source || currentApplication.submitted_from || 'Unknown'}
                </span>
              </p>
              {currentApplication.resume_url && (
                <button
                  onClick={() => window.open(currentApplication.resume_url, '_blank')}
                  className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200"
                >
                  <ExternalLink size={14} /> View resume
                </button>
              )}
            </div>
          </div>
        </div>

        {answers.length > 0 && (
          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Notebook size={16} /> Screening questions
            </h4>
            <div className="space-y-4 text-sm text-slate-300">
              {answers.map((answer, index) => (
                <div key={index}>
                  <p className="text-slate-400 text-xs uppercase">
                    {answer.question}
                  </p>
                  <p className="text-white mt-1 leading-relaxed">
                    {answer.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock3 size={16} /> Hiring workflow
            </h4>
            <span className="text-xs text-slate-400 uppercase">
              {currentApplication.onboarding_status?.replace(/-/g, ' ') || 'new'}
            </span>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              <strong>Shortlist:</strong> {shortlistStageText}
            </p>
            <p>
              <strong>Documents:</strong> {documentsStatus}{' '}
              {documentUploads.length > 0 && (
                <span className="text-xs text-slate-500">
                  ({documentUploads.length} file{documentUploads.length === 1 ? '' : 's'})
                </span>
              )}
            </p>
            <p>
              <strong>Offer:</strong> {offerStageText}{' '}
              {offerUser && (
                <span className="text-xs text-slate-500">
                  • Profile: {offerUser.name || offerUser.email}
                </span>
              )}
            </p>
          </div>

          {documentUploads.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase">Documents</p>
              <div className="flex flex-col gap-2">
                {documentUploads.map((doc, index) => (
                  <a
                    key={`${doc.filename}-${index}`}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-300 hover:text-cyan-200 underline"
                  >
                    {doc.label || doc.filename}
                  </a>
                ))}
              </div>
            </div>
          )}

        {hasPermission('job-applications.manage') && (
          <div className="space-y-3">
            {workflowNotice && (
              <p
                className={`text-xs ${
                  workflowNotice.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {workflowNotice.message}
              </p>
            )}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase">001 • Shortlist</p>
                  <textarea
                    value={shortlistNote}
                    onChange={(e) => setShortlistNote(e.target.value)}
                    placeholder="Optional note to include..."
                    rows={3}
                    className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleWorkflowEmailSend('001')}
                    disabled={workflowSending === '001' || !canSend001}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} /> {workflowSending === '001' ? 'Sending…' : 'Send 001'}
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase">002 • Request documents</p>
                  <textarea
                    value={documentsNote}
                    onChange={(e) => setDocumentsNote(e.target.value)}
                    placeholder="Reminder or instructions…"
                    rows={3}
                    className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleWorkflowEmailSend('002')}
                    disabled={workflowSending === '002' || !canSend002}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} /> {workflowSending === '002' ? 'Sending…' : 'Send 002'}
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase">003 • Offer letter</p>
                  <textarea
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    placeholder="Personal message to candidate…"
                    rows={3}
                    className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <input
                    ref={offerFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleOfferLetterUpload}
                  />
                  <button
                    type="button"
                    onClick={() => offerFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-white hover:border-cyan-400 transition-colors"
                  >
                    {offerUploadLoading ? 'Uploading…' : 'Upload offer letter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOfferLetterGenerate('pdf')}
                    disabled={offerGenerateLoading}
                    className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-white hover:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {offerGenerateLoading ? 'Generating…' : 'Auto-generate PDF'}
                  </button>
                  <p className="text-xs text-slate-500">
                    {offerLetterName
                      ? `Attached: ${offerLetterName}`
                      : offerLetterPath
                        ? `Using existing file: ${offerLetterPath}`
                        : 'Accepted formats: PDF, DOC, DOCX, JPG, PNG'}
                  </p>
                  {offerGenerateMessage && (
                    <p className="text-xs text-emerald-300">{offerGenerateMessage}</p>
                  )}
                  {offerUploadError && (
                    <p className="text-xs text-rose-400">{offerUploadError}</p>
                  )}
                  <button
                    onClick={() => handleWorkflowEmailSend('003')}
                    disabled={workflowSending === '003' || !canSend003}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} /> {workflowSending === '003' ? 'Sending…' : 'Send 003'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity size={16} /> Activity feed
          </h4>
          <div className="space-y-2 text-sm text-slate-300">
            {activityFeed.length === 0 && (
              <p className="text-xs text-slate-500">No activity captured yet.</p>
            )}
            {activityFeed.map((entry, index) => (
              <div key={`${entry.status}-${index}`} className="border border-gray-800 rounded-xl p-3">
                <p className="text-white">{entry.note || entry.status}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(entry.changed_at)} • {entry.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <TagIcon size={16} /> Tags
            </h4>
            <div className="space-y-2">
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Add comma separated tags"
                className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
              {hasPermission('job-applications.manage') && (
                <button
                  onClick={handleTagsSave}
                  className="px-3 py-2 text-sm rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
                >
                  Save tags
                </button>
              )}
              <div className="flex flex-wrap gap-2">
                {currentApplication.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-200 border border-cyan-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Star size={16} /> Rating
            </h4>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleRatingChange(value)}
                  className={`p-2 rounded-lg border ${
                    (currentApplication.rating || 0) >= value
                      ? 'text-yellow-300 border-yellow-400 bg-yellow-500/10'
                      : 'text-slate-500 border-gray-700'
                  }`}
                  disabled={!hasPermission('job-applications.manage')}
                >
                  <Star size={18} fill="currentColor" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Send size={16} /> Email applicant
            </h4>
            <div className="space-y-3">
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                maxLength={160}
              />
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your message..."
                rows={5}
                className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Email will be sent to <span className="text-slate-300">{currentApplication.email || 'unknown'}</span>
                </p>
                {hasPermission('job-applications.manage') && (
                  <button
                    onClick={handleSendEmail}
                    disabled={
                      sendingEmail ||
                      !currentApplication.email ||
                      !emailSubject.trim() ||
                      !emailBody.trim()
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} /> {sendingEmail ? 'Sending...' : 'Send email'}
                  </button>
                )}
              </div>
              {emailNotice && (
                <p
                  className={`text-xs ${
                    emailNotice.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {emailNotice.message}
                </p>
              )}
              {!hasPermission('job-applications.manage') && (
                <p className="text-xs text-slate-500">
                  You need hiring permissions to send emails.
                </p>
              )}
            </div>
          </div>

          <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail size={16} /> Email history
            </h4>
            <div className="space-y-3 text-sm text-slate-300 max-h-60 overflow-y-auto pr-1">
              {!currentApplication.email_logs || currentApplication.email_logs.length === 0 ? (
                <p className="text-xs text-slate-500">No emails sent yet.</p>
              ) : (
                [...(currentApplication.email_logs || [])]
                  .slice()
                  .reverse()
                  .map((log, index) => (
                    <div key={`${log.sent_at}-${index}`} className="border border-gray-800 rounded-lg p-3">
                      <p className="text-white text-sm font-semibold">{log.subject}</p>
                      <p className="text-xs text-slate-500">{formatDate(log.sent_at)}</p>
                      <p className="text-xs text-slate-400 mt-2 whitespace-pre-wrap">
                        {log.body?.length > 280 ? `${log.body.slice(0, 280)}…` : log.body}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Notebook size={16} /> Internal notes
          </h4>
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Interview notes, reminders, follow-ups..."
            rows={4}
            className="w-full bg-[#0d0e0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
          />
          {hasPermission('job-applications.manage') && (
            <button
              onClick={handleNotesSave}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-colors"
            >
              Save notes
            </button>
          )}
        </div>

        <div className="bg-[#15170f] border border-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Clock3 size={16} /> Timeline
          </h4>
          <div className="space-y-4">
            {timeline.length === 0 && (
              <p className="text-sm text-slate-500">No updates yet.</p>
            )}
            {timeline.map((entry, index) => (
              <div key={`${entry.status}-${index}`} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5" />
                <div>
                  <p className="text-sm text-white">
                    {APPLICATION_STATUS_LABELS[entry.status as ApplicationStatus] ||
                      entry.status}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-slate-400">{entry.note}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {formatDate(entry.changed_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {hasPermission('job-applications.manage') && (
          <div className="flex justify-end">
            <button
              onClick={() => handleDelete(currentApplication)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500 text-rose-300 hover:bg-rose-500/10 transition-colors text-sm"
            >
              <Trash2 size={16} /> Delete application
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        {statusSummary.map((item) => (
          <div
            key={item.status}
            className="bg-[#15170f] border border-gray-800 rounded-xl p-4"
          >
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="text-2xl font-semibold text-white mt-1">
              {item.count}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants..."
            className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
        >
          <option value="all">All roles</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'all' | ApplicationStatus)
          }
          className="bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
        >
          <option value="all">All status</option>
          {statusOrder.map((status) => (
            <option key={status} value={status}>
              {APPLICATION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      <button
        onClick={refetchWithFilters}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors"
      >
        <RefreshCw size={16} /> Refresh
      </button>
    </div>

      {hasPermission('job-applications.manage') && (
        <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-white font-semibold">Bulk workflow center</h3>
              <p className="text-xs text-slate-500">
                Send 001, 002, and 003 workflow emails to multiple applicants at once.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchWorkflowBuckets}
                disabled={bulkWorkflowLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-700 text-xs text-slate-300 hover:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={14}
                  className={bulkWorkflowLoading ? 'animate-spin' : ''}
                />
                Refresh
              </button>
            </div>
          </div>
          {bulkWorkflowError && (
            <p className="text-xs text-rose-400">{bulkWorkflowError}</p>
          )}
          {bulkWorkflowMessage && (
            <p
              className={`text-xs ${
                bulkWorkflowMessage.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {bulkWorkflowMessage.text}
            </p>
          )}
          <div className="grid md:grid-cols-3 gap-4">
            {renderWorkflowBucket(
              '001',
              '001 • Shortlist',
              'New applicants awaiting shortlist confirmation.',
              workflowBuckets.shortlist
            )}
            {renderWorkflowBucket(
              '002',
              '002 • Documents',
              'Accepted shortlist candidates pending document upload.',
              workflowBuckets.documents
            )}
            {renderWorkflowBucket(
              '003',
              '003 • Offers',
              'Document-complete candidates awaiting offer letters.',
              workflowBuckets.offers
            )}
          </div>
        </div>
      )}

        <div className="grid xl:grid-cols-3 gap-6">
        <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-4 space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Applicants</h3>
            <span className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
          </div>
          <div className="space-y-3">
            {applications.length === 0 && !loading && (
              <p className="text-sm text-slate-500 text-center py-8">
                No applications found for the selected filters.
              </p>
            )}
            {applications.map(renderListItem)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={pagination.page <= 1}
              className="px-4 py-2 text-sm rounded-lg border border-gray-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPage((prev) =>
                  Math.min(prev + 1, pagination.totalPages || prev + 1)
                )
              }
              disabled={pagination.page >= (pagination.totalPages || 1)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

        <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-6 xl:col-span-1 space-y-6 max-h-[85vh] overflow-y-auto">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">New Hires</h3>
            <p className="text-xs text-slate-500 mb-4">
              Candidates who accepted their offer letters.
            </p>
            <div className="space-y-3">
              {hiredApplicants.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No accepted offers yet.</p>
              )}
              {hiredApplicants.map((hire) => (
                <div
                  key={hire.id}
                  className="border border-gray-800 rounded-xl p-3 bg-black/20 text-sm text-slate-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold">{hire.applicant_name}</p>
                      <p className="text-xs text-slate-400">{hire.email}</p>
                    </div>
                    <span className="text-xs text-emerald-300 uppercase">Hired</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    <p>{hire.job?.title || currentApplication?.job_title || 'Role not set'}</p>
                    <p>Accepted on {formatDate(hire.offer?.responded_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <AttendanceMonitor />
          {renderDetail()}
        </div>
      </div>
    </div>
  );
};

export default ApplicantManagement;
