import express from 'express';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import JobApplication from '../models/JobApplication.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const findCandidateApplication = async (userId) => {
  return JobApplication.findOne({ 'offer.user': userId });
};

router.post('/check-in', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const application = await findCandidateApplication(req.user._id);

    const record = await Attendance.findOneAndUpdate(
      { user: req.user._id, date: today },
      {
        user: req.user._id,
        application: application?._id,
        date: today,
        check_in: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(record);
  } catch (error) {
    console.error('Attendance check-in error:', error);
    res.status(500).json({ message: 'Failed to check in' });
  }
});

router.post('/check-out', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { user: req.user._id, date: today },
      { check_out: new Date() },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Check-in record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Attendance check-out error:', error);
    res.status(500).json({ message: 'Failed to check out' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(30);
    res.json(records);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});

const buildDayRange = (value) => {
  const day = new Date(value);
  if (Number.isNaN(day.getTime())) {
    return null;
  }
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

router.get(
  '/recent',
  authenticate,
  authorize(['job-applications.view']),
  async (req, res) => {
    try {
      const { date, start, end } = req.query;
      const match = {};

      if (date) {
        const range = buildDayRange(date);
        if (!range) {
          return res.status(400).json({ message: 'Invalid date parameter' });
        }
        match.date = { $gte: range.start, $lt: range.end };
      } else if (start || end) {
        const startRange = start ? buildDayRange(start)?.start : null;
        const endRange = end ? buildDayRange(end)?.end : null;

        if ((start && !startRange) || (end && !endRange)) {
          return res.status(400).json({ message: 'Invalid date range' });
        }

        match.date = {};
        if (startRange) match.date.$gte = startRange;
        if (endRange) match.date.$lt = endRange;
      } else {
        const since = new Date();
        since.setDate(since.getDate() - 7);
        match.date = { $gte: since };
      }

      const records = await Attendance.find(match)
        .sort({ date: -1, check_in: -1 })
        .limit(200)
        .populate('application', 'applicant_name email job_title')
        .populate('user', 'name email');

      res.json(
        records.map((record) => ({
          id: record._id,
          applicant_name: record.application?.applicant_name || record.user?.name || 'Candidate',
          email: record.application?.email || record.user?.email || '',
          job_title: record.application?.job_title || 'Intern',
          date: record.date,
          check_in: record.check_in,
          check_out: record.check_out,
          status: record.check_out
            ? 'checked_out'
            : record.check_in
            ? 'checked_in'
            : 'pending',
        }))
      );
    } catch (error) {
      console.error('Fetch recent attendance error:', error);
      res.status(500).json({ message: 'Failed to fetch attendance records' });
    }
  }
);

export default router;
