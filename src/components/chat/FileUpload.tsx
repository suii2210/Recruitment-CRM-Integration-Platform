import React, { useRef } from 'react';
import { Upload, Image, File, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onClose: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const openFileDialog = (accept?: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept || '*/*';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-gray-200 rounded-lg shadow-xl p-4 w-64">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white dark:text-white light:text-gray-900">Share File</h3>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 dark:text-slate-400 light:text-gray-500 hover:text-white dark:hover:text-white light:hover:text-gray-900"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => openFileDialog('image/*')}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-white dark:text-white light:text-gray-900 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
        >
          <Image className="w-4 h-4" />
          <span className="text-sm">Photo</span>
        </button>
        
        <button
          onClick={() => openFileDialog()}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-white dark:text-white light:text-gray-900 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
        >
          <File className="w-4 h-4" />
          <span className="text-sm">Document</span>
        </button>
        
        <button
          onClick={() => openFileDialog()}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-white dark:text-white light:text-gray-900 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm">Other</span>
        </button>
      </div>
    </div>
  );
};

export default FileUpload;