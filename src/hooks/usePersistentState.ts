import { useEffect, useRef, useState } from "react";

/**
 * usePersistentState
 * Igual ao useState, mas persiste o valor em localStorage (com fallback para sessionStorage)
 * usando a `key` informada. Ao remontar o componente (troca de aba do navegador, refresh,
 * volta pela rota, etc.) o estado é restaurado automaticamente de onde o usuário parou.
 *
 * Uso:
 *   const [form, setForm] = usePersistentState("cadastro:cliente:novo", { nome: "", email: "" });
 *
 * Dica: inclua no `key` algo único do contexto (id do usuário, id do registro em edição,
 * id da categoria, etc.) para não misturar rascunhos de telas diferentes.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T),
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const readInitial = (): T => {
    if (typeof window === "undefined") {
      return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    }
    try {
      const raw = window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  };

  const [value, setValue] = useState<T>(readInitial);
  const keyRef = useRef(key);

  // Se a key mudar, recarrega o estado da nova key.
  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(readInitial());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persiste sempre que o valor mudar.
  useEffect(() => {
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      window.sessionStorage.setItem(key, serialized);
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [key, value]);

  const clear = () => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  };

  return [value, setValue, clear];
}

export default usePersistentState;
