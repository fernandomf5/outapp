import { useEffect } from "react";

interface DraggableCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DraggableCalculator = ({ isOpen, onClose }: DraggableCalculatorProps) => {
  useEffect(() => {
    if (isOpen) {
      window.open('/calculadora', '_blank');
      onClose();
    }
  }, [isOpen, onClose]);
  
  return null;
};
