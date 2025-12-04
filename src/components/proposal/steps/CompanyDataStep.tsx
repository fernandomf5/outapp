import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ImageUpload';

interface CompanyData {
  company_name: string;
  company_logo_url: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_cnpj: string;
}

interface CompanyDataStepProps {
  data: CompanyData;
  onChange: (data: Partial<CompanyData>) => void;
}

export function CompanyDataStep({ data, onChange }: CompanyDataStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Dados da Empresa</h2>
        <p className="text-muted-foreground">Informações que aparecerão no cabeçalho da proposta</p>
      </div>

      <div className="flex flex-col items-center gap-4 mb-6">
        <Label>Logo da Empresa</Label>
        <ImageUpload
          currentImage={data.company_logo_url}
          onImageSelect={(url) => onChange({ company_logo_url: url })}
          bucketName="business-logos"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Nome da Empresa *</Label>
          <Input
            id="company_name"
            value={data.company_name}
            onChange={(e) => onChange({ company_name: e.target.value })}
            placeholder="Sua Empresa LTDA"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_cnpj">CNPJ</Label>
          <Input
            id="company_cnpj"
            value={data.company_cnpj}
            onChange={(e) => onChange({ company_cnpj: e.target.value })}
            placeholder="00.000.000/0001-00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_email">E-mail</Label>
          <Input
            id="company_email"
            type="email"
            value={data.company_email}
            onChange={(e) => onChange({ company_email: e.target.value })}
            placeholder="contato@empresa.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_phone">Telefone</Label>
          <Input
            id="company_phone"
            value={data.company_phone}
            onChange={(e) => onChange({ company_phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="company_address">Endereço</Label>
          <Textarea
            id="company_address"
            value={data.company_address}
            onChange={(e) => onChange({ company_address: e.target.value })}
            placeholder="Rua, número, bairro, cidade - UF"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
