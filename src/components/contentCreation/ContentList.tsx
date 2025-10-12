import React from 'react';
import { Edit, Trash2, Eye, Calendar, User, Tag } from 'lucide-react';

interface ContentListProps {
  contents: any[];
  onEdit: (content: any) => void;
  onDelete: (contentId: string) => void;
  onPreview: (content: any) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => any;
}

const ContentList: React.FC<ContentListProps> = ({
  contents,
  onEdit,
  onDelete,
  onPreview,
  getStatusColor,
  getStatusIcon
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...'
      : textContent;
  };

  if (contents.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Edit className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No contents found</h3>
        <p className="text-slate-400 mb-6">Get started by creating your first content</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {contents.map((content) => {
        const StatusIcon = getStatusIcon(content.status);
        
        return (
          <div key={content.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Featured Image */}
                {content.imageUrl && (
                  <div className="lg:w-48 lg:flex-shrink-0">
                    <img
                      src={content.imageUrl}
                      alt={content.title}
                      className="w-full h-32 lg:h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                        {content.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-3">
                        {truncateContent(content.content)}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(content.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                    </div>
                  </div>
                  
                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {content.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(content.createdAt)}
                    </div>
                    {content.publishDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Publish: {formatDate(content.publishDate)}
                      </div>
                    )}
                  </div>
                  
                  {/* Tags */}
                  {content.tags && content.tags.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <div className="flex flex-wrap gap-2">
                        {content.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {content.tags.length > 3 && (
                          <span className="text-slate-400 text-xs">
                            +{content.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreview(content)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => onEdit(content)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(content.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContentList;