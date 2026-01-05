import { Button } from "@/components/ui/button";
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Link, Image, Trash2, Copy, Layers, MoveUp, MoveDown
} from "lucide-react";
import { EditorElement } from "@/pages/PageEditor";

interface EditorToolbarProps {
  selectedElement: EditorElement | null;
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onAddLink?: () => void;
  onAddImage?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const EditorToolbar = ({
  selectedElement,
  onBold,
  onItalic,
  onUnderline,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAddLink,
  onAddImage,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown
}: EditorToolbarProps) => {
  if (!selectedElement) return null;

  const isTextElement = selectedElement.type === 'text' || selectedElement.type === 'button';

  return (
    <div className="flex items-center gap-1 p-2 bg-card border rounded-lg shadow-lg">
      {/* Text Formatting */}
      {isTextElement && (
        <>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onBold}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onItalic}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onUnderline}>
            <Underline className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
        </>
      )}

      {/* Alignment */}
      {isTextElement && (
        <>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAlignLeft}>
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAlignCenter}>
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAlignRight}>
            <AlignRight className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
        </>
      )}

      {/* Add Link/Image */}
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAddLink}>
        <Link className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAddImage}>
        <Image className="w-4 h-4" />
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Layer Actions */}
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onMoveUp}>
        <MoveUp className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onMoveDown}>
        <MoveDown className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onDuplicate}>
        <Copy className="w-4 h-4" />
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Delete */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 text-destructive hover:text-destructive" 
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};
