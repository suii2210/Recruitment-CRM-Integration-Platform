import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Permission description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Permission category is required'],
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Permission', permissionSchema);