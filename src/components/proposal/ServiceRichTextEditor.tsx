import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ServiceRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'align',
  'link'
];

export function ServiceRichTextEditor({ value, onChange, placeholder }: ServiceRichTextEditorProps) {
  return (
    <div className="service-rich-editor">
      <style>{`
        .service-rich-editor .ql-container {
          min-height: 120px;
          font-size: 14px;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }
        .service-rich-editor .ql-toolbar {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          background: hsl(var(--muted) / 0.3);
        }
        .service-rich-editor .ql-editor {
          min-height: 100px;
        }
        .service-rich-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: hsl(var(--muted-foreground));
        }
        .dark .service-rich-editor .ql-toolbar {
          border-color: hsl(var(--border));
          background: hsl(var(--muted) / 0.2);
        }
        .dark .service-rich-editor .ql-container {
          border-color: hsl(var(--border));
        }
        .dark .service-rich-editor .ql-editor {
          color: hsl(var(--foreground));
        }
        .dark .service-rich-editor .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .dark .service-rich-editor .ql-fill {
          fill: hsl(var(--foreground));
        }
        .dark .service-rich-editor .ql-picker-label {
          color: hsl(var(--foreground));
        }
        .dark .service-rich-editor .ql-picker-options {
          background: hsl(var(--popover));
          border-color: hsl(var(--border));
        }
        .dark .service-rich-editor .ql-picker-item {
          color: hsl(var(--foreground));
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
