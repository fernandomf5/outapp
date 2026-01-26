import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Volume2, 
  Play, 
  Pause,
  Check,
  Loader2,
  Mic
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  preview?: string;
}

// ElevenLabs top voices
const AVAILABLE_VOICES: Voice[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Voz feminina suave e profissional', gender: 'female', accent: 'Americano' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Voz masculina grave e confiante', gender: 'male', accent: 'Britânico' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Voz feminina clara e amigável', gender: 'female', accent: 'Americano' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Voz masculina casual e natural', gender: 'male', accent: 'Australiano' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Voz masculina jovem e energética', gender: 'male', accent: 'Americano' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Voz feminina calorosa e acolhedora', gender: 'female', accent: 'Americano' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Voz feminina doce e expressiva', gender: 'female', accent: 'Britânico' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Voz masculina profissional', gender: 'male', accent: 'Americano' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Voz masculina elegante', gender: 'male', accent: 'Britânico' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Voz feminina vibrante', gender: 'female', accent: 'Americano' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', description: 'Voz masculina amigável', gender: 'male', accent: 'Americano' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', description: 'Voz neutra versátil', gender: 'neutral', accent: 'Americano' },
];

interface VoiceSelectorProps {
  selectedVoiceId: string | null;
  onSelectVoice: (voiceId: string, voiceName: string) => void;
}

export function VoiceSelector({ selectedVoiceId, onSelectVoice }: VoiceSelectorProps) {
  const { toast } = useToast();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlayPreview = async (voice: Voice) => {
    // For now, just show a message that preview requires API
    toast({
      title: "Preview de Voz",
      description: `Para ouvir a voz "${voice.name}", configure a API do ElevenLabs.`,
    });
  };

  const handleSelectVoice = (voice: Voice) => {
    onSelectVoice(voice.id, voice.name);
    toast({
      title: "Voz Selecionada! 🎙️",
      description: `A voz "${voice.name}" será usada pelo seu agente.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          Escolha a Voz do Agente
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecione a voz que seu agente usará para responder áudios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Voice Type Filter */}
        <Card className="col-span-full">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                Todas
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                👩 Femininas
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                👨 Masculinas
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                🌐 Neutras
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Voices Grid */}
        <ScrollArea className="col-span-full h-[400px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AVAILABLE_VOICES.map((voice) => (
              <Card 
                key={voice.id} 
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedVoiceId === voice.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
                }`}
                onClick={() => handleSelectVoice(voice)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${
                        voice.gender === 'female' ? 'bg-pink-500/20' : 
                        voice.gender === 'male' ? 'bg-blue-500/20' : 
                        'bg-purple-500/20'
                      }`}>
                        <Mic className={`w-4 h-4 ${
                          voice.gender === 'female' ? 'text-pink-500' : 
                          voice.gender === 'male' ? 'text-blue-500' : 
                          'text-purple-500'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{voice.name}</h4>
                        <p className="text-xs text-muted-foreground">{voice.accent}</p>
                      </div>
                    </div>
                    
                    {selectedVoiceId === voice.id && (
                      <Badge className="bg-primary text-primary-foreground">
                        <Check className="w-3 h-3 mr-1" /> Selecionada
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    {voice.description}
                  </p>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPreview(voice);
                    }}
                  >
                    {playingId === voice.id ? (
                      <>
                        <Pause className="w-3 h-3 mr-1" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" /> Ouvir Preview
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Sobre as Vozes</p>
              <p className="text-xs text-muted-foreground">
                As vozes são fornecidas pela ElevenLabs, uma das melhores tecnologias de síntese de voz do mercado. 
                Para ativar respostas por áudio, configure sua chave API do ElevenLabs nas configurações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
