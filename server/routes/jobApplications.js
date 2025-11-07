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
  return {
    filename: path.basename(absolutePath),
    path: absolutePath,
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

      const { template, note, offerLetterPath } = req.body || {};
      const templateCode = (template || '').toString().trim();

      if (!['001', '002', '003'].includes(templateCode)) {
        return res.status(400).json({
          message: 'Unsupported workflow template. Use 001, 002, or 003.',
        });
      }

      const application = await JobApplication.findById(id)
        .populate('job', 'title slug status department location employment_type')
        .populate('processed_by', 'name email')
        .populate('offer.user', 'name email role status');

      if (!application) {
        return res.status(404).json({ message: 'Application not found.' });
      }

      if (!application.email) {
        return res.status(400).json({
          message: 'Applicant does not have an email address on file.',
        });
      }

      const baseUrl = buildCandidatePortalBase(req);
      const jobTitle =
        application.job_title || application.job?.title || 'the position';
      const recruiterNote = (note || '').toString().trim();

      let subject = '';
      let html = '';
      let attachments = [];
      const now = new Date();

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
          <p>Hi ${application.applicant_name?.split(' ')[0] || 'there'},</p>
          <p>Great news! You have been shortlisted for <strong>${jobTitle}</strong>.</p>
          <p>Please confirm if you would like to continue with the next steps:</p>
          <p>
            <a href="${acceptUrl}">✔️ Yes, I would like to continue</a><br/>
            <a href="${declineUrl}">✖️ No, I am not available</a>
          </p>
          ${
            recruiterNote
              ? `<p>${recruiterNote.replace(/\n/g, '<br/>')}</p>`
              : ''
          }
          <p>Kind regards,<br/>${req.user?.name || 'HR Team'}</p>
        `;

        appendTimeline(
          application,
          'Sent 001 shortlist email to candidate.',
          req.user?._id
        );
      }

      if (templateCode === '002') {
        if (!application.shortlist || application.shortlist.response_status !== 'accepted') {
          return res.status(400).json({
            message:
              'Cannot send 002 email until the applicant accepts the shortlist invitation.',
          });
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
          <p>Hi ${application.applicant_name?.split(' ')[0] || 'there'},</p>
          <p>Thank you for confirming your interest in <strong>${jobTitle}</strong>.</p>
          <p>Please upload the requested identification documents (Aadhaar, passport, etc.) using the secure link below:</p>
          <p><a href="${uploadUrl}">Upload documents</a></p>
          ${
            recruiterNote
              ? `<p>${recruiterNote.replace(/\n/g, '<br/>')}</p>`
              : ''
          }
          <p>Let us know if you have any questions.<br/>${req.user?.name || 'HR Team'}</p>
        `;

        appendTimeline(
          application,
          'Sent 002 document request email to candidate.',
          req.user?._id
        );
      }

      if (templateCode === '003') {
      if (!application.document_request || !application.document_request.completed_at) {
        return res.status(400).json({
          message:
            'Cannot send 003 email until the applicant uploads their documents.',
        });
      }

      if (application.offer?.response_status === 'accepted') {
        return res.status(400).json({
          message: 'Offer has already been accepted by the candidate.',
        });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const acceptUrl = `${baseUrl}/offer/${token}/accept`;
      const declineUrl = `${baseUrl}/offer/${token}/decline`;

        application.offer = {
          ...(application.offer || {}),
          token,
          sent_at: now,
          response_status: 'pending',
        };
        application.onboarding_status = 'offer-sent';
        application.status = 'offered';

        subject = `003 | Offer letter for ${jobTitle}`;
        let offerLetterBlock = '';

        if (offerLetterPath) {
          try {
            const attachment = resolveUploadAttachment(offerLetterPath);
            if (attachment) {
              attachments.push(attachment);
              offerLetterBlock = `<p>Your offer letter is attached to this email.</p>`;
            }
          } catch (error) {
            return res.status(400).json({ message: error.message });
          }
        }

        html = `
          <p>Hi ${application.applicant_name?.split(' ')[0] || 'there'},</p>
          <p>We are pleased to extend you an offer for <strong>${jobTitle}</strong>.</p>
          ${offerLetterBlock}
          <p>Please let us know your decision by selecting one of the options below:</p>
          <p>
            <a href="${acceptUrl}">✔️ Accept the offer</a><br/>
            <a href="${declineUrl}">✖️ Decline the offer</a>
          </p>
          ${
            recruiterNote
              ? `<p>${recruiterNote.replace(/\n/g, '<br/>')}</p>`
              : ''
          }
          <p>We look forward to having you on the team!<br/>${req.user?.name || 'HR Team'}</p>
        `;

        appendTimeline(
          application,
          'Sent 003 offer email to candidate.',
          req.user?._id
        );
      }

      await sendApplicantEmail({
        to: application.email,
        subject,
        html,
        text: html.replace(/<[^>]*>/g, ' '),
        attachments,
      });

      const emailEntry = appendEmailLog(application, {
        subject,
        body: (html || '').replace(/<[^>]*>/g, ' '),
        userId: req.user?._id,
      });

      application.processed_by = req.user?._id;

      await application.save();

      await application.populate([
        {
          path: 'job',
          select: 'title slug status department location employment_type',
        },
        { path: 'processed_by', select: 'name email' },
        { path: 'offer.user', select: 'name email role status' },
      ]);

      res.json({
        message: `Workflow email ${templateCode} sent successfully.`,
        email: emailEntry,
        application,
      });
    } catch (error) {
      console.error('Error sending workflow email:', error);
      res.status(500).json({
        message: 'Failed to send workflow email',
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
