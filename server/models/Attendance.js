import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication',
    },
    date: {
      type: Date,
      required: true,
    },
    check_in: { type: Date },
    check_out: { type: Date },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
