import React, { useState } from 'react';
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
import BorderGlow from '../BorderGlow';

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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
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
      {blogs.map((blog) => {
        const isHovered = hoveredCard === blog.id;
        
        const cardContent = (
          <div
            className="overflow-hidden transition-all group"
            style={{
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              backgroundColor: 'rgba(17, 25, 40, 0.75)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.125)'
            }}
            onMouseEnter={() => setHoveredCard(blog.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
          {blog.featured_image ? (
            <div className="aspect-video bg-[#0d0e0a] overflow-hidden">
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
            <div className="aspect-video bg-[#0d0e0a] flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-500" />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
                {blog.status}
              </span>
              {blog.category && (
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
                  {blog.category}
                </span>
              )}
            </div>

            <h3
              onClick={() => onView(blog)}
              className="text-xl font-semibold text-white mb-2 line-clamp-2 cursor-pointer hover:text-cyan-400 transition-colors"
            >
              {blog.title}
            </h3>

            {blog.excerpt && (
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                {blog.excerpt}
              </p>
            )}

            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {blog.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 bg-[#0d0e0a] px-2 py-1 rounded"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
                {blog.tags.length > 3 && (
                  <span className="text-xs text-gray-400 bg-[#0d0e0a] px-2 py-1 rounded">
                    +{blog.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(blog.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {blog.views_count || 0}
              </div>
            </div>

            <div className="text-sm text-gray-400 mb-4">
              By {blog.author_name}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
              <button
                onClick={() => onView(blog)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0d0e0a] border-2 border-green-400 hover:bg-green-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-green-400/20 hover:shadow-green-400/40"
              >
                <Eye className="w-4 h-4" />
                View
              </button>

              {hasPermission('blogs.edit') && (
                <button
                  onClick={() => onEdit(blog)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0d0e0a] border-2 border-green-400 hover:bg-green-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-green-400/20 hover:shadow-green-400/40"
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
                      className="inline-flex items-center justify-center p-2 bg-[#0d0e0a] border-2 border-green-400 hover:bg-green-900 text-white rounded-lg transition-all shadow-lg shadow-green-400/20 hover:shadow-green-400/40"
                      title="Unpublish"
                    >
                      <FileX className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onPublish(blog.id)}
                      className="inline-flex items-center justify-center p-2 bg-[#0d0e0a] border-2 border-green-400 hover:bg-green-900 text-white rounded-lg transition-all shadow-lg shadow-green-400/20 hover:shadow-green-400/40"
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
                    if (confirm(`Are you sure you want to delete "${blog.title}"? This action cannot be undone.`)) {
                      try {
                        onDelete(blog.id);
                      } catch (error) {
                        console.error('Error deleting blog:', error);
                        alert('Failed to delete blog. Please try again.');
                      }
                    }
                  }}
                  className="inline-flex items-center justify-center p-2 bg-[#0d0e0a] border-2 border-red-400 hover:bg-red-900 text-white rounded-lg transition-all shadow-lg shadow-red-400/20 hover:shadow-red-400/40"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          </div>
        );
        
        return (
          <div key={blog.id}>
            <BorderGlow glowColor="#22d3ee" className="w-full">
              {cardContent}
            </BorderGlow>
          </div>
        );
      })}
    </div>
  );
};

export default BlogList;
