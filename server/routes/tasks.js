import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import JobApplication from '../models/JobApplication.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const basePopulate = [
  { path: 'assigned_candidates.application', select: 'applicant_name email job_title' },
  { path: 'assigned_candidates.user', select: 'name email avatar' },
  { path: 'created_by', select: 'name email' },
];

const populateTask = (query) => query.populate(basePopulate);

const populateTaskDoc = async (task) => {
  if (!task) return task;
  await task.populate(basePopulate);
  return task;
};

const mapAssignees = async (assigneeIds = [], previousAssignments = []) => {
  const previous = previousAssignments.map((assignment) =>
    assignment?.toObject ? assignment.toObject() : assignment
  );
  const ids = assigneeIds
    .map((id) => (validateObjectId(id) ? new mongoose.Types.ObjectId(id) : null))
    .filter(Boolean);

  if (!ids.length) return [];

  const applications = await JobApplication.find({ _id: { $in: ids } })
    .select('offer applicant_name email job_title')
    .populate('offer.user', '_id name email');

  return applications
    .map((application) => {
      const offerUser = application.offer?.user;
      const userId =
        typeof offerUser === 'object'
          ? offerUser?._id || offerUser?.id
          : offerUser || null;

      if (!userId) {
        return null;
      }

      const existing = previous.find(
        (assignment) =>
          assignment?.application?.toString() === application._id.toString()
      );

      return {
        application: application._id,
        user: userId,
        status: existing?.status || 'pending',
        shared_at: existing?.shared_at,
        submission: existing?.submission,
      };
    })
    .filter(Boolean);
};

router.get('/', authenticate, authorize(['job-applications.view']), async (_req, res) => {
  try {
    const tasks = await populateTask(Task.find().sort({ created_at: -1 }));

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

router.post('/', authenticate, authorize(['job-applications.manage']), async (req, res) => {
  try {
    const {
      title,
      description,
      due_date,
      attachments = [],
      assignees = [],
      label,
      status,
    } = req.body;

    const assignments = await mapAssignees(assignees);

    const task = await Task.create({
      title,
      description,
      due_date,
      attachments,
      label,
      assigned_candidates: assignments,
      status: status || 'draft',
      created_by: req.user._id,
    });

    await populateTaskDoc(task);

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

router.post('/:id/share', authenticate, authorize(['job-applications.manage']), async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
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
    await populateTaskDoc(task);

    res.json(task);
  } catch (error) {
    console.error('Error sharing task:', error);
    res.status(500).json({ message: 'Failed to share task' });
  }
});

router.patch('/:id', authenticate, authorize(['job-applications.manage']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updatableFields = ['title', 'description', 'due_date', 'status', 'label'];

    updatableFields.forEach((field) => {
      if (typeof req.body[field] !== 'undefined') {
        task[field] = req.body[field];
      }
    });

    if (Array.isArray(req.body.attachments)) {
      task.attachments = req.body.attachments;
    }

    if (Array.isArray(req.body.assignees)) {
      task.assigned_candidates = await mapAssignees(req.body.assignees, task.assigned_candidates);
    }

    await task.save();
    await populateTaskDoc(task);

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

router.delete('/:id', authenticate, authorize(['job-applications.manage']), async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task' });
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
