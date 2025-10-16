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
  chatId: string;
  chatName: string;
  type: 'chatbot' | 'agent';
}

export const ChatWidgetGenerator = ({ chatId, chatName, type }: ChatWidgetGeneratorProps) => {
  const { toast } = useToast();
  const [position, setPosition] = useState('bottom-right');
  const [buttonColor, setButtonColor] = useState('#25D366');
  const [buttonText, setButtonText] = useState('Chat Online');

  const generateWidgetCode = () => {
    const slug = (chatName || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const chatUrl = `${window.location.origin}/chat/${chatId}/${slug || 'bot'}`;

    const positionStyles: Record<string, string> = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
    };

    return `<!-- Bot Reals Zap - Widget de Chat Online -->
<div id="bot-reals-zap-widget">
  <style>
    #bot-reals-zap-button {
      position: fixed;
      ${positionStyles[position]}
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${buttonColor};
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    #bot-reals-zap-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }
    #bot-reals-zap-button svg {
      width: 30px;
      height: 30px;
    }
    #bot-reals-zap-tooltip {
      position: fixed;
      ${positionStyles[position].replace('20px', '20px')}
      ${position.includes('right') ? 'right: 90px;' : 'left: 90px;'}
      background: white;
      padding: 8px 12px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      white-space: nowrap;
      z-index: 9997;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    #bot-reals-zap-button:hover + #bot-reals-zap-tooltip {
      opacity: 1;
    }
    #bot-reals-zap-iframe-container {
      display: none;
      position: fixed;
      ${positionStyles[position]}
      width: 400px;
      height: 600px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 40px);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 9999;
      overflow: hidden;
      background: white;
    }
    #bot-reals-zap-iframe-container.open {
      display: block;
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    #bot-reals-zap-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    #bot-reals-zap-close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      transition: background 0.2s ease;
    }
    #bot-reals-zap-close:hover {
      background: rgba(0,0,0,0.7);
    }
    @media (max-width: 768px) {
      #bot-reals-zap-iframe-container {
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

  <button id="bot-reals-zap-button" onclick="toggleBotChat()" aria-label="Abrir chat">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  </button>
  
  <div id="bot-reals-zap-tooltip">${buttonText}</div>

  <div id="bot-reals-zap-iframe-container">
    <button id="bot-reals-zap-close" onclick="toggleBotChat()" aria-label="Fechar chat">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <iframe id="bot-reals-zap-iframe" src="${chatUrl}" allow="microphone"></iframe>
  </div>

  <script>
    function toggleBotChat() {
      const container = document.getElementById('bot-reals-zap-iframe-container');
      const button = document.getElementById('bot-reals-zap-button');
      
      if (container.classList.contains('open')) {
        container.classList.remove('open');
        button.style.display = 'flex';
      } else {
        container.classList.add('open');
        button.style.display = 'none';
      }
    }
  </script>
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
