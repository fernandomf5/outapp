import React, { useState, useEffect, useRef } from 'react';
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
import { Plus, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  { value: 'ativo', label: 'Ativo', color: 'bg-green-500/15 text-green-600 border-green-500/30' },
  { value: 'inativo', label: 'Inativo', color: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/30' },
  { value: 'lead', label: 'Lead', color: 'bg-purple-500/15 text-purple-600 border-purple-500/30' },
  { value: 'cliente', label: 'Cliente', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  { value: 'prospecto', label: 'Prospecto', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  { value: 'em_negociacao', label: 'Em Negociação', color: 'bg-orange-500/15 text-orange-600 border-orange-500/30' },
  { value: 'concluido', label: 'Concluído', color: 'bg-teal-500/15 text-teal-600 border-teal-500/30' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500/15 text-red-600 border-red-500/30' },
];

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
  const [duplicatePhone, setDuplicatePhone] = useState<{ id: string; name: string } | null>(null);

  // Draft persistence key (per user + category + edited id). Skip in view-only.
  const draftKey = !isViewOnly
    ? `registration-draft:${user?.id || 'anon'}:${categoryId}:${initialData?.id || 'new'}`
    : null;

  const loadDraft = (): any => {
    if (!draftKey) return null;
    try {
      const raw = localStorage.getItem(draftKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const draft = loadDraft();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: draft?.fields || initialData || {}
  });

  const avatarUrl = watch('avatar_url');

  const [urls, setUrls] = useState<Array<{ label: string; url: string }>>(() => {
    if (draft?.urls && Array.isArray(draft.urls)) return draft.urls;
    const raw = initialData?.urls;
    if (Array.isArray(raw)) {
      return raw.map((u: any) =>
        typeof u === 'string' ? { label: '', url: u } : { label: u?.label || '', url: u?.url || '' }
      );
    }
    return [];
  });

  // Persist draft whenever any field or urls change
  const allFields = watch();
  const skipFirstSave = useRef(true);
  useEffect(() => {
    if (!draftKey) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    try {
      localStorage.setItem(draftKey, JSON.stringify({ fields: allFields, urls }));
    } catch {
      // ignore quota errors
    }
  }, [allFields, urls, draftKey]);

  const addUrl = () => setUrls((p) => [...p, { label: '', url: '' }]);
  const removeUrl = (i: number) => setUrls((p) => p.filter((_, idx) => idx !== i));
  const updateUrl = (i: number, field: 'label' | 'url', val: string) =>
    setUrls((p) => p.map((u, idx) => (idx === i ? { ...u, [field]: val } : u)));

  const normalizeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

  const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');

  const checkDuplicatePhone = async (phone: string) => {
    const digits = onlyDigits(phone);
    if (!user || !digits || digits.length < 8) {
      setDuplicatePhone(null);
      return;
    }
    try {
      const { data } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('user_id', user.id)
        .neq('id', initialData?.id || '00000000-0000-0000-0000-000000000000')
        .limit(50);
      const match = (data || []).find((c: any) => onlyDigits(c.phone || '') === digits);
      setDuplicatePhone(match ? { id: match.id, name: match.name } : null);
    } catch {
      setDuplicatePhone(null);
    }
  };



  const onSubmit = async (data: any) => {
    if (!user || isViewOnly) return;

    // Duplicate-phone confirmation guard
    const digits = onlyDigits(data.phone || '');
    if (digits && digits.length >= 8) {
      try {
        const { data: existing } = await supabase
          .from('contacts')
          .select('id, name, phone')
          .eq('user_id', user.id)
          .neq('id', initialData?.id || '00000000-0000-0000-0000-000000000000')
          .limit(100);
        const match = (existing || []).find((c: any) => onlyDigits(c.phone || '') === digits);
        if (match) {
          const ok = window.confirm(
            `Já existe um cadastro com este número: "${match.name}". Deseja cadastrar mesmo assim?`
          );
          if (!ok) return;
        }
      } catch {}
    }

    setLoading(true);

    try {
      const cleanUrls = urls
        .filter((u) => u.url.trim())
        .map((u) => ({ label: u.label.trim(), url: normalizeUrl(u.url.trim()) }));

      if (initialData?.id) {
        const { error } = await supabase
          .from('contacts')
          .update({
            ...data,
            urls: cleanUrls as any,
            registration_category_id: categoryId,
          })
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success(`${categoryName} atualizado com sucesso!`);
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([{
            ...data,
            urls: cleanUrls as any,
            user_id: user.id,
            registration_category_id: categoryId,
          }]);

        if (error) throw error;
        toast.success(`${categoryName} cadastrado com sucesso!`);
      }

      reset();
      setUrls([]);
      if (draftKey) {
        try { localStorage.removeItem(draftKey); } catch {}
      }


      
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>URLs do Cliente (Drive, Site, etc.)</Label>
              {!isViewOnly && (
                <Button type="button" variant="outline" size="sm" onClick={addUrl}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar URL
                </Button>
              )}
            </div>
            {urls.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma URL cadastrada.</p>
            )}
            {urls.map((u, i) => (
              <div key={i} className="flex gap-2 items-center">
                {isViewOnly ? (
                  <a
                    href={normalizeUrl(u.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30 hover:bg-muted text-primary underline break-all"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span className="truncate">{u.label ? `${u.label} — ${u.url}` : u.url}</span>
                  </a>
                ) : (
                  <>
                    <Input
                      placeholder="Rótulo (opcional)"
                      value={u.label}
                      onChange={(e) => updateUrl(i, 'label', e.target.value)}
                      className="md:max-w-[200px]"
                    />
                    <Input
                      placeholder="https://exemplo.com"
                      value={u.url}
                      onChange={(e) => updateUrl(i, 'url', e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeUrl(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
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
