import mongoose from 'mongoose';

export const APPLICATION_STATUSES = [
  'new',
  'in_review',
  'shortlisted',
  'interview',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
];

const answerSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, maxlength: 500 },
    answer: { type: String, trim: true },
  },
  { _id: false }
);

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

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    note: { type: String, trim: true },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changed_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const emailLogSchema = new mongoose.Schema(
  {
    subject: { type: String, trim: true, maxlength: 200 },
    body: { type: String },
    sent_at: { type: Date, default: Date.now },
    sent_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const documentUploadSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true },
    label: { type: String, trim: true, maxlength: 120 },
    url: { type: String, trim: true },
    uploaded_at: { type: Date, default: Date.now },
    uploaded_by_candidate: { type: Boolean, default: true },
  },
  { _id: false }
);

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    job_title: { type: String, trim: true, maxlength: 200 },
    job_slug: { type: String, trim: true, lowercase: true },
    job_department: { type: String, trim: true },
    job_location: { type: String, trim: true },
    applicant_name: {
      type: String,
      required: [true, 'Applicant name is required'],
      trim: true,
      maxlength: [200, 'Applicant name cannot exceed 200 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    phone: { type: String, trim: true, maxlength: 40 },
    resume_url: { type: String, trim: true },
    cover_letter: { type: String },
    linkedin_url: { type: String, trim: true },
    portfolio_url: { type: String, trim: true },
    location: { type: String, trim: true },
    experience_years: { type: Number, min: 0, max: 60 },
    expected_salary: { type: String, trim: true, maxlength: 120 },
    notice_period: { type: String, trim: true, maxlength: 120 },
    current_company: { type: String, trim: true, maxlength: 200 },
    source: { type: String, trim: true, maxlength: 120 },
    submitted_from: { type: String, trim: true, maxlength: 200 },
    answers: [answerSchema],
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'new',
    },
    rating: { type: Number, min: 0, max: 5 },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    internal_notes: { type: String },
    processed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timeline: [timelineSchema],
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
    email_logs: [emailLogSchema],
    onboarding_status: {
      type: String,
      enum: ['new', 'shortlisted', 'documents-requested', 'offer-sent', 'hired', 'declined'],
      default: 'new',
    },
    shortlist: {
      token: { type: String, trim: true },
      sent_at: { type: Date },
      response_status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
      },
      responded_at: { type: Date },
      candidate_message: { type: String, trim: true },
    },
    document_request: {
      token: { type: String, trim: true },
      sent_at: { type: Date },
      completed_at: { type: Date },
    },
    document_uploads: [documentUploadSchema],
    offer: {
      token: { type: String, trim: true },
      sent_at: { type: Date },
      response_status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
      },
      responded_at: { type: Date },
      candidate_message: { type: String, trim: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      start_date: { type: Date },
      end_date: { type: Date },
      letter: {
        filename: { type: String, trim: true },
        path: { type: String, trim: true },
        format: { type: String, trim: true },
        size: { type: Number },
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

jobApplicationSchema.index({ job: 1, status: 1 });
jobApplicationSchema.index({ job_slug: 1 });
jobApplicationSchema.index({
  applicant_name: 'text',
  email: 'text',
  phone: 'text',
});

export default mongoose.model('JobApplication', jobApplicationSchema);
