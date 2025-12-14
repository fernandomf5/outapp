import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface AddressData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface AddressFieldProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  required?: boolean;
  textColor?: string;
  fieldBackgroundColor?: string;
  primaryColor?: string;
}

export function AddressField({ value, onChange, required, textColor, fieldBackgroundColor, primaryColor }: AddressFieldProps) {
  const [loading, setLoading] = useState(false);
  
  const handleCepSearch = async () => {
    const cep = value.cep?.replace(/\D/g, '');
    
    if (!cep || cep.length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      
      onChange({
        ...value,
        cep: data.cep,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
        complemento: data.complemento || value.complemento || ''
      });
      
      toast.success("Endereço encontrado!");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let cepValue = e.target.value.replace(/\D/g, '');
    if (cepValue.length > 8) cepValue = cepValue.slice(0, 8);
    // Format: 00000-000
    if (cepValue.length > 5) {
      cepValue = cepValue.slice(0, 5) + '-' + cepValue.slice(5);
    }
    onChange({ ...value, cep: cepValue });
  };

  const inputStyle = {
    backgroundColor: fieldBackgroundColor,
    color: textColor,
  };

  return (
    <div className="space-y-3 border rounded-lg p-4" style={{ borderColor: `${textColor}30` }}>
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4" style={{ color: textColor }} />
        <span className="font-medium text-sm" style={{ color: textColor }}>Endereço</span>
      </div>
      
      {/* CEP com busca */}
      <div className="grid gap-2">
        <Label className="text-sm" style={{ color: textColor }}>CEP</Label>
        <div className="flex gap-2">
          <Input
            value={value.cep || ''}
            onChange={handleCepChange}
            placeholder="00000-000"
            required={required}
            className="flex-1"
            style={inputStyle}
          />
          <Button 
            type="button" 
            size="icon"
            onClick={handleCepSearch}
            disabled={loading}
            style={{
              backgroundColor: primaryColor || '#8B5CF6',
              borderColor: primaryColor || '#8B5CF6',
              color: '#ffffff'
            }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Logradouro */}
      <div className="grid gap-2">
        <Label className="text-sm" style={{ color: textColor }}>Rua / Logradouro</Label>
        <Input
          value={value.logradouro || ''}
          onChange={(e) => onChange({ ...value, logradouro: e.target.value })}
          placeholder="Rua, Avenida, etc."
          required={required}
          style={inputStyle}
        />
      </div>

      {/* Número e Complemento */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="text-sm" style={{ color: textColor }}>Número</Label>
          <Input
            value={value.numero || ''}
            onChange={(e) => onChange({ ...value, numero: e.target.value })}
            placeholder="123"
            required={required}
            style={inputStyle}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-sm" style={{ color: textColor }}>Complemento</Label>
          <Input
            value={value.complemento || ''}
            onChange={(e) => onChange({ ...value, complemento: e.target.value })}
            placeholder="Apto, Bloco, etc."
            style={inputStyle}
          />
        </div>
      </div>

      {/* Bairro */}
      <div className="grid gap-2">
        <Label className="text-sm" style={{ color: textColor }}>Bairro</Label>
        <Input
          value={value.bairro || ''}
          onChange={(e) => onChange({ ...value, bairro: e.target.value })}
          placeholder="Bairro"
          required={required}
          style={inputStyle}
        />
      </div>

      {/* Cidade e Estado */}
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-2 col-span-2">
          <Label className="text-sm" style={{ color: textColor }}>Cidade</Label>
          <Input
            value={value.cidade || ''}
            onChange={(e) => onChange({ ...value, cidade: e.target.value })}
            placeholder="Cidade"
            required={required}
            style={inputStyle}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-sm" style={{ color: textColor }}>UF</Label>
          <Input
            value={value.estado || ''}
            onChange={(e) => onChange({ ...value, estado: e.target.value.toUpperCase().slice(0, 2) })}
            placeholder="SP"
            required={required}
            maxLength={2}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
