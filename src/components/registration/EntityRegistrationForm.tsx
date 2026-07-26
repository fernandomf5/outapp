import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUpload } from "../ImageUpload";
import { toast } from "sonner";
import { EntityKind, KindField, getEntityKind } from "./entityKinds";


interface EntityRegistrationFormProps {
  categoryId: string;
  categoryName: string;
  entityKind: string;
  customSchema?: KindField[];
  initialData?: any;
  isViewOnly?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NATIVE_KEYS = new Set([
  "name",
  "email",
  "phone",
  "company",
  "position",
  "document",
  "address",
  "website",
  "market_area",
  "contact_person",
  "notes",
  "avatar_url",
  "status",
]);

export function EntityRegistrationForm({
  categoryId,
  categoryName,
  entityKind,
  customSchema = [],
  initialData,
  isViewOnly = false,
  onSuccess,
  onCancel,
}: EntityRegistrationFormProps) {
  const { user } = useAuth();
  const kind: EntityKind = getEntityKind(entityKind);
  
  const [loading, setLoading] = useState(false);

  const fields = useMemo<KindField[]>(() => {
    const merged = [...kind.fields, ...(Array.isArray(customSchema) ? customSchema : [])];
    const seen = new Map<string, KindField>();
    merged.forEach((f) => f?.key && seen.set(f.key, f));
    return Array.from(seen.values());
  }, [kind, customSchema]);



  const buildInitialValues = () => {
    const base: Record<string, any> = {};
    base.name = initialData?.name || "";
    base.email = initialData?.email || "";
    base.phone = initialData?.phone || "";
    base.address = initialData?.address || "";
    base.notes = initialData?.notes || "";
    base.document = initialData?.document || "";
    base.avatar_url = initialData?.avatar_url || "";
    base.status = initialData?.status || "";
    fields.forEach((f) => {
      if (f.native) base[f.key] = initialData?.[f.native] ?? "";
      else base[f.key] = initialData?.custom_fields?.[f.key] ?? "";
    });
    return base;
  };

  const draftKey = !isViewOnly
    ? `entity-draft:${user?.id || "anon"}:${categoryId}:${initialData?.id || "new"}`
    : null;

  const [values, setValues] = useState<Record<string, any>>(() => {
    if (draftKey) {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) return { ...buildInitialValues(), ...JSON.parse(raw) };
      } catch {}
    }
    return buildInitialValues();
  });

  const skipFirst = useRef(true);
  useEffect(() => {
    if (!draftKey) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    try {
      localStorage.setItem(draftKey, JSON.stringify(values));
    } catch {}
  }, [values, draftKey]);

  const set = (key: string, val: any) => setValues((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isViewOnly) return;
    if (!values.name?.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }
    setLoading(true);
    try {
      const custom: Record<string, any> = { ...(initialData?.custom_fields || {}) };
      const payload: Record<string, any> = {
        name: values.name?.trim(),
        avatar_url: values.avatar_url || null,
        notes: values.notes || null,
        status: values.status || null,
      };

      if (kind.showContactBlock) {
        payload.email = values.email || null;
        payload.phone = values.phone || null;
        payload.address = values.address || null;
        payload.document = values.document || null;
      }

      fields.forEach((f) => {
        const v = values[f.key];
        if (f.native) payload[f.native] = v === "" ? null : v;
        else custom[f.key] = v === "" ? null : v;
      });

      payload.custom_fields = custom;
      payload.registration_category_id = categoryId;

      if (initialData?.id) {
        const { error } = await supabase.from("contacts").update(payload as any).eq("id", initialData.id);
        if (error) throw error;
        toast.success("Registro atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("contacts")
          .insert([{ ...payload, user_id: user.id } as any]);
        if (error) throw error;
        toast.success(`${kind.itemLabel} cadastrado com sucesso!`);
      }

      if (draftKey) {
        try { localStorage.removeItem(draftKey); } catch {}
      }
      window.dispatchEvent(new CustomEvent("registration-items-updated"));
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (f: KindField) => {
    const value = values[f.key] ?? "";
    const common = { id: f.key, disabled: isViewOnly };

    if (f.type === "textarea") {
      return (
        <div key={f.key} className="space-y-2 md:col-span-2">
          <Label htmlFor={f.key}>{f.label}</Label>
          <Textarea {...common} value={value} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
        </div>
      );
    }

    if (f.type === "select") {
      return (
        <div key={f.key} className="space-y-2">
          <Label htmlFor={f.key}>{f.label}</Label>
          <Select value={value || ""} onValueChange={(v) => set(f.key, v)} disabled={isViewOnly}>
            <SelectTrigger id={f.key}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {(f.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    const inputType =
      f.type === "number" || f.type === "currency" ? "number" :
      f.type === "date" ? "date" :
      f.type === "email" ? "email" : "text";

    return (
      <div key={f.key} className={`space-y-2 ${f.half === false ? "md:col-span-2" : ""}`}>
        <Label htmlFor={f.key}>{f.label}</Label>
        <Input
          {...common}
          type={inputType}
          step={f.type === "currency" ? "0.01" : undefined}
          value={value}
          placeholder={f.placeholder}
          onChange={(e) => set(f.key, e.target.value)}
        />
      </div>
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {kind.showAvatar && (
            <div className="flex justify-center mb-4">
              <div className="flex flex-col items-center gap-2">
                <Avatar className="w-20 h-20 border-2 border-primary/20 rounded-xl">
                  <AvatarImage src={values.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary rounded-xl">
                    {(values.name || "").slice(0, 2).toUpperCase() || "--"}
                  </AvatarFallback>
                </Avatar>
                {!isViewOnly && (
                  <ImageUpload
                    label="Imagem"
                    currentImage={values.avatar_url}
                    onImageSelect={(url) => set("avatar_url", url)}
                    bucketName="avatars"
                  />
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">{kind.nameLabel}</Label>
              <Input
                id="name"
                value={values.name}
                placeholder={kind.namePlaceholder}
                onChange={(e) => set("name", e.target.value)}
                disabled={isViewOnly}
                required
              />
            </div>

            {kind.showContactBlock && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} disabled={isViewOnly} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input id="phone" value={values.phone} onChange={(e) => set("phone", e.target.value)} disabled={isViewOnly} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CNPJ / Documento</Label>
                  <Input id="document" value={values.document} onChange={(e) => set("document", e.target.value)} disabled={isViewOnly} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" value={values.address} onChange={(e) => set("address", e.target.value)} disabled={isViewOnly} />
                </div>
              </>
            )}

            {fields.filter((f) => f.type !== "textarea").map(renderField)}


            {fields.filter((f) => f.type === "textarea").map(renderField)}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Observações gerais</Label>
              <Textarea id="notes" value={values.notes} onChange={(e) => set("notes", e.target.value)} disabled={isViewOnly} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              {isViewOnly ? "Fechar" : "Cancelar"}
            </Button>
            {!isViewOnly && (
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : initialData?.id ? "Atualizar" : "Cadastrar"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
