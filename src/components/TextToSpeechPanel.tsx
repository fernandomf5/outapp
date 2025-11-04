import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Volume2, Download, Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
  style: string;
}

const neuralVoices: Voice[] = [
  { id: "pt-BR-FranciscaNeural", name: "Francisca", language: "pt-BR", gender: "Feminino", style: "Jovem e Natural" },
  { id: "pt-BR-AntonioNeural", name: "Antonio", language: "pt-BR", gender: "Masculino", style: "Profissional" },
  { id: "pt-BR-BrendaNeural", name: "Brenda", language: "pt-BR", gender: "Feminino", style: "Elegante" },
  { id: "pt-BR-DonatoNeural", name: "Donato", language: "pt-BR", gender: "Masculino", style: "Sério e Formal" },
  { id: "pt-BR-ElzaNeural", name: "Elza", language: "pt-BR", gender: "Feminino", style: "Madura e Confiante" },
  { id: "pt-BR-FabioNeural", name: "Fábio", language: "pt-BR", gender: "Masculino", style: "Amigável" },
  { id: "pt-BR-GiovannaNeural", name: "Giovanna", language: "pt-BR", gender: "Feminino", style: "Jovem e Energética" },
  { id: "pt-BR-HumbertoNeural", name: "Humberto", language: "pt-BR", gender: "Masculino", style: "Maduro e Sério" },
  { id: "pt-BR-JulioNeural", name: "Júlio", language: "pt-BR", gender: "Masculino", style: "Casual" },
  { id: "pt-BR-LeilaNeural", name: "Leila", language: "pt-BR", gender: "Feminino", style: "Suave" },
  { id: "pt-BR-LeticiaNeural", name: "Letícia", language: "pt-BR", gender: "Feminino", style: "Empresarial" },
  { id: "pt-BR-ManuelaNeural", name: "Manuela", language: "pt-BR", gender: "Feminino", style: "Clara e Natural" },
  { id: "pt-BR-NicolauNeural", name: "Nicolau", language: "pt-BR", gender: "Masculino", style: "Warm e Friendly" },
  { id: "pt-BR-ThalitaNeural", name: "Thalita", language: "pt-BR", gender: "Feminino", style: "Versátil" },
  { id: "pt-BR-ValerioNeural", name: "Valério", language: "pt-BR", gender: "Masculino", style: "Corporativo" },
  { id: "pt-BR-YaraNeural", name: "Yara", language: "pt-BR", gender: "Feminino", style: "Moderna" },
];

export const TextToSpeechPanel = () => {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(neuralVoices[0].id);
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const selectedVoiceData = neuralVoices.find(v => v.id === selectedVoice);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Digite um texto para narrar");
      return;
    }

    setIsGenerating(true);

    try {
      // Usar Web Speech API como demonstração
      // Em produção, você pode usar Azure TTS, Google TTS, ElevenLabs, etc.
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Tentar encontrar uma voz em português
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(voice => voice.lang.startsWith('pt'));
        
        if (ptVoice) {
          utterance.voice = ptVoice;
        }
        
        utterance.rate = speed[0];
        utterance.pitch = pitch[0];
        
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsGenerating(false);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        utterance.onerror = () => {
          setIsPlaying(false);
          setIsGenerating(false);
          toast.error("Erro ao gerar narração");
        };
        
        window.speechSynthesis.speak(utterance);
        toast.success("Narração iniciada!");
      } else {
        throw new Error("Seu navegador não suporta síntese de voz");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar narração");
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    toast.info("Para baixar áudio em alta qualidade, integre com Azure TTS, Google Cloud TTS ou ElevenLabs API");
  };

  const characterCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const estimatedDuration = Math.ceil(wordCount / 2.5); // ~150 palavras por minuto

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Narração de Texto (TTS)</h2>
        <p className="text-muted-foreground">
          Converta texto em áudio com vozes neurais realistas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Texto para Narrar</CardTitle>
              <CardDescription>Digite ou cole o texto que deseja converter em áudio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite ou cole seu texto aqui..."
                rows={12}
                className="resize-none"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{characterCount} caracteres • {wordCount} palavras</span>
                <span>≈ {estimatedDuration}s de áudio</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={isPlaying ? handleStop : handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="flex-1 gradient-primary shadow-glow"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Parar
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Gerar e Reproduzir
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              disabled={!audioUrl}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar MP3
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Configurações de Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Narrador Neural</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {neuralVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{voice.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {voice.gender} • {voice.style}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVoiceData && (
                  <p className="text-xs text-muted-foreground">
                    {selectedVoiceData.gender} • {selectedVoiceData.style}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Velocidade</Label>
                  <span className="text-sm text-muted-foreground">{speed[0].toFixed(1)}x</span>
                </div>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tom de Voz</Label>
                  <span className="text-sm text-muted-foreground">{pitch[0].toFixed(1)}x</span>
                </div>
                <Slider
                  value={pitch}
                  onValueChange={setPitch}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">💡 Dica Profissional</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                • Use pontuação para controlar pausas
              </p>
              <p>
                • Textos mais curtos geram melhor qualidade
              </p>
              <p>
                • Para produção, integre com APIs como Azure TTS ou ElevenLabs
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
