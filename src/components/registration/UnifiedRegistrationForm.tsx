import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UnifiedRegistrationFormProps {
  categoryId: string;
  categoryName: string;
  systemType: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UnifiedRegistrationForm({ categoryId, categoryName, systemType, onSuccess, onCancel }: UnifiedRegistrationFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contacts')
        .insert([{
          ...data,
          user_id: user.id,
          registration_category_id: categoryId,
        }]);

      if (error) throw error;

      toast.success(`${categoryName} cadastrado com sucesso!`);
      reset();
      
      // Emit event to refresh sidebar if needed
      window.dispatchEvent(new CustomEvent('registration-items-updated'));
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error saving registration:', error);
      toast.error('Erro ao salvar cadastro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Cadastrar em {categoryName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {['supplier', 'business', 'logistics', 'investors', 'infrastructure'].includes(systemType) 
                  ? 'Razão Social / Nome da Entidade' 
                  : 'Nome Completo'}
              </Label>
              <Input
                id="name"
                placeholder={['supplier', 'business', 'logistics', 'investors', 'infrastructure'].includes(systemType) 
                  ? 'Nome da empresa ou entidade' 
                  : 'Nome completo'}
                {...register('name', { required: 'Nome é obrigatório' })}
              />
              {errors.name && <p className="text-sm text-red-500">{(errors.name as any).message}</p>}
            </div>

            {['supplier', 'business', 'partners', 'maintenance', 'services', 'legal'].includes(systemType) && (
              <div className="space-y-2">
                <Label htmlFor="contact_person">Pessoa de Contato</Label>
                <Input
                  id="contact_person"
                  placeholder="Nome do responsável"
                  {...register('contact_person')}
                />
              </div>
            )}

            {['team', 'maintenance', 'services'].includes(systemType) && (
              <div className="space-y-2">
                <Label htmlFor="role">Cargo / Especialidade</Label>
                <Input
                  id="role"
                  placeholder="Ex: Vendedor, Técnico, Consultor..."
                  {...register('position')}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                {...register('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">
                {['supplier', 'business', 'logistics', 'partners'].includes(systemType) ? 'CNPJ' : 'CPF / Documento'}
              </Label>
              <Input
                id="document"
                placeholder={['supplier', 'business', 'logistics', 'partners'].includes(systemType) ? '00.000.000/0000-00' : '000.000.000-00'}
                {...register('document')}
              />
            </div>

            {['business', 'leads', 'investors', 'services', 'education'].includes(systemType) && (
              <div className="space-y-2">
                <Label htmlFor="market_area">
                  {systemType === 'leads' ? 'Origem / Interesse' : 
                   systemType === 'education' ? 'Curso / Série' :
                   systemType === 'investors' ? 'Área de Investimento' : 'Área de Atuação'}
                </Label>
                <Input
                  id="market_area"
                  placeholder="Informação adicional..."
                  {...register('market_area')}
                />
              </div>
            )}
          </div>

          {!['team', 'leads', 'investors'].includes(systemType) && (
            <div className="space-y-2">
              <Label htmlFor="address">Endereço / Localização</Label>
              <Input
                id="address"
                placeholder="Rua, número, bairro, cidade"
                {...register('address')}
              />
            </div>
          )}

          {['supplier', 'business', 'services', 'logistics'].includes(systemType) && (
            <div className="space-y-2">
              <Label htmlFor="website">Website / Link</Label>
              <Input
                id="website"
                placeholder="https://exemplo.com"
                {...register('website')}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais..."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
