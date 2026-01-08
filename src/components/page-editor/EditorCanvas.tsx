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
  onIframeAction: (action: string, elementId: string, data: any) => void;
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
  onIframeAction,
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

    // Simple, clean editor styles
    const editorStyles = isPreview ? '' : `
      <style id="editor-styles">
        * {
          cursor: pointer !important;
        }
        
        [data-editor-id] {
          transition: outline 0.15s ease, box-shadow 0.15s ease;
        }
        
        [data-editor-id]:hover {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 2px;
        }
        
        [data-editor-id].editor-selected {
          outline: 3px solid #8b5cf6 !important;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2) !important;
        }
        
        [data-editor-id].editor-editing {
          outline: 3px solid #10b981 !important;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2) !important;
        }
      </style>
    `;

    const editorScript = isPreview ? '' : `
      <script id="editor-script">
        (function() {
          let selectedElement = null;
          let isEditing = false;
          
          const editableSelectors = 'h1, h2, h3, h4, h5, h6, p, span, a, button, img, video, iframe, section, div, header, footer, nav, article, aside, figure, figcaption, ul, ol, li, blockquote';
          
          function getElementType(el) {
            const tag = el.tagName.toLowerCase();
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'heading';
            if (['p', 'span', 'blockquote', 'li'].includes(tag)) return 'text';
            if (tag === 'img') return 'image';
            if (tag === 'video' || tag === 'iframe') return 'video';
            if (tag === 'a') return 'link';
            if (tag === 'button') return 'button';
            if (['section', 'div', 'header', 'footer', 'nav', 'article', 'aside'].includes(tag)) return 'container';
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
              'element': tag.toUpperCase()
            };
            return labels[type] || tag.toUpperCase();
          }
          
          function generateId() {
            return 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          }
          
          function deselectCurrent() {
            if (selectedElement) {
              selectedElement.classList.remove('editor-selected');
              if (isEditing) {
                selectedElement.contentEditable = 'false';
                selectedElement.classList.remove('editor-editing');
                isEditing = false;
                
                // Send updated HTML
                window.parent.postMessage({
                  type: 'content-updated',
                  elementId: selectedElement.dataset.editorId,
                  content: selectedElement.innerHTML,
                  outerHtml: document.documentElement.outerHTML
                }, '*');
              }
              selectedElement = null;
            }
          }
          
          function selectElement(el) {
            deselectCurrent();
            
            if (!el.dataset.editorId) {
              el.dataset.editorId = generateId();
            }
            
            selectedElement = el;
            el.classList.add('editor-selected');
            
            const type = getElementType(el);
            
            window.parent.postMessage({
              type: 'element-selected',
              elementId: el.dataset.editorId,
              elementType: type,
              elementLabel: getElementLabel(el),
              tagName: el.tagName.toLowerCase(),
              content: el.innerHTML,
              src: el.src || '',
              href: el.href || '',
              styles: el.getAttribute('style') || ''
            }, '*');
          }
          
          function startEditing(el) {
            if (!el) return;
            const type = getElementType(el);
            if (['heading', 'text', 'link', 'button'].includes(type)) {
              isEditing = true;
              el.classList.add('editor-editing');
              el.contentEditable = 'true';
              el.focus();
              
              // Select text
              try {
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              } catch(e) {}
            }
          }
          
          // Initialize elements with IDs
          function initElements() {
            document.querySelectorAll(editableSelectors).forEach(function(el) {
              if (!el.dataset.editorId) {
                el.dataset.editorId = generateId();
              }
            });
          }
          
          // Click to select
          document.addEventListener('click', function(e) {
            if (isEditing) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const el = e.target.closest(editableSelectors);
            if (el) {
              selectElement(el);
            }
          }, true);
          
          // Double click to edit text
          document.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const el = e.target.closest(editableSelectors);
            if (el) {
              if (selectedElement !== el) {
                selectElement(el);
              }
              startEditing(el);
            }
          }, true);
          
          // Blur to stop editing
          document.addEventListener('blur', function(e) {
            if (e.target.contentEditable === 'true') {
              e.target.classList.remove('editor-editing');
              e.target.contentEditable = 'false';
              isEditing = false;
              
              window.parent.postMessage({
                type: 'content-updated',
                elementId: e.target.dataset.editorId,
                content: e.target.innerHTML,
                outerHtml: document.documentElement.outerHTML
              }, '*');
            }
          }, true);
          
          // Escape to deselect
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              deselectCurrent();
              window.parent.postMessage({ type: 'element-deselected' }, '*');
            }
            
            // Delete element
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && !isEditing) {
              e.preventDefault();
              const id = selectedElement.dataset.editorId;
              selectedElement.remove();
              selectedElement = null;
              
              window.parent.postMessage({
                type: 'element-deleted',
                elementId: id,
                outerHtml: document.documentElement.outerHTML
              }, '*');
            }
          });
          
          // Listen for commands from parent
          window.addEventListener('message', function(e) {
            const data = e.data;
            
            if (data.type === 'select-element') {
              const el = document.querySelector('[data-editor-id="' + data.elementId + '"]');
              if (el) {
                selectElement(el);
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
            
            if (data.type === 'update-element') {
              const el = document.querySelector('[data-editor-id="' + data.elementId + '"]');
              if (el) {
                if (data.content !== undefined && data.content !== null) {
                  el.innerHTML = data.content;
                }

                // Update src in a way that works with common patterns (srcset, lazy-load attrs, <picture>)
                if (data.src !== undefined && data.src !== null && data.src !== '') {
                  const tag = el.tagName.toLowerCase();

                  // Always set as attribute too (outerHTML serialization)
                  try { el.setAttribute('src', data.src); } catch (e) {}

                  if (tag === 'img') {
                    // srcset often overrides src
                    if (el.hasAttribute('srcset')) el.removeAttribute('srcset');
                    if (el.hasAttribute('data-srcset')) el.removeAttribute('data-srcset');

                    // common lazy-load attributes that may overwrite our change
                    if (el.hasAttribute('data-src')) el.setAttribute('data-src', data.src);
                    if (el.hasAttribute('data-lazy-src')) el.setAttribute('data-lazy-src', data.src);
                    if (el.hasAttribute('data-original')) el.setAttribute('data-original', data.src);
                    if (el.hasAttribute('data-url')) el.setAttribute('data-url', data.src);

                    el.src = data.src;

                    // If inside <picture>, update <source> as well
                    const picture = el.closest && el.closest('picture');
                    if (picture) {
                      picture.querySelectorAll('source').forEach(function(source) {
                        try { source.setAttribute('srcset', data.src); } catch (e) {}
                      });
                    }
                  } else {
                    // video / iframe / etc
                    try { el.src = data.src; } catch (e) {}
                  }
                }

                if (data.href !== undefined && data.href !== null && data.href !== '') {
                  try { el.setAttribute('href', data.href); } catch (e) {}
                  el.href = data.href;
                }

                if (data.styles !== undefined && data.styles !== null && data.styles !== '') {
                  el.setAttribute('style', data.styles);
                }

                window.parent.postMessage({
                  type: 'html-changed',
                  outerHtml: document.documentElement.outerHTML
                }, '*');
              }
            }
            
            if (data.type === 'delete-element') {
              const el = document.querySelector('[data-editor-id="' + data.elementId + '"]');
              if (el) {
                el.remove();
                window.parent.postMessage({
                  type: 'element-deleted',
                  elementId: data.elementId,
                  outerHtml: document.documentElement.outerHTML
                }, '*');
              }
            }
            
            if (data.type === 'duplicate-element') {
              const el = document.querySelector('[data-editor-id="' + data.elementId + '"]');
              if (el) {
                const clone = el.cloneNode(true);
                clone.dataset.editorId = generateId();
                el.parentNode.insertBefore(clone, el.nextSibling);
                
                window.parent.postMessage({
                  type: 'element-duplicated',
                  elementId: clone.dataset.editorId,
                  outerHtml: document.documentElement.outerHTML
                }, '*');
              }
            }
          });
          
          setTimeout(initElements, 100);
        })();
      </script>
    `;

    let modifiedHtml = html;

    // Remove CSP meta tags that can block loading images/resources from Supabase
    // (common in cloned pages and breaks "trocar imagem")
    modifiedHtml = modifiedHtml
      .replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '')
      .replace(/<meta[^>]+http-equiv=["']Content-Security-Policy-Report-Only["'][^>]*>/gi, '');

    // Inject styles
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${editorStyles}</head>`);
    } else {
      modifiedHtml = editorStyles + modifiedHtml;
    }
    
    // Inject script
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
          styles: parseStyles(styles),
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
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectElement, onElementUpdate, onHtmlChange, onElementDiscovered, onIframeAction]);

  const parseStyles = (styleString: string): Record<string, string> => {
    const styles: Record<string, string> = {};
    if (!styleString) return styles;
    
    styleString.split(';').forEach(style => {
      const [key, value] = style.split(':').map(s => s.trim());
      if (key && value) {
        // Convert to camelCase
        const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[camelKey] = value;
      }
    });
    
    return styles;
  };

  // Update element in iframe when selected element changes externally
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
      sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
      title="Editor Canvas"
    />
  );
});

EditorCanvas.displayName = 'EditorCanvas';
