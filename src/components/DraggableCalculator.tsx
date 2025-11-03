import { useState, useRef, useEffect } from "react";
import { Calculator, X, Save, Trash2 } from "lucide-react";
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

interface DraggableCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DraggableCalculator = ({ isOpen, onClose }: DraggableCalculatorProps) => {
  const [display, setDisplay] = useState("0");
  const [currentValue, setCurrentValue] = useState("");
  const [operator, setOperator] = useState("");
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [calculationName, setCalculationName] = useState("");
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSavedCalculations();
    }
  }, [user]);

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

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.calc-button')) return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.calc-button')) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        if (!touch) return;
        e.preventDefault();
        setPosition({
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y,
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

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

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={calculatorRef}
        className="fixed z-50 shadow-2xl"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
      >
        <Card className="w-80 bg-card/95 backdrop-blur-sm border-2">
          <div className="p-4">
            {/* Header - Área de arrastar */}
            <div 
              className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing select-none bg-accent/20 -mx-4 -mt-4 px-4 py-3 rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Calculadora</h3>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="calc-button h-8 w-8"
                  onClick={() => setShowHistoryDialog(true)}
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="calc-button h-8 w-8"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Display */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4 text-right">
              <div className="text-3xl font-bold break-all">{display}</div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" className="calc-button" onClick={clear}>C</Button>
              <Button variant="outline" className="calc-button" onClick={() => performOperation("÷")}>÷</Button>
              <Button variant="outline" className="calc-button" onClick={() => performOperation("×")}>×</Button>
              <Button variant="outline" className="calc-button" onClick={() => setShowSaveDialog(true)}>
                <Save className="w-4 h-4" />
              </Button>

              <Button variant="outline" className="calc-button" onClick={() => inputDigit("7")}>7</Button>
              <Button variant="outline" className="calc-button" onClick={() => inputDigit("8")}>8</Button>
              <Button variant="outline" className="calc-button" onClick={() => inputDigit("9")}>9</Button>
              <Button variant="outline" className="calc-button" onClick={() => performOperation("-")}>-</Button>

              <Button variant="outline" className="calc-button" onClick={() => inputDigit("4")}>4</Button>
              <Button variant="outline" className="calc-button" onClick={() => inputDigit("5")}>5</Button>
              <Button variant="outline" className="calc-button" onClick={() => inputDigit("6")}>6</Button>
              <Button variant="outline" className="calc-button" onClick={() => performOperation("+")}>+</Button>

              <Button variant="outline" className="calc-button" onClick={() => inputDigit("1")}>1</Button>
              <Button variant="outline" className="calc-button" onClick={() => inputDigit("2")}>2</Button>
              <Button variant="outline" className="calc-button" onClick={() => inputDigit("3")}>3</Button>
              <Button variant="default" className="calc-button row-span-2" onClick={() => performOperation("=")}>=</Button>

              <Button variant="outline" className="calc-button col-span-2" onClick={() => inputDigit("0")}>0</Button>
              <Button variant="outline" className="calc-button" onClick={inputDecimal}>.</Button>
            </div>
          </div>
        </Card>
      </div>

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
    </>
  );
};
