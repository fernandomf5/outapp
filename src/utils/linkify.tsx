/**
 * Transforma URLs em texto em links clicáveis
 */
export const linkifyText = (text: string): React.ReactNode => {
  // Regex para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};
