import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, User, Plus, ArrowRight, Briefcase, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  business_type: 'personal' | 'company';
  description?: string;
}

interface BusinessSelectorProps {
  businesses: Business[];
  onSelectBusiness: (businessId: string) => void;
  onSelectMultipleBusinesses?: (businessIds: string[]) => void;
  onCreateBusiness: (data: { name: string; business_type: 'personal' | 'company'; description: string }) => void;
}

export const BusinessSelector = ({ businesses, onSelectBusiness, onSelectMultipleBusinesses, onCreateBusiness }: BusinessSelectorProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    business_type: 'personal' as 'personal' | 'company',
    description: ''
  });

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleViewConsolidated = () => {
    if (selectedIds.size < 2) return;
    onSelectMultipleBusinesses?.(Array.from(selectedIds));
  };

  const handleCreate = () => {
    onCreateBusiness(formData);
    setIsCreateDialogOpen(false);
    setFormData({ name: '', business_type: 'personal', description: '' });
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Briefcase className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Gestão Financeira</h1>
        <p className="text-muted-foreground max-w-md">
          Selecione um negócio para gerenciar suas finanças ou crie um novo
        </p>
        {businesses.length >= 2 && (
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant={multiSelectMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMultiSelectMode(!multiSelectMode);
                setSelectedIds(new Set());
              }}
            >
              <Layers className="w-4 h-4 mr-2" />
              {multiSelectMode ? "Cancelar Seleção" : "Juntar Negócios"}
            </Button>
            {multiSelectMode && selectedIds.size >= 2 && (
              <Button size="sm" onClick={handleViewConsolidated}>
                Ver Consolidado ({selectedIds.size} selecionados)
              </Button>
            )}
          </div>
        )}
      </div>

      {businesses.length > 0 ? (
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {businesses.map((business) => (
              <Card 
                key={business.id} 
                className={cn(
                  "cursor-pointer hover:border-primary hover:shadow-lg transition-all group",
                  multiSelectMode && selectedIds.has(business.id) && "border-primary ring-2 ring-primary/30"
                )}
                onClick={() => {
                  if (multiSelectMode) {
                    toggleSelection(business.id);
                  } else {
                    onSelectBusiness(business.id);
                  }
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {multiSelectMode && (
                        <Checkbox
                          checked={selectedIds.has(business.id)}
                          onCheckedChange={() => toggleSelection(business.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div className={cn(
                        "p-3 rounded-lg",
                        business.business_type === 'company' ? 'bg-blue-500/10' : 'bg-green-500/10'
                      )}>
                        {business.business_type === 'company' ? (
                          <Building2 className={cn("w-6 h-6", "text-blue-600")} />
                        ) : (
                          <User className={cn("w-6 h-6", "text-green-600")} />
                        )}
                      </div>
                    </div>
                    {!multiSelectMode && (
                      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{business.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {business.business_type === 'company' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </Badge>
                  {business.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {business.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Create New Card */}
            <Card 
              className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[160px]">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Criar Novo Negócio</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Nenhum negócio cadastrado</CardTitle>
            <CardDescription>
              Crie seu primeiro negócio para começar a gerenciar suas finanças
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button size="lg" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Negócio
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Negócio</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Nome do Negócio</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Minha Loja, Consultoria XYZ"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select 
                value={formData.business_type} 
                onValueChange={(v: 'personal' | 'company') => setFormData({ ...formData, business_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Pessoa Física (CPF)
                    </div>
                  </SelectItem>
                  <SelectItem value="company">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Pessoa Jurídica (CNPJ)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do negócio"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim()}>
              Criar Negócio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
