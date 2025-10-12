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
  placeholder = "Start writing your home content..."
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
          background-color: #334155;
          color: #f1f5f9;
          border-radius: 0.5rem;
        }
        
        .ql-toolbar {
          background-color: #475569;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border: 1px solid #475569;
        }
        
        .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border: 1px solid #475569;
          border-top: none;
        }
        
        .ql-toolbar .ql-stroke {
          fill: none;
          stroke: #cbd5e1;
        }
        
        .ql-toolbar .ql-fill {
          fill: #cbd5e1;
          stroke: none;
        }
        
        .ql-toolbar .ql-picker-label {
          color: #cbd5e1;
        }
        
        .ql-toolbar button:hover,
        .ql-toolbar button:focus {
          color: #ef4444;
        }
        
        .ql-toolbar button.ql-active {
          color: #ef4444;
        }
        
        .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: italic;
        }
        
        .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
          color: #f1f5f9;
        }
        
        .ql-editor blockquote {
          border-left: 4px solid #ef4444;
          background-color: #1e293b;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .ql-editor code {
          background-color: #1e293b;
          color: #f1f5f9;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }
        
        .ql-editor pre {
          background-color: #1e293b;
          color: #f1f5f9;
          padding: 1rem;
          border-radius: 0.5rem;
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