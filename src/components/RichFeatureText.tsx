import DOMPurify from "dompurify";

interface RichFeatureTextProps {
  html: string;
  className?: string;
}

/** Renderiza um recurso de plano preservando a formatação criada no editor */
export function RichFeatureText({ html, className }: RichFeatureTextProps) {
  const clean = DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "s", "strike", "span", "br", "small"],
    ALLOWED_ATTR: [],
  });

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export default RichFeatureText;
