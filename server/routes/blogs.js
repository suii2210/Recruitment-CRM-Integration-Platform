import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all blogs
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, author_id, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('blogs')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (author_id) {
      query = query.eq('author_id', author_id);
    }

    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      blogs: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
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
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ message: 'Error fetching blog', error: error.message });
  }
});

// Get blog by slug
router.get('/slug/:slug', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(data);
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
      author_id: req.user.id,
      category,
      tags: tags || [],
      status,
      created_by: req.user.id,
      updated_by: req.user.id,
      published_at: status === 'published' ? new Date().toISOString() : null
    };

    const { data, error } = await supabase
      .from('blogs')
      .insert([blogData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ message: 'Error creating blog', error: error.message });
  }
});

// Update blog
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      excerpt,
      featured_image,
      author_name,
      category,
      tags,
      status
    } = req.body;

    const updateData = {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(featured_image !== undefined && { featured_image }),
      ...(author_name && { author_name }),
      ...(category !== undefined && { category }),
      ...(tags && { tags }),
      ...(status && { status }),
      updated_by: req.user.id
    };

    // If changing to published, set published_at
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('blogs')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ message: 'Error updating blog', error: error.message });
  }
});

// Delete blog
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Error deleting blog', error: error.message });
  }
});

// Publish blog
router.patch('/:id/publish', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_by: req.user.id
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error publishing blog:', error);
    res.status(500).json({ message: 'Error publishing blog', error: error.message });
  }
});

// Unpublish blog
router.patch('/:id/unpublish', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .update({
        status: 'draft',
        updated_by: req.user.id
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error unpublishing blog:', error);
    res.status(500).json({ message: 'Error unpublishing blog', error: error.message });
  }
});

// Increment view count
router.post('/:id/view', async (req, res) => {
  try {
    const { data: blog, error: fetchError } = await supabase
      .from('blogs')
      .select('views_count')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const { data, error } = await supabase
      .from('blogs')
      .update({ views_count: (blog.views_count || 0) + 1 })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ message: 'Error incrementing view count', error: error.message });
  }
});

export default router;
