import DOMPurify from "dompurify";
import { CSSProperties } from "react";

interface BlockRichTextProps {
  content: string;
  className?: string;
  style?: CSSProperties;
}

const HTML_BLOCK_REGEX = /<(p|div|br|ul|ol|li|h[1-6]|blockquote|table|pre|img|iframe|section|article)\b/i;

/**
 * Renderiza conteúdo de texto/anotações preservando as quebras de linha.
 * - Se o conteúdo for HTML real (criado por editor), sanitiza e renderiza como HTML.
 * - Se for texto puro, preserva os "enters" e espaços com whitespace-pre-wrap.
 */
export function BlockRichText({ content, className, style }: BlockRichTextProps) {
  const raw = content ?? "";

  if (HTML_BLOCK_REGEX.test(raw)) {
    const clean = DOMPurify.sanitize(raw);
    return (
      <div
        className={className}
        style={{ whiteSpace: "normal", ...style }}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  // Texto puro (ou com formatação inline simples): preserva quebras de linha
  const clean = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "s", "strike", "span", "small", "a", "code"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });

  return (
    <div
      className={className}
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", ...style }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export default BlockRichText;
