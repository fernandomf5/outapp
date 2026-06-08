import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, Table as TableIcon, LayoutDashboard, Search, Filter, MoreHorizontal, Pencil, Trash2, Calendar, DollarSign, User, Phone, Mail, FileText, CheckCircle2, Clock, AlertCircle, XCircle, Handshake, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Structure {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Field {
  id: string;
  label: string;
  field_type: string;
  options: any;
  is_required: boolean;
  order_index: number;
}

export const CustomFinancialRecordsPanel = () => {
  const [structures, setStructures] = useState<Structure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateStructureOpen, setIsCreateStructureOpen] = useState(false);
  
  // New structure form state
  const [newStructure, setNewStructure] = useState({ name: "", description: "" });
  const [customFields, setCustomFields] = useState<Partial<Field>[]>([
    { label: "Email", field_type: "email", is_required: false },
    { label: "Telefone", field_type: "tel", is_required: false },
    { label: "Plano", field_type: "text", is_required: false },
  ]);

  useEffect(() => {
    loadStructures();
  }, []);

  useEffect(() => {
    if (selectedStructure) {
      loadStructureData(selectedStructure.id);
    }
  }, [selectedStructure]);

  const loadStructures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_financial_structures')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setStructures(data || []);
      if (data && data.length > 0 && !selectedStructure) {
        setSelectedStructure(data[0]);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar estruturas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStructureData = async (structureId: string) => {
    try {
      setLoading(true);
      
      // Load fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('custom_financial_fields')
        .select('*')
        .eq('structure_id', structureId)
        .order('order_index');
      
      if (fieldsError) throw fieldsError;
      setFields(fieldsData || []);

      // Load records
      const { data: recordsData, error: recordsError } = await supabase
        .from('custom_financial_records')
        .select(`
          *,
          field_values:custom_financial_field_values(*)
        `)
        .eq('structure_id', structureId)
        .order('name');
      
      if (recordsError) throw recordsError;
      setRecords(recordsData || []);

      // Load entries (simplified for dashboard)
      const { data: entriesData, error: entriesError } = await supabase
        .from('custom_financial_entries')
        .select('*')
        .in('record_id', (recordsData || []).map(r => r.id));
      
      if (!entriesError) {
        setEntries(entriesData || []);
      }

    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStructure = async () => {
    if (!newStructure.name) {
      toast.error("Nome da estrutura é obrigatório");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: structure, error: structureError } = await supabase
        .from('custom_financial_structures')
        .insert({
          user_id: user.id,
          name: newStructure.name,
          description: newStructure.description,
          icon: 'LayoutDashboard'
        })
        .select()
        .single();

      if (structureError) throw structureError;

      // Create fields
      if (customFields.length > 0) {
        const fieldsToInsert = customFields.map((f, index) => ({
          structure_id: structure.id,
          label: f.label,
          field_type: f.field_type || 'text',
          order_index: index,
          is_required: f.is_required || false
        }));

        const { error: fieldsError } = await supabase
          .from('custom_financial_fields')
          .insert(fieldsToInsert);
        
        if (fieldsError) throw fieldsError;
      }

      toast.success("Estrutura criada com sucesso!");
      setIsCreateStructureOpen(false);
      setNewStructure({ name: "", description: "" });
      loadStructures();
    } catch (error: any) {
      toast.error("Erro ao criar estrutura: " + error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'upcoming': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'overdue': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'negotiating': return <Handshake className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      paid: 'Pago',
      pending: 'Pendente',
      upcoming: 'A vencer',
      overdue: 'Vencido',
      cancelled: 'Cancelado',
      negotiating: 'Em negociação'
    };
    return labels[status] || status;
  };

  const calculateStats = () => {
    const totalReceived = entries.filter(e => e.status === 'paid' && e.entry_type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalToReceive = entries.filter(e => e.status !== 'paid' && e.entry_type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalOverdue = entries.filter(e => e.status === 'overdue' && e.entry_type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    return { totalReceived, totalToReceive, totalOverdue };
  };

  const stats = calculateStats();

  if (loading && structures.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registros Personalizados</h2>
          <p className="text-sm text-muted-foreground">Crie e gerencie estruturas financeiras adaptadas ao seu negócio.</p>
        </div>
        
        <Dialog open={isCreateStructureOpen} onOpenChange={setIsCreateStructureOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Estrutura
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Estrutura de Registro</DialogTitle>
              <DialogDescription>
                Defina o nome e os campos personalizados que deseja acompanhar (ex: Controle de Alunos, Contratos, Assinaturas).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Estrutura</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Clientes de Assinatura" 
                  value={newStructure.name}
                  onChange={(e) => setNewStructure({...newStructure, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Descrição (Opcional)</Label>
                <Input 
                  id="desc" 
                  placeholder="Breve descrição do uso desta tabela" 
                  value={newStructure.description}
                  onChange={(e) => setNewStructure({...newStructure, description: e.target.value})}
                />
              </div>
              
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center">
                  <Label>Campos Personalizados</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCustomFields([...customFields, { label: "", field_type: "text" }])}
                  >
                    Adicionar Campo
                  </Button>
                </div>
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input 
                      placeholder="Label (ex: CPF)" 
                      value={field.label}
                      onChange={(e) => {
                        const updated = [...customFields];
                        updated[idx].label = e.target.value;
                        setCustomFields(updated);
                      }}
                      className="flex-1"
                    />
                    <Select 
                      value={field.field_type} 
                      onValueChange={(val) => {
                        const updated = [...customFields];
                        updated[idx].field_type = val;
                        setCustomFields(updated);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="date">Data</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="tel">Telefone</SelectItem>
                        <SelectItem value="boolean">Sim/Não</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateStructureOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateStructure}>Criar Estrutura</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {structures.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
          <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma estrutura criada</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Comece criando uma estrutura personalizada para gerenciar seus clientes, contratos ou qualquer outro tipo de registro financeiro.
          </p>
          <Button onClick={() => setIsCreateStructureOpen(true)}>Criar minha primeira estrutura</Button>
        </Card>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6">
          <Card className="xl:w-64 shrink-0 h-fit">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Minhas Estruturas</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {structures.map((structure) => (
                    <button
                      key={structure.id}
                      onClick={() => setSelectedStructure(structure)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedStructure?.id === structure.id 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <TableIcon className="h-4 w-4" />
                        <span className="truncate">{structure.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex-1 space-y-6">
            {selectedStructure && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total Recebido</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-green-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalReceived)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total a Receber</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-blue-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalToReceive)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total em Atraso</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-red-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalOverdue)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="records" className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="records" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Registros
                      </TabsTrigger>
                      <TabsTrigger value="financial" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financeiro Integrado
                      </TabsTrigger>
                      <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Buscar
                      </Button>
                      <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar {selectedStructure.name}
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="records">
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            {fields.slice(0, 3).map(field => (
                              <TableHead key={field.id} className="hidden md:table-cell">{field.label}</TableHead>
                            ))}
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={fields.length + 2} className="h-32 text-center text-muted-foreground">
                                Nenhum registro cadastrado nesta estrutura.
                              </TableCell>
                            </TableRow>
                          ) : (
                            records.map(record => (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">{record.name}</TableCell>
                                {fields.slice(0, 3).map(field => {
                                  const val = record.field_values.find((v: any) => v.field_id === field.id)?.value;
                                  return (
                                    <TableCell key={field.id} className="hidden md:table-cell">
                                      {val || "-"}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="financial">
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Registro</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entries.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                Nenhuma movimentação financeira vinculada aos registros.
                              </TableCell>
                            </TableRow>
                          ) : (
                            entries.map(entry => {
                              const record = records.find(r => r.id === entry.record_id);
                              return (
                                <TableRow key={entry.id}>
                                  <TableCell className="font-medium">{record?.name || "Desconhecido"}</TableCell>
                                  <TableCell>{entry.description}</TableCell>
                                  <TableCell>
                                    <span className={entry.entry_type === 'income' ? 'text-green-500' : 'text-red-500'}>
                                      {entry.entry_type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                                    </span>
                                  </TableCell>
                                  <TableCell>{format(new Date(entry.due_date), "dd/MM/yyyy")}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                      {getStatusIcon(entry.status)}
                                      {getStatusLabel(entry.status)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="dashboard">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Situação Financeira</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center">
                          <div className="text-center text-muted-foreground space-y-2">
                            <LayoutDashboard className="h-12 w-12 mx-auto opacity-20" />
                            <p>Gráficos de fluxo de caixa previsto e status financeiro aparecerão aqui conforme houver dados.</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Próximos Vencimentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {entries.filter(e => e.status !== 'paid').slice(0, 5).map(entry => {
                              const record = records.find(r => r.id === entry.record_id);
                              return (
                                <div key={entry.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                                  <div>
                                    <p className="font-medium text-sm">{record?.name}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(entry.due_date), "dd 'de' MMMM", { locale: ptBR })}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}</p>
                                    <Badge className="text-[10px] h-4 px-1">{getStatusLabel(entry.status)}</Badge>
                                  </div>
                                </div>
                              );
                            })}
                            {entries.filter(e => e.status !== 'paid').length === 0 && (
                              <p className="text-sm text-center text-muted-foreground py-12">Não há vencimentos próximos.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
