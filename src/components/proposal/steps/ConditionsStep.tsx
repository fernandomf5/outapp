import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ConditionsStepProps {
  conditions: string;
  validUntil: string;
  primaryColor: string;
  onChange: (data: { conditions?: string; valid_until?: string; primary_color?: string }) => void;
}

const TEMPLATE_CONDITIONS = `• Forma de Pagamento: 50% na aprovação e 50% na entrega
• Prazo de execução inicia após aprovação formal
• Revisões incluídas: até 2 rounds de ajustes
• Alterações de escopo serão orçadas separadamente
• Validade da proposta: conforme data indicada
• Propriedade intelectual transferida após quitação total`;

export function ConditionsStep({ conditions, validUntil, primaryColor, onChange }: ConditionsStepProps) {
  const applyTemplate = () => {
    onChange({ conditions: TEMPLATE_CONDITIONS });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Condições Comerciais</h2>
        <p className="text-muted-foreground">Defina os termos e condições da proposta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="validUntil">Validade da Proposta</Label>
          <Input
            id="validUntil"
            type="date"
            value={validUntil}
            onChange={(e) => onChange({ valid_until: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryColor">Cor Principal da Proposta</Label>
          <div className="flex gap-2">
            <Input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              className="w-14 h-10 p-1 cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              placeholder="#6366f1"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="conditions">Termos e Condições</Label>
          <Button variant="ghost" size="sm" onClick={applyTemplate}>
            Usar modelo padrão
          </Button>
        </div>
        <Textarea
          id="conditions"
          value={conditions}
          onChange={(e) => onChange({ conditions: e.target.value })}
          placeholder="Descreva as condições de pagamento, prazos, garantias, etc..."
          rows={10}
        />
      </div>
    </div>
  );
}
