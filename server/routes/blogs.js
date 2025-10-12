import express from 'express';
import Blog from '../models/Blog.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/published',async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, author } = req.query;
    
    const query = {status: 'published'};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (author) {
      query.authorId = author;
    }

    const blogs = await Blog.find(query)
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
});

router.get('/published/pages/:pagename',async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, author } = req.query;
    const { pagename } = req.params;

    console.log('🔍 Searching for pagename:', pagename); // Add this

    const query = {
  status: 'published',
  pages: { $elemMatch: { $in: [pagename] } }
};


    console.log('🔍 MongoDB query:', JSON.stringify(query, null, 2)); // Add this

    const blogs = await Blog.find(query)
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('🔍 Found blogs:', blogs.length); // Add this

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('❌ Error:', error); // Add this
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
});

router.get('/published/pages/:pagename/:id', async (req, res) => {
  try {
    const { pagename, id } = req.params;
    
    const query = {
      slug: id,
      status: 'published',
      pages: { $elemMatch: { $in: [pagename] } }
    };

    const blog = await Blog.findOne(query).populate('authorId', 'name email');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blog' });
  }
});



router.get('/:id',async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('authorId', 'name email');
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blog' });
  }
});

// Get blogs by author name
router.get('/by-author/:authorName', async (req, res) => {
  try {
    const { authorName } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const query = {
      author: authorName,
      status: 'published'
    };
    
    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Blog.countDocuments(query);
    
    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Error fetching blogs by author:', error);
    res.status(500).json({ message: 'Failed to fetch blogs by author' });
  }
});

// Get all blogs
router.get('/', authenticate, authorize(['blogs.view']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, author } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (author) {
      query.authorId = author;
    }

    const blogs = await Blog.find(query)
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
});

// Get blog by ID
router.get('/:id', authenticate, authorize(['blogs.view']), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('authorId', 'name email');
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch blog' });
  }
});

// Create blog
router.post('/', authenticate, authorize(['blogs.create']), async (req, res) => {
  try {
    const { title, content, tags, imageUrl, publishDate, status = 'draft', pages } = req.body;

    console.log('Creating blog with data:', { title, content, tags, imageUrl, publishDate, status, pages });

    const blog = new Blog({
      title,
      content,
      author: req.user.name,
      authorId: req.user._id,
      tags: tags || [],
      pages: pages || [],
      imageUrl,
      publishDate,
      status
    });

    // Set published date if status is published
    if (status === 'published') {
      blog.publishedAt = new Date();
    }

    await blog.save();
    await blog.populate('authorId', 'name email');

    console.log('Blog created successfully:', blog._id);

    res.status(201).json({
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ 
      message: 'Failed to create blog',
      error: error.message 
    });
  }
});

// Update blog
router.put('/:id', authenticate, authorize(['blogs.edit']), async (req, res) => {
  try {
    const { title, content, tags, imageUrl, publishDate, status, pages } = req.body;
    
    console.log('Updating blog with data:', { title, content, tags, imageUrl, publishDate, status, pages });
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user can edit this blog
    if (blog.authorId.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You can only edit your own blogs' });
    }

    // Update fields
    if (title) blog.title = title;
    if (content) blog.content = content;
    if (tags) blog.tags = tags;
    if (pages) blog.pages = pages;
    if (imageUrl !== undefined) blog.imageUrl = imageUrl;
    if (publishDate) blog.publishDate = publishDate;
    
    // Handle status change
    if (status && status !== blog.status) {
      blog.status = status;
      if (status === 'published' && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }
    }

    await blog.save();
    await blog.populate('authorId', 'name email');

    console.log('Blog updated successfully:', blog._id);

    res.json({
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ 
      message: 'Failed to update blog',
      error: error.message 
    });
  }
});

// Delete blog
router.delete('/:id', authenticate, authorize(['blogs.delete']), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user can delete this blog
    if (blog.authorId.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You can only delete your own blogs' });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete blog' });
  }
});

// Publish/Approve blog (Admin only)
router.patch('/:id/publish', authenticate, authorize(['blogs.publish']), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    blog.status = 'published';
    blog.publishedAt = new Date();
    
    await blog.save();

    res.json({
      message: 'Blog published successfully',
      blog
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to publish blog' });
  }
});

// Reject blog (Admin only)
router.patch('/:id/reject', authenticate, authorize(['blogs.publish']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    blog.status = 'rejected';
    blog.rejectionReason = reason;
    
    await blog.save();

    res.json({
      message: 'Blog rejected',
      blog
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject blog' });
  }

});




export default router;