import React from 'react';
import {
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag,
  Send,
  FileX,
  Image as ImageIcon
} from 'lucide-react';
import { Blog } from '../../store/blogStore';

interface BlogListProps {
  blogs: Blog[];
  onEdit: (blog: Blog) => void;
  onDelete: (blogId: string) => void;
  onPublish: (blogId: string) => void;
  onUnpublish: (blogId: string) => void;
  onView: (blog: Blog) => void;
  hasPermission: (permission: string) => boolean;
}

const BlogList: React.FC<BlogListProps> = ({
  blogs,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  onView,
  hasPermission
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileX className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No Blogs Found</h3>
        <p className="text-slate-400">Get started by creating your first blog post.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <div
          key={blog.id}
          className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-all group"
        >
          {blog.featured_image ? (
            <div className="aspect-video bg-slate-700 overflow-hidden">
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23334155"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          ) : (
            <div className="aspect-video bg-slate-700 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-slate-500" />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
                {blog.status}
              </span>
              {blog.category && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                  {blog.category}
                </span>
              )}
            </div>

            <h3
              onClick={() => onView(blog)}
              className="text-xl font-semibold text-white mb-2 line-clamp-2 cursor-pointer hover:text-blue-400 transition-colors"
            >
              {blog.title}
            </h3>

            {blog.excerpt && (
              <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                {blog.excerpt}
              </p>
            )}

            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {blog.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
                {blog.tags.length > 3 && (
                  <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                    +{blog.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(blog.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {blog.views_count || 0}
              </div>
            </div>

            <div className="text-sm text-slate-400 mb-4">
              By {blog.author_name}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
              <button
                onClick={() => onView(blog)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Eye className="w-4 h-4" />
                View
              </button>

              {hasPermission('blogs.edit') && (
                <button
                  onClick={() => onEdit(blog)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}

              {hasPermission('blogs.publish') && (
                <>
                  {blog.status === 'published' ? (
                    <button
                      onClick={() => onUnpublish(blog.id)}
                      className="inline-flex items-center justify-center p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                      title="Unpublish"
                    >
                      <FileX className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onPublish(blog.id)}
                      className="inline-flex items-center justify-center p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      title="Publish"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              {hasPermission('blogs.delete') && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this blog?')) {
                      onDelete(blog.id);
                    }
                  }}
                  className="inline-flex items-center justify-center p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BlogList;
