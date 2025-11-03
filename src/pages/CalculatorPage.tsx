import { useState } from "react";
import { Calculator, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

export default function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [currentValue, setCurrentValue] = useState("");
  const [operator, setOperator] = useState("");
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [calculationName, setCalculationName] = useState("");
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSavedCalculations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('saved_calculations' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedCalculations(data as unknown as SavedCalculation[]);
    }
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setCurrentValue("");
    setOperator("");
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (currentValue === "") {
      setCurrentValue(String(inputValue));
    } else if (operator) {
      const currentVal = parseFloat(currentValue);
      let newValue = currentVal;

      switch (operator) {
        case "+":
          newValue = currentVal + inputValue;
          break;
        case "-":
          newValue = currentVal - inputValue;
          break;
        case "×":
          newValue = currentVal * inputValue;
          break;
        case "÷":
          newValue = currentVal / inputValue;
          break;
        case "=":
          newValue = inputValue;
          break;
      }

      setCurrentValue(String(newValue));
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleSaveCalculation = async () => {
    if (!user || !calculationName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o cálculo",
        variant: "destructive",
      });
      return;
    }

    const expression = currentValue && operator ? `${currentValue} ${operator} ${display}` : display;

    const { error } = await supabase
      .from('saved_calculations' as any)
      .insert({
        user_id: user.id,
        name: calculationName,
        expression: expression,
        result: display,
      });

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cálculo salvo! 💾",
        description: "Seu cálculo foi salvo com sucesso.",
      });
      setShowSaveDialog(false);
      setCalculationName("");
      fetchSavedCalculations();
    }
  };

  const handleDeleteCalculation = async (id: string) => {
    const { error } = await supabase
      .from('saved_calculations' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cálculo excluído",
        description: "O cálculo foi removido com sucesso.",
      });
      fetchSavedCalculations();
    }
  };

  const loadCalculation = (calc: SavedCalculation) => {
    setDisplay(calc.result);
    setShowHistoryDialog(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-md bg-card shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Calculadora</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                fetchSavedCalculations();
                setShowHistoryDialog(true);
              }}
            >
              <Save className="w-5 h-5" />
            </Button>
          </div>

          {/* Display */}
          <div className="bg-muted/50 rounded-lg p-6 mb-6 text-right">
            <div className="text-4xl font-bold break-all">{display}</div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-3">
            <Button variant="outline" onClick={clear}>C</Button>
            <Button variant="outline" onClick={() => performOperation("÷")}>÷</Button>
            <Button variant="outline" onClick={() => performOperation("×")}>×</Button>
            <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
              <Save className="w-4 h-4" />
            </Button>

            <Button variant="outline" onClick={() => inputDigit("7")}>7</Button>
            <Button variant="outline" onClick={() => inputDigit("8")}>8</Button>
            <Button variant="outline" onClick={() => inputDigit("9")}>9</Button>
            <Button variant="outline" onClick={() => performOperation("-")}>-</Button>

            <Button variant="outline" onClick={() => inputDigit("4")}>4</Button>
            <Button variant="outline" onClick={() => inputDigit("5")}>5</Button>
            <Button variant="outline" onClick={() => inputDigit("6")}>6</Button>
            <Button variant="outline" onClick={() => performOperation("+")}>+</Button>

            <Button variant="outline" onClick={() => inputDigit("1")}>1</Button>
            <Button variant="outline" onClick={() => inputDigit("2")}>2</Button>
            <Button variant="outline" onClick={() => inputDigit("3")}>3</Button>
            <Button variant="default" className="row-span-2" onClick={() => performOperation("=")}>=</Button>

            <Button variant="outline" className="col-span-2" onClick={() => inputDigit("0")}>0</Button>
            <Button variant="outline" onClick={inputDecimal}>.</Button>
          </div>
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
              <p className="text-sm text-muted-foreground">Resultado:</p>
              <p className="text-2xl font-bold">{display}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
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
              <p className="text-center text-muted-foreground py-8">
                Nenhum cálculo salvo ainda
              </p>
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
                          {new Date(calc.created_at).toLocaleDateString('pt-BR')}
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
