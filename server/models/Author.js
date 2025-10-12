import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  role: {
    type: String,
    required: true,
    default: 'Author'
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: {
    type: String
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  website: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true,
    default: 'MATV Staff'
  },
  category: {
    type: String,
    trim: true,
    default: 'BUSINESS'
  },
  socialLinks: {
    twitter: {
      type: String,
      trim: true
    },
    linkedin: {
      type: String,
      trim: true
    }
  },
  activityLog: [{
    action: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    }
  }]
}, {
  timestamps: true
});

// Hide sensitive fields in responses
authorSchema.methods.toJSON = function() {
  const authorObj = this.toObject();
  
  // Keep only the fields we want
  return {
    _id: authorObj._id,
    name: authorObj.name,
    email: authorObj.email,
    role: authorObj.role,
    avatar: authorObj.avatar || '',
    location: authorObj.location || '',
    bio: authorObj.bio || '',
    website: authorObj.website || '',
    phone: authorObj.phone || '',
    socialLinks: {
      twitter: authorObj.socialLinks?.twitter || '',
      linkedin: authorObj.socialLinks?.linkedin || ''
    }
  };
};

export default mongoose.model('Author', authorSchema);
