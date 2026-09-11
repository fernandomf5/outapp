import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { sanitizeMoneyInput } from "@/lib/money";

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, "type" | "inputMode" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Campo de valor monetário livre: aceita qualquer valor (milhares, milhões),
 * com ou sem separadores brasileiros (160.000 / 4.000.000,00).
 * O parsing final é feito por parseMoneyBR no momento de salvar.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder, ...rest }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(sanitizeMoneyInput(e.target.value))}
        {...rest}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
