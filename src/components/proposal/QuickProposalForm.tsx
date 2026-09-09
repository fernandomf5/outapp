import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Send, Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';

/** Item de serviço do modo rápido: uma linha = descrição + valor. */
export interface QuickItem {
  id: string;
  description: string;
  value: number;
}

export interface QuickProposalValues {
  company_name: string;
  company_phone: string;
  company_email: string;
  client_name: string;
  client_company: string;
  title: string;
  introduction: string;
  items: QuickItem[];
  valid_until: string;
}

interface QuickProposalFormProps {
  saving: boolean;
  onSubmit: (values: QuickProposalValues, status: 'draft' | 'sent') => void;
  onSwitchToAdvanced: () => void;
}

const COMPANY_STORAGE_KEY = 'proposal:company-defaults';

const newItem = (): QuickItem => ({
  id: crypto.randomUUID(),
  description: '',
  value: 0,
});

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function QuickProposalForm({ saving, onSubmit, onSwitchToAdvanced }: QuickProposalFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [title, setTitle] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [items, setItems] = useState<QuickItem[]>([newItem()]);
  const [validUntil, setValidUntil] = useState('');

  // Os dados da própria empresa mudam pouco: são lembrados entre propostas.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPANY_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<QuickProposalValues>;
      setCompanyName(parsed.company_name ?? '');
      setCompanyPhone(parsed.company_phone ?? '');
      setCompanyEmail(parsed.company_email ?? '');
    } catch {
      // dados corrompidos no navegador: apenas ignora
    }
  }, []);

  const total = items.reduce((sum, item) => sum + (Number.isFinite(item.value) ? item.value : 0), 0);
  const isValid = companyName.trim() !== '' && clientName.trim() !== '' && title.trim() !== '';

  const updateItem = (id: string, patch: Partial<QuickItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleSubmit = (status: 'draft' | 'sent') => {
    if (!isValid) {
      toast.error('Preencha sua empresa, o cliente e o título da proposta');
      return;
    }

    try {
      localStorage.setItem(
        COMPANY_STORAGE_KEY,
        JSON.stringify({
          company_name: companyName,
          company_phone: companyPhone,
          company_email: companyEmail,
        }),
      );
    } catch {
      // sem espaço no navegador: não impede o envio
    }

    onSubmit(
      {
        company_name: companyName.trim(),
        company_phone: companyPhone.trim(),
        company_email: companyEmail.trim(),
        client_name: clientName.trim(),
        client_company: clientCompany.trim(),
        title: title.trim(),
        introduction: introduction.trim(),
        items: items.filter((item) => item.description.trim() !== '' || item.value > 0),
        valid_until: validUntil,
      },
      status,
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quick-company">Sua empresa *</Label>
          <Input
            id="quick-company"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Ex: Out App Marketing"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quick-client">Cliente *</Label>
          <Input
            id="quick-client"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Nome de quem vai receber"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quick-company-contact">Seu contato (telefone ou e-mail)</Label>
          <Input
            id="quick-company-contact"
            value={companyPhone}
            onChange={(event) => setCompanyPhone(event.target.value)}
            placeholder="(11) 90000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quick-client-company">Empresa do cliente</Label>
          <Input
            id="quick-client-company"
            value={clientCompany}
            onChange={(event) => setClientCompany(event.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quick-title">Título da proposta *</Label>
        <Input
          id="quick-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex: Gestão de tráfego pago - 3 meses"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quick-intro">Apresentação (opcional)</Label>
        <Textarea
          id="quick-intro"
          value={introduction}
          onChange={(event) => setIntroduction(event.target.value)}
          placeholder="Escreva em poucas linhas o que você vai entregar."
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>O que está incluído</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, newItem()])}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar item
          </Button>
        </div>

        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={item.description}
              onChange={(event) => updateItem(item.id, { description: event.target.value })}
              placeholder="Ex: Criação de 12 criativos"
              className="flex-1"
              aria-label="Descrição do item"
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              value={item.value === 0 ? '' : item.value}
              onChange={(event) => updateItem(item.id, { value: Number(event.target.value) || 0 })}
              placeholder="R$ 0,00"
              className="sm:w-40"
              aria-label="Valor do item"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive shrink-0"
              aria-label="Remover item"
              onClick={() => setItems((prev) => (prev.length === 1 ? [newItem()] : prev.filter((i) => i.id !== item.id)))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="quick-valid">Válida até (opcional)</Label>
          <Input
            id="quick-valid"
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
          />
        </div>
        <Card className="bg-muted/40">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">Valor total</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onSwitchToAdvanced} className="justify-start">
          <Building2 className="mr-2 h-4 w-4" />
          Preciso de mais campos (modo completo)
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => handleSubmit('draft')} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Salvar rascunho
          </Button>
          <Button type="button" onClick={() => handleSubmit('sent')} disabled={saving}>
            <Send className="mr-2 h-4 w-4" />
            Criar e gerar link
          </Button>
        </div>
      </div>
    </div>
  );
}
