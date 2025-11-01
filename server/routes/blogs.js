import express from 'express';
import Blog from '../models/Blog.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all blogs
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, website, author_id, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (website) filter.website = website;
    if (author_id) filter.author_id = author_id;

    const offset = (page - 1) * limit;
    const blogs = await Blog.find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(parseInt(limit));

    const total = await Blog.countDocuments(filter);

    res.json({
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Error fetching blogs', error: error.message });
  }
});

// Get single blog by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Error fetching blog', error: error.message });
  }
});

// Get blog by slug
router.get('/slug/:slug', authenticate, async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Error fetching blog', error: error.message });
  }
});

// Create new blog
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      excerpt,
      featured_image,
      author_name,
      category,
      website,
      tags,
      status = 'draft'
    } = req.body;

    if (!title || !slug || !content || !author_name) {
      return res.status(400).json({
        message: 'Missing required fields: title, slug, content, author_name'
      });
    }

    const blogData = {
      title,
      slug,
      content,
      excerpt,
      featured_image,
      author_name,
      author_id: req.user._id,
      category,
      website,
      tags: tags || [],
      status,
      created_by: req.user._id,
      updated_by: req.user._id,
      published_at: status === 'published' ? new Date() : null
    };

    const blog = new Blog(blogData);
    await blog.save();

    res.status(201).json(blog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ message: 'Error creating blog', error: error.message });
  }
});

// Update blog
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }
    
    const updateData = { ...req.body, updated_by: req.user._id };
    
    if (req.body.status === 'published') {
      updateData.published_at = new Date();
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Error updating blog:', error);
    
    // Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({ message: 'A blog with this slug already exists' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors: validationErrors });
    }
    
    res.status(500).json({ message: 'Error updating blog', error: error.message });
  }
});

// Delete blog
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }
    
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Error deleting blog', error: error.message });
  }
});

// Publish blog
router.patch('/:id/publish', authenticate, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }
    
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        status: 'published',
        published_at: new Date(),
        updated_by: req.user._id
      },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Error publishing blog:', error);
    res.status(500).json({ message: 'Error publishing blog', error: error.message });
  }
});

// Unpublish blog
router.patch('/:id/unpublish', authenticate, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }
    
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        status: 'draft',
        updated_by: req.user._id
      },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Error unpublishing blog:', error);
    res.status(500).json({ message: 'Error unpublishing blog', error: error.message });
  }
});

// Increment view count
router.post('/:id/view', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views_count: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ message: 'Error incrementing view count', error: error.message });
  }
});

export default router;