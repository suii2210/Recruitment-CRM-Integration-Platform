import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import JobApplication, { APPLICATION_STATUSES } from '../models/JobApplication.js';
import Job from '../models/Job.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { isEmailConfigured, sendApplicantEmail } from '../utils/emailService.js';
import { ensureCandidateAccount } from '../utils/candidateAccount.js';
import Attendance from '../models/Attendance.js';
import { generateOfferLetterBuffer } from '../utils/offerLetterGenerator.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '../../uploads');
const offerLetterDir = path.join(uploadsRoot, 'offer-letters');
if (!fs.existsSync(offerLetterDir)) {
  fs.mkdirSync(offerLetterDir, { recursive: true });
}

const buildCandidatePortalBase = (req) => {
  const base =
    process.env.CANDIDATE_PORTAL_BASE_URL ||
    `${req.protocol}://${req.get('host')}/api/public/applications`;
  return base.replace(/\/$/, '');
};

const ensureAbsoluteUrl = (value, req) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z]+:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const protocol =
    trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')
      ? 'http'
      : req?.protocol || 'https';
  const sanitized = trimmed.replace(/^\/+/, '');
  return `${protocol}://${sanitized}`;
};

const buildCandidateDashboardUrl = (req) => {
  const explicit = ensureAbsoluteUrl(process.env.CANDIDATE_DASHBOARD_URL, req);
  if (explicit) return explicit;

  const derived = ensureAbsoluteUrl(
    process.env.CANDIDATE_PORTAL_BASE_URL?.replace(/\/api\/public\/applications$/, ''),
    req
  );
  if (derived) return derived;

  return `${req.protocol}://${req.get('host')}/candidate`;
};

const resolveUploadAttachment = (relativePath) => {
  if (!relativePath || typeof relativePath !== 'string') return null;
  const sanitized = relativePath.replace(/^\/*/, '');
  const absolutePath = path.join(__dirname, '../../', sanitized);
  if (!absolutePath.startsWith(uploadsRoot)) {
    throw new Error('Attachment must be within the uploads directory');
  }
  if (!fs.existsSync(absolutePath)) {
    throw new Error('Attachment file not found on server');
  }
  const stats = fs.statSync(absolutePath);
  const normalizedRelative = `/${path
    .relative(path.join(__dirname, '../../'), absolutePath)
    .replace(/\\/g, '/')}`;
  return {
    filename: path.basename(absolutePath),
    path: absolutePath,
    relativePath: normalizedRelative,
    size: stats.size,
  };
};

const appendEmailLog = (application, { subject, body, userId }) => {
  const entry = {
    subject,
    body,
    sent_by: userId,
    recipient: application.email,
    sent_at: new Date(),
  };
  application.email_logs = application.email_logs || [];
  application.email_logs.push(entry);
  return entry;
};

const appendTimeline = (application, note, userId) => {
  application.timeline = application.timeline || [];
  application.timeline.push({
    status: application.status,
    note,
    changed_by: userId,
    changed_at: new Date(),
  });
};

const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const workflowPopulateFields = [
  {
    path: 'job',
    select: 'title slug status department location employment_type',
  },
  { path: 'processed_by', select: 'name email' },
  { path: 'offer.user', select: 'name email role status' },
];

const safeSlug = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'offer-letter';

const formatDisplayDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const monthsBetween = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate
  ) {
    return null;
  }
  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  if (endDate.getDate() < startDate.getDate()) {
    months -= 1;
  }
  if (months <= 0) {
    months = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  }
  return months > 0 ? months : 1;
};

const computeDurationLabel = (application, override) => {
  if (override && override.toString().trim()) {
    return override.toString().trim();
  }
  const metaDuration =
    application.meta?.duration ||
    application.meta?.internship_duration ||
    application.meta?.offer_duration;
  if (typeof metaDuration === 'string' && metaDuration.trim()) {
    return metaDuration.trim();
  }
  if (application.offer?.start_date && application.offer?.end_date) {
    const months = monthsBetween(application.offer.start_date, application.offer.end_date);
    if (months) {
      return `${months} Month${months === 1 ? '' : 's'}`;
    }
  }
  if (
    application.job?.employment_type === 'internship' ||
    application.job?.employment_type === 'unpaid'
  ) {
    return '3 Months Internship';
  }
  return '3 Months';
};

const buildOfferLetterTemplateData = (application, overrides = {}) => ({
  name: (overrides.name || application.applicant_name || 'Candidate').toString().trim(),
  role: (
    overrides.role ||
    application.job_title ||
    application.job?.title ||
    'Team Member'
  )
    .toString()
    .trim(),
  duration: computeDurationLabel(application, overrides.duration),
  date: formatDisplayDate(overrides.date || overrides.offerDate || new Date()),
});

const autoGenerateOfferLetterFile = async (application, options = {}) => {
  const templateData = buildOfferLetterTemplateData(application, options.dataOverrides);

  const buffer = await generateOfferLetterBuffer(templateData);
  const extension = '.pdf';
  const filename = `${safeSlug(
    `${application.applicant_name || 'candidate'}-${application.job_title || 'offer'}`
  )}-${Date.now()}${extension}`;
  const absolutePath = path.join(offerLetterDir, filename);
  fs.writeFileSync(absolutePath, buffer);

  return {
    absolutePath,
    relativePath: `/uploads/offer-letters/${filename}`,
    filename,
    format: 'pdf',
    size: buffer.length,
    templateData,
    warning: null,
  };
};

const normalizeAutoOfferOptions = (input) => {
  if (!input) return null;
  if (input === true) {
    return { enabled: true, format: 'pdf' };
  }
  if (typeof input === 'object') {
    const normalized = {
      enabled: input.enabled !== false,
      format: (input.format || 'pdf').toLowerCase(),
    };
    if (!['pdf', 'pptx'].includes(normalized.format)) {
      normalized.format = 'pdf';
    }
    const overrides = { ...(input.dataOverrides || {}) };
    ['name', 'role', 'duration', 'date', 'offerDate'].forEach((key) => {
      if (input[key]) {
        overrides[key === 'offerDate' ? 'date' : key] = input[key];
      }
    });
    if (Object.keys(overrides).length) {
      normalized.dataOverrides = overrides;
    }
    return normalized;
  }
  return null;
};

const dispatchWorkflowEmail = async ({
  application,
  templateCode,
  recruiterNote,
  baseUrl,
  candidateDashboardUrl,
  offerLetterPath,
  user,
  autoOfferOptions = null,
  populateAfterSave = true,
}) => {
  if (!application) {
    throw createHttpError('Application not found.', 404);
  }
  if (!application.email) {
    throw createHttpError('Applicant does not have an email address on file.');
  }

  const normalizedAutoOffer =
    templateCode === '003' ? normalizeAutoOfferOptions(autoOfferOptions) : null;

  const now = new Date();
  const jobTitle = application.job_title || application.job?.title || 'the position';
  const firstName = application.applicant_name?.split(' ')[0] || 'there';
  const trimmedNote = recruiterNote?.toString().trim();
  const noteBlock = trimmedNote ? `<p>${trimmedNote.replace(/\n/g, '<br/>')}</p>` : '';

  let subject = '';
  let html = '';
  const attachments = [];
  let offerAttachmentInfo = null;

  if (templateCode === '001') {
    const token = crypto.randomBytes(32).toString('hex');
    const acceptUrl = `${baseUrl}/respond/${token}/accept`;
    const declineUrl = `${baseUrl}/respond/${token}/decline`;

    application.shortlist = {
      token,
      sent_at: now,
      response_status: 'pending',
    };
    application.onboarding_status = 'shortlisted';
    application.status = 'shortlisted';

    subject = `001 | Shortlisted for ${jobTitle}`;
    html = `
      <p>Hi ${firstName},</p>
      <p>Great news! You have been shortlisted for <strong>${jobTitle}</strong>.</p>
      <p>Please confirm if you would like to continue with the next steps:</p>
      <p>
        <a href="${acceptUrl}">✅ Yes, I would like to continue</a><br/>
        <a href="${declineUrl}">❌ No, I am not available</a>
      </p>
      ${noteBlock}
      <p>Kind regards,<br/>${user?.name || 'HR Team'}</p>
    `;

    appendTimeline(application, 'Sent 001 shortlist email to candidate.', user?._id);
  } else if (templateCode === '002') {
    if (!application.shortlist || application.shortlist.response_status !== 'accepted') {
      throw createHttpError(
        'Cannot send 002 email until the applicant accepts the shortlist invitation.'
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const uploadUrl = `${baseUrl}/documents/${token}`;

    application.document_request = {
      token,
      sent_at: now,
      completed_at: application.document_request?.completed_at || null,
    };
    application.onboarding_status = 'documents-requested';
    application.status = application.status === 'offered' ? application.status : 'in_review';

    subject = `002 | Documents required for ${jobTitle}`;
    html = `
      <p>Hi ${firstName},</p>
      <p>Thank you for confirming your interest in <strong>${jobTitle}</strong>.</p>
      <p>Please upload the requested identification documents (Aadhaar, passport, etc.) using the secure link below:</p>
      <p><a href="${uploadUrl}">Upload documents</a></p>
      ${noteBlock}
      <p>Let us know if you have any questions.<br/>${user?.name || 'HR Team'}</p>
    `;

    appendTimeline(application, 'Sent 002 document request email to candidate.', user?._id);
  } else if (templateCode === '003') {
    if (!application.document_request || !application.document_request.completed_at) {
      throw createHttpError('Cannot send 003 email until the applicant uploads their documents.');
    }
    if (application.offer?.response_status === 'accepted') {
      throw createHttpError('Offer has already been accepted by the candidate.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const offerPageUrl = `${baseUrl}/offer/${token}`;
    const acceptUrl = `${baseUrl}/offer/${token}/accept`;
    const declineUrl = `${baseUrl}/offer/${token}/decline`;

    const { password: candidatePassword } = await ensureCandidateAccount(application);
    const loginUrl =
      candidateDashboardUrl ||
      process.env.CANDIDATE_DASHBOARD_URL ||
      process.env.CANDIDATE_PORTAL_BASE_URL?.replace(/\/api\/public\/applications$/, '');

    application.offer = application.offer || {};
    application.offer.token = token;
    application.offer.sent_at = now;
    application.offer.response_status = 'pending';
    application.onboarding_status = 'offer-sent';
    application.status = 'offered';

    const letterPageUrl = offerPageUrl;
    let offerLetterBlock = '';
    const shouldAutoGenerate = normalizedAutoOffer?.enabled !== false;

    if (offerLetterPath) {
      try {
        const attachment = resolveUploadAttachment(offerLetterPath);
        offerAttachmentInfo = {
          relativePath: attachment.relativePath,
          filename: attachment.filename,
          autoGenerated: false,
          format: path.extname(attachment.filename)?.replace('.', '') || 'pptx',
          size: attachment.size,
        };
      } catch (attachmentError) {
        throw createHttpError(
          attachmentError?.message || 'Failed to attach the selected offer letter.'
        );
      }
    } else if (shouldAutoGenerate) {
      const generated = await autoGenerateOfferLetterFile(application, normalizedAutoOffer || {});
      offerAttachmentInfo = {
        relativePath: generated.relativePath,
        filename: generated.filename,
        autoGenerated: true,
        format: generated.format,
        warning: generated.warning,
        size: generated.size,
      };
    } else {
      throw createHttpError(
        'No offer letter file provided. Upload a letter or enable auto-generation before sending 003.'
      );
    }

    if (!offerAttachmentInfo?.relativePath) {
      throw createHttpError('Unable to prepare the offer letter file.');
    }

    application.offer.letter = {
      filename: offerAttachmentInfo.filename,
      path: offerAttachmentInfo.relativePath,
      format: offerAttachmentInfo.format,
      size: offerAttachmentInfo.size,
    };
    application.markModified('offer');

    offerLetterBlock = `
      <div style="margin:16px 0;padding:12px;border-left:4px solid #2563eb;background:#eff6ff;">
        <p style="margin:0 0 8px 0;">Your offer letter is ready. Open the secure page below to download the document and submit your decision.</p>
        <p style="margin:0;">
          <a href="${letterPageUrl}" style="color:#2563eb;font-weight:600;" target="_blank" rel="noopener">
            Review offer & download letter
          </a>
        </p>
      </div>`;

    const credentialsBlock = candidatePassword
      ? `
        <div style="margin-top:16px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
          <p style="margin:0 0 4px 0;font-weight:600;color:#0f172a;">Dashboard access</p>
          <p style="margin:0;color:#0f172a;font-size:14px;">
            Username: <strong>${application.email}</strong><br/>
            Password: <strong>${candidatePassword}</strong><br/>
            Dashboard: <a href="${loginUrl || '#'}" style="color:#2563eb;">${loginUrl}</a>
          </p>
        </div>`
      : '';

    subject = `003 | Offer letter for ${jobTitle}`;
    html = `
      <p>Hi ${firstName},</p>
      <p>We are pleased to extend you an offer for <strong>${jobTitle}</strong>.</p>
      ${offerLetterBlock}
      <p>Please review all details and let us know your decision using the secure page above.</p>
      ${noteBlock}
      ${credentialsBlock}
      <p>We look forward to having you on the team!<br/>${user?.name || 'HR Team'}</p>
    `;

    appendTimeline(application, 'Sent 003 offer email to candidate.', user?._id);
  } else {
    throw new Error('Unsupported workflow template. Use 001, 002, or 003.');
  }

  const plainText = html.replace(/<[^>]*>/g, ' ');
  const emailPayload = {
    to: application.email,
    subject,
    html,
    text: plainText,
  };
  if (attachments.length) {
    emailPayload.attachments = attachments;
  }

  await sendApplicantEmail(emailPayload);

  const emailEntry = appendEmailLog(application, {
    subject,
    body: plainText,
    userId: user?._id,
  });

  application.processed_by = user?._id;
  await application.save();

  if (populateAfterSave) {
    await application.populate(workflowPopulateFields);
  }

  return { application, emailEntry, offerAttachment: offerAttachmentInfo };
};

const sendWorkflowEmailById = async ({
  applicationId,
  templateCode,
  recruiterNote,
  baseUrl,
  candidateDashboardUrl,
  offerLetterPath,
  user,
  autoOfferOptions,
  populateAfterSave = true,
}) => {
  if (!validateObjectId(applicationId)) {
    throw createHttpError('Invalid application ID.', 400);
  }

  const application = await JobApplication.findById(applicationId)
    .populate('job', 'title slug status department location employment_type')
    .populate('processed_by', 'name email')
    .populate('offer.user', 'name email role status');

  if (!application) {
    throw createHttpError('Application not found.', 404);
  }

  return dispatchWorkflowEmail({
    application,
    templateCode,
    recruiterNote,
    baseUrl,
    candidateDashboardUrl,
    offerLetterPath,
    user,
    autoOfferOptions,
    populateAfterSave,
  });
};


const offerLetterStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, offerLetterDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9.\-_]+/gi, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const allowedOfferExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

const offerLetterUpload = multer({
  storage: offerLetterStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedOfferExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOC, DOCX, JPG, or PNG.'));
    }
  },
});

const parseTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((tag) => (typeof tag === 'string' ? tag.trim() : tag))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/,|\r?\n/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const buildDateRange = (start, end) => {
  if (!start && !end) return undefined;
  const range = {};
  if (start) range.$gte = new Date(start);
  if (end) {
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    range.$lte = endDate;
  }
  return range;
};

router.get(
  '/',
  authenticate,
  authorize(['job-applications.view']),
  async (req, res) => {
    try {
      const {
        jobId,
        status,
        search,
        page = 1,
        limit = 20,
        startDate,
        endDate,
      } = req.query;

      const filter = {};

      if (jobId) {
        if (!validateObjectId(jobId)) {
          return res.status(400).json({ message: 'Invalid job ID provided.' });
        }
        filter.job = new mongoose.Types.ObjectId(jobId);
      }

      if (status && status !== 'all') {
        if (!APPLICATION_STATUSES.includes(status)) {
          return res
            .status(400)
            .json({ message: 'Unsupported application status filter.' });
        }
        filter.status = status;
      }

      const dateRange = buildDateRange(startDate, endDate);
      if (dateRange) {
        filter.created_at = dateRange;
      }

      if (search && typeof search === 'string') {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { applicant_name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { job_title: searchRegex },
          { tags: searchRegex },
        ];
      }

      const safePage = Math.max(parseInt(page, 10) || 1, 1);
      const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const skip = (safePage - 1) * safeLimit;

      const matchFilter = { ...filter };

      const [applications, total, statusStats, jobStatsRaw] = await Promise.all(
        [
          JobApplication.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(safeLimit)
            .populate('job', 'title slug status department location employment_type')
            .populate('processed_by', 'name email')
            .populate('offer.user', 'name email role status'),
          JobApplication.countDocuments(filter),
          JobApplication.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
          JobApplication.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$job', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ]),
        ]
      );

      let jobStats = [];
      if (jobStatsRaw.length) {
        const jobIds = jobStatsRaw
          .map((item) => item._id)
          .filter((id) => id && validateObjectId(id));
        const relatedJobs = await Job.find({ _id: { $in: jobIds } }).select(
          'title slug status department location employment_type'
        );
        const jobMap = new Map(
          relatedJobs.map((job) => [job._id.toString(), job])
        );
        jobStats = jobStatsRaw.map((stat) => ({
          job: jobMap.get(stat._id?.toString()) || null,
          count: stat.count,
        }));
      }

      const statsByStatus = statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      res.json({
        applications,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit) || 1,
        },
        stats: {
          byStatus: statsByStatus,
          byJob: jobStats,
        },
      });
    } catch (error) {
      console.error('Error fetching job applications:', error);
      res.status(500).json({
        message: 'Failed to fetch job applications',
        error: error.message,
      });
    }
  }
);

// NOTE: Route for fetching application by ID is defined near the bottom of this file

router.patch(
  '/:id',
  authenticate,
  authorize(['job-applications.manage']),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid application ID.' });
      }

      const allowedFields = [
        'status',
        'internal_notes',
        'tags',
        'rating',
        'resume_url',
        'cover_letter',
        'experience_years',
        'expected_salary',
        'notice_period',
        'attachments',
      ];

      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (updates.tags) {
        updates.tags = parseTags(updates.tags);
      }

      if (updates.status && !APPLICATION_STATUSES.includes(updates.status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
      }

      const application = await JobApplication.findById(id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found.' });
      }

      const statusChanged =
        updates.status && updates.status !== application.status;

      Object.assign(application, updates);

      if (statusChanged) {
        application.timeline.push({
          status: updates.status,
          note:
            req.body.status_note ||
            `Status updated to ${(updates.status || '').replace('_', ' ')}`,
          changed_by: req.user?._id,
          changed_at: new Date(),
        });
        application.processed_by = req.user?._id;
      }

      if (req.body.note && typeof req.body.note === 'string') {
        application.timeline.push({
          status: application.status,
          note: req.body.note.trim(),
          changed_by: req.user?._id,
          changed_at: new Date(),
        });
      }

      await application.save();
      await application.populate([
        {
          path: 'job',
          select: 'title slug status department location employment_type',
        },
        { path: 'processed_by', select: 'name email' },
        { path: 'offer.user', select: 'name email role status' },
      ]);

      res.json(application);
    } catch (error) {
      console.error('Error updating job application:', error);
      res.status(500).json({
        message: 'Failed to update job application',
        error: error.message,
      });
    }
  }
);

router.get(
  '/hired/list',
  authenticate,
  authorize(['job-applications.view']),
  async (_req, res) => {
    try {
      const hires = await JobApplication.find({
        'offer.response_status': 'accepted',
      })
        .sort({ 'offer.responded_at': -1 })
        .populate('job', 'title department location employment_type')
        .populate('offer.user', 'name email role status');

      res.json({
        hires: hires.map((application) => ({
          id: application._id,
          applicant_name: application.applicant_name,
          email: application.email,
          phone: application.phone,
          job: application.job,
          offer: {
            responded_at: application.offer?.responded_at,
            candidate_message: application.offer?.candidate_message,
            user: application.offer?.user,
            start_date: application.offer?.start_date,
            end_date: application.offer?.end_date,
            response_status: application.offer?.response_status || 'pending',
          },
          document_uploads: application.document_uploads || [],
          onboarding_status: application.onboarding_status,
          resume_url: application.resume_url,
        })),
      });
    } catch (error) {
      console.error('Error fetching hired applicants:', error);
      res.status(500).json({ message: 'Failed to fetch hired applicants' });
    }
  }
);

router.get(
  '/workflow/buckets',
  authenticate,
  authorize(['job-applications.manage']),
  async (_req, res) => {
    try {
      const limit = 200;

      const shortlistPromise = JobApplication.find({
        email: { $exists: true, $ne: null },
        $or: [
          { 'shortlist.sent_at': { $exists: false } },
          { 'shortlist.sent_at': null },
        ],
        status: { $in: ['new', 'in_review'] },
      })
        .select(
          'applicant_name email job_title status shortlist document_request offer onboarding_status created_at'
        )
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      const documentsPromise = JobApplication.find({
        email: { $exists: true, $ne: null },
        'shortlist.response_status': 'accepted',
        $or: [
          { 'document_request.completed_at': { $exists: false } },
          { 'document_request.completed_at': null },
        ],
      })
        .select(
          'applicant_name email job_title status shortlist document_request offer onboarding_status created_at'
        )
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      const offersPromise = JobApplication.find({
        email: { $exists: true, $ne: null },
        'document_request.completed_at': { $ne: null },
        $or: [
          { 'offer.response_status': { $exists: false } },
          { 'offer.response_status': null },
          { 'offer.response_status': 'pending' },
        ],
      })
        .select(
          'applicant_name email job_title status shortlist document_request offer onboarding_status created_at'
        )
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();

      const [shortlist, documents, offers] = await Promise.all([
        shortlistPromise,
        documentsPromise,
        offersPromise,
      ]);

      const mapBucket = (items) =>
        items.map((application) => ({
          id: application._id?.toString?.() || application._id,
          applicant_name: application.applicant_name,
          email: application.email,
          job_title: application.job_title,
          status: application.status,
          shortlist: application.shortlist || null,
          document_request: application.document_request || null,
          offer: application.offer || null,
          onboarding_status: application.onboarding_status,
          created_at: application.created_at,
        }));

      res.json({
        shortlist: mapBucket(shortlist),
        documents: mapBucket(documents),
        offers: mapBucket(offers),
      });
    } catch (error) {
      console.error('Error fetching workflow buckets:', error);
      res.status(500).json({ message: 'Failed to fetch workflow buckets' });
    }
  }
);

const formatNotification = (payload) => ({
  id: payload.id,
  type: payload.type,
  applicant_name: payload.applicant_name,
  email: payload.email,
  job_title: payload.job_title,
  timestamp: payload.timestamp,
  message: payload.message,
  meta: {
    ...(payload.meta || {}),
    applicationId:
      payload.applicationId?.toString?.() ||
      payload.applicationId ||
      payload.meta?.applicationId ||
      null,
  },
});

router.get(
  '/notifications',
  authenticate,
  authorize(['job-applications.view']),
  async (_req, res) => {
    try {
      const applications = await JobApplication.find({
        $or: [
          { 'shortlist.response_status': { $in: ['accepted', 'declined'] } },
          { 'document_request.completed_at': { $ne: null } },
          { 'document_uploads.0': { $exists: true } },
          { 'offer.response_status': { $in: ['accepted', 'declined'] } },
        ],
      })
        .select(
          'applicant_name email job_title shortlist document_request document_uploads offer'
        )
        .lean();

      const notifications = [];

      applications.forEach((application) => {
        if (
          application.shortlist?.response_status &&
          application.shortlist.response_status !== 'pending' &&
          application.shortlist.responded_at
        ) {
          notifications.push(
            formatNotification({
              id: `${application._id}-shortlist`,
              type:
                application.shortlist.response_status === 'accepted'
                  ? 'shortlist.accepted'
                  : 'shortlist.declined',
              applicant_name: application.applicant_name,
              email: application.email,
              job_title: application.job_title,
              timestamp: application.shortlist.responded_at,
              applicationId: application._id,
              message:
                application.shortlist.response_status === 'accepted'
                  ? `${application.applicant_name} accepted the shortlist invitation`
                  : `${application.applicant_name} declined the shortlist invitation`,
            })
          );
        }

        if (application.document_request?.completed_at) {
          notifications.push(
            formatNotification({
              id: `${application._id}-documents`,
              type: 'documents.completed',
              applicant_name: application.applicant_name,
              email: application.email,
              job_title: application.job_title,
              timestamp: application.document_request.completed_at,
              applicationId: application._id,
              message: `${application.applicant_name} submitted their documents`,
            })
          );
        }

        if (Array.isArray(application.document_uploads)) {
          application.document_uploads.forEach((doc, index) => {
            notifications.push(
              formatNotification({
                id: `${application._id}-doc-${index}`,
                type: 'documents.uploaded',
                applicant_name: application.applicant_name,
                email: application.email,
                job_title: application.job_title,
                timestamp: doc.uploaded_at || application.document_request?.completed_at,
                applicationId: application._id,
                message: `${application.applicant_name} uploaded ${doc.label || doc.filename}`,
                meta: { url: doc.url },
              })
            );
          });
        }

        if (
          application.offer?.response_status &&
          application.offer.response_status !== 'pending' &&
          application.offer.responded_at
        ) {
          notifications.push(
            formatNotification({
              id: `${application._id}-offer`,
              type:
                application.offer.response_status === 'accepted'
                  ? 'offer.accepted'
                  : 'offer.declined',
              applicant_name: application.applicant_name,
              email: application.email,
              job_title: application.job_title,
              timestamp: application.offer.responded_at,
              applicationId: application._id,
              message:
                application.offer.response_status === 'accepted'
                  ? `${application.applicant_name} accepted the offer`
                  : `${application.applicant_name} declined the offer`,
            })
          );
        }

        if (application.offer?.end_date) {
          const endDate = new Date(application.offer.end_date);
          const now = new Date();
          const soonWindow = new Date();
          soonWindow.setDate(soonWindow.getDate() + 7);

          if (endDate <= soonWindow && endDate >= now) {
            notifications.push(
              formatNotification({
                id: `${application._id}-internship-end`,
                type: 'internship.endingSoon',
                applicant_name: application.applicant_name,
                email: application.email,
                job_title: application.job_title,
                timestamp: endDate,
                applicationId: application._id,
                message: `${application.applicant_name}'s internship ends on ${endDate.toLocaleDateString()}`,
              })
            );
          }
        }
      });

      const attendanceWindow = new Date();
      attendanceWindow.setDate(attendanceWindow.getDate() - 7);
      const attendanceRecords = await Attendance.find({
        $or: [
          { check_in: { $gte: attendanceWindow } },
          { check_out: { $gte: attendanceWindow } },
        ],
      })
        .populate('application', 'applicant_name email job_title')
        .lean();

      attendanceRecords.forEach((record) => {
        const application = record.application;
        if (!application) return;

        if (record.check_in) {
          notifications.push(
            formatNotification({
              id: `${record._id}-checkin`,
              type: 'attendance.checkIn',
              applicant_name: application.applicant_name || 'Candidate',
              email: application.email,
              job_title: application.job_title,
              timestamp: record.check_in,
              message: `${application.applicant_name || 'Candidate'} checked in at ${new Date(
                record.check_in
              ).toLocaleTimeString()}`,
              meta: { applicationId: application._id, attendanceId: record._id },
            })
          );
        }

        if (record.check_out) {
          notifications.push(
            formatNotification({
              id: `${record._id}-checkout`,
              type: 'attendance.checkOut',
              applicant_name: application.applicant_name || 'Candidate',
              email: application.email,
              job_title: application.job_title,
              timestamp: record.check_out,
              message: `${application.applicant_name || 'Candidate'} checked out at ${new Date(
                record.check_out
              ).toLocaleTimeString()}`,
              meta: { applicationId: application._id, attendanceId: record._id },
            })
          );
        }
      });

      const sorted = notifications
        .filter((item) => item.timestamp)
        .sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 30);

      res.json({ notifications: sorted });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  }
);

router.get(
  '/:id',
  authenticate,
  authorize(['job-applications.view']),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid application ID.' });
      }

      const application = await JobApplication.findById(id)
        .populate('job', 'title slug status department location employment_type')
        .populate('processed_by', 'name email')
        .populate('offer.user', 'name email role status');

      if (!application) {
        return res.status(404).json({ message: 'Application not found.' });
      }

      res.json(application);
    } catch (error) {
      console.error('Error fetching job application:', error);
      res.status(500).json({
        message: 'Failed to fetch job application',
        error: error.message,
      });
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  authorize(['job-applications.manage']),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid application ID.' });
      }

      const deleted = await JobApplication.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Application not found.' });
      }

      res.json({ message: 'Application deleted successfully.' });
    } catch (error) {
      console.error('Error deleting job application:', error);
      res.status(500).json({
        message: 'Failed to delete job application',
        error: error.message,
      });
    }
  }
);

router.post(
  '/:id/offer-letter/upload',
  authenticate,
  authorize(['job-applications.manage']),
  offerLetterUpload.single('offerLetter'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No offer letter uploaded.' });
      }

      const { id } = req.params;
      if (!validateObjectId(id)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Invalid application ID.' });
      }

      const relativePath = `/uploads/offer-letters/${req.file.filename}`;

      res.json({
        message: 'Offer letter uploaded successfully.',
        path: relativePath,
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (error) {
      console.error('Offer letter upload error:', error);
      res.status(500).json({ message: 'Failed to upload offer letter', error: error.message });
    }
  }
);

router.post(
  '/:id/offer-letter/generate',
  authenticate,
  authorize(['job-applications.manage']),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid application ID.' });
      }

      const { format = 'pdf', overrides = {} } = req.body || {};
      const application = await JobApplication.findById(id).populate(
        'job',
        'title department location employment_type'
      );
      if (!application) {
        return res.status(404).json({ message: 'Application not found.' });
      }

      const dataOverrides = { ...(overrides || {}) };
      ['name', 'role', 'duration', 'date'].forEach((key) => {
        if (req.body?.[key]) {
          dataOverrides[key] = req.body[key];
        }
      });

      const generated = await autoGenerateOfferLetterFile(application, {
        format,
        dataOverrides,
      });

      res.json({
        message: `Offer letter generated as ${generated.format.toUpperCase()}`,
        path: generated.relativePath,
        filename: generated.filename,
        format: generated.format,
        size: generated.size,
        templateData: generated.templateData,
        warning: generated.warning,
      });
    } catch (error) {
      console.error('Offer letter generate error:', error);
      res.status(500).json({
        message: 'Failed to generate offer letter',
        error: error.message,
      });
    }
  }
);

router.post(
  '/:id/workflow-email',
  authenticate,
  authorize(['job-applications.manage']),
  async (req, res) => {
    try {
      if (!isEmailConfigured()) {
        return res.status(500).json({
          message:
            'Email service is not configured. Please set SMTP_* environment variables.',
        });
      }

      const { id } = req.params;
      if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid application ID.' });
      }

      const { template, note, offerLetterPath, autoGenerateOffer } = req.body || {};
      const templateCode = (template || '').toString().trim();

      if (!['001', '002', '003'].includes(templateCode)) {
        return res.status(400).json({
          message: 'Unsupported workflow template. Use 001, 002, or 003.',
        });
      }

      const baseUrl = buildCandidatePortalBase(req);
      const candidateDashboardUrl = buildCandidateDashboardUrl(req);

      const result = await sendWorkflowEmailById({
        applicationId: id,
        templateCode,
        recruiterNote: note,
        baseUrl,
        candidateDashboardUrl,
        offerLetterPath,
        user: req.user,
        autoOfferOptions: templateCode === '003' ? autoGenerateOffer : null,
        populateAfterSave: true,
      });

      res.json({
        message: `Workflow email ${templateCode} sent successfully.`,
        email: result.emailEntry,
        application: result.application,
        offerAttachment: result.offerAttachment,
      });
    } catch (error) {
      console.error('Error sending workflow email:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        message: status >= 500 ? 'Failed to send workflow email' : error.message,
        error: error.message,
      });
    }
  }
);

router.post(
  '/workflow-email/batch',
  authenticate,
  authorize(['job-applications.manage']),
  async (req, res) => {
    try {
      if (!isEmailConfigured()) {
        return res.status(500).json({
          message:
            'Email service is not configured. Please set SMTP_* environment variables.',
        });
      }

      const { template, applicationIds, note, offerLetterPath, autoGenerateOffer } =
        req.body || {};
      const templateCode = (template || '').toString().trim();

      if (!['001', '002', '003'].includes(templateCode)) {
        return res.status(400).json({
          message: 'Unsupported workflow template. Use 001, 002, or 003.',
        });
      }

      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        return res
          .status(400)
          .json({ message: 'Please select at least one applicant.' });
      }

      if (templateCode === '003' && offerLetterPath) {
        return res.status(400).json({
          message:
            'Batch offer letters must be auto-generated. Remove the uploaded file selection and try again.',
        });
      }

      const baseUrl = buildCandidatePortalBase(req);
      const candidateDashboardUrl = buildCandidateDashboardUrl(req);

      const seen = new Set();
      const invalid = [];
      const queue = [];

      applicationIds.forEach((raw) => {
        const id = (raw || '').toString().trim();
        if (!id || seen.has(id)) return;
        seen.add(id);
        if (!validateObjectId(id)) {
          invalid.push({ applicationId: id, status: 'failed', error: 'Invalid application ID.' });
        } else {
          queue.push(id);
        }
      });

      if (queue.length === 0) {
        return res.status(400).json({
          message: 'Please select at least one valid applicant.',
          results: invalid,
        });
      }

      if (queue.length > 200) {
        return res.status(400).json({
          message: 'Please process at most 200 applicants at a time.',
        });
      }

      const results = [...invalid];
      for (const applicationId of queue) {
        try {
          await sendWorkflowEmailById({
            applicationId,
            templateCode,
            recruiterNote: note,
            baseUrl,
            candidateDashboardUrl,
            offerLetterPath: templateCode === '003' ? null : offerLetterPath,
            user: req.user,
            autoOfferOptions: templateCode === '003' ? autoGenerateOffer ?? true : null,
            populateAfterSave: false,
          });
          results.push({ applicationId, status: 'sent' });
        } catch (error) {
          results.push({
            applicationId,
            status: 'failed',
            error: error.message,
          });
        }
      }

      const sentCount = results.filter((item) => item.status === 'sent').length;
      res.json({
        message: `Processed ${sentCount} of ${results.length} workflow emails.`,
        results,
      });
    } catch (error) {
      console.error('Error sending batch workflow emails:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        message:
          status >= 500
            ? 'Failed to process batch workflow email'
            : error.message,
        error: error.message,
      });
    }
  }
);

router.post(
  '/:id/email',
  authenticate,
  authorize(['job-applications.manage']),
  async (req, res) => {
    try {
      if (!isEmailConfigured()) {
        return res.status(500).json({
          message:
            'Email service is not configured. Please set SMTP_* environment variables.',
        });
      }

      const { id } = req.params;
      if (!validateObjectId(id)) {
        return res.status(400).json({ message: 'Invalid application ID.' });
      }

      const { subject, message } = req.body || {};
      const trimmedSubject = (subject || '').toString().trim();
      const trimmedMessage = (message || '').toString().trim();

      if (!trimmedSubject || !trimmedMessage) {
        return res.status(400).json({
          message: 'Subject and message are required to send an email.',
        });
      }

      const application = await JobApplication.findById(id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found.' });
      }

      if (!application.email) {
        return res
          .status(400)
          .json({ message: 'Applicant does not have an email address.' });
      }

      await sendApplicantEmail({
        to: application.email,
        subject: trimmedSubject,
        html: `<p>${trimmedMessage.replace(/\n/g, '<br/>')}</p>`,
        text: trimmedMessage,
      });

      const emailLogEntry = {
        subject: trimmedSubject,
        body: trimmedMessage,
        sent_by: req.user?._id,
        recipient: application.email,
        sent_at: new Date(),
      };

      application.email_logs = application.email_logs || [];
      application.email_logs.push(emailLogEntry);

      application.timeline = application.timeline || [];
      application.timeline.push({
        status: application.status,
        note: `Email sent: ${trimmedSubject}`,
        changed_by: req.user?._id,
        changed_at: emailLogEntry.sent_at,
      });

      application.processed_by = req.user?._id;

      await application.save();

      await application.populate([
        {
          path: 'job',
          select: 'title slug status department location employment_type',
        },
        { path: 'processed_by', select: 'name email' },
      ]);

      res.json({
        message: 'Email sent successfully.',
        application,
      });
    } catch (error) {
      console.error('Error sending applicant email:', error);
      res.status(500).json({
        message: 'Failed to send email',
        error: error.message,
      });
    }
  }
);

export default router;
