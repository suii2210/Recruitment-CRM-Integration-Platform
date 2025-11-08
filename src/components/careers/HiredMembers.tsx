import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  MapPin,
  RefreshCw,
  UserCheck,
  FileText,
  Link as LinkIcon,
  Clock3,
  Mail,
  Building2,
  Briefcase,
  MessageCircle,
  Download,
} from 'lucide-react';
import { useApplicationStore } from '../../store/applicationStore';
import useAttendanceMonitorStore from '../../store/attendanceMonitorStore';

const formatDate = (value?: string) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString();
};

const formatTime = (value?: string) => {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatStatusLabel = (status?: string) => {
  const normalized = (status || 'pending').replace(/_/g, ' ').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getOfferStatusVariant = (status?: string) => {
  const normalized = (status || 'pending').toLowerCase();
  if (normalized === 'accepted') {
    return { text: 'text-emerald-300', badge: 'border-emerald-400 text-emerald-300' };
  }
  if (normalized === 'declined') {
    return { text: 'text-rose-300', badge: 'border-rose-400 text-rose-300' };
  }
  return { text: 'text-amber-300', badge: 'border-amber-400 text-amber-300' };
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

const HiredMembers: React.FC = () => {
  const hiredApplicants = useApplicationStore((state) => state.hiredApplicants);
  const loading = useApplicationStore((state) => state.loading);
  const fetchHiredApplicants = useApplicationStore((state) => state.fetchHiredApplicants);
  const { records: attendanceRecords, loading: attendanceLoading, fetchRecent } =
    useAttendanceMonitorStore();

  const [activeTab, setActiveTab] = useState<'hires' | 'attendance'>('hires');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHire, setSelectedHire] =
    useState<(typeof hiredApplicants)[number] | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const offerStatusVariant = getOfferStatusVariant(selectedHire?.offer?.response_status);
  const offerStatusLabel = formatStatusLabel(selectedHire?.offer?.response_status);

  useEffect(() => {
    fetchHiredApplicants();
  }, [fetchHiredApplicants]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchRecent(selectedDate || undefined);
    }
  }, [activeTab, selectedDate, fetchRecent]);

  useEffect(() => {
    if (!selectedHire && hiredApplicants.length > 0) {
      setSelectedHire(hiredApplicants[0]);
    }
  }, [hiredApplicants, selectedHire]);

  useEffect(() => {
    if (selectedHire && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedHire]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Team Members</h2>
          <p className="text-sm text-slate-400">
            Everyone who has accepted their offer and is ready for onboarding.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="bg-black/40 p-1 rounded-xl border border-gray-800 flex">
            {[
              { id: 'hires', label: 'Hires' },
              { id: 'attendance', label: 'Attendance' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'hires' | 'attendance')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'hires' ? (
            <button
              onClick={fetchHiredApplicants}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 transition-colors"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          ) : (
            <button
              onClick={() => fetchRecent(selectedDate || undefined)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 transition-colors"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          )}
        </div>
      </div>

      {activeTab === 'hires' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {hiredApplicants.length === 0 && !loading && (
            <div className="sm:col-span-2 xl:col-span-3 border border-dashed border-gray-700 rounded-2xl p-8 text-center text-slate-500">
              No hires yet. As soon as a candidate accepts their offer they will appear here.
            </div>
          )}
          {hiredApplicants.map((hire) => (
            <button
              key={hire.id}
              onClick={() => setSelectedHire(hire)}
              className={`text-left bg-[#15170f] border rounded-2xl p-5 flex flex-col gap-3 shadow-lg shadow-black/20 transition-colors ${
                selectedHire?.id === hire.id ? 'border-cyan-400' : 'border-gray-800 hover:border-cyan-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-lg font-semibold">{hire.applicant_name}</p>
                  <p className="text-xs text-slate-400">{hire.email}</p>
                </div>
                <span className="flex items-center gap-1 text-emerald-300 text-xs uppercase font-semibold">
                  <UserCheck size={14} /> Hired
                </span>
              </div>

              <div className="text-sm text-slate-300 space-y-2">
                <p className="font-medium text-white">{hire.job?.title || 'Role TBD'}</p>
                {hire.job?.location && (
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin size={14} /> {hire.job.location}
                  </p>
                )}
                <p className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar size={14} /> Accepted{' '}
                  {new Date(hire.offer?.responded_at || hire.created_at).toLocaleDateString()}
                </p>
                {hire.offer?.start_date && (
                  <p className="text-xs text-slate-400">
                    Start:{' '}
                    <span className="text-white">
                      {new Date(hire.offer.start_date).toLocaleDateString()}
                    </span>
                  </p>
                )}
                {hire.offer?.end_date && (
                  <p className="text-xs text-slate-400">
                    Ends:{' '}
                    <span className="text-white">
                      {new Date(hire.offer.end_date).toLocaleDateString()}
                    </span>
                  </p>
                )}
              </div>

              {hire.offer?.candidate_message && (
                <div className="bg-black/30 border border-gray-800 rounded-xl p-3 text-xs text-slate-400">
                  <p className="uppercase text-slate-500 tracking-wide mb-1">Candidate note</p>
                  <p className="text-slate-300">{hire.offer.candidate_message}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-white font-semibold text-lg">
              <Clock3 className="text-cyan-400" />
              Attendance monitor
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              Filter by date:
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1 text-slate-200 text-sm focus:border-cyan-400 focus:outline-none"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {attendanceLoading ? (
            <p className="text-sm text-slate-400">Loading attendance records...</p>
          ) : attendanceRecords.length === 0 ? (
            <p className="text-sm text-slate-500">
              {selectedDate
                ? `No check-ins recorded for ${new Date(selectedDate).toLocaleDateString()}.`
                : 'No recent check-ins recorded yet.'}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {attendanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-800 rounded-2xl p-4 bg-black/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold capitalize">
                        {record.applicant_name}
                      </p>
                      <p className="text-xs text-slate-400">{record.job_title || 'Intern'}</p>
                    </div>
                    {statusBadge(record.status)}
                  </div>
                  <div className="text-xs text-slate-400 space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <div>
                        <p className="uppercase text-slate-500 tracking-wide">Date</p>
                        <p className="text-white">{formatDate(record.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="uppercase text-slate-500 tracking-wide">Check-in</p>
                        <p className="text-white">{formatTime(record.check_in)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="uppercase text-slate-500 tracking-wide">Check-out</p>
                      <p className="text-white">{formatTime(record.check_out)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'hires' && selectedHire && (
        <div
          ref={detailRef}
          className="bg-[#0d0e0a] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl shadow-black/30"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase text-slate-500 tracking-wide mb-1">Selected hire</p>
              <h3 className="text-3xl font-semibold text-white">{selectedHire.applicant_name}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <p className="flex items-center gap-2 text-slate-400">
                  <Mail size={16} className="text-cyan-400" />
                  {selectedHire.email}
                </p>
                <span
                  className={`text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border ${offerStatusVariant.badge}`}
                >
                  {offerStatusLabel}
                </span>
              </div>
            </div>
            {selectedHire.resume_url && (
              <a
                href={selectedHire.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-800 text-sm text-cyan-300 hover:border-cyan-400 hover:text-white transition-colors"
              >
                <Download size={16} /> Download resume
              </a>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="bg-black/30 border border-gray-800 rounded-2xl p-4 space-y-3">
              <p className="uppercase text-xs text-slate-500 tracking-[0.2em]">Profile</p>
              <div className="space-y-2 text-sm text-slate-300">
                <p className="flex items-center gap-2 text-white">
                  <Briefcase size={16} className="text-cyan-400" />
                  {selectedHire.job?.title || 'Role TBD'}
                </p>
                {selectedHire.job?.department && (
                  <p className="flex items-center gap-2">
                    <Building2 size={16} className="text-cyan-400" />
                    {selectedHire.job.department}
                  </p>
                )}
                {selectedHire.job?.location && (
                  <p className="flex items-center gap-2">
                    <MapPin size={16} className="text-cyan-400" />
                    {selectedHire.job.location}
                  </p>
                )}
              </div>
              <div className="border-t border-gray-800 pt-3 text-xs text-slate-400 space-y-1">
                <p>
                  Offer status:{' '}
                  <span className={`capitalize ${offerStatusVariant.text}`}>{offerStatusLabel}</span>
                </p>
                {selectedHire.offer?.responded_at && (
                  <p>
                    {offerStatusLabel === 'Accepted' ? 'Accepted' : 'Responded'} on{' '}
                    {formatDate(selectedHire.offer.responded_at)}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-black/30 border border-gray-800 rounded-2xl p-4 space-y-4">
              <p className="uppercase text-xs text-slate-500 tracking-[0.2em]">
                Internship timeline
              </p>
              <div className="space-y-3 text-sm text-slate-300">
                <p className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar size={16} className="text-cyan-400" />
                    Start date
                  </span>
                  <span className="text-white">{formatDate(selectedHire.offer?.start_date)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock3 size={16} className="text-cyan-400" />
                    End date
                  </span>
                  <span className="text-white">{formatDate(selectedHire.offer?.end_date)}</span>
                </p>
              </div>
              {selectedHire.offer?.candidate_message && (
                <div className="bg-[#15170f] border border-gray-800 rounded-xl p-3 text-xs text-slate-300">
                  <p className="flex items-center gap-2 text-slate-400 uppercase tracking-wide mb-2">
                    <MessageCircle size={14} className="text-cyan-400" />
                    Candidate message
                  </p>
                  <p>{selectedHire.offer.candidate_message}</p>
                </div>
              )}
            </div>

            <div className="bg-black/30 border border-gray-800 rounded-2xl p-4 space-y-3">
              <p className="uppercase text-xs text-slate-500 tracking-[0.2em]">
                Uploaded documents
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(selectedHire.document_uploads || []).length === 0 && (
                  <p className="text-sm text-slate-500">No documents submitted yet.</p>
                )}
                {(selectedHire.document_uploads || []).map((doc, index) => (
                  <a
                    key={`${doc.filename || index}-${index}`}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 px-3 py-2 border border-gray-800 rounded-xl text-sm text-cyan-300 hover:text-cyan-100 hover:border-cyan-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={16} />
                      {doc.label || doc.filename || `Document ${index + 1}`}
                    </span>
                    <LinkIcon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiredMembers;
