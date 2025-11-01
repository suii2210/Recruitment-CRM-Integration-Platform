import React, { useState, useEffect } from 'react';
import { Save, Send, Trash2, Calendar, Tag, Eye, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from '../contentCreation/RichTextEditor';
import { Blog } from '../../store/blogStore';

interface BlogFormProps {
  blog?: Blog;
  currentUser: any;
  onSubmit: (formData: any, status: string) => Promise<void>;
  onDelete?: (blogId: string) => void;
  onCancel: () => void;
}

const BlogForm: React.FC<BlogFormProps> = ({
  blog,
  currentUser,
  onSubmit,
  onDelete,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: blog?.title || '',
    slug: blog?.slug || '',
    content: blog?.content || '',
    excerpt: blog?.excerpt || '',
    featured_image: blog?.featured_image || '',
    author_name: blog?.author_name || currentUser?.name || '',
    category: blog?.category || '',
    website: blog?.website || 'Conservative', // Default to Conservative
    tags: blog?.tags || []
  });

  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (formData.title && !slugManuallyEdited) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, slugManuallyEdited]);

  useEffect(() => {
    if (blog?.slug) {
      setSlugManuallyEdited(false); // Allow auto-generation even for existing blogs
    }
  }, [blog]);

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (status: string) => {
    if (!formData.title || !formData.content || !formData.slug) {
      alert('Please fill in all required fields (title, slug, content)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData, status);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (blog && onDelete && confirm('Are you sure you want to delete this blog?')) {
      onDelete(blog.id);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: uploadFormData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const fullImageUrl = `${window.location.origin}${result.imageUrl}`;
      setFormData(prev => ({ ...prev, featured_image: fullImageUrl }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <style jsx>{`
        select option:checked,
        select option:hover {
          background-color: #16a34a !important;
          color: white !important;
        }
        select:focus option:checked {
          background: linear-gradient(0deg, #16a34a 0%, #16a34a 100%) !important;
        }
      `}</style>
      <div className="bg-[#15170f] rounded-2xl border border-gray-800/50 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 rounded-lg bg-[#0d0e0a] text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-white">
              {blog ? 'Edit Blog' : 'Create New Blog'}
            </h2>
          </div>

          <div className="flex gap-2">
            {blog && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[#0d0e0a] hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit('published')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-black border-2 border-green-400 hover:bg-green-900 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-lg shadow-green-400/20"
            >
              <Send className="w-4 h-4" />
              Publish
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter blog title"
              className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, slug: e.target.value }));
                setSlugManuallyEdited(true);
              }}
              placeholder="url-friendly-slug"
              className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
            />
            <p className="text-gray-400 text-xs mt-1">
              URL-friendly version of the title (auto-generated from title)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief summary of the blog post"
              rows={3}
              className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Featured Image URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={formData.featured_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center gap-2 bg-[#0d0e0a] hover:bg-gray-800 text-white px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </label>
            </div>
            {formData.featured_image && (
              <div className="mt-2">
                <img
                  src={formData.featured_image}
                  alt="Featured preview"
                  className="w-full h-48 object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23334155"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="18"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Author Name *
              </label>
              <input
                type="text"
                value={formData.author_name}
                onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                placeholder="Author name"
                className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20 transition-all"
              >
                <option value="">Select Category</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Travel">Travel</option>
                <option value="Food">Food</option>
                <option value="Health">Health</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Sports">Sports</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <select
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:border-gray-700 transition-colors"
            >
              <option value="">Select Website</option>
              <option value="Conservative">Conservative</option>
              <option value="Bihaan">Bihaan</option>
              <option value="Pkltd">Pkltd</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag"
                className="flex-1 bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-2 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex items-center gap-2 bg-[#0d0e0a] hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Tag className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-cyan-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={handleContentChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogForm;