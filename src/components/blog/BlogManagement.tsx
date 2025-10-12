import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import { useBlogStore } from '../../store/blogStore';
import { useUserStore } from '../../store/userStore';
import BlogList from './BlogList';
import BlogForm from './BlogForm';
import BlogPreview from './BlogPreview';

const BlogManagement: React.FC = () => {
  const {
    blogs,
    currentBlog,
    loading,
    pagination,
    fetchBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    publishBlog,
    unpublishBlog,
    incrementViewCount,
    setCurrentBlog
  } = useBlogStore();

  const { currentUser, hasPermission } = useUserStore();

  const [view, setView] = useState<'list' | 'form' | 'preview'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    loadBlogs();
  }, [filterStatus, filterCategory]);

  const loadBlogs = async () => {
    try {
      await fetchBlogs({
        status: filterStatus || undefined,
        category: filterCategory || undefined,
        page: pagination.page
      });
    } catch (error) {
      console.error('Error loading blogs:', error);
    }
  };

  const handleCreateNew = () => {
    setCurrentBlog(null);
    setView('form');
  };

  const handleEdit = (blog: any) => {
    setCurrentBlog(blog);
    setView('form');
  };

  const handleView = (blog: any) => {
    setCurrentBlog(blog);
    setView('preview');
  };

  const handleFormSubmit = async (formData: any, status: string) => {
    try {
      if (currentBlog) {
        await updateBlog(currentBlog.id, { ...formData, status });
      } else {
        await createBlog({ ...formData, status });
      }
      setView('list');
      loadBlogs();
    } catch (error: any) {
      alert(error.message || 'Error saving blog');
    }
  };

  const handleDelete = async (blogId: string) => {
    try {
      await deleteBlog(blogId);
      loadBlogs();
      if (view !== 'list') {
        setView('list');
      }
    } catch (error: any) {
      alert(error.message || 'Error deleting blog');
    }
  };

  const handlePublish = async (blogId: string) => {
    try {
      await publishBlog(blogId);
      loadBlogs();
    } catch (error: any) {
      alert(error.message || 'Error publishing blog');
    }
  };

  const handleUnpublish = async (blogId: string) => {
    try {
      await unpublishBlog(blogId);
      loadBlogs();
    } catch (error: any) {
      alert(error.message || 'Error unpublishing blog');
    }
  };

  const handleCancel = () => {
    setCurrentBlog(null);
    setView('list');
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (view === 'form') {
    return (
      <div className="p-6">
        <BlogForm
          blog={currentBlog || undefined}
          currentUser={currentUser}
          onSubmit={handleFormSubmit}
          onDelete={currentBlog ? handleDelete : undefined}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (view === 'preview' && currentBlog) {
    return (
      <div className="p-6">
        <BlogPreview
          blog={currentBlog}
          onBack={handleCancel}
          incrementViewCount={incrementViewCount}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Blog Management</h1>
            <p className="text-slate-400">Create and manage your blog posts</p>
          </div>

          {hasPermission('blogs.create') && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Blog
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blogs..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <BlogList
          blogs={filteredBlogs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onView={handleView}
          hasPermission={hasPermission}
        />
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchBlogs({ ...{ status: filterStatus, category: filterCategory }, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-slate-300">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchBlogs({ ...{ status: filterStatus, category: filterCategory }, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;
