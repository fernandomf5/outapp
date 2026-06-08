import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SecureDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}

export function SecureDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmar Exclusão",
  description = "Esta ação não pode ser desfeita. Para confirmar, digite 'excluir' abaixo.",
  itemName,
}: SecureDeleteDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");

  const handleConfirm = () => {
    if (confirmationText.toLowerCase() === "excluir") {
      onConfirm();
      setConfirmationText("");
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmationText("");
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            {itemName && (
              <span className="block mt-2 font-bold text-foreground">
                Item: {itemName}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="confirmation">Digite "excluir" para confirmar:</Label>
          <Input
            id="confirmation"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="excluir"
            className="border-destructive/50 focus-visible:ring-destructive"
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={confirmationText.toLowerCase() !== "excluir"}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
