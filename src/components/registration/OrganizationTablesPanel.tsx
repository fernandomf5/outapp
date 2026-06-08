import React, { useState, useEffect } from "react";
import { Plus, Table as TableIcon, Settings, Trash2, Edit2, ChevronRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const OrganizationTablesPanel = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTableName, setNewTableName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
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

  const createTable = async () => {
    if (!newTableName) return;
    const { error } = await supabase.from("organization_tables").insert({
      name: newTableName,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });

    if (error) {
      toast({ title: "Erro ao criar tabela", variant: "destructive" });
    } else {
      toast({ title: "Tabela criada com sucesso!" });
      setNewTableName("");
      fetchTables();
    }
  };

  const deleteTable = async (id: string) => {
    const { error } = await supabase.from("organization_tables").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir tabela", variant: "destructive" });
    } else {
      fetchTables();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tabela de Organização</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova Tabela
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Tabela</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Nome da Tabela</Label>
              <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} />
              <Button onClick={createTable}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <Card key={table.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{table.name}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => deleteTable(table.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{table.description || "Sem descrição"}</p>
              <Button className="w-full mt-4" variant="outline">
                Ver Tabela <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
