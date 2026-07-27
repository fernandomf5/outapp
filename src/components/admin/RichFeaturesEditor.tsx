import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, Strikethrough, RemoveFormatting } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichFeaturesEditorProps {
  /** Cada item do array é uma linha de recurso em HTML simples */
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const toHtml = (lines: string[]) => {
  if (!lines.length) return "";
  return lines
    .map((line) => `<div>${line && line.trim() ? line : "<br>"}</div>`)
    .join("");
};

const parseLines = (root: HTMLElement): string[] => {
  const lines: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const cleaned = current.replace(/<br\s*\/?>/gi, "").trim();
    lines.push(cleaned);
    current = "";
  };

  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      current += escapeHtml(node.textContent || "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;
    if (tag === "BR") {
      pushCurrent();
      return;
    }
    if (tag === "DIV" || tag === "P" || tag === "LI") {
      if (current.trim()) pushCurrent();
      const inner = el.innerHTML;
      lines.push(inner.replace(/<br\s*\/?>/gi, "").trim());
      return;
    }
    if (tag === "UL" || tag === "OL") {
      if (current.trim()) pushCurrent();
      el.querySelectorAll("li").forEach((li) => lines.push(li.innerHTML.trim()));
      return;
    }
    current += el.outerHTML;
  });

  if (current.trim()) pushCurrent();

  return lines.filter((line) => line.replace(/<[^>]*>/g, "").trim().length > 0);
};

export function RichFeaturesEditor({ value, onChange, placeholder }: RichFeaturesEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInternal = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    if (isInternal.current) {
      isInternal.current = false;
      return;
    }
    const html = toHtml(value);
    if (ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    isInternal.current = true;
    onChange(parseLines(ref.current));
  };

  const exec = (command: string) => {
    ref.current?.focus();
    document.execCommand(command, false);
    emit();
  };

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-1">
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} title="Negrito">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} title="Itálico">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} title="Sublinhado">
          <Underline className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("strikeThrough")} title="Tachado">
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("removeFormat")} title="Limpar formatação">
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          emit();
        }}
        className="min-h-[150px] w-full px-3 py-2 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_u]:underline"
      />
    </div>
  );
}

export default RichFeaturesEditor;
