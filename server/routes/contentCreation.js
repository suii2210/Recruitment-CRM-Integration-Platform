import express from 'express';
import Content from '../models/ContentCreation.js';
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

    const contents = await Content.find(query)
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Content.countDocuments(query);

    res.json({
      contents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contents' });
  }
});

router.get('/published/pages/:pagename',async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, author } = req.query;
    const { pagename } = req.params;

    const query = {
      status: 'published',
      pages: { $in: [pagename] }
    };

    const contents = await Content.find(query)
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Content.countDocuments(query);

    res.json({
      contents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contents' });
  }
});

router.get('/published/pages/:pagename/:id', async (req, res) => {
  try {
    const { pagename, id } = req.params;
    
    const query = {
      slug: id,
      status: 'published',
      pages:  { $elemMatch: { $in: [pagename] } }
    };

    const content = await Content.findOne(query).populate('authorId', 'name email');
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch content' });
  }
});





// Get all contents
router.get('/', authenticate, authorize(['contents.view']), async (req, res) => {
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

    const contents = await Content.find(query)
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Content.countDocuments(query);

    res.json({
      contents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contents' });
  }
});

// Get content by ID
router.get('/:id', authenticate, authorize(['contents.view']), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id).populate('authorId', 'name email');
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch content' });
  }
});

// Create content
router.post('/', authenticate, authorize(['contents.create']), async (req, res) => {
  try {
    const { title, content, tags, imageUrl, publishDate, status = 'draft', pages } = req.body;

    const newContent = new Content({
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
      newContent.publishedAt = new Date();
    }

    await newContent.save();
    await newContent.populate('authorId', 'name email');

    res.status(201).json({
      message: 'Content created successfully',
      content: newContent
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create content',
      error: error.message 
    });
  }
});

// Update content
router.put('/:id', authenticate, authorize(['contents.edit']), async (req, res) => {
  try {
    const { title, content, tags, imageUrl, publishDate, status, pages } = req.body;
    
    const existingContent = await Content.findById(req.params.id);
    if (!existingContent) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user can edit this content
    if (existingContent.authorId.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You can only edit your own content' });
    }

    // Update fields
    if (title) existingContent.title = title;
    if (content) existingContent.content = content;
    if (tags) existingContent.tags = tags;
    if (pages) existingContent.pages = pages;
    if (imageUrl !== undefined) existingContent.imageUrl = imageUrl;
    if (publishDate) existingContent.publishDate = publishDate;
    
    // Handle status change
    if (status && status !== existingContent.status) {
      existingContent.status = status;
      if (status === 'published' && !existingContent.publishedAt) {
        existingContent.publishedAt = new Date();
      }
    }

    await existingContent.save();
    await existingContent.populate('authorId', 'name email');

    res.json({
      message: 'Content updated successfully',
      content: existingContent
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update content',
      error: error.message 
    });
  }
});

// Delete content
router.delete('/:id', authenticate, authorize(['contents.delete']), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user can delete this content
    if (content.authorId.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You can only delete your own content' });
    }

    await Content.findByIdAndDelete(req.params.id);

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete content' });
  }
});

// Publish/Approve content (Admin only)
router.patch('/:id/publish', authenticate, authorize(['contents.publish']), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.status = 'published';
    content.publishedAt = new Date();
    
    await content.save();

    res.json({
      message: 'Content published successfully',
      content
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to publish content' });
  }
});

// Reject content (Admin only)
router.patch('/:id/reject', authenticate, authorize(['contents.publish']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.status = 'rejected';
    
    await content.save();

    res.json({
      message: 'Content rejected successfully',
      content
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject content' });
  }
});

export default router;