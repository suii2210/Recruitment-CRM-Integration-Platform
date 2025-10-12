import mongoose from 'mongoose';

const homeContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Content title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content body is required']
  },
  author: {
    type: String,
    required: true,
    default: 'Super Admin'
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Making it optional since we don't have user auth yet
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'rejected'],
    default: 'draft'
  },
  pages: {
    type: [String],
    default: []
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  imageUrl: {
    type: String,
    default: ''
  },
  publishDate: {
    type: Date
  },
  publishedAt: {
    type: Date
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  likes: {
    type: Number,
    default: 0,
    min: [0, 'Likes cannot be negative']
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  featured: {
    type: Boolean,
    default: false
  },
  // Additional fields for backward compatibility
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  updatedBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate slug before saving
homeContentSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) + '-' + Date.now();
  }
  next();
});

// Set publishedAt when status changes to published
homeContentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
    if (!this.publishDate) {
      this.publishDate = new Date();
    }
  }
  next();
});

// Virtual for formatted publish date
homeContentSchema.virtual('formattedPublishDate').get(function() {
  const date = this.publishedAt || this.publishDate || this.createdAt;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for content preview
homeContentSchema.virtual('contentPreview').get(function() {
  const plainText = this.content.replace(/<[^>]*>/g, '');
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
});

// Virtual for reading time estimate
homeContentSchema.virtual('readingTime').get(function() {
  const plainText = this.content.replace(/<[^>]*>/g, '');
  const wordsPerMinute = 200;
  const wordCount = plainText.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime;
});

// Indexes for better query performance
homeContentSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    content: 1,
    tags: 3
  }
});

homeContentSchema.index({ status: 1, publishedAt: -1 });
homeContentSchema.index({ pages: 1 });
homeContentSchema.index({ featured: 1, status: 1 });
homeContentSchema.index({ slug: 1 });
homeContentSchema.index({ createdAt: -1 });
homeContentSchema.index({ views: -1 });
homeContentSchema.index({ likes: -1 });

// Static methods
homeContentSchema.statics.getPublished = function() {
  return this.find({ status: 'published' }).sort({ publishedAt: -1 });
};

homeContentSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ 
    featured: true, 
    status: 'published' 
  })
  .sort({ publishedAt: -1 })
  .limit(limit);
};

homeContentSchema.statics.getByPages = function(page, limit = 10) {
  return this.find({
    pages: page,
    status: 'published'
  })
  .sort({ publishedAt: -1 })
  .limit(limit);
};

homeContentSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    published: 0,
    pending: 0,
    drafts: 0,
    rejected: 0
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    switch (stat._id) {
      case 'published':
        result.published = stat.count;
        break;
      case 'pending':
        result.pending = stat.count;
        break;
      case 'draft':
        result.drafts = stat.count;
        break;
      case 'rejected':
        result.rejected = stat.count;
        break;
    }
  });
  
  return result;
};

// Instance methods
homeContentSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

homeContentSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

homeContentSchema.methods.decrementLikes = function() {
  if (this.likes > 0) {
    this.likes -= 1;
  }
  return this.save();
};

homeContentSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  if (!this.publishDate) {
    this.publishDate = new Date();
  }
  return this.save();
};

homeContentSchema.methods.unpublish = function() {
  this.status = 'draft';
  return this.save();
};

homeContentSchema.methods.toggleFeatured = function() {
  this.featured = !this.featured;
  return this.save();
};

export default mongoose.model('HomeContent', homeContentSchema);