import React, { useEffect } from 'react';
import { ArrowLeft, Calendar, Eye, Tag, User } from 'lucide-react';
import { Blog } from '../../store/blogStore';

interface BlogPreviewProps {
  blog: Blog;
  onBack: () => void;
  incrementViewCount?: (id: string) => void;
}

const BlogPreview: React.FC<BlogPreviewProps> = ({ blog, onBack, incrementViewCount }) => {
  useEffect(() => {
    if (incrementViewCount && blog.status === 'published') {
      incrementViewCount(blog.id);
    }
  }, [blog.id, blog.status, incrementViewCount]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Blogs
        </button>
      </div>

      <article className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {blog.featured_image && (
          <div className="aspect-video bg-slate-700 overflow-hidden">
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            {blog.status && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                blog.status === 'published'
                  ? 'bg-green-500/20 text-green-400'
                  : blog.status === 'draft'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {blog.status}
              </span>
            )}
            {blog.category && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                {blog.category}
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-xl text-slate-300 mb-6 leading-relaxed">
              {blog.excerpt}
            </p>
          )}

          <div className="flex items-center gap-6 text-sm text-slate-400 mb-6 pb-6 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{blog.author_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(blog.published_at || blog.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{blog.views_count || 0} views</span>
            </div>
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="prose prose-invert prose-slate max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-slate-300 prose-p:leading-relaxed
              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-ul:text-slate-300 prose-ol:text-slate-300
              prose-li:text-slate-300
              prose-blockquote:border-l-blue-500 prose-blockquote:text-slate-300
              prose-code:text-blue-400 prose-code:bg-slate-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-slate-700 prose-pre:border prose-pre:border-slate-600
              prose-img:rounded-lg prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          <div className="mt-8 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Last updated: {formatDate(blog.updated_at)}
              </div>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blogs
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPreview;
