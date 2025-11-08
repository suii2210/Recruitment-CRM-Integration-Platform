import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import JobApplication from '../models/JobApplication.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const mapAssignees = async (assigneeIds = []) => {
  const ids = assigneeIds
    .map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null))
    .filter(Boolean);

  const applications = await JobApplication.find({ _id: { $in: ids } }).select('offer user applicant_name email offer user');

  return applications.map((application) => ({
    application: application._id,
    user: application.offer?.user || null,
    status: 'pending',
  }));
};

router.get('/', authenticate, authorize(['job-applications.view']), async (_req, res) => {
  try {
    const tasks = await Task.find()
      .sort({ created_at: -1 })
      .populate('assigned_candidates.application', 'applicant_name email job_title')
      .populate('assigned_candidates.user', 'name email')
      .populate('created_by', 'name email');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

router.post('/', authenticate, authorize(['job-applications.manage']), async (req, res) => {
  try {
    const { title, description, due_date, attachments = [], assignees = [] } = req.body;

    const assignments = await mapAssignees(assignees);

    const task = await Task.create({
      title,
      description,
      due_date,
      attachments,
      assigned_candidates: assignments,
      created_by: req.user._id,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

router.post('/:id/share', authenticate, authorize(['job-applications.manage']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = 'assigned';
    task.assigned_candidates = task.assigned_candidates.map((assignment) => ({
      ...assignment,
      status: assignment.status === 'pending' ? 'assigned' : assignment.status,
      shared_at: assignment.shared_at || new Date(),
    }));

    await task.save();

    res.json(task);
  } catch (error) {
    console.error('Error sharing task:', error);
    res.status(500).json({ message: 'Failed to share task' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({
      'assigned_candidates.user': req.user._id,
    }).select('title description due_date status assigned_candidates attachments');

    const mapped = tasks.map((task) => {
      const myAssignment = task.assigned_candidates.find(
        (assignment) => assignment.user?.toString() === req.user._id.toString()
      );
      return {
        id: task._id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        status: myAssignment?.status || 'pending',
        submission: myAssignment?.submission,
        attachments: task.attachments,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

router.post('/:id/submissions', authenticate, async (req, res) => {
  try {
    const { note, attachment } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const assignment = task.assigned_candidates.find(
      (item) => item.user?.toString() === req.user._id.toString()
    );

    if (!assignment) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    assignment.status = 'submitted';
    assignment.submission = {
      note,
      attachment,
      submitted_at: new Date(),
    };

    await task.save();

    res.json({ message: 'Task submitted successfully' });
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({ message: 'Failed to submit task' });
  }
});

export default router;
