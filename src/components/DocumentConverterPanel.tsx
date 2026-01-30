import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, Download, FileText, RefreshCw, Loader2, X, FileImage, FileSpreadsheet } from 'lucide-react';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { FeatureGate } from './FeatureGate';

type ConversionType = {
  from: string;
  to: string;
  label: string;
  description: string;
  accept: string;
  icon: typeof FileText;
};

const CONVERSION_TYPES: ConversionType[] = [
  {
    from: 'docx',
    to: 'html',
    label: 'Word → HTML',
    description: 'Converter documento Word para HTML',
    accept: '.docx',
    icon: FileText,
  },
  {
    from: 'docx',
    to: 'txt',
    label: 'Word → Texto',
    description: 'Extrair texto de documento Word',
    accept: '.docx',
    icon: FileText,
  },
  {
    from: 'docx',
    to: 'pdf',
    label: 'Word → PDF',
    description: 'Converter Word para PDF',
    accept: '.docx',
    icon: FileText,
  },
  {
    from: 'txt',
    to: 'pdf',
    label: 'Texto → PDF',
    description: 'Converter arquivo de texto para PDF',
    accept: '.txt',
    icon: FileText,
  },
  {
    from: 'html',
    to: 'pdf',
    label: 'HTML → PDF',
    description: 'Converter HTML para PDF',
    accept: '.html,.htm',
    icon: FileText,
  },
  {
    from: 'csv',
    to: 'json',
    label: 'CSV → JSON',
    description: 'Converter CSV para JSON',
    accept: '.csv',
    icon: FileSpreadsheet,
  },
  {
    from: 'json',
    to: 'csv',
    label: 'JSON → CSV',
    description: 'Converter JSON para CSV',
    accept: '.json',
    icon: FileSpreadsheet,
  },
  {
    from: 'md',
    to: 'html',
    label: 'Markdown → HTML',
    description: 'Converter Markdown para HTML',
    accept: '.md,.markdown',
    icon: FileText,
  },
  {
    from: 'image',
    to: 'pdf',
    label: 'Imagem → PDF',
    description: 'Converter imagem para PDF',
    accept: 'image/*',
    icon: FileImage,
  },
];

export const DocumentConverterPanel = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedConversion, setSelectedConversion] = useState<ConversionType | null>(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConversionSelect = (value: string) => {
    const conversion = CONVERSION_TYPES.find(c => `${c.from}-${c.to}` === value);
    setSelectedConversion(conversion || null);
    setSelectedFile(null);
    setConvertedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setConvertedUrl(null);
      setProgress(0);
    }
  };

  const convertDocxToHtml = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  };

  const convertDocxToText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const convertTextToPdf = (text: string, fileName: string): Blob => {
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(text, 180);
    let y = 20;
    
    lines.forEach((line: string) => {
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 15, y);
      y += 7;
    });
    
    return pdf.output('blob');
  };

  const convertHtmlToPdf = (html: string): Blob => {
    const pdf = new jsPDF();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    const lines = pdf.splitTextToSize(text, 180);
    let y = 20;
    
    lines.forEach((line: string) => {
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 15, y);
      y += 7;
    });
    
    return pdf.output('blob');
  };

  const convertCsvToJson = (csv: string): string => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const result = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    return JSON.stringify(result, null, 2);
  };

  const convertJsonToCsv = (json: string): string => {
    const data = JSON.parse(json);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('JSON deve ser um array de objetos');
    }
    
    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvLines.push(values.join(','));
    });
    
    return csvLines.join('\n');
  };

  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/__(.*)__/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/_(.*)_/gim, '<em>$1</em>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n/gim, '<br>');
    
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Converted</title></head><body>${html}</body></html>`;
  };

  const convertImageToPdf = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const pdf = new jsPDF({
            orientation: img.width > img.height ? 'landscape' : 'portrait',
          });
          
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          let imgWidth = pageWidth - 20;
          let imgHeight = (img.height / img.width) * imgWidth;
          
          if (imgHeight > pageHeight - 20) {
            imgHeight = pageHeight - 20;
            imgWidth = (img.width / img.height) * imgHeight;
          }
          
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;
          
          pdf.addImage(e.target?.result as string, 'JPEG', x, y, imgWidth, imgHeight);
          resolve(pdf.output('blob'));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleConvert = async () => {
    if (!selectedFile || !selectedConversion) return;

    setConverting(true);
    setProgress(10);

    try {
      let result: Blob | string;
      let outputFileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      let mimeType = 'text/plain';

      setProgress(30);

      switch (`${selectedConversion.from}-${selectedConversion.to}`) {
        case 'docx-html':
          const htmlContent = await convertDocxToHtml(selectedFile);
          result = new Blob([htmlContent], { type: 'text/html' });
          outputFileName += '.html';
          mimeType = 'text/html';
          break;

        case 'docx-txt':
          const textContent = await convertDocxToText(selectedFile);
          result = new Blob([textContent], { type: 'text/plain' });
          outputFileName += '.txt';
          break;

        case 'docx-pdf':
          const docxText = await convertDocxToText(selectedFile);
          result = convertTextToPdf(docxText, outputFileName);
          outputFileName += '.pdf';
          mimeType = 'application/pdf';
          break;

        case 'txt-pdf':
          const txtContent = await selectedFile.text();
          result = convertTextToPdf(txtContent, outputFileName);
          outputFileName += '.pdf';
          mimeType = 'application/pdf';
          break;

        case 'html-pdf':
          const htmlFile = await selectedFile.text();
          result = convertHtmlToPdf(htmlFile);
          outputFileName += '.pdf';
          mimeType = 'application/pdf';
          break;

        case 'csv-json':
          const csvContent = await selectedFile.text();
          const jsonResult = convertCsvToJson(csvContent);
          result = new Blob([jsonResult], { type: 'application/json' });
          outputFileName += '.json';
          mimeType = 'application/json';
          break;

        case 'json-csv':
          const jsonContent = await selectedFile.text();
          const csvResult = convertJsonToCsv(jsonContent);
          result = new Blob([csvResult], { type: 'text/csv' });
          outputFileName += '.csv';
          mimeType = 'text/csv';
          break;

        case 'md-html':
          const mdContent = await selectedFile.text();
          const mdHtml = convertMarkdownToHtml(mdContent);
          result = new Blob([mdHtml], { type: 'text/html' });
          outputFileName += '.html';
          mimeType = 'text/html';
          break;

        case 'image-pdf':
          result = await convertImageToPdf(selectedFile);
          outputFileName += '.pdf';
          mimeType = 'application/pdf';
          break;

        default:
          throw new Error('Conversão não suportada');
      }

      setProgress(80);

      const blob = result instanceof Blob ? result : new Blob([result], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
      setConvertedFileName(outputFileName);

      setProgress(100);
      toast.success('Conversão concluída com sucesso!');
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Erro na conversão. Verifique o arquivo e tente novamente.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedUrl) return;

    const a = document.createElement('a');
    a.href = convertedUrl;
    a.download = convertedFileName;
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

  return (
    <FeatureGate featureKey="document_converter">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Conversor de Documentos</h2>
            <p className="text-muted-foreground">
              Converta documentos entre diferentes formatos
            </p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          {/* Conversion Type Select */}
          <div>
            <Label>Tipo de Conversão</Label>
            <Select onValueChange={handleConversionSelect}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione o tipo de conversão" />
              </SelectTrigger>
              <SelectContent>
                {CONVERSION_TYPES.map((conversion) => (
                  <SelectItem
                    key={`${conversion.from}-${conversion.to}`}
                    value={`${conversion.from}-${conversion.to}`}
                  >
                    <div className="flex items-center gap-2">
                      <conversion.icon className="w-4 h-4" />
                      <span>{conversion.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedConversion && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedConversion.description}
              </p>
            )}
          </div>

          {/* File Upload */}
          {selectedConversion && (
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
                      {selectedConversion.accept}
                    </span>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept={selectedConversion.accept}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-accent/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <selectedConversion.icon className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium truncate max-w-[200px] md:max-w-[400px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
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
          )}

          {/* Convert Button */}
          {selectedFile && (
            <>
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
                    Converter
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
                    Baixar {convertedFileName}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-medium mb-2">💡 Formatos Suportados</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Word</strong>: DOCX → HTML, Texto, PDF</li>
            <li>• <strong>Texto</strong>: TXT → PDF</li>
            <li>• <strong>HTML</strong>: HTML → PDF</li>
            <li>• <strong>Dados</strong>: CSV ↔ JSON</li>
            <li>• <strong>Markdown</strong>: MD → HTML</li>
            <li>• <strong>Imagens</strong>: JPG, PNG → PDF</li>
          </ul>
        </Card>
      </div>
    </FeatureGate>
  );
};
