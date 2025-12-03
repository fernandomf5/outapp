import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Copy, MessageCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ChatWidgetGeneratorProps {
  botId: string;
  type?: 'chatbot' | 'agent' | 'funnel';
}

export const ChatWidgetGenerator = ({ botId, type = 'chatbot' }: ChatWidgetGeneratorProps) => {
  const { toast } = useToast();
  const [position, setPosition] = useState('bottom-right');
  const [buttonColor, setButtonColor] = useState('#25D366');
  const [buttonText, setButtonText] = useState('Chat Online');

  const generateWidgetCode = () => {
    const chatUrl = type === 'agent' 
      ? `${window.location.origin}/agent-chat/${botId}` 
      : `${window.location.origin}/chatbot-chat/${botId}`;

    const positionStyles: Record<string, string> = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
    };

    return `<!-- Out App - Widget de Chat Online -->
<div id="out-app-widget">
  <style>
    #out-app-widget * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    #out-app-button {
      position: fixed !important;
      ${positionStyles[position]}
      width: 60px !important;
      height: 60px !important;
      min-width: 60px !important;
      min-height: 60px !important;
      border-radius: 50% !important;
      background: ${buttonColor} !important;
      color: white !important;
      border: none !important;
      cursor: pointer !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      z-index: 999998 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.3s ease !important;
      flex-shrink: 0 !important;
      font-family: inherit !important;
      outline: none !important;
    }
    @media (max-width: 768px) {
      #out-app-button {
        width: 56px !important;
        height: 56px !important;
        min-width: 56px !important;
        min-height: 56px !important;
        bottom: ${position.includes('bottom') ? '16px' : 'auto'} !important;
        top: ${position.includes('top') ? '16px' : 'auto'} !important;
        right: ${position.includes('right') ? '16px' : 'auto'} !important;
        left: ${position.includes('left') ? '16px' : 'auto'} !important;
      }
    }
    #out-app-button:hover {
      transform: scale(1.1) !important;
      box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
    }
    #out-app-button svg {
      width: 30px !important;
      height: 30px !important;
      pointer-events: none !important;
    }
    #out-app-tooltip {
      position: fixed !important;
      ${positionStyles[position]}
      ${position.includes('right') ? 'right: 90px !important;' : 'left: 90px !important;'}
      background: white !important;
      color: #333 !important;
      padding: 8px 12px !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
      font-size: 14px !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      white-space: nowrap !important;
      z-index: 999997 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.3s ease !important;
      max-width: calc(100vw - 120px) !important;
    }
    #out-app-button:hover + #out-app-tooltip {
      opacity: 1 !important;
    }
    @media (max-width: 768px) {
      #out-app-tooltip {
        display: none !important;
      }
    }
    #out-app-iframe-container {
      display: none !important;
      position: fixed !important;
      ${positionStyles[position]}
      width: 400px !important;
      height: 600px !important;
      max-width: calc(100vw - 40px) !important;
      max-height: calc(100vh - 40px) !important;
      border-radius: 16px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
      z-index: 999999 !important;
      overflow: hidden !important;
      background: white !important;
    }
    #out-app-iframe-container.open {
      display: block !important;
      animation: outAppSlideUp 0.3s ease !important;
    }
    @keyframes outAppSlideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    #out-app-iframe {
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      display: block !important;
    }
    #out-app-close {
      position: absolute !important;
      top: 10px !important;
      right: 10px !important;
      width: 32px !important;
      height: 32px !important;
      border-radius: 50% !important;
      background: rgba(0,0,0,0.5) !important;
      color: white !important;
      border: none !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 1000000 !important;
      transition: background 0.2s ease !important;
      font-family: inherit !important;
      outline: none !important;
    }
    #out-app-close:hover {
      background: rgba(0,0,0,0.7) !important;
    }
    #out-app-close svg {
      pointer-events: none !important;
    }
    @media (max-width: 768px) {
      #out-app-iframe-container {
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
      }
    }
  </style>

  <a id="out-app-button" href="${chatUrl}" target="_blank" rel="noopener noreferrer" aria-label="Abrir chat online">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  </a>
  
  <div id="out-app-tooltip">${buttonText}</div>


</div>`;
  };

  const handleCopyCode = () => {
    const code = generateWidgetCode();
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado! ✅",
      description: "Cole o código no seu site antes do fechamento da tag </body>",
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-xl">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-primary">Gerar Botão Flutuante</h3>
          <p className="text-sm text-muted-foreground">
            Adicione um widget de chat online ao seu site
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Posição */}
        <div className="space-y-3">
          <Label>Posição do Botão</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Inferior Direito</SelectItem>
              <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
              <SelectItem value="top-right">Superior Direito</SelectItem>
              <SelectItem value="top-left">Superior Esquerdo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cor do Botão */}
        <div className="space-y-3">
          <Label>Cor do Botão</Label>
          <div className="flex gap-3">
            <Input
              type="color"
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
              className="w-20 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
              placeholder="#25D366"
              className="flex-1"
            />
          </div>
        </div>

        {/* Texto do Tooltip */}
        <div className="space-y-3">
          <Label>Texto ao passar o mouse</Label>
          <Input
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="Chat Online"
          />
        </div>

        {/* Prévia */}
        <div className="bg-accent/50 p-6 rounded-xl">
          <Label className="mb-3 block">Prévia do Botão</Label>
          <div className="relative h-24 bg-background rounded-lg border-2 border-dashed border-border flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: buttonColor }}
            >
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Código Gerado */}
        <div className="space-y-3">
          <Label>Código HTML para seu site</Label>
          <div className="relative">
            <Textarea
              value={generateWidgetCode()}
              readOnly
              rows={8}
              className="font-mono text-xs bg-muted"
            />
            <Button
              onClick={handleCopyCode}
              size="sm"
              className="absolute top-2 right-2"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
          <h4 className="font-semibold mb-2 text-sm">📋 Como usar:</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Copie o código acima</li>
            <li>Cole no seu site antes do fechamento da tag <code className="bg-muted px-1 rounded">&lt;/body&gt;</code></li>
            <li>O botão flutuante aparecerá automaticamente</li>
            <li>Ao clicar, o chat abrirá em um popup elegante</li>
          </ol>
        </div>
      </div>
    </Card>
  );
};
