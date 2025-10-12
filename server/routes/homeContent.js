import express from 'express';
import HomeContent from '../models/HomeContent.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get published home contents by author name
router.get('/by-author/:authorName', async (req, res) => {
  try {
    const { authorName } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const query = {
      author: authorName,
      status: 'published'
    };
    
    const homeContents = await HomeContent.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
      
    const total = await HomeContent.countDocuments(query);
    
    res.json({
      success: true,
      data: homeContents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(total / limit),
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch home contents by author' 
    });
  }
});

// Get all published home contents
router.get('/published', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, author, section } = req.query;
    
    const query = { status: 'published' };
  
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    if (section) {
      query.selectedPages = { $in: [section] };
    }

    const homeContents = await HomeContent.find(query)
      .sort({ featured: -1, publishDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await HomeContent.countDocuments(query);

    res.json({
      success: true,
      data: homeContents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(total / limit),
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch published home contents' 
    });
  }
});

// Get published home contents by section/page
router.get('/published/pages/:pagename', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const { pagename } = req.params;

    const query = {
      status: 'published',
      pages: { $in: [pagename] }
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const homeContents = await HomeContent.find(query)
      .sort({ publishDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await HomeContent.countDocuments(query);

    res.json({
      success: true,
      data: homeContents,
      section: pagename,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(total / limit),
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch home contents for section' 
    });
  }
});

// Get single published home content by section and slug/id
router.get('/published/pages/:pagename/:id', async (req, res) => {
  try {
    const { pagename, id } = req.params;
    
    let query;
    
    // Check if id is a valid ObjectId or treat as slug
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = {
        _id: id,
        status: 'published',
        pages: { $in: [pagename] }
      };
    } else {
      query = {
        slug: id,
        status: 'published',
        pages: { $in: [pagename] }
      };
    }

    const homeContent = await HomeContent.findOne(query);
    
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    // Increment views
    await homeContent.incrementViews();
    
    res.json({
      success: true,
      data: homeContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch home content' 
    });
  }
});

// Get featured home contents
router.get('/published/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const featuredContents = await HomeContent.find({
      status: 'published',
      featured: true
    })
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      data: featuredContents,
      total: featuredContents.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch featured home contents' 
    });
  }
});

// Get home content by slug (public)
router.get('/published/slug/:slug', async (req, res) => {
  try {
    const homeContent = await HomeContent.findOne({ 
      slug: req.params.slug,
      status: 'published'
    });
    
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    // Increment views
    await homeContent.incrementViews();

    res.json({
      success: true,
      data: homeContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch home content' 
    });
  }
});

// Get single published home content by ID (public)
router.get('/published/:id', async (req, res) => {
  try {
    const homeContent = await HomeContent.findOne({
      _id: req.params.id,
      status: 'published'
    });
    
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    // Increment views
    await homeContent.incrementViews();

    res.json({
      success: true,
      data: homeContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch home content' 
    });
  }
});

// ============================================
// ADMIN ROUTES (Authentication required)
// ============================================

// Get all home contents (admin)
router.get('/', authenticate, authorize(['home-contents.view']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      author, 
      tags, 
      selectedPages, 
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    if (tags) {
      query.tags = { $in: tags.split(',').map(tag => tag.trim()) };
    }
    
    if (selectedPages) {
      query.pages = { $in: selectedPages.split(',').map(page => page.trim()) };
    }
    
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const homeContents = await HomeContent.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await HomeContent.countDocuments(query);

    res.json({
      success: true,
      data: homeContents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(total / limit),
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch home contents' 
    });
  }
});

// Get home content by ID (admin)
router.get('/:id', authenticate, authorize(['home-contents.view']), async (req, res) => {
  try {
    const homeContent = await HomeContent.findById(req.params.id);
    
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    res.json({
      success: true,
      data: homeContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch home content' 
    });
  }
});

// Create home content
router.post('/', authenticate, authorize(['home-contents.create']), async (req, res) => {
  try {
    const {
      title,
      content,
      author,
      publishDate,
      status = 'Draft',
      tags,
      pages,
      featured = false,
      metaDescription,
      imageUrl // Image URL from separate upload endpoint
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and content are required' 
      });
    }

    // Parse arrays from strings if needed
    const parsedTags = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];
    const parsedPages = pages ? (Array.isArray(pages) ? pages : JSON.parse(pages)) : [];

    // Create new home content
    const homeContent = new HomeContent({
      title,
      content,
      author: author || req.user?.name || 'Super Admin',
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      status: status.toLowerCase(),
      imageUrl: imageUrl || '', // Use provided image URL
      tags: parsedTags,
      pages: parsedPages,
      featured: featured === 'true' || featured === true,
      metaDescription,
      createdBy: req.user?.id || 'admin',
      updatedBy: req.user?.id || 'admin'
    });

    // Set published date and publishedAt if status is published
    if (status.toLowerCase() === 'published') {
      homeContent.publishDate = new Date();
      homeContent.publishedAt = new Date();
    }

    await homeContent.save();

    res.status(201).json({
      success: true,
      message: 'Home content created successfully',
      data: homeContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to create home content',
      error: error.message 
    });
  }
});

// Update home content
router.put('/:id', authenticate, authorize(['home-contents.edit']), async (req, res) => {
  try {
    const homeContent = await HomeContent.findById(req.params.id);
    
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    const {
      title,
      content,
      author,
      publishDate,
      status,
      tags,
      pages,
      featured,
      metaDescription,
      imageUrl // Image URL from separate upload endpoint
    } = req.body;

    // Update fields
    if (title) homeContent.title = title;
    if (content) homeContent.content = content;
    if (author) homeContent.author = author;
    if (publishDate) homeContent.publishDate = new Date(publishDate);
    if (tags) homeContent.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
    if (pages) homeContent.pages = Array.isArray(pages) ? pages : JSON.parse(pages);
    if (featured !== undefined) homeContent.featured = featured === 'true' || featured === true;
    if (metaDescription) homeContent.metaDescription = metaDescription;
    if (imageUrl !== undefined) homeContent.imageUrl = imageUrl; // Update image URL
    
    // Handle status change
    if (status && status !== homeContent.status) {
      homeContent.status = status.toLowerCase();
      if (status.toLowerCase() === 'published') {
        homeContent.publishDate = new Date();
        homeContent.publishedAt = new Date();
      }
    }
    
    homeContent.updatedBy = req.user?.id || 'admin';

    await homeContent.save();

    res.json({
      success: true,
      message: 'Home content updated successfully',
      data: homeContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to update home content',
      error: error.message 
    });
  }
});

// Delete home content
router.delete('/:id', authenticate, authorize(['home-contents.delete']), async (req, res) => {
  try {
    const homeContent = await HomeContent.findById(req.params.id);
    
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    await HomeContent.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true,
      message: 'Home content deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete home content' 
    });
  }
});

// Publish/Approve home content (Admin only)
router.patch('/:id/publish', authenticate, authorize(['home-contents.publish']), async (req, res) => {
  try {
    const homeContent = await HomeContent.findById(req.params.id);
    
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    homeContent.status = 'published';
    homeContent.publishDate = new Date();
    homeContent.publishedAt = new Date();
    
    await homeContent.save();

    res.json({
      success: true,
      message: 'Home content published successfully',
      data: homeContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to publish home content' 
    });
  }
});

// Unpublish home content
router.patch('/:id/unpublish', authenticate, authorize(['home-contents.publish']), async (req, res) => {
  try {
    const homeContent = await HomeContent.findById(req.params.id);
    
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    homeContent.status = 'draft';
    
    await homeContent.save();

    res.json({
      success: true,
      message: 'Home content unpublished successfully',
      data: homeContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to unpublish home content' 
    });
  }
});

// Reject home content (Admin only)
router.patch('/:id/reject', authenticate, authorize(['home-contents.publish']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const homeContent = await HomeContent.findById(req.params.id);
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    homeContent.status = 'rejected';
    
    await homeContent.save();

    res.json({
      success: true,
      message: 'Home content rejected successfully',
      data: homeContent,
      reason
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to reject home content' 
    });
  }
});

// Toggle featured status
router.patch('/:id/feature', authenticate, authorize(['home-contents.feature']), async (req, res) => {
  try {
    const homeContent = await HomeContent.findById(req.params.id);
    
    if (!homeContent) {
      return res.status(404).json({ 
        success: false,
        message: 'Home content not found' 
      });
    }

    homeContent.featured = !homeContent.featured;
    await homeContent.save();

    res.json({
      success: true,
      message: `Home content ${homeContent.featured ? 'featured' : 'unfeatured'} successfully`,
      data: homeContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to toggle featured status' 
    });
  }
});

// Get statistics
router.get('/admin/stats', authenticate, authorize(['home-contents.view']), async (req, res) => {
  try {
    const stats = await HomeContent.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Statistics fetched successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch statistics' 
    });
  }
});

export default router;