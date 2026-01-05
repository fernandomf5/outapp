import { forwardRef, useEffect, useRef, useState, useImperativeHandle } from "react";
import { EditorElement } from "@/pages/PageEditor";

interface EditorCanvasProps {
  html: string;
  elements: EditorElement[];
  selectedElement: EditorElement | null;
  onSelectElement: (element: EditorElement | null) => void;
  onElementUpdate: (element: EditorElement) => void;
  onHtmlChange: (html: string) => void;
  isPreview: boolean;
  viewMode: 'desktop' | 'tablet' | 'mobile';
}

export const EditorCanvas = forwardRef<HTMLIFrameElement, EditorCanvasProps>(({
  html,
  elements,
  selectedElement,
  onSelectElement,
  onElementUpdate,
  onHtmlChange,
  isPreview,
  viewMode
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useImperativeHandle(ref, () => iframeRef.current!);

  useEffect(() => {
    if (iframeRef.current && html) {
      updateIframeContent();
    }
  }, [html, elements, isPreview]);

  const updateIframeContent = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    // Inject editor styles and scripts
    const editorStyles = isPreview ? '' : `
      <style>
        [data-editor-element] {
          position: relative;
          outline: 2px dashed transparent;
          transition: outline-color 0.2s;
        }
        [data-editor-element]:hover {
          outline-color: #3b82f6;
          cursor: pointer;
        }
        [data-editor-element].selected {
          outline-color: #8b5cf6;
          outline-style: solid;
        }
        [data-editor-element][contenteditable="true"] {
          outline-color: #10b981;
          outline-style: solid;
        }
        .editor-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 9999;
        }
        .editor-new-element {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
          border: 2px dashed #3b82f6;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 10px 0;
          border-radius: 8px;
        }
        .editor-new-element:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
        }
      </style>
    `;

    const editorScript = isPreview ? '' : `
      <script>
        document.addEventListener('click', function(e) {
          const element = e.target.closest('[data-editor-element]');
          if (element) {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove selected class from all
            document.querySelectorAll('[data-editor-element].selected').forEach(el => {
              el.classList.remove('selected');
            });
            
            // Add selected class
            element.classList.add('selected');
            
            // Send message to parent
            window.parent.postMessage({
              type: 'element-selected',
              elementId: element.dataset.editorElement
            }, '*');
          }
        });

        document.addEventListener('dblclick', function(e) {
          const element = e.target.closest('[data-editor-element]');
          if (element && element.dataset.editorType === 'text') {
            e.preventDefault();
            element.contentEditable = 'true';
            element.focus();
            
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(element);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        });

        document.addEventListener('blur', function(e) {
          if (e.target.contentEditable === 'true') {
            e.target.contentEditable = 'false';
            
            // Send updated content to parent
            window.parent.postMessage({
              type: 'content-updated',
              elementId: e.target.dataset.editorElement,
              content: e.target.innerHTML
            }, '*');
          }
        }, true);

        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && document.activeElement.contentEditable === 'true') {
            document.activeElement.blur();
          }
        });
      </script>
    `;

    // Parse and modify HTML to add editor attributes
    let modifiedHtml = html;
    
    // Add new elements from the editor
    const newElementsHtml = elements
      .filter(el => el.isNew)
      .map(el => {
        const dataAttrs = `data-editor-element="${el.id}" data-editor-type="${el.type}"`;
        const styleAttr = el.styles ? `style="${Object.entries(el.styles).map(([k, v]) => `${k}:${v}`).join(';')}"` : '';
        
        if (el.type === 'text') {
          return `<div ${dataAttrs} ${styleAttr} class="editor-new-element">${el.newContent || ''}</div>`;
        } else if (el.type === 'image') {
          return `<div ${dataAttrs} ${styleAttr} class="editor-new-element">
            <img src="${el.attributes?.src || 'https://via.placeholder.com/400x200'}" alt="${el.attributes?.alt || 'Imagem'}" style="max-width: 100%; height: auto;" />
          </div>`;
        } else if (el.type === 'video') {
          const videoUrl = el.attributes?.src || '';
          if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const videoId = videoUrl.includes('youtu.be') 
              ? videoUrl.split('/').pop() 
              : new URLSearchParams(new URL(videoUrl).search).get('v');
            return `<div ${dataAttrs} ${styleAttr} class="editor-new-element">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
            </div>`;
          }
          return `<div ${dataAttrs} ${styleAttr} class="editor-new-element">
            <video src="${videoUrl}" controls style="max-width: 100%;"></video>
          </div>`;
        } else if (el.type === 'button') {
          return `<div ${dataAttrs} ${styleAttr} class="editor-new-element">
            <a href="${el.attributes?.href || '#'}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              ${el.newContent || 'Clique Aqui'}
            </a>
          </div>`;
        } else if (el.type === 'section') {
          return `<section ${dataAttrs} ${styleAttr} class="editor-new-element" style="min-height: 200px; padding: 40px 20px;">
            ${el.newContent || '<p>Nova Seção</p>'}
          </section>`;
        } else if (el.type === 'divider') {
          return `<hr ${dataAttrs} ${styleAttr} style="margin: 20px 0; border: none; border-top: 2px solid #e5e7eb;" />`;
        } else if (el.type === 'spacer') {
          const height = el.styles?.height || '40px';
          return `<div ${dataAttrs} ${styleAttr} class="editor-new-element" style="height: ${height}; background: transparent;"></div>`;
        } else if (el.type === 'html') {
          return `<div ${dataAttrs} ${styleAttr} class="editor-new-element">${el.newContent || ''}</div>`;
        }
        return `<div ${dataAttrs} ${styleAttr} class="editor-new-element">${el.newContent || ''}</div>`;
      })
      .join('\n');

    // Insert new elements before closing body tag
    if (newElementsHtml) {
      modifiedHtml = modifiedHtml.replace('</body>', `
        <div id="editor-new-elements" style="padding: 20px;">
          ${newElementsHtml}
        </div>
        </body>
      `);
    }

    // Inject styles and scripts
    modifiedHtml = modifiedHtml.replace('</head>', `${editorStyles}</head>`);
    modifiedHtml = modifiedHtml.replace('</body>', `${editorScript}</body>`);

    doc.open();
    doc.write(modifiedHtml);
    doc.close();
    
    setIframeLoaded(true);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'element-selected') {
        const element = elements.find(el => el.id === event.data.elementId);
        if (element) {
          onSelectElement(element);
        }
      } else if (event.data.type === 'content-updated') {
        const element = elements.find(el => el.id === event.data.elementId);
        if (element) {
          onElementUpdate({
            ...element,
            newContent: event.data.content
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [elements, onSelectElement, onElementUpdate]);

  // Highlight selected element in iframe
  useEffect(() => {
    if (!iframeRef.current || !iframeLoaded) return;
    
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    // Remove all selected classes
    doc.querySelectorAll('[data-editor-element].selected').forEach(el => {
      el.classList.remove('selected');
    });

    // Add selected class to current element
    if (selectedElement) {
      const el = doc.querySelector(`[data-editor-element="${selectedElement.id}"]`);
      if (el) {
        el.classList.add('selected');
      }
    }
  }, [selectedElement, iframeLoaded]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full min-h-[600px] h-[calc(100vh-120px)] border-0"
      sandbox="allow-same-origin allow-scripts allow-forms"
      title="Editor Canvas"
    />
  );
});

EditorCanvas.displayName = 'EditorCanvas';
