import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface FooterColumn {
  title: string;
  links: Array<{ label: string; url: string }>;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface FooterConfig {
  copyright: string;
  social_links: SocialLink[];
  columns: FooterColumn[];
}

interface FooterEditorProps {
  config: FooterConfig;
  onUpdate: (config: FooterConfig) => void;
}

export function FooterEditor({ config, onUpdate }: FooterEditorProps) {
  const addColumn = () => {
    onUpdate({
      ...config,
      columns: [...config.columns, { title: '', links: [] }]
    });
  };

  const updateColumn = (index: number, field: 'title', value: string) => {
    const newColumns = [...config.columns];
    newColumns[index][field] = value;
    onUpdate({ ...config, columns: newColumns });
  };

  const addLinkToColumn = (columnIndex: number) => {
    const newColumns = [...config.columns];
    newColumns[columnIndex].links.push({ label: '', url: '' });
    onUpdate({ ...config, columns: newColumns });
  };

  const updateLink = (columnIndex: number, linkIndex: number, field: 'label' | 'url', value: string) => {
    const newColumns = [...config.columns];
    newColumns[columnIndex].links[linkIndex][field] = value;
    onUpdate({ ...config, columns: newColumns });
  };

  const removeColumn = (index: number) => {
    onUpdate({
      ...config,
      columns: config.columns.filter((_, i) => i !== index)
    });
  };

  const removeLink = (columnIndex: number, linkIndex: number) => {
    const newColumns = [...config.columns];
    newColumns[columnIndex].links = newColumns[columnIndex].links.filter((_, i) => i !== linkIndex);
    onUpdate({ ...config, columns: newColumns });
  };

  const addSocialLink = () => {
    onUpdate({
      ...config,
      social_links: [...config.social_links, { platform: '', url: '' }]
    });
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...config.social_links];
    newLinks[index][field] = value;
    onUpdate({ ...config, social_links: newLinks });
  };

  const removeSocialLink = (index: number) => {
    onUpdate({
      ...config,
      social_links: config.social_links.filter((_, i) => i !== index)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configurar Footer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Copyright */}
        <div className="space-y-2">
          <Label>Texto de Copyright</Label>
          <Textarea
            placeholder="© 2024 Sua Empresa. Todos os direitos reservados."
            value={config.copyright}
            onChange={(e) => onUpdate({ ...config, copyright: e.target.value })}
            rows={2}
          />
        </div>

        {/* Social Links */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Redes Sociais</Label>
            <Button size="sm" variant="outline" onClick={addSocialLink}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>
          
          {config.social_links.map((link, index) => (
            <div key={index} className="flex gap-2 p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Plataforma (Instagram, Facebook, etc.)"
                  value={link.platform}
                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                />
                <Input
                  placeholder="URL completa"
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeSocialLink(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Footer Columns */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Colunas do Footer</Label>
            <Button size="sm" variant="outline" onClick={addColumn}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Coluna
            </Button>
          </div>
          
          {config.columns.map((column, colIndex) => (
            <div key={colIndex} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Título da coluna"
                  value={column.title}
                  onChange={(e) => updateColumn(colIndex, 'title', e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeColumn(colIndex)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 ml-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Links</Label>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => addLinkToColumn(colIndex)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Link
                  </Button>
                </div>
                
                {column.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="flex gap-2">
                    <Input
                      placeholder="Texto"
                      value={link.label}
                      onChange={(e) => updateLink(colIndex, linkIndex, 'label', e.target.value)}
                      size-sm
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateLink(colIndex, linkIndex, 'url', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLink(colIndex, linkIndex)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}