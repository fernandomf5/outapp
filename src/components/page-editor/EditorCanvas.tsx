import { forwardRef, useEffect, useRef, useState, useImperativeHandle } from "react";
import { EditorElement } from "@/pages/PageEditor";

interface EditorCanvasProps {
  html: string;
  elements: EditorElement[];
  selectedElement: EditorElement | null;
  onSelectElement: (element: EditorElement | null) => void;
  onElementUpdate: (element: EditorElement) => void;
  onHtmlChange: (html: string) => void;
  onElementDiscovered: (element: EditorElement) => void;
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
  onElementDiscovered,
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
  }, [html, isPreview]);

  const updateIframeContent = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    // Inject comprehensive editor styles
    const editorStyles = isPreview ? '' : `
      <style id="editor-styles">
        * {
          cursor: pointer !important;
        }
        
        .editor-element-highlight {
          position: relative;
          outline: 2px dashed rgba(59, 130, 246, 0.5) !important;
          outline-offset: 2px;
          transition: outline-color 0.15s ease;
        }
        
        .editor-element-highlight:hover {
          outline-color: rgba(59, 130, 246, 1) !important;
          outline-style: solid !important;
        }
        
        .editor-element-selected {
          outline: 3px solid #8b5cf6 !important;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2) !important;
        }
        
        .editor-element-editing {
          outline: 3px solid #10b981 !important;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2) !important;
        }
        
        .editor-toolbar {
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          gap: 8px;
          z-index: 99999;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .editor-toolbar button {
          background: transparent;
          border: none;
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.15s;
        }
        
        .editor-toolbar button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .editor-toolbar button.danger:hover {
          background: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        
        .editor-context-menu {
          position: fixed;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          min-width: 180px;
          z-index: 99999;
          overflow: hidden;
        }
        
        .editor-context-menu button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          text-align: left;
          transition: background 0.15s;
        }
        
        .editor-context-menu button:hover {
          background: #f3f4f6;
        }
        
        .editor-context-menu button.danger {
          color: #ef4444;
        }
        
        .editor-context-menu button.danger:hover {
          background: #fef2f2;
        }
        
        .editor-element-label {
          position: absolute;
          top: -24px;
          left: 0;
          background: #8b5cf6;
          color: white;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px 4px 0 0;
          font-family: system-ui, sans-serif;
          pointer-events: none;
          z-index: 99998;
        }
        
        .editor-resize-handle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #8b5cf6;
          border: 2px solid white;
          border-radius: 50%;
          cursor: se-resize;
        }
        
        .editor-resize-handle.se { bottom: -5px; right: -5px; }
        .editor-resize-handle.sw { bottom: -5px; left: -5px; cursor: sw-resize; }
        .editor-resize-handle.ne { top: -5px; right: -5px; cursor: ne-resize; }
        .editor-resize-handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
      </style>
    `;

    const editorScript = isPreview ? '' : `
      <script id="editor-script">
        (function() {
          let selectedElement = null;
          let contextMenu = null;
          let toolbar = null;
          
          // Elements we want to make editable
          const editableSelectors = 'h1, h2, h3, h4, h5, h6, p, span, a, button, img, video, iframe, section, div, header, footer, nav, article, aside, figure, figcaption, ul, ol, li, blockquote, table, form, input, textarea, select, label';
          
          function getElementType(el) {
            const tag = el.tagName.toLowerCase();
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'heading';
            if (['p', 'span', 'blockquote', 'li'].includes(tag)) return 'text';
            if (tag === 'img') return 'image';
            if (tag === 'video' || tag === 'iframe') return 'video';
            if (tag === 'a') return 'link';
            if (tag === 'button' || (tag === 'a' && el.classList.contains('btn'))) return 'button';
            if (['section', 'div', 'header', 'footer', 'nav', 'article', 'aside'].includes(tag)) return 'container';
            if (['input', 'textarea', 'select'].includes(tag)) return 'form-field';
            return 'element';
          }
          
          function getElementLabel(el) {
            const tag = el.tagName.toLowerCase();
            const type = getElementType(el);
            const labels = {
              'heading': tag.toUpperCase(),
              'text': 'Texto',
              'image': 'Imagem',
              'video': 'Vídeo',
              'link': 'Link',
              'button': 'Botão',
              'container': 'Seção',
              'form-field': 'Campo',
              'element': tag.toUpperCase()
            };
            return labels[type] || tag.toUpperCase();
          }
          
          function generateUniqueId() {
            return 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          }
          
          function closeContextMenu() {
            if (contextMenu) {
              contextMenu.remove();
              contextMenu = null;
            }
          }
          
          function closeToolbar() {
            if (toolbar) {
              toolbar.remove();
              toolbar = null;
            }
          }
          
          function showToolbar(el) {
            closeToolbar();
            
            const type = getElementType(el);
            
            toolbar = document.createElement('div');
            toolbar.className = 'editor-toolbar';
            
            // Edit button
            if (['heading', 'text', 'link', 'button'].includes(type)) {
              const editBtn = document.createElement('button');
              editBtn.innerHTML = '✏️ Editar Texto';
              editBtn.onclick = () => startEditing(el);
              toolbar.appendChild(editBtn);
            }
            
            // Image change button
            if (type === 'image') {
              const imgBtn = document.createElement('button');
              imgBtn.innerHTML = '🖼️ Trocar Imagem';
              imgBtn.onclick = () => {
                window.parent.postMessage({
                  type: 'change-image',
                  elementId: el.dataset.editorId,
                  currentSrc: el.src
                }, '*');
              };
              toolbar.appendChild(imgBtn);
            }
            
            // Link button for links/buttons
            if (type === 'link' || type === 'button') {
              const linkBtn = document.createElement('button');
              linkBtn.innerHTML = '🔗 Editar Link';
              linkBtn.onclick = () => {
                window.parent.postMessage({
                  type: 'edit-link',
                  elementId: el.dataset.editorId,
                  currentHref: el.href || ''
                }, '*');
              };
              toolbar.appendChild(linkBtn);
            }
            
            // Style button
            const styleBtn = document.createElement('button');
            styleBtn.innerHTML = '🎨 Estilos';
            styleBtn.onclick = () => {
              window.parent.postMessage({
                type: 'edit-styles',
                elementId: el.dataset.editorId,
                currentStyles: el.getAttribute('style') || ''
              }, '*');
            };
            toolbar.appendChild(styleBtn);
            
            // Duplicate button
            const dupBtn = document.createElement('button');
            dupBtn.innerHTML = '📋 Duplicar';
            dupBtn.onclick = () => duplicateElement(el);
            toolbar.appendChild(dupBtn);
            
            // Delete button
            const delBtn = document.createElement('button');
            delBtn.className = 'danger';
            delBtn.innerHTML = '🗑️ Excluir';
            delBtn.onclick = () => deleteElement(el);
            toolbar.appendChild(delBtn);
            
            document.body.appendChild(toolbar);
          }
          
          function startEditing(el) {
            el.classList.add('editor-element-editing');
            el.contentEditable = 'true';
            el.focus();
            
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
          
          function stopEditing(el) {
            el.classList.remove('editor-element-editing');
            el.contentEditable = 'false';
            
            // Send updated content
            window.parent.postMessage({
              type: 'content-updated',
              elementId: el.dataset.editorId,
              content: el.innerHTML,
              outerHtml: document.documentElement.outerHTML
            }, '*');
          }
          
          function duplicateElement(el) {
            const clone = el.cloneNode(true);
            clone.dataset.editorId = generateUniqueId();
            el.parentNode.insertBefore(clone, el.nextSibling);
            
            window.parent.postMessage({
              type: 'element-duplicated',
              elementId: clone.dataset.editorId,
              outerHtml: document.documentElement.outerHTML
            }, '*');
            
            closeToolbar();
          }
          
          function deleteElement(el) {
            const id = el.dataset.editorId;
            el.remove();
            
            window.parent.postMessage({
              type: 'element-deleted',
              elementId: id,
              outerHtml: document.documentElement.outerHTML
            }, '*');
            
            closeToolbar();
            selectedElement = null;
          }
          
          function selectElement(el) {
            // Deselect previous
            if (selectedElement) {
              selectedElement.classList.remove('editor-element-selected');
            }
            
            selectedElement = el;
            el.classList.add('editor-element-selected');
            
            // Ensure it has an ID
            if (!el.dataset.editorId) {
              el.dataset.editorId = generateUniqueId();
            }
            
            showToolbar(el);
            
            // Notify parent
            window.parent.postMessage({
              type: 'element-selected',
              elementId: el.dataset.editorId,
              elementType: getElementType(el),
              elementLabel: getElementLabel(el),
              tagName: el.tagName.toLowerCase(),
              content: el.innerHTML,
              src: el.src || el.querySelector('img')?.src || '',
              href: el.href || '',
              styles: el.getAttribute('style') || ''
            }, '*');
          }
          
          // Initialize all editable elements
          function initElements() {
            document.querySelectorAll(editableSelectors).forEach(el => {
              if (!el.dataset.editorId) {
                el.dataset.editorId = generateUniqueId();
              }
              el.classList.add('editor-element-highlight');
            });
          }
          
          // Click handler
          document.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            closeContextMenu();
            
            // Find closest editable element
            const el = e.target.closest(editableSelectors);
            if (el) {
              selectElement(el);
            }
          }, true);
          
          // Double click for text editing
          document.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const el = e.target.closest(editableSelectors);
            if (el) {
              const type = getElementType(el);
              if (['heading', 'text', 'link', 'button'].includes(type)) {
                startEditing(el);
              }
            }
          }, true);
          
          // Blur handler for text editing
          document.addEventListener('blur', function(e) {
            if (e.target.contentEditable === 'true') {
              stopEditing(e.target);
            }
          }, true);
          
          // Keyboard shortcuts
          document.addEventListener('keydown', function(e) {
            // Escape to deselect
            if (e.key === 'Escape') {
              if (document.activeElement.contentEditable === 'true') {
                document.activeElement.blur();
              } else if (selectedElement) {
                selectedElement.classList.remove('editor-element-selected');
                selectedElement = null;
                closeToolbar();
                window.parent.postMessage({ type: 'element-deselected' }, '*');
              }
            }
            
            // Delete key to remove element
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && document.activeElement.contentEditable !== 'true') {
              e.preventDefault();
              deleteElement(selectedElement);
            }
            
            // Ctrl+D to duplicate
            if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedElement) {
              e.preventDefault();
              duplicateElement(selectedElement);
            }
          });
          
          // Context menu
          document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            
            const el = e.target.closest(editableSelectors);
            if (!el) return;
            
            selectElement(el);
            closeContextMenu();
            
            const type = getElementType(el);
            
            contextMenu = document.createElement('div');
            contextMenu.className = 'editor-context-menu';
            contextMenu.style.left = e.clientX + 'px';
            contextMenu.style.top = e.clientY + 'px';
            
            const actions = [];
            
            if (['heading', 'text', 'link', 'button'].includes(type)) {
              actions.push({ icon: '✏️', label: 'Editar Texto', action: () => { startEditing(el); closeContextMenu(); }});
            }
            
            if (type === 'image') {
              actions.push({ icon: '🖼️', label: 'Trocar Imagem', action: () => {
                window.parent.postMessage({ type: 'change-image', elementId: el.dataset.editorId, currentSrc: el.src }, '*');
                closeContextMenu();
              }});
            }
            
            if (type === 'link' || type === 'button') {
              actions.push({ icon: '🔗', label: 'Editar Link', action: () => {
                window.parent.postMessage({ type: 'edit-link', elementId: el.dataset.editorId, currentHref: el.href }, '*');
                closeContextMenu();
              }});
            }
            
            actions.push({ icon: '🎨', label: 'Editar Estilos', action: () => {
              window.parent.postMessage({ type: 'edit-styles', elementId: el.dataset.editorId, currentStyles: el.getAttribute('style') || '' }, '*');
              closeContextMenu();
            }});
            
            actions.push({ icon: '📋', label: 'Duplicar', action: () => { duplicateElement(el); closeContextMenu(); }});
            actions.push({ icon: '🗑️', label: 'Excluir', action: () => { deleteElement(el); closeContextMenu(); }, danger: true });
            
            actions.forEach(item => {
              const btn = document.createElement('button');
              btn.innerHTML = item.icon + ' ' + item.label;
              if (item.danger) btn.className = 'danger';
              btn.onclick = item.action;
              contextMenu.appendChild(btn);
            });
            
            document.body.appendChild(contextMenu);
          });
          
          // Close context menu on click outside
          document.addEventListener('mousedown', function(e) {
            if (contextMenu && !contextMenu.contains(e.target)) {
              closeContextMenu();
            }
          });
          
          // Listen for messages from parent
          window.addEventListener('message', function(e) {
            if (e.data.type === 'update-element') {
              const el = document.querySelector('[data-editor-id="' + e.data.elementId + '"]');
              if (el) {
                if (e.data.content !== undefined) el.innerHTML = e.data.content;
                if (e.data.src !== undefined) el.src = e.data.src;
                if (e.data.href !== undefined) el.href = e.data.href;
                if (e.data.styles !== undefined) el.setAttribute('style', e.data.styles);
                
                window.parent.postMessage({
                  type: 'html-changed',
                  outerHtml: document.documentElement.outerHTML
                }, '*');
              }
            }
            
            if (e.data.type === 'select-element') {
              const el = document.querySelector('[data-editor-id="' + e.data.elementId + '"]');
              if (el) {
                selectElement(el);
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          });
          
          // Init
          setTimeout(initElements, 100);
        })();
      </script>
    `;

    let modifiedHtml = html;
    
    // Inject styles and scripts
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${editorStyles}</head>`);
    } else {
      modifiedHtml = editorStyles + modifiedHtml;
    }
    
    if (modifiedHtml.includes('</body>')) {
      modifiedHtml = modifiedHtml.replace('</body>', `${editorScript}</body>`);
    } else {
      modifiedHtml = modifiedHtml + editorScript;
    }

    doc.open();
    doc.write(modifiedHtml);
    doc.close();
    
    setIframeLoaded(true);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, elementId, elementType, elementLabel, tagName, content, src, href, styles, outerHtml } = event.data;
      
      if (type === 'element-selected') {
        const element: EditorElement = {
          id: elementId,
          type: elementType as any,
          selector: `[data-editor-id="${elementId}"]`,
          originalContent: content,
          newContent: content,
          styles: {},
          attributes: { src, href, tagName, label: elementLabel }
        };
        onElementDiscovered(element);
        onSelectElement(element);
      }
      
      if (type === 'element-deselected') {
        onSelectElement(null);
      }
      
      if (type === 'content-updated' || type === 'element-duplicated' || type === 'element-deleted' || type === 'html-changed') {
        if (outerHtml) {
          onHtmlChange(outerHtml);
        }
      }
      
      if (type === 'change-image') {
        const element: EditorElement = {
          id: elementId,
          type: 'image',
          selector: `[data-editor-id="${elementId}"]`,
          attributes: { src: event.data.currentSrc }
        };
        onElementDiscovered(element);
        onSelectElement(element);
      }
      
      if (type === 'edit-link') {
        const element: EditorElement = {
          id: elementId,
          type: 'button',
          selector: `[data-editor-id="${elementId}"]`,
          attributes: { href: event.data.currentHref }
        };
        onElementDiscovered(element);
        onSelectElement(element);
      }
      
      if (type === 'edit-styles') {
        const element: EditorElement = {
          id: elementId,
          type: 'container',
          selector: `[data-editor-id="${elementId}"]`,
          styles: parseStyles(event.data.currentStyles)
        };
        onElementDiscovered(element);
        onSelectElement(element);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectElement, onElementUpdate, onHtmlChange, onElementDiscovered]);

  const parseStyles = (styleString: string): Record<string, string> => {
    const styles: Record<string, string> = {};
    if (!styleString) return styles;
    
    styleString.split(';').forEach(style => {
      const [key, value] = style.split(':').map(s => s.trim());
      if (key && value) {
        styles[key] = value;
      }
    });
    
    return styles;
  };

  // Update element in iframe
  useEffect(() => {
    if (!iframeRef.current || !selectedElement) return;
    
    iframeRef.current.contentWindow?.postMessage({
      type: 'select-element',
      elementId: selectedElement.id
    }, '*');
  }, [selectedElement?.id]);

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
