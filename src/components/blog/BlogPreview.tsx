import React from 'react';
import { ArrowLeft, Edit, Calendar, User, Tag, Clock } from 'lucide-react';

interface BlogPreviewProps {
  blog: any;
  onEdit: () => void;
  onBack: () => void;
}

const BlogPreview: React.FC<BlogPreviewProps> = ({ blog, onEdit, onBack }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'draft': return 'text-slate-400 bg-slate-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Blog Preview</h1>
              <p className="text-slate-400">Preview how your blog will appear</p>
            </div>
          </div>
          
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Blog
          </button>
        </div>

        {/* Blog Content */}
        <article className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {/* Featured Image */}
          {blog.imageUrl && (
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-8">
            {/* Status and Meta */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(blog.status)}`}>
                  <Clock className="w-3 h-3" />
                  {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {blog.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(blog.createdAt)}
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              {blog.title}
            </h1>
            
            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-8">
                <Tag className="w-4 h-4 text-slate-400" />
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag: string) => (
                    <span key={tag} className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Content */}
            <div 
              className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-p:text-slate-300 prose-a:text-red-400 prose-strong:text-white prose-blockquote:border-red-500 prose-blockquote:bg-slate-700/50 prose-code:bg-slate-700 prose-code:text-slate-300"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
            
            {/* Publish Date */}
            {blog.publishDate && (
              <div className="mt-8 pt-6 border-t border-slate-700">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {blog.status === 'published' ? 'Published on' : 'Scheduled for'}: {formatDate(blog.publishDate)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogPreview;