import express from 'express';
import Blog from '../models/Blog.js';

const router = express.Router();

// Public endpoint to get published blogs for Conservative website
router.get('/conservative', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const blogs = await Blog.find({
      status: 'published',
      website: 'Conservative'
    })
      .sort({ published_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('title slug excerpt content featured_image author_name category tags published_at views_count created_at');

    const total = await Blog.countDocuments({
      status: 'published',
      website: 'Conservative'
    });

    console.log(`Found ${blogs.length} published Conservative blogs out of ${total} total`);

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
    console.error('Error fetching public blogs:', error);
    res.status(500).json({ message: 'Error fetching blogs' });
  }
});

// Get single blog by slug for Conservative website
router.get('/conservative/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published',
      website: 'Conservative'
    });

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Increment view count
    blog.views_count = (blog.views_count || 0) + 1;
    await blog.save();

    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Error fetching blog' });
  }
});

// Public endpoint to get published blogs for Bihaan website
router.get('/bihaan', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const blogs = await Blog.find({
      status: 'published',
      website: 'Bihaan'
    })
      .sort({ published_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('title slug excerpt content featured_image author_name category tags published_at views_count created_at');

    const total = await Blog.countDocuments({
      status: 'published',
      website: 'Bihaan'
    });

    console.log(`Found ${blogs.length} published Bihaan blogs out of ${total} total`);

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
    console.error('Error fetching public blogs:', error);
    res.status(500).json({ message: 'Error fetching blogs' });
  }
});

// Get single blog by slug for Bihaan website
router.get('/bihaan/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published',
      website: 'Bihaan'
    });

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Increment view count
    blog.views_count = (blog.views_count || 0) + 1;
    await blog.save();

    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Error fetching blog' });
  }
});

// Debug endpoint to check all blogs (remove in production)
router.get('/debug/all', async (req, res) => {
  try {
    const allBlogs = await Blog.find({})
      .select('title status website published_at created_at')
      .sort({ created_at: -1 });
    
    const stats = {
      total: allBlogs.length,
      published: allBlogs.filter(b => b.status === 'published').length,
      conservative: allBlogs.filter(b => b.website === 'Conservative').length,
      publishedConservative: allBlogs.filter(b => b.status === 'published' && b.website === 'Conservative').length
    };
    
    res.json({ stats, blogs: allBlogs });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: 'Error fetching debug data' });
  }
});

export default router;