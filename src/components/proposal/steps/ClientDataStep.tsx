import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ClientData {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_cnpj: string;
  client_address: string;
}

interface ClientDataStepProps {
  data: ClientData;
  onChange: (data: Partial<ClientData>) => void;
}

export function ClientDataStep({ data, onChange }: ClientDataStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Dados do Cliente</h2>
        <p className="text-muted-foreground">Para quem você está enviando esta proposta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_name">Nome do Cliente *</Label>
          <Input
            id="client_name"
            value={data.client_name}
            onChange={(e) => onChange({ client_name: e.target.value })}
            placeholder="Nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_company">Empresa do Cliente</Label>
          <Input
            id="client_company"
            value={data.client_company}
            onChange={(e) => onChange({ client_company: e.target.value })}
            placeholder="Empresa do cliente"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_cnpj">CNPJ/CPF</Label>
          <Input
            id="client_cnpj"
            value={data.client_cnpj}
            onChange={(e) => onChange({ client_cnpj: e.target.value })}
            placeholder="00.000.000/0001-00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_email">E-mail</Label>
          <Input
            id="client_email"
            type="email"
            value={data.client_email}
            onChange={(e) => onChange({ client_email: e.target.value })}
            placeholder="cliente@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_phone">Telefone</Label>
          <Input
            id="client_phone"
            value={data.client_phone}
            onChange={(e) => onChange({ client_phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_address">Endereço</Label>
          <Input
            id="client_address"
            value={data.client_address}
            onChange={(e) => onChange({ client_address: e.target.value })}
            placeholder="Cidade - UF"
          />
        </div>
      </div>
    </div>
  );
}
