import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle, PlusCircle, List, Mail, Phone, Trash2, Eye, Pencil, ArrowUp, ArrowDown, MoreHorizontal, History, MessageCircle, Search, Upload, Camera, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UnifiedRegistrationForm } from "./UnifiedRegistrationForm";
import { useStatusOptions } from "./statusOptions";
import { StatusManagerDialog } from "./StatusManagerDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BulkRegistrationDialog } from "./BulkRegistrationDialog";
import { PhotoRegistrationDialog } from "./PhotoRegistrationDialog";
import { ContactHistoryPanel } from "./ContactHistoryPanel";
import { toast } from "sonner";
import { SecureDeleteDialog } from "@/components/ui/secure-delete-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RegistrationManagerPanelProps {
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
  system_type: string | null;
  color: string;
}

interface RegisteredItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  created_at: string;
}

export function RegistrationManagerPanel({ categoryId }: RegistrationManagerPanelProps) {
  const { user } = useAuth();

  const sessionKey = categoryId ? `registration-panel-state:${user?.id || 'anon'}:${categoryId}` : null;
  const initialSession = (() => {
    if (!sessionKey) return null;
    try {
      const raw = localStorage.getItem(sessionKey) || sessionStorage.getItem(sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<RegisteredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(initialSession?.activeTab || "form");
  const [selectedItem, setSelectedItem] = useState<any>(initialSession?.selectedItem || null);
  const [isViewOnly, setIsViewOnly] = useState<boolean>(initialSession?.isViewOnly || false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [statusManagerOpen, setStatusManagerOpen] = useState(false);
  const { options: statusOptions } = useStatusOptions();
  const sortKey = categoryId ? `registration-sort:${categoryId}` : null;
  const [sortMode, setSortMode] = useState<'custom' | 'recent' | 'oldest' | 'name'>(() => {
    try {
      if (!sortKey) return 'custom';
      return (localStorage.getItem(sortKey) as any) || 'custom';
    } catch { return 'custom'; }
  });
  useEffect(() => { if (sortKey) { try { localStorage.setItem(sortKey, sortMode); } catch {} } }, [sortKey, sortMode]);

  useEffect(() => {
    if (!sessionKey) return;
    try {
      const state = JSON.stringify({ activeTab, selectedItem, isViewOnly });
      localStorage.setItem(sessionKey, state);
      sessionStorage.setItem(sessionKey, state);
    } catch {}
  }, [sessionKey, activeTab, selectedItem, isViewOnly]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from('contacts').delete().in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} cadastro(s) excluído(s) com sucesso!`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      fetchItems();
    } catch (e: any) {
      toast.error('Erro ao excluir em massa: ' + e.message);
    } finally {
      setBulkDeleteOpen(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const newStatus = status === '__clear__' ? null : status;
    const previous = items;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: newStatus } : it)));
    const { error } = await supabase
      .from('contacts')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      setItems(previous);
      toast.error('Erro ao atualizar status: ' + error.message);
    } else {
      toast.success('Status atualizado');
    }
  };

  useEffect(() => {
    if (categoryId && user) {
      fetchCategory();
      fetchItems();
    }
  }, [categoryId, user]);

  const fetchCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('registration_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      setCategory(data);
    } catch (error) {
      console.error('Error fetching category:', error);
    }
  };

  const getOrderKey = () => `registration-order-${categoryId}`;

  const applyCustomOrder = (list: RegisteredItem[]): RegisteredItem[] => {
    try {
      const stored = localStorage.getItem(getOrderKey());
      if (!stored) return list;
      const orderIds: string[] = JSON.parse(stored);
      const indexOf = (id: string) => {
        const i = orderIds.indexOf(id);
        return i === -1 ? Number.MAX_SAFE_INTEGER : i;
      };
      return [...list].sort((a, b) => {
        const ai = indexOf(a.id);
        const bi = indexOf(b.id);
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
    } catch {
      return list;
    }
  };

  const saveOrder = (list: RegisteredItem[]) => {
    try {
      localStorage.setItem(getOrderKey(), JSON.stringify(list.map((i) => i.id)));
    } catch {}
  };

  const moveItem = (index: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      let newIndex = index;
      if (direction === 'up') newIndex = Math.max(0, index - 1);
      else if (direction === 'down') newIndex = Math.min(next.length, index + 1);
      else if (direction === 'top') newIndex = 0;
      else if (direction === 'bottom') newIndex = next.length;
      next.splice(newIndex, 0, item);
      saveOrder(next);
      return next;
    });
  };

  const moveItemToPosition = (id: string, newPosition1Based: number) => {
    setItems((prev) => {
      const from = prev.findIndex((i) => i.id === id);
      if (from === -1) return prev;
      const target = Math.max(1, Math.min(prev.length, Math.floor(newPosition1Based))) - 1;
      if (target === from) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(target, 0, item);
      saveOrder(next);
      return next;
    });
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('registration_category_id', categoryId)
        .order('name');

      if (error) throw error;
      const ordered = applyCustomOrder(data || []);
      setItems(ordered);

      // Não troca automaticamente para a lista: mantém a tela onde o usuário estava.
      if ((!data || data.length === 0) && activeTab === "list") {
        setActiveTab("form");
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      toast.success('Cadastro excluído com sucesso!');
      fetchItems();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsViewOnly(false);
    setActiveTab("form");
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setIsViewOnly(true);
    setActiveTab("form");
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsViewOnly(false);
    setActiveTab("form");
  };

  if (loading && !category) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Categoria não encontrada</CardTitle>
          </div>
          <CardDescription>
            A categoria selecionada não existe ou foi excluída.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{category.name}</h2>
          <p className="text-muted-foreground">
            {activeTab === "form" ? `Preencha os dados para cadastrar em ${category.name.toLowerCase()}.` : `Gerencie os cadastros na categoria ${category.name.toLowerCase()}.`}
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                Opções
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setPhotoOpen(true)}>
                <Camera className="h-4 w-4 mr-2" />
                Cadastrar por Foto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Cadastro em Massa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusManagerOpen(true)}>
                <Settings2 className="h-4 w-4 mr-2" />
                Editar Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tabs value={activeTab} onValueChange={(val) => {
            if (val === "form" && activeTab !== "form") {
              handleAddNew();
            } else {
              setActiveTab(val);
            }
          }} className="w-full md:w-auto">
            <TabsList className={`grid w-full ${selectedItem ? "grid-cols-3" : "grid-cols-2"}`}>
              <TabsTrigger value="form" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Cadastrar
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Ver Lista
              </TabsTrigger>
              {selectedItem && (
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Histórico
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "form" ? (
          <UnifiedRegistrationForm 
            categoryId={category.id} 
            categoryName={category.name}
            systemType={category.system_type || 'other'}
            initialData={selectedItem}
            isViewOnly={isViewOnly}
            onSuccess={() => {
              setActiveTab("list");
              fetchItems();
              setSelectedItem(null);
            }}
            onCancel={() => {
              setActiveTab("list");
              setSelectedItem(null);
            }}
          />
        ) : activeTab === "history" && selectedItem ? (
          <ContactHistoryPanel contactId={selectedItem.id} contactName={selectedItem.name} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome, email ou telefone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!selectionMode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectionMode(true)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir em Massa
                    </Button>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {selectedIds.size} selecionado(s)
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedIds.size === 0}
                        onClick={() => setBulkDeleteOpen(true)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir Selecionados
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectionMode && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={(() => {
                            const q = searchQuery.trim().toLowerCase();
                            const filtered = q
                              ? items.filter((it) =>
                                  (it.name || '').toLowerCase().includes(q) ||
                                  (it.email || '').toLowerCase().includes(q) ||
                                  (it.phone || '').toLowerCase().includes(q)
                                )
                              : items;
                            return filtered.length > 0 && filtered.every((i) => selectedIds.has(i.id));
                          })()}
                          onCheckedChange={(checked) => {
                            const q = searchQuery.trim().toLowerCase();
                            const filtered = q
                              ? items.filter((it) =>
                                  (it.name || '').toLowerCase().includes(q) ||
                                  (it.email || '').toLowerCase().includes(q) ||
                                  (it.phone || '').toLowerCase().includes(q)
                                )
                              : items;
                            setSelectedIds(checked ? new Set(filtered.map((i) => i.id)) : new Set());
                          }}
                        />
                      </TableHead>
                    )}
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-16" title="Posição na lista. Digite um número para reordenar.">#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="w-[170px]">Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const q = searchQuery.trim().toLowerCase();
                    const filtered = q
                      ? items.filter((it) =>
                          (it.name || '').toLowerCase().includes(q) ||
                          (it.email || '').toLowerCase().includes(q) ||
                          (it.phone || '').toLowerCase().includes(q)
                        )
                      : items;
                    if (filtered.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={selectionMode ? 8 : 7} className="h-24 text-center text-muted-foreground">
                            {q ? 'Nenhum cadastro corresponde à pesquisa.' : 'Nenhum cadastro encontrado nesta categoria.'}
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return filtered.map((item, index) => (
                       <TableRow key={item.id} data-state={selectedIds.has(item.id) ? 'selected' : undefined}>
                         {selectionMode && (
                           <TableCell>
                             <Checkbox
                               checked={selectedIds.has(item.id)}
                               onCheckedChange={() => toggleSelected(item.id)}
                             />
                           </TableCell>
                         )}
                         <TableCell>
                           <Avatar className="h-8 w-8">
                             <AvatarImage src={(item as any).avatar_url} />
                             <AvatarFallback>{item.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                           </Avatar>
                         </TableCell>
                         <TableCell>
                           <Input
                             type="number"
                             min={1}
                             max={items.length}
                             defaultValue={items.findIndex((i) => i.id === item.id) + 1}
                             key={`pos-${item.id}-${items.findIndex((i) => i.id === item.id)}`}
                             onBlur={(e) => {
                               const v = parseInt(e.target.value, 10);
                               if (!isNaN(v)) moveItemToPosition(item.id, v);
                             }}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                             }}
                             className="h-8 w-14 text-center px-1"
                             title="Digite a posição desejada"
                           />
                         </TableCell>
                         <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {item.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {item.email}
                              </div>
                            )}
                            {item.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {item.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const opt = statusOptions.find((o) => o.value === item.status);
                            return (
                              <Select
                                value={item.status || ''}
                                onValueChange={(v) => updateStatus(item.id, v)}
                              >
                                <SelectTrigger
                                  className={`h-7 w-[160px] rounded-full border-0 px-3 text-xs font-medium [&>svg]:opacity-60 ${
                                    opt ? opt.color : 'bg-muted/40 text-muted-foreground'
                                  }`}
                                >
                                  <span className="truncate">
                                    {opt ? opt.label : 'Sem status'}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__clear__">
                                    <span className="text-muted-foreground">Sem status</span>
                                  </SelectItem>
                                  {statusOptions.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                      <Badge variant="outline" className={`${s.color} font-normal`}>
                                        {s.label}
                                      </Badge>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Conversar no WhatsApp"
                                onClick={() => {
                                  const digits = (item.phone || '').replace(/\D/g, '');
                                  const normalized = digits.length <= 11 ? `55${digits}` : digits;
                                  window.open(`https://wa.me/${normalized}`, '_blank');
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" title="Ações">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => moveItem(index, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4 mr-2" />
                                Subir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => moveItem(index, 'down')}
                                disabled={index === items.length - 1}
                              >
                                <ArrowDown className="h-4 w-4 mr-2" />
                                Descer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => moveItem(index, 'top')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4 mr-2" />
                                Mover para o topo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => moveItem(index, 'bottom')}
                                disabled={index === items.length - 1}
                              >
                                <ArrowDown className="h-4 w-4 mr-2" />
                                Mover para o fundo
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsViewOnly(false); setActiveTab("history"); }}>
                                <History className="h-4 w-4 mr-2" />
                                Ver Histórico
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => confirmDelete(item.id, item.name)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
      <SecureDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Cadastro"
        description="Esta ação excluirá permanentemente este cadastro. Para confirmar, digite 'excluir' abaixo."
        itemName={itemToDelete?.name}
      />
      <BulkRegistrationDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        categoryId={category.id}
        onSuccess={() => { fetchItems(); setActiveTab("list"); }}
      />
      <PhotoRegistrationDialog
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        categoryId={category.id}
        onSuccess={() => { fetchItems(); setActiveTab("list"); }}
      />
      <SecureDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title="Excluir cadastros selecionados"
        description={`Esta ação excluirá permanentemente ${selectedIds.size} cadastro(s). Para confirmar, digite 'excluir' abaixo.`}
        itemName={`${selectedIds.size} cadastro(s)`}
      />
      <StatusManagerDialog open={statusManagerOpen} onOpenChange={setStatusManagerOpen} />
    </div>
  );
}
