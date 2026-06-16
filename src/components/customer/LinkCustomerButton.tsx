import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link2, User, X } from "lucide-react";
import { CustomerPicker } from "./CustomerPicker";
import {
  ResourceType,
  useCustomerLink,
} from "@/hooks/useCustomerLink";
import { cn } from "@/lib/utils";

interface LinkCustomerButtonProps {
  resourceType: ResourceType;
  resourceId?: string | null;
  resourceTitle?: string;
  resourceUrl?: string;
  size?: "sm" | "default" | "icon";
  variant?: "outline" | "ghost" | "secondary";
  className?: string;
  compact?: boolean;
}

export function LinkCustomerButton({
  resourceType,
  resourceId,
  resourceTitle,
  resourceUrl,
  size = "sm",
  variant = "outline",
  className,
  compact = false,
}: LinkCustomerButtonProps) {
  const { customerId, linkCustomer, loading } = useCustomerLink({
    resourceType,
    resourceId,
    resourceTitle,
    resourceUrl,
  });
  const [open, setOpen] = useState(false);

  if (!resourceId) return null;

  const linked = !!customerId;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={linked ? "secondary" : variant}
          size={size}
          className={cn("gap-1.5", className)}
          disabled={loading}
        >
          {linked ? <User className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
          {!compact && (linked ? "Cliente atrelado" : "Atrelar cliente")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 space-y-2" align="end">
        <div className="text-sm font-medium">Atrelar a um cliente</div>
        <p className="text-xs text-muted-foreground">
          Quando você atrelar este item a um cliente, ele aparecerá na aba
          "Atividades" do cliente no Cadastro.
        </p>
        <CustomerPicker
          value={customerId}
          onChange={async (id) => {
            await linkCustomer(id);
            setOpen(false);
          }}
          allowClear
        />
        {linked && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={async () => {
              await linkCustomer(null);
              setOpen(false);
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Remover vínculo
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
