import React, { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your blog content..."
}) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  return (
    <div className="rich-text-editor">
      <style jsx global>{`
        .ql-editor {
          min-height: 300px;
          background-color: #0d0e0a;
          color: #d1d5db;
          border-radius: 0.75rem;
        }
        
        .ql-toolbar {
          background-color: #15170f;
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border: 1px solid #1f2937;
        }
        
        .ql-container {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border: 1px solid #1f2937;
          border-top: none;
        }
        
        .ql-toolbar .ql-stroke {
          fill: none;
          stroke: #9ca3af;
        }
        
        .ql-toolbar .ql-fill {
          fill: #9ca3af;
          stroke: none;
        }
        
        .ql-toolbar .ql-picker-label {
          color: #9ca3af;
        }
        
        .ql-toolbar button:hover,
        .ql-toolbar button:focus {
          color: #22d3ee;
        }
        
        .ql-toolbar button.ql-active {
          color: #22d3ee;
        }
        
        .ql-editor.ql-blank::before {
          color: #6b7280;
          font-style: italic;
        }
        
        .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
          color: #f3f4f6;
        }
        
        .ql-editor blockquote {
          border-left: 4px solid #22d3ee;
          background-color: #15170f;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .ql-editor code {
          background-color: #15170f;
          color: #d1d5db;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }
        
        .ql-editor pre {
          background-color: #15170f;
          color: #d1d5db;
          padding: 1rem;
          border-radius: 0.75rem;
          overflow-x: auto;
        }
      `}</style>
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;