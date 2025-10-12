import React, { useState } from 'react';
import {
  ArrowLeft,
  Upload,
  Plus,
  X,
  Trash2
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import ImageUpload from './ImageUpload';
import { useUserStore } from '../../store/userStore';

interface HomeContentFormProps {
  onBack: () => void;
  content?: any;
  isEdit?: boolean;
  onSubmit: (formData: any, status: string) => Promise<void>;
  onDelete?: (id: string) => void;
}

const HomeContentForm: React.FC<HomeContentFormProps> = ({
  onBack,
  content,
  isEdit = false,
  onSubmit,
  onDelete
}) => {
  const [title, setTitle] = useState(content?.title || '');
  const [contentText, setContentText] = useState(content?.content || '');
  const [publishDate, setPublishDate] = useState(content?.publishDate?.split('T')[0] || '');
  const [tags, setTags] = useState<string[]>(content?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [pages, setPages] = useState(content?.pages?.[0] || '');
  const [metaDescription, setMetaDescription] = useState(content?.metaDescription || '');
  const [imageUrl, setImageUrl] = useState(content?.imageUrl || '');
  const [subsection, setSubsection] = useState(content?.subsection || '');


  // Update imageUrl when content changes (for edit mode)
  React.useEffect(() => {
    if (content?.imageUrl) {
      setImageUrl(content.imageUrl);
    }
  }, [content?.imageUrl]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useUserStore();

  const canPublishDirectly = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (status: string) => {
    if (!title.trim() || !contentText.trim()) {
      alert('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting with imageUrl:', imageUrl); // Debug log
      await onSubmit({
        title,
        content: contentText,
        author: currentUser?.name || 'Unknown',
        publishDate: publishDate || new Date().toISOString().split('T')[0],
        status,
        tags,
        pages: pages ? [pages] : [],
        subsection: (pages === 'technology' && subsection) ? subsection : '',
        metaDescription,
        imageUrl,
        featured: false
      }, status);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (content && confirm('Are you sure you want to delete this item?')) {
      onDelete?.(content.id);
    }
  };

  const handlePublish = () => {
    if (canPublishDirectly) {
      handleSubmit('published');
    } else {
      handleSubmit('pending');
      alert('Your content has been submitted for admin approval.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? 'Edit Home Content' : 'Create New Home Content'}
          </h1>
          <p className="text-slate-400">
            {canPublishDirectly ? 'Publish immediately or save as draft' : 'Submit for review or save as draft'}
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        {/* Admin status */}
        <div className={`rounded-lg p-3 mb-6 border ${canPublishDirectly ? 'bg-green-900/20 border-green-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${canPublishDirectly ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className={`text-sm font-medium ${canPublishDirectly ? 'text-green-400' : 'text-yellow-400'}`}>
              {canPublishDirectly
                ? 'Administrator Mode - You can publish directly'
                : 'Editor Mode - Content will require admin approval'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="text-white block text-sm font-medium mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter home content title..."
            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Meta Description */}
        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            Meta Description
          </label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Brief description for SEO (max 160 characters)..."
            maxLength={160}
            rows={3}
            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-xs text-slate-400 mt-1">
            {metaDescription.length}/160 characters
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="mb-6">
          <label className="text-white block text-sm font-medium mb-2">
            Content Body <span className="text-red-400">*</span>
          </label>
          <RichTextEditor
            value={contentText}
            onChange={setContentText}
            placeholder="Write your content here..."
          />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Featured Image */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Featured Image
            </label>
            <ImageUpload
              onImageSelect={(url) => setImageUrl(url || '')}
              currentImage={imageUrl}
            />
          </div>

          {/* Right Side Inputs */}
          <div className="space-y-6">
            {/* Publish Date */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Publish Date</label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Tags</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddTag}
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span key={index} className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-blue-600 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Page Select */}
            <div>
  <label className="block text-white text-sm font-medium mb-2">Select Section</label>
  <select
    value={pages}
    onChange={(e) => {
      const value = e.target.value;
      setPages(value);
      if (value !== 'technology') setSubsection(''); // reset subsection if not tech
    }}
    className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select section...</option>
    <option value="latest-news">LATEST NEWS</option>
    <option value="deep-dive">DEEP DIVE</option>
    <option value="top-stories">TOP STORIES</option>
    <option value="community">COMMUNITY</option>
    <option value="money">MONEY</option>
    <option value="sports">SPORTS</option>
    <option value="technology">TECHNOLOGY</option>
  </select>
</div>



          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-700">
          <div className="flex gap-4">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
              className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {isSubmitting
                ? canPublishDirectly ? 'Publishing...' : 'Submitting...'
                : canPublishDirectly ? 'Publish Now' : 'Submit for Review'}
            </button>
          </div>
          {isEdit && content && onDelete && (
            <button
              onClick={handleDelete}
              className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg"
            >
              <Trash2 size={16} className="inline-block mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeContentForm;
