import express from 'express';
import mongoose from 'mongoose';
import Job, { JOB_PUBLISH_TARGETS, JOB_PUBLISH_TARGET_DETAILS } from '../models/Job.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const parseListField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// List jobs with filters and pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      status,
      department,
      location,
      employment_type,
      experience_level,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (department) filter.department = department;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (employment_type) filter.employment_type = employment_type;
    if (experience_level) filter.experience_level = experience_level;

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { summary: searchRegex },
        { description: searchRegex },
        { department: searchRegex },
        { location: searchRegex },
      ];
    }

    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Math.max(Number(limit), 1)),
      Job.countDocuments(filter),
    ]);

    res.json({
      jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Math.max(Number(limit), 1)) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// Get available publish targets
router.get('/targets/list', authenticate, (_req, res) => {
  res.json({ targets: JOB_PUBLISH_TARGET_DETAILS });
});

// Get job by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
});

// Create a job
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      slug,
      department,
      location,
      employment_type = 'full-time',
      experience_level = 'entry',
      salary_range,
      summary,
      description,
      responsibilities,
      requirements,
      benefits,
      application_url,
      application_email,
      publish_targets = [],
      status = 'draft',
      closing_date,
    } = req.body;

    if (!title || !slug || !location || !description) {
      return res.status(400).json({
        message: 'Missing required fields: title, slug, location, description',
      });
    }

    const normalizedPublishTargets = parseListField(publish_targets).filter((target) =>
      JOB_PUBLISH_TARGETS.includes(target)
    );

    const job = new Job({
      title,
      slug,
      department,
      location,
      employment_type,
      experience_level,
      salary_range,
      summary,
      description,
      responsibilities: parseListField(responsibilities),
      requirements: parseListField(requirements),
      benefits: parseListField(benefits),
      application_url,
      application_email,
      publish_targets: normalizedPublishTargets,
      status,
      published_at: status === 'published' ? new Date() : null,
      closing_date: closing_date ? new Date(closing_date) : undefined,
      created_by: req.user._id,
      updated_by: req.user._id,
    });

    await job.save();

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);

    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({ message: 'A job with this slug already exists' });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: 'Validation error', errors: validationErrors });
    }

    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
});

// Update job
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const updatePayload = { ...req.body };
    updatePayload.updated_by = req.user._id;

    if (updatePayload.publish_targets !== undefined) {
      updatePayload.publish_targets = parseListField(updatePayload.publish_targets).filter((target) =>
        JOB_PUBLISH_TARGETS.includes(target)
      );
    }

    if (updatePayload.responsibilities !== undefined) {
      updatePayload.responsibilities = parseListField(updatePayload.responsibilities);
    }

    if (updatePayload.requirements !== undefined) {
      updatePayload.requirements = parseListField(updatePayload.requirements);
    }

    if (updatePayload.benefits !== undefined) {
      updatePayload.benefits = parseListField(updatePayload.benefits);
    }

    if (updatePayload.status === 'published') {
      updatePayload.published_at = new Date();
    }

    if (updatePayload.status === 'draft') {
      updatePayload.published_at = null;
    }

    if (updatePayload.closing_date) {
      updatePayload.closing_date = new Date(updatePayload.closing_date);
    }

    const job = await Job.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);

    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({ message: 'A job with this slug already exists' });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: 'Validation error', errors: validationErrors });
    }

    res.status(500).json({ message: 'Error updating job', error: error.message });
  }
});

// Delete job
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job', error: error.message });
  }
});

// Publish job
router.patch('/:id/publish', authenticate, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const publishTargets = parseListField(req.body?.publish_targets).filter((target) =>
      JOB_PUBLISH_TARGETS.includes(target)
    );

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        status: 'published',
        publish_targets: publishTargets.length ? publishTargets : undefined,
        published_at: new Date(),
        updated_by: req.user._id,
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error publishing job:', error);
    res.status(500).json({ message: 'Error publishing job', error: error.message });
  }
});

// Unpublish job (back to draft)
router.patch('/:id/unpublish', authenticate, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        status: 'draft',
        published_at: null,
        updated_by: req.user._id,
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error unpublishing job:', error);
    res.status(500).json({ message: 'Error unpublishing job', error: error.message });
  }
});

// Close job posting
router.patch('/:id/close', authenticate, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        status: 'closed',
        updated_by: req.user._id,
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error closing job:', error);
    res.status(500).json({ message: 'Error closing job', error: error.message });
  }
});

export default router;
