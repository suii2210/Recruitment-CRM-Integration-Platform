import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 120 },
    name: { type: String, trim: true, maxlength: 200 },
    url: { type: String, trim: true },
    type: { type: String, trim: true, maxlength: 60 },
    size: { type: Number },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    note: { type: String, trim: true },
    attachment: attachmentSchema,
    submitted_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'in_review', 'submitted', 'completed'],
      default: 'pending',
    },
    shared_at: { type: Date },
    submission: submissionSchema,
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String },
    due_date: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'assigned', 'in_progress', 'in_review', 'completed', 'archived'],
      default: 'draft',
    },
    label: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    attachments: [attachmentSchema],
    assigned_candidates: [assignmentSchema],
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

taskSchema.index({ 'assigned_candidates.user': 1 });
taskSchema.index({ due_date: 1 });

export default mongoose.model('Task', taskSchema);
