import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Save, Undo, Redo, Eye, EyeOff, 
  Smartphone, Tablet, Monitor, Settings2, Download
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface BuilderToolbarProps {
  pageName: string;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  setViewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  showProperties: boolean;
  setShowProperties: (show: boolean) => void;
  historyIndex: number;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  saving: boolean;
  onBack: () => void;
}

export const BuilderToolbar = ({
  pageName,
  viewMode,
  setViewMode,
  showPreview,
  setShowPreview,
  showProperties,
  setShowProperties,
  historyIndex,
  historyLength,
  onUndo,
  onRedo,
  onSave,
  onExport,
  saving,
  onBack
}: BuilderToolbarProps) => {
  return (
    <div className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="h-6 w-px bg-border" />
        <span className="font-medium text-sm truncate max-w-[200px]">
          {pageName || 'Nova Página'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* View Mode */}
        <div className="flex items-center border rounded-lg p-1 bg-muted/50">
          <Button
            variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewMode('desktop')}
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'tablet' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewMode('tablet')}
            title="Tablet"
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewMode('mobile')}
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={historyIndex <= 0}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={historyIndex >= historyLength - 1}
          title="Refazer (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Preview Toggle */}
        <Button
          variant={showPreview ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          title={showPreview ? 'Voltar a editar' : 'Visualizar'}
        >
          {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showPreview ? 'Editar' : 'Preview'}
        </Button>

        {/* Properties Toggle */}
        <Button
          variant={showProperties ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowProperties(!showProperties)}
          title="Propriedades"
        >
          <Settings2 className="w-4 h-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Export */}
        <Button variant="outline" size="sm" onClick={onExport} title="Exportar HTML">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>

        {/* Save */}
        <Button onClick={onSave} disabled={saving} className="gradient-primary">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>
    </div>
  );
};
