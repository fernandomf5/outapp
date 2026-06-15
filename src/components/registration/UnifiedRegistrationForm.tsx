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
import { ImageUpload } from '../ImageUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

interface UnifiedRegistrationFormProps {
  categoryId: string;
  categoryName: string;
  systemType: string;
  initialData?: any;
  isViewOnly?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UnifiedRegistrationForm({ 
  categoryId, 
  categoryName, 
  systemType, 
  initialData,
  isViewOnly = false,
  onSuccess, 
  onCancel 
}: UnifiedRegistrationFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: initialData || {}
  });

  const avatarUrl = watch('avatar_url');

  const onSubmit = async (data: any) => {
    if (!user || isViewOnly) return;
    setLoading(true);

    try {
      if (initialData?.id) {
        // Update existing registration
        const { error } = await supabase
          .from('contacts')
          .update({
            ...data,
            registration_category_id: categoryId,
          })
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success(`${categoryName} atualizado com sucesso!`);
      } else {
        // Insert new registration
        const { error } = await supabase
          .from('contacts')
          .insert([{
            ...data,
            user_id: user.id,
            registration_category_id: categoryId,
          }]);

        if (error) throw error;
        toast.success(`${categoryName} cadastrado com sucesso!`);
      }

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
        <CardTitle>
          {isViewOnly ? `Detalhes de ${categoryName}` : initialData?.id ? `Editar ${categoryName}` : `Cadastrar em ${categoryName}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {watch('name')?.slice(0, 2).toUpperCase() || 'UP'}
                </AvatarFallback>
              </Avatar>
              {!isViewOnly && (
                <ImageUpload 
                  label="Foto ou Logo"
                  currentImage={avatarUrl}
                  onImageSelect={(url) => setValue('avatar_url', url)}
                  bucketName="avatars"
                />
              )}
            </div>
          </div>
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
                disabled={isViewOnly}
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
                  disabled={isViewOnly}
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
                  disabled={isViewOnly}
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
                disabled={isViewOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                {...register('phone')}
                disabled={isViewOnly}
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
                disabled={isViewOnly}
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
                  disabled={isViewOnly}
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
                disabled={isViewOnly}
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
                disabled={isViewOnly}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais..."
              {...register('notes')}
              disabled={isViewOnly}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              {isViewOnly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!isViewOnly && (
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : initialData?.id ? 'Atualizar' : 'Cadastrar'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
