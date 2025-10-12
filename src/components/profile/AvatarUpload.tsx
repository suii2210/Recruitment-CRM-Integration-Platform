import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';

interface AvatarUploadProps {
  onImageSelect: (imageUrl: string | null) => void;
  currentImage?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  onImageSelect, 
  currentImage,
  size = 'md'
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(API_ENDPOINTS.UPLOAD.IMAGE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const fullImageUrl = `${window.location.origin}${result.imageUrl}`;
      
      onImageSelect(fullImageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <button
        onClick={openFileDialog}
        disabled={uploading}
        className={`
          ${sizeClasses[size]} bg-slate-700 hover:bg-slate-600 rounded-full border-2 border-slate-800 
          transition-colors flex items-center justify-center
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Change avatar"
      >
        {uploading ? (
          <div className={`animate-spin rounded-full border-b-2 border-slate-300 ${iconSizes[size]}`}></div>
        ) : (
          <Camera className={`${iconSizes[size]} text-slate-300`} />
        )}
      </button>
    </>
  );
};

export default AvatarUpload;