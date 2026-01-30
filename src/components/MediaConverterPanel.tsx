import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, Download, Video, Music, RefreshCw, FileAudio, FileVideo, Loader2, X } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FeatureGate } from './FeatureGate';

const VIDEO_FORMATS = [
  { value: 'mp4', label: 'MP4', mime: 'video/mp4' },
  { value: 'webm', label: 'WebM', mime: 'video/webm' },
  { value: 'avi', label: 'AVI', mime: 'video/avi' },
  { value: 'mov', label: 'MOV', mime: 'video/quicktime' },
  { value: 'mkv', label: 'MKV', mime: 'video/x-matroska' },
  { value: 'flv', label: 'FLV', mime: 'video/x-flv' },
  { value: 'wmv', label: 'WMV', mime: 'video/x-ms-wmv' },
  { value: 'gif', label: 'GIF', mime: 'image/gif' },
];

const AUDIO_FORMATS = [
  { value: 'mp3', label: 'MP3', mime: 'audio/mpeg' },
  { value: 'wav', label: 'WAV', mime: 'audio/wav' },
  { value: 'ogg', label: 'OGG', mime: 'audio/ogg' },
  { value: 'aac', label: 'AAC', mime: 'audio/aac' },
  { value: 'flac', label: 'FLAC', mime: 'audio/flac' },
  { value: 'm4a', label: 'M4A', mime: 'audio/mp4' },
  { value: 'wma', label: 'WMA', mime: 'audio/x-ms-wma' },
];

export const MediaConverterPanel = () => {
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('video');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    setLoading(true);
    try {
      const ffmpegInstance = new FFmpeg();
      
      ffmpegInstance.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setFFmpeg(ffmpegInstance);
      setLoaded(true);
      toast.success('Conversor carregado com sucesso!');
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
      toast.error('Erro ao carregar o conversor. Tente recarregar a página.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setConvertedUrl(null);
      setProgress(0);
      
      // Auto-detect if it's video or audio
      if (file.type.startsWith('video/')) {
        setActiveTab('video');
        setOutputFormat('mp4');
      } else if (file.type.startsWith('audio/')) {
        setActiveTab('audio');
        setOutputFormat('mp3');
      }
    }
  };

  const handleConvert = async () => {
    if (!ffmpeg || !selectedFile) return;

    setConverting(true);
    setProgress(0);
    setConvertedUrl(null);

    try {
      const inputFileName = `input.${selectedFile.name.split('.').pop()}`;
      const outputFileName = `output.${outputFormat}`;

      // Write input file
      await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile));

      // Build FFmpeg command based on output format
      let command: string[] = ['-i', inputFileName];

      // Add format-specific options
      if (outputFormat === 'mp3') {
        command.push('-vn', '-acodec', 'libmp3lame', '-q:a', '2');
      } else if (outputFormat === 'wav') {
        command.push('-vn', '-acodec', 'pcm_s16le');
      } else if (outputFormat === 'ogg') {
        command.push('-vn', '-acodec', 'libvorbis', '-q:a', '5');
      } else if (outputFormat === 'aac' || outputFormat === 'm4a') {
        command.push('-vn', '-acodec', 'aac', '-b:a', '192k');
      } else if (outputFormat === 'flac') {
        command.push('-vn', '-acodec', 'flac');
      } else if (outputFormat === 'gif') {
        command.push('-vf', 'fps=10,scale=480:-1:flags=lanczos', '-loop', '0');
      } else if (outputFormat === 'webm') {
        command.push('-c:v', 'libvpx', '-c:a', 'libvorbis', '-b:v', '1M');
      } else if (outputFormat === 'mp4') {
        command.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac');
      } else {
        // Generic conversion
        command.push('-c', 'copy');
      }

      command.push(outputFileName);

      // Execute conversion
      await ffmpeg.exec(command);

      // Read output file
      const data = await ffmpeg.readFile(outputFileName);
      
      // Determine MIME type
      const format = [...VIDEO_FORMATS, ...AUDIO_FORMATS].find(f => f.value === outputFormat);
      const mimeType = format?.mime || 'application/octet-stream';

      // Convert to Blob properly - data is Uint8Array from FFmpeg
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blobData = data as any;
      const blob = new Blob([blobData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);

      toast.success('Conversão concluída com sucesso!');
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Erro na conversão. Verifique o arquivo e tente novamente.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedUrl || !selectedFile) return;

    const fileName = selectedFile.name.replace(/\.[^/.]+$/, '') + '.' + outputFormat;
    const a = document.createElement('a');
    a.href = convertedUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setConvertedUrl(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentFormats = activeTab === 'video' ? VIDEO_FORMATS : AUDIO_FORMATS;

  return (
    <FeatureGate featureKey="media_converter">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70">
            <RefreshCw className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Conversor de Mídia</h2>
            <p className="text-muted-foreground">
              Converta vídeos e áudios entre diferentes formatos
            </p>
          </div>
        </div>

        {loading ? (
          <Card className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Carregando conversor...</p>
            <p className="text-sm text-muted-foreground">
              Isso pode levar alguns segundos na primeira vez
            </p>
          </Card>
        ) : !loaded ? (
          <Card className="p-8 text-center">
            <Button onClick={loadFFmpeg} size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Carregar Conversor
            </Button>
          </Card>
        ) : (
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Vídeo
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Áudio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="space-y-6">
                <div className="text-center text-sm text-muted-foreground mb-4">
                  Converta vídeos para MP4, WebM, AVI, MOV, MKV, GIF e mais
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-6">
                <div className="text-center text-sm text-muted-foreground mb-4">
                  Converta áudios para MP3, WAV, OGG, AAC, FLAC e mais
                </div>
              </TabsContent>

              {/* File Upload */}
              <div className="space-y-4">
                <div>
                  <Label>Arquivo de Entrada</Label>
                  <div className="mt-2">
                    {!selectedFile ? (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                        <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium">
                          Clique ou arraste um arquivo
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {activeTab === 'video' ? 'MP4, WebM, AVI, MOV, MKV...' : 'MP3, WAV, OGG, AAC, FLAC...'}
                        </span>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept={activeTab === 'video' ? 'video/*' : 'audio/*'}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          {activeTab === 'video' ? (
                            <FileVideo className="w-8 h-8 text-primary" />
                          ) : (
                            <FileAudio className="w-8 h-8 text-primary" />
                          )}
                          <div>
                            <p className="font-medium truncate max-w-[200px] md:max-w-[400px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleReset}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedFile && (
                  <>
                    {/* Output Format */}
                    <div>
                      <Label>Formato de Saída</Label>
                      <Select value={outputFormat} onValueChange={setOutputFormat}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currentFormats.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Convert Button */}
                    <Button
                      onClick={handleConvert}
                      disabled={converting}
                      className="w-full"
                      size="lg"
                    >
                      {converting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Convertendo...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Converter para {outputFormat.toUpperCase()}
                        </>
                      )}
                    </Button>

                    {/* Progress */}
                    {converting && (
                      <div className="space-y-2">
                        <Progress value={progress} />
                        <p className="text-center text-sm text-muted-foreground">
                          {progress}% concluído
                        </p>
                      </div>
                    )}

                    {/* Download */}
                    {convertedUrl && (
                      <div className="space-y-4 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <Download className="w-5 h-5" />
                          <span className="font-medium">Conversão concluída!</span>
                        </div>
                        <Button
                          onClick={handleDownload}
                          variant="outline"
                          className="w-full border-primary text-primary hover:bg-primary/10"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar {selectedFile.name.replace(/\.[^/.]+$/, '')}.{outputFormat}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Tabs>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-medium mb-2">💡 Como funciona</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• A conversão é feita localmente no seu navegador</li>
            <li>• Seus arquivos não são enviados para nenhum servidor</li>
            <li>• Suporta arquivos de até ~2GB (dependendo do navegador)</li>
            <li>• Arquivos maiores podem demorar mais para converter</li>
          </ul>
        </Card>
      </div>
    </FeatureGate>
  );
};
