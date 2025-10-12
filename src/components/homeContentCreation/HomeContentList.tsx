import React from 'react';
import { 
  Edit, 
  Eye, 
  Trash2, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  Tag
} from 'lucide-react';

interface HomeContentItem {
  id: number;
  title: string;
  content: string;
  author: string;
  publishDate: string;
  publishedAt?: string;
  status: 'published' | 'draft' | 'pending' | 'rejected';
  imageUrl: string;
  tags: string[];
  pages: string[];
  views?: number;
  likes?: number;
  featured?: boolean;
  metaDescription?: string;
  // Backward compatibility
  description?: string;
  subsection?: string;
}

interface HomeContentListProps {
  items: HomeContentItem[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onPreview: (id: number) => void;
  onPublish?: (id: number) => void;
  onToggleFeatured?: (id: number) => void;
}

const HomeContentList: React.FC<HomeContentListProps> = ({ 
  items, 
  onEdit, 
  onDelete, 
  onPreview, 
  onPublish, 
  onToggleFeatured 
}) => {
  console.log('HomeContentList items:', items.map(item => ({ id: item.id, title: item.title, imageUrl: item.imageUrl }))); // Debug log
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'pending':
        return <Clock size={14} className="text-yellow-400" />;
      default:
        return <Clock size={14} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="bg-slate-800 rounded-lg p-6 hover:bg-slate-750 transition-colors">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Content Image */}
            {item.imageUrl && item.imageUrl.trim() !== '' && (
              <div className="flex-shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full lg:w-32 h-32 object-cover rounded-lg"
                  onError={(e) => {
                    console.log('Image failed to load:', item.imageUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Content Details */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 mb-3">
                    {item.description || item.metaDescription || 
                     (item.content ? item.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`${getStatusColor(item.status)} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1`}>
                    {getStatusIcon(item.status)}
                    <span>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                  </span>
                </div>
              </div>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center space-x-1">
                  <User size={16} />
                  <span>{item.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Created: {new Date(item.publishDate).toLocaleDateString()}</span>
                </div>
                {item.publishedAt && (
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>Published: {new Date(item.publishedAt).toLocaleDateString()}</span>
                  </div>
                )}
                
                
                {item.pages && item.pages.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-400">Section:</span>
                    <span className="text-blue-400 font-medium">
                      {item.pages.map(section => 
                        section.replace('-', ' ').toUpperCase()
                      ).join(', ')}
                    </span>
                  </div>
                )}
                {item.pages.includes('technology') && item.subsection && (
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400">Subsection:</span>
                  <span className="text-indigo-400 font-medium">
                    {item.subsection.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase())}
                  </span>
                </div>
              )}

                {item.views !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Eye size={16} />
                    <span>{item.views} views</span>
                  </div>
                )}
                {item.likes !== undefined && (
                  <div className="flex items-center space-x-1">
                    <span>❤️</span>
                    <span>{item.likes} likes</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tag size={16} className="text-slate-400" />
                  {item.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                {item.status === 'draft' && onPublish && (
                  <button 
                    onClick={() => onPublish(item.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <CheckCircle size={16} />
                    <span>Publish</span>
                  </button>
                )}
                {onToggleFeatured && (
                  <button 
                    onClick={() => onToggleFeatured(item.id)}
                    className={`${item.featured ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-slate-600 hover:bg-slate-500'} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors`}
                  >
                    <span>{item.featured ? '★' : '☆'}</span>
                    <span>{item.featured ? 'Featured' : 'Feature'}</span>
                  </button>
                )}
                <button 
                  onClick={() => onPreview(item.id)}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </button>
                <button 
                  onClick={() => onEdit(item.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeContentList;