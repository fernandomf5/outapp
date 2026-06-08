import React, { useState, useEffect } from "react";
import { Plus, Table as TableIcon, Settings, Trash2, Edit2, ChevronRight, Save, X, MoreHorizontal, Layout, Check, Palette, Image as ImageIcon, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ColumnType = 'text' | 'number' | 'date' | 'select' | 'status' | 'currency' | 'email';

interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
  options?: any;
  order_index: number;
}

interface TableRow {
  id: string;
  cells: Record<string, string>; // columnId -> value
}

export const OrganizationTablesPanel = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  
  // Create Table State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ name: "", description: "", color: "#3b82f6", logo_url: "" });
  
  // Column State
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumn, setNewColumn] = useState({ name: "", type: 'text' as ColumnType });

  const { toast } = useToast();

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableDetails(selectedTable.id);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("organization_tables")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao buscar tabelas", variant: "destructive" });
    } else {
      setTables(data || []);
    }
    setLoading(false);
  };

  const fetchTableDetails = async (tableId: string) => {
    // Fetch Columns
    const { data: cols, error: colsError } = await supabase
      .from("organization_table_columns")
      .select("*")
      .eq("table_id", tableId)
      .order("order_index");

    if (colsError) return;
    setColumns(cols || []);

    // Fetch Rows and Cells
    const { data: rowsData, error: rowsError } = await supabase
      .from("organization_table_rows")
      .select(`
        id,
        organization_table_cells (
          column_id,
          value
        )
      `)
      .eq("table_id", tableId);

    if (rowsError) return;

    const formattedRows = rowsData.map((r: any) => {
      const cells: Record<string, string> = {};
      r.organization_table_cells.forEach((c: any) => {
        cells[c.column_id] = c.value;
      });
      return { id: r.id, cells };
    });

    setRows(formattedRows);
  };

  const handleCreateTable = async () => {
    if (!newTable.name) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from("organization_tables")
      .insert({
        ...newTable,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar tabela", variant: "destructive" });
    } else {
      toast({ title: "Tabela criada com sucesso!" });
      setNewTable({ name: "", description: "", color: "#3b82f6", logo_url: "" });
      setIsCreateModalOpen(false);
      fetchTables();
      setSelectedTable(data);
      setView('table');
    }
  };

  const handleAddColumn = async () => {
    if (!newColumn.name || !selectedTable) return;

    const { error } = await supabase
      .from("organization_table_columns")
      .insert({
        table_id: selectedTable.id,
        name: newColumn.name,
        type: newColumn.type,
        order_index: columns.length,
      });

    if (error) {
      toast({ title: "Erro ao adicionar coluna", variant: "destructive" });
    } else {
      setIsColumnModalOpen(false);
      setNewColumn({ name: "", type: 'text' });
      fetchTableDetails(selectedTable.id);
    }
  };

  const handleAddRow = async () => {
    if (!selectedTable) return;
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("organization_table_rows")
      .insert({
        table_id: selectedTable.id,
        user_id: userData.user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao adicionar linha", variant: "destructive" });
    } else {
      fetchTableDetails(selectedTable.id);
    }
  };

  const handleCellUpdate = async (rowId: string, columnId: string, value: string) => {
    // Update local state first for performance
    const updatedRows = rows.map(r => {
      if (r.id === rowId) {
        return { ...r, cells: { ...r.cells, [columnId]: value } };
      }
      return r;
    });
    setRows(updatedRows);

    // Upsert to DB
    // We need to know if the cell exists. Simplest is to use a DB function or a clever query.
    // For now, let's just try to find if it exists or insert.
    const { data: existing } = await supabase
      .from("organization_table_cells")
      .select("id")
      .eq("row_id", rowId)
      .eq("column_id", columnId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("organization_table_cells")
        .update({ value })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("organization_table_cells")
        .insert({ row_id: rowId, column_id: columnId, value });
    }
  };

  const handleDeleteTable = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase.from("organization_tables").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir tabela", variant: "destructive" });
    } else {
      if (selectedTable?.id === id) setSelectedTable(null);
      fetchTables();
    }
  };

  if (view === 'table' && selectedTable) {
    return (
      <div className="flex flex-col h-screen max-h-[calc(100vh-140px)] bg-background">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setView('grid')}>
              <ChevronRight className="rotate-180 h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedTable.color }}
                />
                {selectedTable.name}
              </h2>
              <p className="text-xs text-muted-foreground">{selectedTable.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsColumnModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Coluna
            </Button>
            <Button size="sm" onClick={handleAddRow}>
              <Plus className="mr-2 h-4 w-4" /> Registro
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
              <tr className="border-b">
                <th className="w-12 px-4 py-3 text-left font-medium text-muted-foreground border-r">#</th>
                {columns.map((col) => (
                  <th key={col.id} className="min-w-[150px] px-4 py-3 text-left font-medium text-muted-foreground border-r group">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {col.name}
                        <Badge variant="outline" className="text-[10px] font-normal py-0">
                          {col.type}
                        </Badge>
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2 border-r text-muted-foreground font-mono text-xs">{idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.id} className="px-0 py-0 border-r min-w-[150px]">
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        className="w-full h-full px-4 py-2 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                        value={row.cells[col.id] || ""}
                        onChange={(e) => handleCellUpdate(row.id, col.id, e.target.value)}
                        placeholder="..."
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={async () => {
                        await supabase.from('organization_table_rows').delete().eq('id', row.id);
                        fetchTableDetails(selectedTable.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} className="py-20 text-center text-muted-foreground italic">
                    Nenhum registro adicionado ainda. Clique em "+ Registro" para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Column Modal */}
        <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Coluna</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Coluna</Label>
                <Input 
                  placeholder="Ex: Cliente, Valor, Data..." 
                  value={newColumn.name}
                  onChange={(e) => setNewColumn({...newColumn, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Dado</Label>
                <Select 
                  value={newColumn.type} 
                  onValueChange={(val: ColumnType) => setNewColumn({...newColumn, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="currency">Moeda</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsColumnModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddColumn}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tabela de Organização</h1>
          <p className="text-muted-foreground">Crie e gerencie suas tabelas de dados de forma personalizada.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-lg hover:shadow-xl transition-all">
          <Plus className="mr-2 h-5 w-5" /> Nova Tabela
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Layout className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Nenhuma tabela criada</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Comece criando sua primeira tabela para organizar seus registros de forma eficiente.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="mt-6" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Criar minha primeira tabela
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <Card 
              key={table.id} 
              className="group overflow-hidden border-2 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
              onClick={() => {
                setSelectedTable(table);
                setView('table');
              }}
            >
              <div 
                className="h-2 w-full" 
                style={{ backgroundColor: table.color }} 
              />
              <CardHeader className="relative">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg bg-muted flex items-center justify-center"
                      style={{ borderLeft: `4px solid ${table.color}` }}
                    >
                      <TableIcon className="h-6 w-6" style={{ color: table.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{table.name}</CardTitle>
                      <CardDescription className="line-clamp-1">{table.description || "Sem descrição"}</CardDescription>
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1" align="end">
                      <Button variant="ghost" className="w-full justify-start text-xs h-8 px-2" onClick={(e) => e.stopPropagation()}>
                        <Edit2 className="mr-2 h-3 w-3" /> Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-xs h-8 px-2 text-destructive hover:text-destructive" 
                        onClick={(e) => handleDeleteTable(e, table.id)}
                      >
                        <Trash2 className="mr-2 h-3 w-3" /> Excluir
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                  <span>Criada em {new Date(table.created_at).toLocaleDateString('pt-BR')}</span>
                  <div className="flex items-center gap-1 group-hover:text-primary transition-colors">
                    Acessar <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Table Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Tabela</DialogTitle>
            <DialogDescription>
              Defina as informações básicas para sua nova estrutura de organização.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Tabela</Label>
              <Input 
                id="name" 
                placeholder="Ex: Controle de Clientes" 
                value={newTable.name}
                onChange={(e) => setNewTable({...newTable, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Input 
                id="description" 
                placeholder="Do que se trata esta tabela?" 
                value={newTable.description}
                onChange={(e) => setNewTable({...newTable, description: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor de Identificação</Label>
              <div className="flex gap-2 flex-wrap">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'].map(c => (
                  <button
                    key={c}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      newTable.color === c ? "border-foreground scale-110 shadow-sm" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewTable({...newTable, color: c})}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTable}>Criar Tabela</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
