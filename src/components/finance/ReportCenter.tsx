import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  format, 
  startOfMonth, 
  addMonths, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  subWeeks, 
  subMonths, 
  subYears, 
  isWithinInterval,
  parseISO,
  startOfQuarter,
  endOfQuarter,
  subDays,
  startOfYear,
  endOfYear
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, Save, FolderOpen, Trash2, FileText, Loader2, Calendar } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  due_date: string;
}

interface ReportCenterProps {
  transactions: Transaction[];
}

interface SavedReport {
  id: string;
  name: string;
  type: string;
  created_at: string;
  data: any;
}

export const ReportCenter = ({ transactions }: ReportCenterProps) => {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'semester' | 'year' | 'projection'>('projection');

  const filteredData = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    let dataPoints: { key: string; label: string; income: number; expense: number }[] = [];

    if (period === 'week') {
      start = startOfWeek(now, { weekStartsOn: 0 });
      end = endOfWeek(now, { weekStartsOn: 0 });
      dataPoints = eachDayOfInterval({ start, end }).map(date => ({
        key: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEE', { locale: ptBR }),
        income: 0,
        expense: 0
      }));
    } else if (period === 'month') {
      start = startOfMonth(now);
      end = now;
      // Group by week of month or chunks of days
      dataPoints = Array.from({ length: 4 }).map((_, i) => {
        const d = subDays(now, (3 - i) * 7);
        return {
          key: `week-${i}`,
          label: `Semana ${i + 1}`,
          income: 0,
          expense: 0
        };
      });
    } else if (period === 'semester') {
      start = subMonths(now, 6);
      dataPoints = Array.from({ length: 6 }).map((_, i) => {
        const date = addMonths(start, i + 1);
        return {
          key: format(date, 'yyyy-MM'),
          label: format(date, 'MMM/yy', { locale: ptBR }),
          income: 0,
          expense: 0
        };
      });
    } else if (period === 'year') {
      start = startOfYear(now);
      end = endOfYear(now);
      dataPoints = Array.from({ length: 12 }).map((_, i) => {
        const date = new Date(now.getFullYear(), i, 1);
        return {
          key: format(date, 'yyyy-MM'),
          label: format(date, 'MMM', { locale: ptBR }),
          income: 0,
          expense: 0
        };
      });
    } else {
      // Default projection (original behavior)
      dataPoints = Array.from({ length: 6 }).map((_, i) => {
        const date = addMonths(startOfMonth(now), i);
        return {
          key: format(date, 'yyyy-MM'),
          label: format(date, 'MMM/yy', { locale: ptBR }),
          income: 0,
          expense: 0
        };
      });
    }

    transactions.forEach(t => {
      const tDate = parseISO(t.due_date);
      if (period === 'projection') {
        const monthKey = t.due_date.substring(0, 7);
        const point = dataPoints.find(p => p.key === monthKey);
        if (point) {
          if (t.type === 'income') point.income += t.amount;
          else point.expense += t.amount;
        }
      } else if (period === 'week') {
        if (isWithinInterval(tDate, { start, end })) {
          const key = format(tDate, 'yyyy-MM-dd');
          const point = dataPoints.find(p => p.key === key);
          if (point) {
            if (t.type === 'income') point.income += t.amount;
            else point.expense += t.amount;
          }
        }
      } else if (period === 'month') {
        if (isWithinInterval(tDate, { start: startOfMonth(now), end: now })) {
          // Simple logic: divide month into 4 weeks
          const day = tDate.getDate();
          const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
          const point = dataPoints[weekIdx];
          if (t.type === 'income') point.income += t.amount;
          else point.expense += t.amount;
        }
      } else {
        // Semester or Year
        const monthKey = t.due_date.substring(0, 7);
        const point = dataPoints.find(p => p.key === monthKey);
        if (point) {
          if (t.type === 'income') point.income += t.amount;
          else point.expense += t.amount;
        }
      }
    });

    return dataPoints.map(p => ({
      ...p,
      balance: p.income - p.expense
    }));
  }, [transactions, period]);

  const cashFlowData = filteredData; // Keep original variable name for compatibility with existing code

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Erro ao carregar relatórios salvos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reportName = `Fluxo de Caixa - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
      
      const { error } = await supabase
        .from('financial_reports')
        .insert({
          user_id: user.id,
          name: reportName,
          type: 'cash_flow',
          data: { cashFlowData }
        });

      if (error) throw error;
      
      toast.success('Relatório salvo com sucesso!');
      loadSavedReports();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Erro ao salvar relatório');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Relatório excluído');
      setSavedReports(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Erro ao excluir relatório');
    }
  };

  const generatePDF = (data = cashFlowData, name = "Relatório Financeiro") => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94); // Green
    doc.text("Relatório de Fluxo de Caixa", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
    doc.text(`Nome: ${name}`, 14, 35);

    // Summary Table
    const tableData = data.map(m => [
      m.label,
      `R$ ${m.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${m.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${m.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Mês', 'Receitas', 'Despesas', 'Saldo']],
      body: tableData,
      headStyles: { fillColor: [34, 197, 94] },
      foot: [[
        'TOTAL',
        `R$ ${data.reduce((acc, curr) => acc + curr.income, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${data.reduce((acc, curr) => acc + curr.expense, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${data.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`${name.replace(/[\s:]/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Central de Relatórios</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowSaved(!showSaved)}
          >
            <FolderOpen className="h-4 w-4" />
            {showSaved ? "Ver Relatório Atual" : "Relatórios Salvos"}
          </Button>
          {!showSaved && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => generatePDF()}
              >
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
              <Button 
                size="sm" 
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={handleSaveReport}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Relatório
              </Button>
            </>
          )}
        </div>
      </div>

      {showSaved ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-500" />
              Relatórios Salvos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : savedReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum relatório salvo encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedReports.map(report => (
                  <Card key={report.id} className="border-muted hover:border-blue-400 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm line-clamp-1">{report.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button 
                          variant="outline" 
                          className="w-full text-xs h-8"
                          onClick={() => generatePDF(report.data.cashFlowData, report.name)}
                        >
                          <Download className="h-3 w-3 mr-1" /> Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Projeção de Fluxo de Caixa (Próximos 6 meses)</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Demonstrativo Detalhado</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Receitas Estimadas</TableHead>
                      <TableHead className="text-right">Despesas Estimadas</TableHead>
                      <TableHead className="text-right">Saldo Previsto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlowData.map(m => (
                      <TableRow key={m.key}>
                        <TableCell className="font-medium">{m.label}</TableCell>
                        <TableCell className="text-right text-green-600">R$ {m.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right text-red-600">R$ {m.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className={`text-right font-bold ${m.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          R$ {m.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};