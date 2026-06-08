import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Table as TableIcon, Settings, Trash2, Edit2, ChevronRight, Save, X, MoreHorizontal, Layout, Check, Palette, Image as ImageIcon, Search, Filter, ExternalLink, Download, FileJson, FileText, Calculator, Upload, Loader2 } from "lucide-react";
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
  cells: Record<string, { value: string, text_color?: string, is_bold?: boolean }>; // columnId -> cellData
  row_background_color?: string;
  row_text_color?: string;
  is_bold?: boolean;
  order_index: number;
}


const COLOR_PALETTE = [
  '#10b981', '#000000', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b',
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'table' | 'column' | 'row', name?: string } | null>(null);
  
  // Column State
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumn, setNewColumn] = useState({ name: "", type: 'text' as ColumnType, header_text_color: "#10b981" });
  const [editingColumn, setEditingColumn] = useState<TableColumn | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<Record<string, string[]>>({}); // rowId -> columnIds[]
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
        row_text_color,
        is_bold,
        order_index,
        organization_table_cells (
          column_id,
          value,
          text_color,
          is_bold
        )
      `)
      .eq("table_id", tableId)
      .order("order_index", { ascending: true });


    if (rowsError) return;

    const formattedRows: TableRow[] = rowsData.map((r: any) => {
      const cells: Record<string, { value: string, text_color?: string, is_bold?: boolean }> = {};
      r.organization_table_cells.forEach((c: any) => {
        cells[c.column_id] = { 
          value: c.value || "", 
          text_color: c.text_color,
          is_bold: c.is_bold 
        };
      });
      return { 
        id: r.id, 
        cells, 
        row_background_color: r.row_background_color,
        row_text_color: r.row_text_color,
        is_bold: r.is_bold,
        order_index: r.order_index || 0
      };
    });

    setRows(formattedRows);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `table-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setNewTable(prev => ({ ...prev, logo_url: publicUrl }));
      toast({ title: "Logo carregado com sucesso!" });
    } catch (error: any) {
      toast({ 
        title: "Erro ao carregar logo", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setUploadingLogo(false);
    }
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
      setNewColumn({ name: "", type: 'text', header_text_color: "#10b981" });
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

  const handleDeleteColumn = (column: TableColumn) => {
    if (!selectedTable) return;
    setItemToDelete({ id: column.id, type: 'column', name: column.name });
    setDeleteConfirmationText("");
    setIsDeleteModalOpen(true);
  };

  const executeDeleteColumn = async (columnId: string) => {
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

  const handleDeleteTable = (e: React.MouseEvent, table: any) => {
    e.stopPropagation();
    setItemToDelete({ id: table.id, type: 'table', name: table.name });
    setDeleteConfirmationText("");
    setIsDeleteModalOpen(true);
  };

  const executeDeleteTable = async (id: string) => {
    const { error } = await supabase.from("organization_tables").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir tabela", variant: "destructive" });
    } else {
      if (selectedTable?.id === id) setSelectedTable(null);
      fetchTables();
      toast({ title: "Tabela excluída com sucesso!" });
    }
  };

  const handleDeleteRow = (rowId: string, index: number) => {
    setItemToDelete({ id: rowId, type: 'row', name: `Linha ${index + 1}` });
    setDeleteConfirmationText("");
    setIsDeleteModalOpen(true);
  };

  const executeDeleteRow = async (rowId: string) => {
    const { error } = await supabase.from('organization_table_rows').delete().eq('id', rowId);
    if (error) {
      toast({ title: "Erro ao excluir linha", variant: "destructive" });
    } else {
      fetchTableDetails(selectedTable.id);
      toast({ title: "Linha excluída com sucesso!" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    // Check confirmation text only for 'table' and 'column' types
    if (itemToDelete.type !== 'row' && deleteConfirmationText.toLowerCase() !== 'excluir') {
      toast({ title: "Texto de confirmação incorreto", description: "Digite 'excluir' para confirmar.", variant: "destructive" });
      return;
    }

    if (itemToDelete.type === 'table') {
      await executeDeleteTable(itemToDelete.id);
    } else if (itemToDelete.type === 'column') {
      await executeDeleteColumn(itemToDelete.id);
    } else if (itemToDelete.type === 'row') {
      await executeDeleteRow(itemToDelete.id);
    }

    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    setDeleteConfirmationText("");
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

  const handleCellUpdate = (rowId: string, columnId: string, value: string) => {
    // Update local state first for performance
    const updatedRows = rows.map(r => {
      if (r.id === rowId) {
        const existingCell = r.cells[columnId] || { value: "" };
        return { 
          ...r, 
          cells: { 
            ...r.cells, 
            [columnId]: { ...existingCell, value } 
          } 
        };
      }
      return r;
    });
    setRows(updatedRows);
  };

  const handleSaveChanges = async () => {
    if (!selectedTable) return;
    
    try {
      setLoading(true);
      
      // Batch update cells
      // In a real production app with many rows, we might want to only update changed cells
      // But for simplicity and to ensure everything is saved as requested:
      for (const row of rows) {
        for (const [columnId, cellData] of Object.entries(row.cells)) {
          const { data: existing } = await supabase
            .from("organization_table_cells")
            .select("id")
            .eq("row_id", row.id)
            .eq("column_id", columnId)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("organization_table_cells")
              .update({ 
                value: cellData.value,
                text_color: cellData.text_color === 'inherit' ? null : cellData.text_color,
                is_bold: cellData.is_bold || false
              })
              .eq("id", existing.id);
          } else {
            await supabase
              .from("organization_table_cells")
              .insert({ 
                row_id: row.id, 
                column_id: columnId, 
                value: cellData.value,
                text_color: cellData.text_color === 'inherit' ? null : cellData.text_color,
                is_bold: cellData.is_bold || false
              });
          }
        }
      }
      
      toast({ title: "Alterações salvas com sucesso!" });
      fetchTableDetails(selectedTable.id);
    } catch (error) {
      toast({ title: "Erro ao salvar alterações", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCellColorUpdate = (rowId: string, columnId: string, color: string) => {
    // Update local state
    const updatedRows = rows.map(r => {
      if (r.id === rowId) {
        const existingCell = r.cells[columnId] || { value: "" };
        return { 
          ...r, 
          cells: { 
            ...r.cells, 
            [columnId]: { ...existingCell, text_color: color } 
          } 
        };
      }
      return r;
    });
    setRows(updatedRows);
  };

  const handleCellBoldUpdate = (rowId: string, columnId: string, isBold: boolean) => {
    const updatedRows = rows.map(r => {
      if (r.id === rowId) {
        const existingCell = r.cells[columnId] || { value: "" };
        return { 
          ...r, 
          cells: { 
            ...r.cells, 
            [columnId]: { ...existingCell, is_bold: isBold } 
          } 
        };
      }
      return r;
    });
    setRows(updatedRows);
  };

  const handleUpdateRowBold = async (rowId: string, isBold: boolean) => {
    const { error } = await supabase
      .from("organization_table_rows")
      .update({ is_bold: isBold })
      .eq("id", rowId);

    if (error) {
      toast({ title: "Erro ao atualizar negrito da linha", variant: "destructive" });
    } else {
      fetchTableDetails(selectedTable.id);
    }
  };

  const handleUpdateRowTextColor = async (rowId: string, color: string) => {
    const { error } = await supabase
      .from("organization_table_rows")
      .update({ row_text_color: color })
      .eq("id", rowId);

    if (error) {
      toast({ title: "Erro ao atualizar cor do texto da linha", variant: "destructive" });
    } else {
      fetchTableDetails(selectedTable.id);
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



  const handleDownloadPDF = () => {
    if (!selectedTable || rows.length === 0) return;
    
    const doc = new jsPDF({
      orientation: "landscape",
    });

    const tableHeaders = columns.map(col => col.name);
    const tableData = rows.map(row => 
      columns.map(col => row.cells[col.id]?.value || "")
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
      // Create a clone to ensure we don't capture UI elements like buttons or cursors
      const element = tableRef.current;
      
      // Temporary style changes for better export
      const originalHeight = element.style.height;
      const originalOverflow = element.style.overflow;
      
      // Expand to show all content if it's scrollable
      element.style.height = 'auto';
      element.style.overflow = 'visible';

      const canvas = await html2canvas(element, {
        backgroundColor: resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff',
        scale: 3, // Increased scale for better resolution
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        onclone: (clonedDoc) => {
          // Find all inputs in the cloned document and replace them with spans/divs 
          // to ensure their text content is rendered correctly by html2canvas
          const inputs = clonedDoc.querySelectorAll('input');
          inputs.forEach(input => {
            const span = clonedDoc.createElement('span');
            span.textContent = input.value;
            span.style.cssText = window.getComputedStyle(input).cssText;
            span.style.display = 'inline-block';
            span.style.border = 'none';
            span.style.background = 'transparent';
            if (input.parentElement) {
              input.parentElement.replaceChild(span, input);
            }
          });

          // Remove UI-only elements from the clone
          const uiElements = clonedDoc.querySelectorAll('button, .popover, [role="combobox"]');
          uiElements.forEach(el => {
            if (el instanceof HTMLElement) el.style.display = 'none';
          });
        }
      });
      
      // Restore original styles
      element.style.height = originalHeight;
      element.style.overflow = originalOverflow;
      
      const link = document.createElement('a');
      link.download = `${selectedTable.name}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      toast({ title: "Imagem gerada com sucesso!" });
    } catch (error) {
      console.error("PNG export error:", error);
      toast({ title: "Erro ao gerar imagem", variant: "destructive" });
    }
  };

  const parseValueToNumber = (val: string) => {
    if (!val) return null;
    const trimmedVal = val.trim();
    
    // Check if it matches exactly "R$ X" or "R$ X,XX"
    // This regex is strict to Brazil currency format
    const currencyRegex = /^R\$\s*\d{1,3}(\.\d{3})*(,\d{2})?$/;
    const currencyRegexSimple = /^R\$\s*\d+([.,]\d{2})?$/;
    
    if (!currencyRegex.test(trimmedVal) && !currencyRegexSimple.test(trimmedVal)) return null;

    // Remove R$, spaces, and thousand separator dots, then replace comma with dot
    let cleanVal = trimmedVal.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
    
    const num = parseFloat(cleanVal);
    return isNaN(num) ? null : num;
  };

  const totals = useMemo(() => {
    // If we have specific cells selected, use those
    const cellRowIds = Object.keys(selectedCells);
    const hasCellSelection = cellRowIds.some(id => selectedCells[id].length > 0);
    
    if (!hasCellSelection && selectedRowIds.length === 0) return {};

    const results: Record<string, { sum: number, count: number }> = {};
    
    columns.forEach(col => {
      let sum = 0;
      let count = 0;

      if (hasCellSelection) {
        // Mode: Specific cells selected
        cellRowIds.forEach(rowId => {
          if (selectedCells[rowId]?.includes(col.id)) {
            const row = rows.find(r => r.id === rowId);
            const val = row?.cells[col.id]?.value;
            if (val) {
              const num = parseValueToNumber(val);
              if (num !== null) {
                sum += num;
                count++;
              }
            }
          }
        });
      } else {
        // Mode: Entire rows selected
        const selectedRows = rows.filter(r => selectedRowIds.includes(r.id));
        selectedRows.forEach(row => {
          const val = row.cells[col.id]?.value;
          if (val) {
            const num = parseValueToNumber(val);
            if (num !== null) {
              sum += num;
              count++;
            }
          }
        });
      }

      if (count > 0) {
        results[col.id] = { sum, count };
      }
    });
    return results;
  }, [selectedRowIds, selectedCells, rows, columns]);

  const toggleCellSelection = (rowId: string, colId: string) => {
    // If not in selection mode, do nothing
    if (!isSelectionMode) return;
    
    setSelectedCells(prev => {
      const rowCols = prev[rowId] || [];
      const isCurrentlySelected = rowCols.includes(colId);
      
      const newCols = isCurrentlySelected 
        ? rowCols.filter(id => id !== colId) 
        : [...rowCols, colId];
      
      return { ...prev, [rowId]: newCols };
    });
  };

  const handleSaveTotal = async (colId: string, sum: number) => {
    if (!selectedTable) return;
    const { data: userData } = await supabase.auth.getUser();
    
    const { data: newRow, error: rowError } = await supabase
      .from("organization_table_rows")
      .insert({
        table_id: selectedTable.id,
        user_id: userData.user?.id,
        order_index: rows.length > 0 ? Math.max(...rows.map(r => r.order_index)) + 1 : 0,
        row_background_color: '#fef9c3' // Light yellow for totals
      })
      .select()
      .single();

    if (rowError) {
      toast({ title: "Erro ao criar linha de total", variant: "destructive" });
      return;
    }

    const valueStr = sum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    await supabase
      .from("organization_table_cells")
      .insert({ 
        row_id: newRow.id, 
        column_id: colId, 
        value: `TOTAL: ${valueStr}` 
      });

    toast({ title: "Total salvo com sucesso!" });
    fetchTableDetails(selectedTable.id);
  };

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
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSaveChanges}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
              Salvar Alterações
            </Button>
            <Button 
              variant={isSelectionMode ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (!isSelectionMode) {
                  setSelectedRowIds([]);
                  setSelectedCells({});
                }
              }}
              className={cn(isSelectionMode && "ring-2 ring-primary")}
            >
              <Calculator className="mr-2 h-4 w-4" /> {isSelectionMode ? "Saindo da Soma" : "Somar"}
            </Button>
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
                <th className="w-10 px-4 py-3 text-center border-r">
                  <Checkbox 
                    checked={rows.length > 0 && selectedRowIds.length === rows.length} 
                    onCheckedChange={toggleAllRows}
                  />
                </th>
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
                            onClick={() => handleDeleteColumn(col)}
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
                  className={cn(
                    "border-b hover:bg-muted/30 transition-colors group relative",
                    row.is_bold && "font-bold"
                  )}
                  style={{ 
                    backgroundColor: row.row_background_color || 'transparent',
                    color: row.row_text_color || (row.row_background_color && row.row_background_color !== 'transparent' && row.row_background_color !== '#f8fafc' ? '#000000' : 'inherit')
                  }}
                >
                  <td className="px-4 py-2 text-center border-r">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedRowIds.includes(row.id)} 
                        onCheckedChange={() => toggleRow(row.id)}
                      />
                      {selectedRowIds.includes(row.id) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 animate-in fade-in scale-in-95 duration-200"
                          onClick={() => handleDeleteRow(row.id, idx)}
                          title="Excluir Registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
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
                      <PopoverContent className="w-56 p-2" side="right">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-medium mb-2 uppercase tracking-wider text-muted-foreground">Estilo da Linha</p>
                            <Button 
                              variant={row.is_bold ? "secondary" : "ghost"} 
                              size="sm" 
                              className="w-full h-7 text-[10px] justify-start px-2 mb-1"
                              onClick={() => handleUpdateRowBold(row.id, !row.is_bold)}
                            >
                              <span className={cn("mr-2 font-bold", row.is_bold ? "text-primary" : "")}>B</span>
                              {row.is_bold ? "Remover Negrito" : "Colocar em Negrito"}
                            </Button>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-[10px] font-medium mb-2 uppercase tracking-wider text-muted-foreground">Cor do Texto da Linha</p>
                            <div className="flex gap-2 flex-wrap mb-2">
                              {COLOR_PALETTE.slice(0, 8).map(c => (
                                <button
                                  key={c}
                                  className={cn(
                                    "w-5 h-5 rounded-full border border-muted transition-transform hover:scale-110",
                                    row.row_text_color === c && "ring-2 ring-primary ring-offset-1"
                                  )}
                                  style={{ backgroundColor: c }}
                                  onClick={() => handleUpdateRowTextColor(row.id, c)}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Input 
                                type="color" 
                                className="w-8 h-8 p-0 border-none cursor-pointer overflow-hidden rounded shadow-sm"
                                value={row.row_text_color || '#000000'}
                                onChange={(e) => handleUpdateRowTextColor(row.id, e.target.value)}
                              />
                              <span className="text-[10px] text-muted-foreground">Personalizada</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full h-7 text-[10px] justify-start px-2"
                              onClick={() => handleUpdateRowTextColor(row.id, 'inherit')}
                            >
                              <X className="mr-1 h-3 w-3" /> Cor Padrão
                            </Button>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-[10px] font-medium mb-2 uppercase tracking-wider text-muted-foreground">Fundo da Linha</p>
                            <div className="flex items-center gap-2 mb-2">
                              <Input 
                                type="color" 
                                className="w-8 h-8 p-0 border-none cursor-pointer overflow-hidden rounded shadow-sm"
                                value={row.row_background_color && row.row_background_color !== 'transparent' ? row.row_background_color : '#ffffff'}
                                onChange={(e) => handleUpdateRowColor(row.id, e.target.value)}
                              />
                              <span className="text-[10px] text-muted-foreground">Cor do Fundo</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full h-7 text-[10px] justify-start px-2"
                              onClick={() => handleUpdateRowColor(row.id, 'transparent')}
                            >
                              <X className="mr-1 h-3 w-3" /> Remover Fundo
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>

                  {columns.map((col) => {
                    const cellData = row.cells[col.id] || { value: "" };
                    const isSelected = selectedCells[row.id]?.includes(col.id);
                    return (
                      <td 
                        key={col.id} 
                        className={cn(
                          "px-0 py-0 border-r min-w-[150px] transition-colors relative",
                          isSelected && "bg-primary/20 ring-1 ring-inset ring-primary"
                        )}
                      >
                        <div 
                          className="absolute inset-0 z-10 cursor-pointer"
                          style={{ display: isSelectionMode ? 'block' : 'none' }}
                          onClick={() => toggleCellSelection(row.id, col.id)}
                        />
                        <div className="flex items-center group/cell">
                          <input
                            type="text"
                            className={cn(
                              "w-full h-full px-4 py-2 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/30",
                              cellData.is_bold && "font-bold"
                            )}
                            style={{ 
                              color: cellData.text_color || (row.row_text_color || (row.row_background_color && row.row_background_color !== 'transparent' ? 'inherit' : undefined))
                            }}
                            value={cellData.value}
                            onChange={(e) => handleCellUpdate(row.id, col.id, e.target.value)}
                            placeholder="..."
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="opacity-0 group-hover/cell:opacity-100 transition-opacity p-1 hover:bg-muted rounded mr-1">
                                <Palette className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" side="bottom">
                              <p className="text-[10px] font-medium mb-2 uppercase tracking-wider text-muted-foreground">Cor do Texto</p>
                              <div className="flex gap-2 flex-wrap mb-3">
                                {COLOR_PALETTE.slice(0, 8).map(c => (
                                  <button
                                    key={c}
                                    className={cn(
                                      "w-6 h-6 rounded-full border border-muted transition-transform hover:scale-110",
                                      cellData.text_color === c && "ring-2 ring-primary ring-offset-1"
                                    )}
                                    style={{ backgroundColor: c }}
                                    onClick={() => handleCellColorUpdate(row.id, col.id, c)}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center gap-2 mb-3">
                                <Input 
                                  type="color" 
                                  className="w-8 h-8 p-0 border-none cursor-pointer overflow-hidden rounded shadow-sm"
                                  value={cellData.text_color || '#000000'}
                                  onChange={(e) => handleCellColorUpdate(row.id, col.id, e.target.value)}
                                />
                                <span className="text-[10px] text-muted-foreground">Personalizada</span>
                              </div>
                              <div className="pt-2 border-t">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full h-7 text-[10px] justify-start px-1"
                                  onClick={() => handleCellColorUpdate(row.id, col.id, 'inherit')}
                                >
                                  <X className="mr-1 h-3 w-3" /> Padrão
                                </Button>
                                <Button 
                                  variant={cellData.is_bold ? "secondary" : "ghost"} 
                                  size="sm" 
                                  className="w-full h-7 text-[10px] justify-start px-1 mt-1"
                                  onClick={() => handleCellBoldUpdate(row.id, col.id, !cellData.is_bold)}
                                >
                                  <span className={cn("mr-2 font-bold", cellData.is_bold ? "text-primary" : "")}>B</span>
                                  {cellData.is_bold ? "Remover Negrito" : "Negrito"}
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 3} className="py-20 text-center text-muted-foreground italic">
                    Nenhum registro adicionado ainda. Clique em "+ Registro" para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {Object.keys(totals).length > 0 && (
          <div className="bg-primary/5 border-t px-6 py-3 flex flex-wrap items-center gap-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Calculator className="h-4 w-4" />
              Cálculos ({Object.values(selectedCells).flat().length || selectedRowIds.length} selecionados):
            </div>
            <div className="flex flex-wrap gap-4">
              {columns.filter(col => totals[col.id]).map(col => (
                <div key={col.id} className="flex flex-col border-l pl-4 first:border-l-0 first:pl-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">{col.name}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {totals[col.id].sum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      (Média: {(totals[col.id].sum / totals[col.id].count).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 ml-1 text-primary hover:text-primary hover:bg-primary/10"
                      title="Salvar Total como Novo Registro"
                      onClick={() => handleSaveTotal(col.id, totals[col.id].sum)}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-xs h-7"
              onClick={() => {
                setSelectedRowIds([]);
                setSelectedCells({});
              }}
            >
              Limpar Seleção
            </Button>
          </div>
        )}

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

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. O item <strong>{itemToDelete?.name}</strong> será removido permanentemente.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {itemToDelete?.type !== 'row' ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Para confirmar, digite <span className="font-bold text-foreground select-none">excluir</span> no campo abaixo:
                  </p>
                  <Input
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="Digite excluir para confirmar"
                    className={cn(
                      "border-2 transition-all",
                      deleteConfirmationText.toLowerCase() === 'excluir' ? "border-green-500 focus-visible:ring-green-500" : "focus-visible:ring-destructive"
                    )}
                    autoFocus
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tem certeza que deseja excluir este registro? Esta ação é imediata.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={itemToDelete?.type !== 'row' && deleteConfirmationText.toLowerCase() !== 'excluir'}
              >
                Excluir Permanentemente
              </Button>
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
                        onClick={(e) => handleDeleteTable(e, table)}
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
              <Label htmlFor="logo">Logo da Tabela (Upload)</Label>
              <div className="flex items-center gap-4">
                {newTable.logo_url && (
                  <div className="w-12 h-12 rounded-lg border overflow-hidden bg-muted flex-shrink-0">
                    <img src={newTable.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Label 
                    htmlFor="logo-upload" 
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                      uploadingLogo && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingLogo ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">Clique para fazer upload</p>
                        </>
                      )}
                    </div>
                    <Input 
                      id="logo-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </Label>
                </div>
              </div>
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
