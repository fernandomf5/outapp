import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface PricingItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface Pricing {
  items: PricingItem[];
  discount: number;
  total: number;
}

interface PricingStepProps {
  pricing: Pricing;
  onChange: (pricing: Pricing) => void;
}

export function PricingStep({ pricing, onChange }: PricingStepProps) {
  const addItem = () => {
    const newItem: PricingItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit_price: 0,
    };
    const newItems = [...pricing.items, newItem];
    onChange({ ...pricing, items: newItems, total: calculateTotal(newItems, pricing.discount) });
  };

  const updateItem = (id: string, data: Partial<PricingItem>) => {
    const newItems = pricing.items.map(item => 
      item.id === id ? { ...item, ...data } : item
    );
    onChange({ ...pricing, items: newItems, total: calculateTotal(newItems, pricing.discount) });
  };

  const removeItem = (id: string) => {
    const newItems = pricing.items.filter(item => item.id !== id);
    onChange({ ...pricing, items: newItems, total: calculateTotal(newItems, pricing.discount) });
  };

  const updateDiscount = (discount: number) => {
    onChange({ ...pricing, discount, total: calculateTotal(pricing.items, discount) });
  };

  const calculateTotal = (items: PricingItem[], discount: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    return subtotal - discount;
  };

  const subtotal = pricing.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Valores</h2>
        <p className="text-muted-foreground">Defina os valores da proposta</p>
      </div>

      <div className="space-y-3">
        {pricing.items.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5 space-y-1">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder="Item ou serviço"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs">Valor Unit.</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unit_price}
                    onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs">Subtotal</Label>
                  <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={addItem} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Item
      </Button>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          <div className="flex justify-between items-center gap-4">
            <Label className="text-sm">Desconto</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={pricing.discount}
                onChange={(e) => updateDiscount(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
            </div>
          </div>
          
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(pricing.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
