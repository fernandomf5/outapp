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
              <Label htmlFor="name">Nome / Razão Social</Label>
              <Input
                id="name"
                placeholder="Nome completo"
                {...register('name', { required: 'Nome é obrigatório' })}
              />
              {errors.name && <p className="text-sm text-red-500">{(errors.name as any).message}</p>}
            </div>
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
              <Label htmlFor="document">CPF / CNPJ</Label>
              <Input
                id="document"
                placeholder="000.000.000-00"
                {...register('document')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              placeholder="Rua, número, bairro, cidade"
              {...register('address')}
            />
          </div>

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
