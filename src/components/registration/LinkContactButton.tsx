import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { ContactPicker } from "./ContactPicker";
import { useResourceContactLink } from "@/hooks/useContactResourceLinks";

interface LinkContactButtonProps {
  resourceType: string;
  resourceId: string;
  resourceTitle?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  className?: string;
  onLinked?: (contactId: string | null) => void;
}

/**
 * Drop-in button that lets the user attach any resource to a cadastro.
 */
export function LinkContactButton({
  resourceType,
  resourceId,
  resourceTitle,
  variant = "outline",
  size = "sm",
  className,
  onLinked,
}: LinkContactButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { contactId, setContactId, saveLink } = useResourceContactLink(resourceType, resourceId);

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveLink(resourceId, contactId, resourceTitle);
      toast.success(contactId ? "Recurso atribuído ao cadastro" : "Atribuição removida");
      onLinked?.(contactId);
      setOpen(false);
    } catch (e: any) {
      toast.error("Erro ao atribuir: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Link2 className="h-4 w-4 mr-1" />
        {contactId ? "Cadastro atribuído" : "Atribuir a cadastro"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px] z-[300]">
          <DialogHeader>
            <DialogTitle>Atribuir a um cadastro</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <ContactPicker value={contactId} onChange={setContactId} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
