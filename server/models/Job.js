import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const getEnvValue = (key) => {
  const value = process.env[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const targetConfigs = [
  {
    id: 'MATV',
    labelKey: 'JOB_TARGET_LABEL_MATV',
    urlKey: 'JOB_TARGET_URL_MATV',
    fallbackLabel: 'MATV',
    fallbackUrl: 'http://localhost:5173/career',
  },
  {
    id: 'Conservative',
    labelKey: 'JOB_TARGET_LABEL_CONSERVATIVE',
    urlKey: 'JOB_TARGET_URL_CONSERVATIVE',
    fallbackLabel: 'PrashantKumar',
    fallbackUrl: 'http://localhost:5173/career',
  },
  {
    id: 'Bihaan',
    labelKey: 'JOB_TARGET_LABEL_BIHAAN',
    urlKey: 'JOB_TARGET_URL_BIHAAN',
    fallbackLabel: 'Bihaan',
    fallbackUrl: 'http://localhost:5174/career',
  },
  {
    id: 'Pkltd',
    labelKey: 'JOB_TARGET_LABEL_PKLTD',
    urlKey: 'JOB_TARGET_URL_PKLTD',
    fallbackLabel: 'Pkltd',
    fallbackUrl: 'http://localhost:5173/career',
  },
  {
    id: 'LinkedIn',
    labelKey: 'JOB_TARGET_LABEL_LINKEDIN',
    urlKey: 'JOB_TARGET_URL_LINKEDIN',
    fallbackLabel: 'LinkedIn',
    fallbackUrl: null,
  },
  {
    id: 'Indeed',
    labelKey: 'JOB_TARGET_LABEL_INDEED',
    urlKey: 'JOB_TARGET_URL_INDEED',
    fallbackLabel: 'Indeed',
    fallbackUrl: null,
  },
  {
    id: 'Assessment',
    labelKey: 'JOB_TARGET_LABEL_ASSESSMENT',
    urlKey: 'JOB_TARGET_URL_ASSESSMENT',
    fallbackLabel: 'AssessmentPortal',
    fallbackUrl: null,
  },
];

const JOB_TARGETS = targetConfigs.map(({ id, labelKey, urlKey, fallbackLabel, fallbackUrl }) => {
  const envLabel = getEnvValue(labelKey);
  const envUrl = getEnvValue(urlKey);

  return {
    id,
    label: envLabel || fallbackLabel,
    url: envUrl ?? fallbackUrl ?? null,
  };
});

const JOB_ENDPOINTS = JOB_TARGETS.map((target) => target.id);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Job title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    department: {
      type: String,
      trim: true,
      maxlength: [120, 'Department cannot exceed 120 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    employment_type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'temporary', 'internship', 'freelance', 'unpaid'],
      default: 'full-time',
    },
    experience_level: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
      default: 'entry',
    },
    salary_range: {
      type: String,
      trim: true,
      maxlength: [120, 'Salary range cannot exceed 120 characters'],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [500, 'Summary cannot exceed 500 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    responsibilities: [
      {
        type: String,
        trim: true,
        maxlength: [300, 'Responsibility cannot exceed 300 characters'],
      },
    ],
    requirements: [
      {
        type: String,
        trim: true,
        maxlength: [300, 'Requirement cannot exceed 300 characters'],
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
        maxlength: [300, 'Benefit cannot exceed 300 characters'],
      },
    ],
    application_url: {
      type: String,
      trim: true,
    },
    application_email: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return /\S+@\S+\.\S+/.test(value);
        },
        message: 'Please provide a valid application email address',
      },
    },
    publish_targets: [
      {
        type: String,
        enum: JOB_ENDPOINTS,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },
    published_at: {
      type: Date,
    },
    closing_date: {
      type: Date,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const JOB_PUBLISH_TARGETS = JOB_ENDPOINTS;
export const JOB_PUBLISH_TARGET_DETAILS = JOB_TARGETS;

export default mongoose.model('Job', jobSchema);
