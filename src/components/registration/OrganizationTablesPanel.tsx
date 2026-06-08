import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Table as TableIcon, Settings, Trash2, Edit2, ChevronRight, Save, X, MoreHorizontal, Layout, Check, Palette, Image as ImageIcon, Search, Filter, ExternalLink, Download, FileJson, FileText, Calculator } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useTheme } from "next-themes";
import { Checkbox } from "@/components/ui/checkbox";
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
  header_text_color?: string;
}

interface TableRow {
  id: string;
  cells: Record<string, string>; // columnId -> value
  row_background_color?: string;
  order_index: number;
}


const COLOR_PALETTE = [
  '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b',
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#475569', '#0891b2'
];

export const OrganizationTablesPanel = ({ preselectedTableId, isFullPage }: { preselectedTableId?: string, isFullPage?: boolean }) => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Create Table State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ name: "", description: "", color: "#3b82f6", logo_url: "" });
  
  // Column State
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumn, setNewColumn] = useState({ name: "", type: 'text' as ColumnType, header_text_color: "#000000" });
  const [editingColumn, setEditingColumn] = useState<TableColumn | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const { toast } = useToast();
  const { resolvedTheme } = useTheme();


  useEffect(() => {
    fetchTables();
    if (preselectedTableId) {
      fetchPreselectedTable(preselectedTableId);
    }
  }, [preselectedTableId]);

  const fetchPreselectedTable = async (id: string) => {
    const { data, error } = await supabase
      .from("organization_tables")
      .select("*")
      .eq("id", id)
      .single();
    
    if (data && !error) {
      setSelectedTable(data);
      setView('table');
    }
  };

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
    setColumns((cols as any) || []);

    // Fetch Rows and Cells
    const { data: rowsData, error: rowsError } = await supabase
      .from("organization_table_rows")
      .select(`
        id,
        row_background_color,
        order_index,
        organization_table_cells (
          column_id,
          value
        )
      `)
      .eq("table_id", tableId)
      .order("order_index", { ascending: true });


    if (rowsError) return;

    const formattedRows = rowsData.map((r: any) => {
      const cells: Record<string, string> = {};
      r.organization_table_cells.forEach((c: any) => {
        cells[c.column_id] = c.value;
      });
      return { 
        id: r.id, 
        cells, 
        row_background_color: r.row_background_color,
        order_index: r.order_index || 0
      };

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
        type: 'text', // Default to text as requested
        header_text_color: newColumn.header_text_color,
        order_index: columns.length,
      });

    if (error) {
      toast({ title: "Erro ao adicionar coluna", variant: "destructive" });
    } else {
      setIsColumnModalOpen(false);
      setNewColumn({ name: "", type: 'text', header_text_color: "#000000" });
      fetchTableDetails(selectedTable.id);
    }
  };

  const handleUpdateColumn = async () => {
    if (!editingColumn || !selectedTable) return;

    const { error } = await supabase
      .from("organization_table_columns")
      .update({
        name: editingColumn.name,
        header_text_color: editingColumn.header_text_color,
      })
      .eq("id", editingColumn.id);

    if (error) {
      toast({ title: "Erro ao atualizar coluna", variant: "destructive" });
    } else {
      setEditingColumn(null);
      fetchTableDetails(selectedTable.id);
      toast({ title: "Coluna atualizada com sucesso!" });
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!selectedTable) return;

    const { error } = await supabase
      .from("organization_table_columns")
      .delete()
      .eq("id", columnId);

    if (error) {
      toast({ title: "Erro ao excluir coluna", variant: "destructive" });
    } else {
      fetchTableDetails(selectedTable.id);
      toast({ title: "Coluna excluída com sucesso!" });
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
        order_index: rows.length > 0 ? Math.max(...rows.map(r => r.order_index)) + 1 : 0
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

  const handleUpdateRowColor = async (rowId: string, color: string) => {
    const { error } = await supabase
      .from("organization_table_rows")
      .update({ row_background_color: color })
      .eq("id", rowId);

    if (error) {
      toast({ title: "Erro ao atualizar cor da linha", variant: "destructive" });
    } else {
      fetchTableDetails(selectedTable.id);
    }
  };
  
  const handleUpdateRowOrder = async (rowId: string, newOrder: number) => {
    // Basic logic: update the specific row. 
    // If the user wants to "move" a row to position 4, they can type 4.
    const { error } = await supabase
      .from("organization_table_rows")
      .update({ order_index: newOrder })
      .eq("id", rowId);

    if (error) {
      toast({ title: "Erro ao atualizar posição", variant: "destructive" });
    } else {
      fetchTableDetails(selectedTable.id);
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

  const handleDownloadPDF = () => {
    if (!selectedTable || rows.length === 0) return;
    
    const doc = new jsPDF({
      orientation: "landscape",
    });

    const tableHeaders = columns.map(col => col.name);
    const tableData = rows.map(row => 
      columns.map(col => row.cells[col.id] || "")
    );

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: selectedTable.color || "#3b82f6" },
      margin: { top: 20 },
      didDrawPage: (data) => {
        doc.text(selectedTable.name, 14, 15);
      }
    });

    doc.save(`${selectedTable.name}.pdf`);
  };

  const handleDownloadPNG = async () => {
    if (!tableRef.current || !selectedTable) return;
    
    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${selectedTable.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: "Imagem gerada com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao gerar imagem", variant: "destructive" });
    }
  };

  const totals = useMemo(() => {
    if (selectedRowIds.length === 0) return {};
    const selectedRows = rows.filter(r => selectedRowIds.includes(r.id));
    const results: Record<string, { sum: number, count: number }> = {};
    
    columns.forEach(col => {
      let sum = 0;
      let count = 0;
      selectedRows.forEach(row => {
        const val = row.cells[col.id];
        if (val) {
          // Clean the string to try to get a number (handle currency/commas)
          const cleanVal = val.replace(/[^\d,.-]/g, '').replace(',', '.');
          const num = parseFloat(cleanVal);
          if (!isNaN(num)) {
            sum += num;
            count++;
          }
        }
      });
      if (count > 0) {
        results[col.id] = { sum, count };
      }
    });
    return results;
  }, [selectedRowIds, rows, columns]);

  const toggleAllRows = () => {
    if (selectedRowIds.length === rows.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(rows.map(r => r.id));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (view === 'table' && selectedTable) {
    return (
      <div className={cn("flex flex-col bg-background", isFullPage ? "h-full" : "h-screen max-h-[calc(100vh-140px)]")}>
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
            {!isFullPage && (
              <Button variant="outline" size="sm" onClick={() => window.open(`/tabela-completa/${selectedTable.id}`, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" /> Abrir Completo
              </Button>
            )}
            {isFullPage && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Baixar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1" align="end">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-xs h-8 px-2"
                    onClick={handleDownloadPDF}
                  >
                    <FileText className="mr-2 h-3 w-3 text-red-500" /> Baixar PDF
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-xs h-8 px-2"
                    onClick={handleDownloadPNG}
                  >
                    <ImageIcon className="mr-2 h-3 w-3 text-blue-500" /> Baixar PNG
                  </Button>
                </PopoverContent>
              </Popover>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsColumnModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Coluna
            </Button>
            <Button size="sm" onClick={handleAddRow}>
              <Plus className="mr-2 h-4 w-4" /> Registro
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative" ref={tableRef}>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
              <tr className="border-b">
                <th className="w-12 px-4 py-3 text-left font-medium text-muted-foreground border-r">#</th>
                {columns.map((col) => (
                  <th 
                    key={col.id} 
                    className="min-w-[180px] px-4 py-3 text-left font-medium border-r group"
                    style={{ color: col.header_text_color || 'inherit' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate">{col.name}</span>
                      </div>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-1" align="end">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-xs h-8 px-2"
                            onClick={() => setEditingColumn(col)}
                          >
                            <Edit2 className="mr-2 h-3 w-3" /> Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-xs h-8 px-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteColumn(col.id)}
                          >
                            <Trash2 className="mr-2 h-3 w-3" /> Excluir
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr 
                  key={row.id} 
                  className="border-b hover:bg-muted/30 transition-colors group"
                  style={{ 
                    backgroundColor: row.row_background_color || 'transparent',
                    color: row.row_background_color && row.row_background_color !== 'transparent' && row.row_background_color !== '#f8fafc' ? '#000000' : 'inherit'
                  }}
                >
                  <td className="px-4 py-2 border-r text-muted-foreground font-mono text-xs relative group/idx">
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        className="w-8 bg-transparent border-none focus:ring-0 p-0 text-xs font-mono"
                        value={row.order_index + 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) handleUpdateRowOrder(row.id, val - 1);
                        }}
                      />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Palette className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" side="right">
                        <p className="text-[10px] font-medium mb-2 uppercase tracking-wider text-muted-foreground">Cor Personalizada</p>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="color" 
                            className="w-10 h-10 p-0 border-none cursor-pointer overflow-hidden rounded-md"
                            value={row.row_background_color && row.row_background_color !== 'transparent' ? row.row_background_color : '#ffffff'}
                            onChange={(e) => handleUpdateRowColor(row.id, e.target.value)}
                          />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase">Escolher Cor</span>
                            <span className="text-[9px] text-muted-foreground/70">Clique para abrir o seletor</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-7 text-[10px] justify-start px-1"
                            onClick={() => handleUpdateRowColor(row.id, 'transparent')}
                          >
                            <X className="mr-1 h-3 w-3" /> Remover Cor
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>

                  {columns.map((col) => (
                    <td key={col.id} className="px-0 py-0 border-r min-w-[150px]">
                      <input
                        type="text"
                        className="w-full h-full px-4 py-2 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                        style={{ color: row.row_background_color && row.row_background_color !== 'transparent' ? 'inherit' : undefined }}
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
                <Label>Cor do Texto da Coluna</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                        newColumn.header_text_color === c ? "border-primary scale-110 shadow-sm" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewColumn({...newColumn, header_text_color: c})}
                    />
                  ))}
                  <div className="flex items-center gap-2 w-full mt-2">
                    <Input 
                      type="color" 
                      className="w-10 h-10 p-0 border-none cursor-pointer overflow-hidden rounded-full shadow-sm"
                      value={newColumn.header_text_color || '#000000'}
                      onChange={(e) => setNewColumn({...newColumn, header_text_color: e.target.value})}
                    />
                    <span className="text-sm text-muted-foreground">Escolher cor personalizada</span>
                  </div>
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsColumnModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddColumn}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Column Modal */}
        <Dialog open={!!editingColumn} onOpenChange={(open) => !open && setEditingColumn(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Coluna</DialogTitle>
            </DialogHeader>
            {editingColumn && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Coluna</Label>
                  <Input 
                    placeholder="Ex: Cliente, Valor, Data..." 
                    value={editingColumn.name}
                    onChange={(e) => setEditingColumn({...editingColumn, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor do Texto da Coluna</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                          editingColumn.header_text_color === c ? "border-primary scale-110 shadow-sm" : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => setEditingColumn({...editingColumn, header_text_color: c})}
                      />
                    ))}
                    <div className="flex items-center gap-2 w-full mt-2">
                      <Input 
                        type="color" 
                        className="w-10 h-10 p-0 border-none cursor-pointer overflow-hidden rounded-full shadow-sm"
                        value={editingColumn.header_text_color || '#000000'}
                        onChange={(e) => setEditingColumn({...editingColumn, header_text_color: e.target.value})}
                      />
                      <span className="text-sm text-muted-foreground">Escolher cor personalizada</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingColumn(null)}>Cancelar</Button>
              <Button onClick={handleUpdateColumn}>Salvar Alterações</Button>
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
                      className="p-2 rounded-lg bg-muted flex items-center justify-center overflow-hidden w-12 h-12"
                      style={{ borderLeft: `4px solid ${table.color}` }}
                    >
                      {table.logo_url ? (
                        <img src={table.logo_url} alt={table.name} className="w-full h-full object-cover" />
                      ) : (
                        <TableIcon className="h-6 w-6" style={{ color: table.color }} />
                      )}
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
              <Label htmlFor="logo">URL da Imagem ou Logo (Opcional)</Label>
              <Input 
                id="logo" 
                placeholder="https://exemplo.com/imagem.png" 
                value={newTable.logo_url}
                onChange={(e) => setNewTable({...newTable, logo_url: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor de Identificação</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PALETTE.slice(1).map(c => (
                  <button
                    key={c}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                      newTable.color === c ? "border-foreground scale-110 shadow-sm" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewTable({...newTable, color: c})}
                  />
                ))}
                <div className="flex items-center gap-2 w-full mt-2">
                  <Input 
                    type="color" 
                    className="w-10 h-10 p-0 border-none cursor-pointer overflow-hidden rounded-full shadow-sm"
                    value={newTable.color || '#3b82f6'}
                    onChange={(e) => setNewTable({...newTable, color: e.target.value})}
                  />
                  <span className="text-sm text-muted-foreground">Escolher cor personalizada</span>
                </div>
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
