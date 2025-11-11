import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface HeaderConfig {
  show_logo: boolean;
  menu_items: Array<{ label: string; link: string }>;
  cta_button: { text: string; link: string };
}

interface HeaderEditorProps {
  config: HeaderConfig;
  onUpdate: (config: HeaderConfig) => void;
}

export function HeaderEditor({ config, onUpdate }: HeaderEditorProps) {
  const addMenuItem = () => {
    onUpdate({
      ...config,
      menu_items: [...config.menu_items, { label: '', link: '' }]
    });
  };

  const updateMenuItem = (index: number, field: 'label' | 'link', value: string) => {
    const newItems = [...config.menu_items];
    newItems[index][field] = value;
    onUpdate({ ...config, menu_items: newItems });
  };

  const removeMenuItem = (index: number) => {
    onUpdate({
      ...config,
      menu_items: config.menu_items.filter((_, i) => i !== index)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configurar Header</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo Toggle */}
        <div className="flex items-center justify-between">
          <Label>Exibir Logo</Label>
          <Switch
            checked={config.show_logo}
            onCheckedChange={(checked) => onUpdate({ ...config, show_logo: checked })}
          />
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Itens do Menu</Label>
            <Button size="sm" variant="outline" onClick={addMenuItem}>
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>
          
          {config.menu_items.map((item, index) => (
            <div key={index} className="flex gap-2 p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Título"
                  value={item.label}
                  onChange={(e) => updateMenuItem(index, 'label', e.target.value)}
                />
                <Input
                  placeholder="Link (ex: #sobre)"
                  value={item.link}
                  onChange={(e) => updateMenuItem(index, 'link', e.target.value)}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeMenuItem(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="space-y-2">
          <Label>Botão de Ação (CTA)</Label>
          <Input
            placeholder="Texto do botão"
            value={config.cta_button.text}
            onChange={(e) => onUpdate({
              ...config,
              cta_button: { ...config.cta_button, text: e.target.value }
            })}
          />
          <Input
            placeholder="Link do botão"
            value={config.cta_button.link}
            onChange={(e) => onUpdate({
              ...config,
              cta_button: { ...config.cta_button, link: e.target.value }
            })}
          />
        </div>
      </CardContent>
    </Card>
  );
}