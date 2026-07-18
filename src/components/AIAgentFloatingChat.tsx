import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AIAgentFloatingChat = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFloatingAgents = async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true);
      
      if (!error && data) {
        // Filter agents that have isFloating: true in their config
        const floatingAgents = data.filter(agent => {
          const config = agent.config as any;
          return config?.isFloating === true;
        });
        setAgents(floatingAgents);
      }
    };

    fetchFloatingAgents();
  }, []);

  if (agents.length === 0) return null;

  // For now, we'll use the first floating agent found
  const agent = agents[0];
  const config = agent.config as any;
  const primaryColor = config?.primaryColor || "#6366f1";

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveAgentId(agent.id);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      {/* Chat Window */}
      {isOpen && activeAgentId && (
        <div className="w-[90vw] sm:w-[400px] h-[70vh] max-h-[600px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-4">
          <div 
            className="p-4 flex items-center justify-between text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              {config?.logoUrl && (
                <img src={config.logoUrl} alt="Logo" className="w-8 h-8 rounded-full bg-white/20 p-1 object-contain" />
              )}
              <span className="font-bold">{agent.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <iframe 
            src={`/agent-auth/${activeAgentId}`}
            className="flex-1 w-full border-none"
            title="Agent Chat"
          />
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={toggleChat}
        size="icon"
        className="w-14 h-14 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
      </Button>
    </div>
  );
};
