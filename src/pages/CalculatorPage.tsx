import { useState, useEffect, useCallback } from "react";
import { Calculator, Save, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chatSounds } from "@/utils/chatSounds";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SavedCalculation {
  id: string;
  name: string;
  expression: string;
  result: string;
  created_at: string;
}

type Op = "+" | "-" | "×" | "÷" | null;

export default function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<Op>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [calculationName, setCalculationName] = useState("");
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const formatNumber = (n: number): string => {
    if (!isFinite(n)) return "Erro";
    if (Number.isInteger(n) && Math.abs(n) < 1e16) return n.toString();
    const abs = Math.abs(n);
    if (abs !== 0 && (abs < 1e-6 || abs >= 1e16)) return n.toExponential(6);
    // limit decimals to keep display tidy
    return parseFloat(n.toPrecision(12)).toString();
  };

  const fetchSavedCalculations = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("saved_calculations" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setSavedCalculations(data as unknown as SavedCalculation[]);
  };

  const inputDigit = (digit: string) => {
    chatSounds.playTypingSound();
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    chatSounds.playTypingSound();
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clearAll = () => {
    setDisplay("0");
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression("");
  };

  // C clears entry only; AC clears all. iPhone shows AC unless an entry exists.
  const clearEntry = () => {
    setDisplay("0");
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    if (display === "0" || display === "Erro") return;
    setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
  };

  const percent = () => {
    const v = parseFloat(display);
    if (isNaN(v)) return;
    setDisplay(formatNumber(v / 100));
  };

  const compute = (a: number, b: number, op: Op): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const performOperation = (nextOperator: Op) => {
    chatSounds.playTypingSound();
    const inputValue = parseFloat(display);

    if (previous === null) {
      setPrevious(inputValue);
      setExpression(`${formatNumber(inputValue)} ${nextOperator ?? ""}`.trim());
    } else if (!waitingForOperand && operator) {
      const result = compute(previous, inputValue, operator);
      const formatted = formatNumber(result);
      setDisplay(formatted);
      setPrevious(result);
      setExpression(`${formatted} ${nextOperator ?? ""}`.trim());
    } else if (operator) {
      // swap operator without recomputing
      setExpression(`${formatNumber(previous)} ${nextOperator ?? ""}`.trim());
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const equals = () => {
    chatSounds.playSendSound();
    if (operator === null || previous === null) return;
    const inputValue = parseFloat(display);
    const result = compute(previous, inputValue, operator);
    const formatted = formatNumber(result);
    setExpression(`${formatNumber(previous)} ${operator} ${formatNumber(inputValue)} =`);
    setDisplay(formatted);
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const backspace = () => {
    if (waitingForOperand) return;
    if (display.length <= 1 || (display.length === 2 && display.startsWith("-"))) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key);
      else if (e.key === ".") inputDecimal();
      else if (e.key === "+" || e.key === "-") performOperation(e.key as Op);
      else if (e.key === "*") performOperation("×");
      else if (e.key === "/") { e.preventDefault(); performOperation("÷"); }
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); }
      else if (e.key === "Escape") clearAll();
      else if (e.key === "Backspace") backspace();
      else if (e.key === "%") percent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, previous, operator, waitingForOperand]);

  const handleSaveCalculation = async () => {
    if (!user || !calculationName.trim()) {
      toast({ title: "Erro", description: "Digite um nome para o cálculo", variant: "destructive" });
      return;
    }
    const expr = expression || display;
    const { error } = await supabase
      .from("saved_calculations" as any)
      .insert({ user_id: user.id, name: calculationName, expression: expr, result: display });
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cálculo salvo!", description: "Seu cálculo foi salvo com sucesso." });
      setShowSaveDialog(false);
      setCalculationName("");
      fetchSavedCalculations();
    }
  };

  const handleDeleteCalculation = async (id: string) => {
    const { error } = await supabase.from("saved_calculations" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cálculo excluído" });
      fetchSavedCalculations();
    }
  };

  const loadCalculation = (calc: SavedCalculation) => {
    setDisplay(calc.result);
    setExpression(calc.expression);
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(true);
    setShowHistoryDialog(false);
  };

  const isEntry = display !== "0" || waitingForOperand === false && previous !== null;
  const clearLabel = display !== "0" && !waitingForOperand ? "C" : "AC";

  // iPhone-style button classes
  const fnBtn =
    "h-16 sm:h-20 text-2xl font-medium rounded-full bg-[hsl(0_0%_65%)] hover:bg-[hsl(0_0%_75%)] text-black transition-all active:scale-95 shadow-md";
  const opBtn =
    "h-16 sm:h-20 text-3xl font-medium rounded-full bg-[hsl(35_100%_50%)] hover:bg-[hsl(35_100%_60%)] text-white transition-all active:scale-95 shadow-md";
  const opBtnActive =
    "h-16 sm:h-20 text-3xl font-medium rounded-full bg-white text-[hsl(35_100%_50%)] hover:bg-white transition-all active:scale-95 shadow-md";
  const numBtn =
    "h-16 sm:h-20 text-2xl font-normal rounded-full bg-[hsl(0_0%_20%)] hover:bg-[hsl(0_0%_28%)] text-white transition-all active:scale-95 shadow-md";

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-sm shadow-2xl bg-black border-zinc-800 overflow-hidden">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-400" />
              <h1 className="text-base font-semibold text-white">Calculadora</h1>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { fetchSavedCalculations(); setShowHistoryDialog(true); }}
                className="hover:bg-zinc-900 text-zinc-300 h-8 w-8"
                aria-label="Histórico"
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSaveDialog(true)}
                className="hover:bg-zinc-900 text-zinc-300 h-8 w-8"
                aria-label="Salvar"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Display */}
          <div className="px-2 py-6 mb-3 text-right min-h-[140px] flex flex-col justify-end">
            {expression && (
              <div className="text-sm text-zinc-500 truncate font-light">{expression}</div>
            )}
            <div
              className="font-light text-white break-all leading-none"
              style={{
                fontSize: display.length > 9 ? "3rem" : display.length > 6 ? "3.5rem" : "4.5rem",
              }}
            >
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2.5">
            <Button className={fnBtn} onClick={clearLabel === "AC" ? clearAll : clearEntry}>
              {clearLabel}
            </Button>
            <Button className={fnBtn} onClick={toggleSign}>+/−</Button>
            <Button className={fnBtn} onClick={percent}>%</Button>
            <Button
              className={operator === "÷" && waitingForOperand ? opBtnActive : opBtn}
              onClick={() => performOperation("÷")}
            >
              ÷
            </Button>

            <Button className={numBtn} onClick={() => inputDigit("7")}>7</Button>
            <Button className={numBtn} onClick={() => inputDigit("8")}>8</Button>
            <Button className={numBtn} onClick={() => inputDigit("9")}>9</Button>
            <Button
              className={operator === "×" && waitingForOperand ? opBtnActive : opBtn}
              onClick={() => performOperation("×")}
            >
              ×
            </Button>

            <Button className={numBtn} onClick={() => inputDigit("4")}>4</Button>
            <Button className={numBtn} onClick={() => inputDigit("5")}>5</Button>
            <Button className={numBtn} onClick={() => inputDigit("6")}>6</Button>
            <Button
              className={operator === "-" && waitingForOperand ? opBtnActive : opBtn}
              onClick={() => performOperation("-")}
            >
              −
            </Button>

            <Button className={numBtn} onClick={() => inputDigit("1")}>1</Button>
            <Button className={numBtn} onClick={() => inputDigit("2")}>2</Button>
            <Button className={numBtn} onClick={() => inputDigit("3")}>3</Button>
            <Button
              className={operator === "+" && waitingForOperand ? opBtnActive : opBtn}
              onClick={() => performOperation("+")}
            >
              +
            </Button>

            <Button
              className={`${numBtn} col-span-2 !rounded-full text-left pl-7`}
              onClick={() => inputDigit("0")}
            >
              0
            </Button>
            <Button className={numBtn} onClick={inputDecimal}>,</Button>
            <Button className={opBtn} onClick={equals}>=</Button>
          </div>

          <p className="text-[10px] text-zinc-600 text-center mt-3">
            Atalhos: 0–9, + − * / , Enter, %, Backspace, Esc
          </p>
        </div>
      </Card>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Cálculo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="calc-name">Nome do Cálculo</Label>
              <Input
                id="calc-name"
                value={calculationName}
                onChange={(e) => setCalculationName(e.target.value)}
                placeholder="Ex: Orçamento do mês"
              />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">{expression || "Resultado:"}</p>
              <p className="text-2xl font-bold">{display}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCalculation}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cálculos Salvos</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {savedCalculations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum cálculo salvo ainda</p>
            ) : (
              <div className="space-y-2">
                {savedCalculations.map((calc) => (
                  <Card key={calc.id} className="p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => loadCalculation(calc)}>
                        <h4 className="font-semibold">{calc.name}</h4>
                        <p className="text-sm text-muted-foreground">{calc.expression}</p>
                        <p className="text-lg font-bold text-primary">{calc.result}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(calc.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteCalculation(calc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
