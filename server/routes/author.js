import express from 'express';
import mongoose from 'mongoose';
import Author from '../models/Author.js';
import User from '../models/User.js';

const router = express.Router();

// GET /authors - Get all authors (optionally paginated and searchable)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const authors = await Author.find(query)
      .select('name email role avatar bio website location phone title category socialLinks')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Author.countDocuments(query);

    res.json({
      authors,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch authors' });
  }
});

// GET /authors/status/active - Get all active authors
router.get('/status/active', async (req, res) => {
  try {
    const authors = await Author.find({ status: 'active' })
      .select('name email role avatar bio website location phone title category socialLinks')
      .sort({ name: 1 });
      
    res.json(authors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active authors' });
  }
});

// GET /authors/name/:name - Get author by name
router.get('/name/:name', async (req, res) => {
  try {
    const author = await Author.findOne({ name: req.params.name })
      .select('name email role avatar bio website location phone title category socialLinks');
      
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.json(author);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch author by name' });
  }
});

// GET /authors/:id - Get author by ID
router.get('/:id', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id)
      .select('name email role avatar bio website location phone title category socialLinks');
      
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.json(author);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch author' });
  }
});

// DELETE /authors/reset - Delete all authors
router.delete('/reset', async (req, res) => {
  try {
    await Author.deleteMany({});
    res.json({ message: 'All authors have been deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete authors', error: error.message });
  }
});

// POST /authors/sync-from-users - Create authors from existing users
router.post('/sync-from-users', async (req, res) => {
  try {
    const users = await User.find().populate('roleId');
    const admin = users.find(user => user.role === 'Super Admin');
    
    // Create authors from users that don't already have an author entry
    const existingAuthors = await Author.find().select('email');
    const existingEmails = existingAuthors.map(author => author.email);
    
    const newAuthors = users.filter(user => !existingEmails.includes(user.email));
    
    if (newAuthors.length === 0) {
      return res.json({ message: 'No new authors to create', count: 0 });
    }
    
    const authorData = newAuthors.map(user => ({
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      bio: user.bio || '',
      location: user.location || '',
      phone: user.phone || '',
      website: user.website || '',
      title: user.title || 'MATV Staff',
      category: user.category || 'BUSINESS',
      socialLinks: {
        twitter: user.socialLinks?.twitter || '',
        linkedin: user.socialLinks?.linkedin || ''
      }
    }));
    
    const result = await Author.insertMany(authorData);
    
    res.status(201).json({
      message: `Successfully created ${result.length} authors from users`,
      count: result.length
    });
  } catch (error) {
    console.error('Error syncing authors from users:', error);
    res.status(500).json({ 
      message: 'Failed to sync authors from users',
      error: error.message 
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const publishedDate = new Date(date);
  const diffInSeconds = Math.floor((now - publishedDate) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

// GET /authors/:id/content - Get all content by author
router.get('/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // First get the author to get the name, title, category and social links
    const author = await Author.findById(id).select('name title category socialLinks');
    
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }
    
    // Import the models here to avoid circular dependencies
    const Blog = mongoose.model('Blog');
    const HomeContent = mongoose.model('HomeContent');
    
    // Fetch blogs and home contents in parallel, along with counts
    const [blogs, homeContents, blogCount, homeContentCount] = await Promise.all([
      Blog.find({ author: author.name, status: 'published' })
        .sort({ publishedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('title content imageUrl publishedAt slug tags views likes')
        .lean(),
      
      HomeContent.find({ author: author.name, status: 'published' })
        .sort({ publishedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('title content imageUrl publishedAt slug tags views likes')
        .lean(),
        
      Blog.countDocuments({ author: author.name, status: 'published' }),
      
      HomeContent.countDocuments({ author: author.name, status: 'published' })
    ]);
    
    // Combine and sort by publishedAt
    const allContent = [...blogs, ...homeContents]
      .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
      .slice(0, limit);
    
    // Format the response
    const formattedContent = allContent.map(item => ({
      _id: item._id,
      title: item.title,
      subtitle: item.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
      image: item.imageUrl,
      publishedAt: item.publishedAt || item.createdAt,
      timeAgo: getTimeAgo(item.publishedAt || item.createdAt),
      slug: item.slug,
      tags: item.tags || [],
      views: item.views || 0,
      likes: item.likes || 0,
      trending: item.views > 1000 // Just an example condition
    }));
    
    // Calculate total items and whether there are more
    const totalItems = blogCount + homeContentCount;
    const totalFetched = (page - 1) * limit + formattedContent.length;
    const hasMore = totalFetched < totalItems;
    
    res.json({
      content: formattedContent,
      totalItems: totalItems,
      currentItems: formattedContent.length,
      hasMore: hasMore,
      author: author.name,
      title: author.title || 'MATV Staff',
      category: author.category || 'BUSINESS',
      socialLinks: author.socialLinks || { twitter: '', linkedin: '' }
    });
  } catch (error) {
    console.error('Error fetching author content:', error);
    res.status(500).json({ message: 'Failed to fetch author content' });
  }
});

export default router;
