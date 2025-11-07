import express from 'express';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';

const router = express.Router();

const sanitizeAnswers = (answers = []) => {
  if (!Array.isArray(answers)) return [];
  return answers
    .slice(0, 20)
    .map((entry) => ({
      question: (entry?.question || '').toString().slice(0, 200),
      answer: (entry?.answer || '').toString(),
    }))
    .filter((entry) => entry.answer.trim().length);
};

const sanitizeAttachments = (attachments = []) => {
  if (!Array.isArray(attachments)) return [];
  return attachments.slice(0, 5).map((file) => ({
    label: file?.label?.toString().slice(0, 120),
    name: file?.name?.toString().slice(0, 200),
    url: file?.url,
    type: file?.type,
    size: file?.size,
  }));
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, target } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const filter = { status: 'published' };
    if (target && typeof target === 'string') {
      filter.$or = [
        { publish_targets: { $size: 0 } },
        { publish_targets: target },
      ];
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ published_at: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select(
          'title slug summary department location employment_type experience_level salary_range closing_date publish_targets updated_at'
        ),
      Job.countDocuments(filter),
    ]);

    res.json({
      jobs,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching public jobs:', error);
    res.status(500).json({ message: 'Failed to fetch public jobs' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const job = await Job.findOne({
      slug: req.params.slug,
      status: 'published',
    }).select('-created_by -updated_by');

    if (!job) {
      return res
        .status(404)
        .json({ message: 'Job not found or not available.' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching public job:', error);
    res.status(500).json({ message: 'Failed to fetch job' });
  }
});

router.post('/:slug/apply', async (req, res) => {
  try {
    const job = await Job.findOne({
      slug: req.params.slug,
      status: { $in: ['published'] },
    });

    if (!job) {
      return res
        .status(404)
        .json({ message: 'Job not found or not accepting applications.' });
    }

    const payload = req.body || {};
    const name = payload.name ? String(payload.name).trim() : '';
    const email = payload.email ? String(payload.email).trim().toLowerCase() : '';

    if (!name || !email) {
      return res
        .status(400)
        .json({ message: 'Applicant name and email are required.' });
    }

    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email.' });
    }

    const application = await JobApplication.create({
      job: job._id,
      job_title: job.title,
      job_slug: job.slug,
      job_department: job.department,
      job_location: job.location,
      applicant_name: name,
      email,
      phone: payload.phone ? String(payload.phone).trim() : undefined,
      resume_url: payload.resumeUrl,
      cover_letter: payload.coverLetter
        ? String(payload.coverLetter).slice(0, 6000)
        : undefined,
      linkedin_url: payload.linkedinUrl,
      portfolio_url: payload.portfolioUrl,
      location: payload.location,
      experience_years: payload.experienceYears,
      expected_salary: payload.expectedSalary,
      notice_period: payload.noticePeriod,
      current_company: payload.currentCompany,
      source: payload.source,
      submitted_from:
        payload.submittedFrom ||
        req.headers.origin ||
        req.headers.referer ||
        'public-site',
      answers: sanitizeAnswers(payload.answers),
      attachments: sanitizeAttachments(payload.attachments),
      meta: {
        ...(payload.meta || {}),
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
      timeline: [
        {
          status: 'new',
          note: 'Application submitted',
          changed_at: new Date(),
        },
      ],
    });

    res.status(201).json({
      message: 'Application submitted successfully.',
      applicationId: application._id,
    });
  } catch (error) {
    console.error('Error submitting job application:', error);
    res
      .status(500)
      .json({ message: 'Failed to submit job application', error: error.message });
  }
});

export default router;
