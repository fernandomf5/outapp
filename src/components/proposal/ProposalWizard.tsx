import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface ProposalWizardProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
  canProceed: boolean;
  isLastStep: boolean;
  steps: { label: string; icon: React.ReactNode }[];
}

export function ProposalWizard({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onFinish,
  canProceed,
  isLastStep,
  steps
}: ProposalWizardProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Passo {currentStep + 1} de {totalSteps}</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              index === currentStep
                ? 'bg-primary text-primary-foreground'
                : index < currentStep
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {index < currentStep ? (
              <Check className="h-3 w-3" />
            ) : (
              step.icon
            )}
            <span className="hidden sm:inline">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        
        {isLastStep ? (
          <Button onClick={onFinish} disabled={!canProceed}>
            <Check className="h-4 w-4 mr-1" />
            Finalizar Proposta
          </Button>
        ) : (
          <Button onClick={onNext} disabled={!canProceed}>
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
