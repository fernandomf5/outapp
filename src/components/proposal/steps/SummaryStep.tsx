import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, User, FileText, Briefcase, Calendar, DollarSign, ScrollText } from 'lucide-react';

interface SummaryStepProps {
  data: {
    company_name: string;
    company_logo_url: string;
    client_name: string;
    client_company: string;
    title: string;
    introduction: string;
    services: { id: string; name: string; description: string }[];
    timeline: { id: string; phase: string; duration: string; deliverables: string }[];
    pricing: { items: { id: string; description: string; quantity: number; unit_price: number }[]; discount: number; total: number };
    conditions: string;
    valid_until: string;
    primary_color: string;
  };
}

export function SummaryStep({ data }: SummaryStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Não definida';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Resumo da Proposta</h2>
        <p className="text-muted-foreground">Revise todas as informações antes de finalizar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" style={{ color: data.primary_color }} />
              Sua Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {data.company_logo_url && (
                <img src={data.company_logo_url} alt="Logo" className="w-12 h-12 object-contain rounded" />
              )}
              <span className="font-medium">{data.company_name || 'Não informado'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Client */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: data.primary_color }} />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{data.client_name || 'Não informado'}</p>
            {data.client_company && <p className="text-sm text-muted-foreground">{data.client_company}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Title & Intro */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: data.primary_color }} />
            Proposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-lg mb-2">{data.title || 'Sem título'}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">{data.introduction || 'Sem introdução'}</p>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="h-4 w-4" style={{ color: data.primary_color }} />
            Serviços ({data.services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.services.length > 0 ? (
              data.services.map(s => (
                <Badge key={s.id} variant="secondary">{s.name || 'Sem nome'}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Nenhum serviço adicionado</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: data.primary_color }} />
            Cronograma ({data.timeline.length} etapas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.timeline.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.timeline.map((t, i) => (
                <Badge key={t.id} variant="outline">
                  {i + 1}. {t.phase || 'Etapa'} - {t.duration || '?'}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Nenhuma etapa definida</span>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" style={{ color: data.primary_color }} />
            Valores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{data.pricing.items.length} item(s)</span>
            <span className="text-xl font-bold" style={{ color: data.primary_color }}>
              {formatCurrency(data.pricing.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScrollText className="h-4 w-4" style={{ color: data.primary_color }} />
            Condições
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {data.conditions ? `${data.conditions.split('\n').length} cláusulas` : 'Não definidas'}
            </span>
            <Badge variant="outline">Válida até: {formatDate(data.valid_until)}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
