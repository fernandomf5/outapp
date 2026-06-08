import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard, Receipt, Wallet, FileBarChart, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBankAccounts } from "@/hooks/useBankAccounts";

// New Components
import { FinancialOverview } from "./finance/FinancialOverview";
import { TransactionManager } from "./finance/TransactionManager";
import { BankAccountSection } from "./finance/BankAccountSection";
import { ReportCenter } from "./finance/ReportCenter";
import { BusinessSelector } from "@/components/financial/BusinessSelector";
import { CustomFinancialRecordsPanel } from "./registration/CustomFinancialRecordsPanel";

interface Business {
  id: string;
  name: string;
  business_type: 'personal' | 'company';
  description?: string;
}

interface FinancialManagementPanelProps {
  teamContext?: {
    adminUserId: string;
    allowedIds: string[];
  };
}

export const FinancialManagementPanel = ({ teamContext }: FinancialManagementPanelProps) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [isConsolidatedView, setIsConsolidatedView] = useState(false);
  const [viewMode, setViewMode] = useState<'selection' | 'management'>('selection');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { bankAccounts, refetch: refetchBankAccounts } = useBankAccounts(selectedBusinessId);

  useEffect(() => {
    loadBusinesses();
  }, [teamContext?.adminUserId]);

  useEffect(() => {
    if (selectedBusinessId || (isConsolidatedView && selectedBusinessIds.length > 0)) {
      loadTransactions();
    }
  }, [selectedBusinessId, selectedBusinessIds, isConsolidatedView]);

  const loadBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetUserId = teamContext?.adminUserId || user.id;

      let query = supabase
        .from('financial_businesses')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (teamContext?.allowedIds && teamContext.allowedIds.length > 0) {
        query = query.in('id', teamContext.allowedIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBusinesses((data || []) as Business[]);
    } catch (error: any) {
      toast.error('Erro ao carregar negócios');
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetUserId = teamContext?.adminUserId || user.id;

      let query = supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('due_date', { ascending: true });

      if (isConsolidatedView && selectedBusinessIds.length > 0) {
        query = query.in('business_id', selectedBusinessIds);
      } else {
        query = query.eq('business_id', selectedBusinessId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setIsConsolidatedView(false);
    setSelectedBusinessIds([]);
    setViewMode('management');
  };

  const handleSelectMultipleBusinesses = (businessIds: string[]) => {
    setSelectedBusinessIds(businessIds);
    setSelectedBusinessId('');
    setIsConsolidatedView(true);
    setViewMode('management');
  };

  const handleBackToSelection = () => {
    setViewMode('selection');
    setSelectedBusinessId('');
    setSelectedBusinessIds([]);
    setIsConsolidatedView(false);
  };

  const handleCreateBusiness = async (data: { name: string; business_type: 'personal' | 'company'; description: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newBusiness, error } = await supabase
        .from('financial_businesses')
        .insert({
          user_id: user.id,
          name: data.name,
          business_type: data.business_type,
          description: data.description || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Negócio criado com sucesso!');
      loadBusinesses();
      if (newBusiness) {
        handleSelectBusiness(newBusiness.id);
      }
    } catch (error: any) {
      toast.error('Erro ao criar negócio');
    }
  };

  if (viewMode === 'selection') {
    return (
      <div className="container mx-auto py-6">
        <BusinessSelector 
          businesses={businesses}
          onSelectBusiness={handleSelectBusiness}
          onSelectMultipleBusinesses={handleSelectMultipleBusinesses}
          onCreateBusiness={handleCreateBusiness}
        />
      </div>
    );
  }

  const selectedBusinessName = isConsolidatedView 
    ? "Visão Consolidada" 
    : businesses.find(b => b.id === selectedBusinessId)?.name || "Negócio";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackToSelection}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{selectedBusinessName}</h1>
            <p className="text-sm text-muted-foreground">Sistema Financeiro Inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[750px] mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Contas</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Transações</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="custom-records" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Registros Perso.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <FinancialOverview 
            transactions={transactions} 
            bankAccounts={bankAccounts} 
          />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <BankAccountSection 
            businessId={selectedBusinessId}
            bankAccounts={bankAccounts}
            onRefresh={refetchBankAccounts}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionManager 
            transactions={transactions} 
            bankAccounts={bankAccounts} 
            onRefresh={() => {
              loadTransactions();
              refetchBankAccounts();
            }}
            businessId={selectedBusinessId}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportCenter transactions={transactions} />
        </TabsContent>

        <TabsContent value="custom-records" className="space-y-4">
          <CustomFinancialRecordsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Badge = ({ children, variant, className }: any) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'outline' ? 'text-foreground' : ''} ${className}`}>
    {children}
  </span>
);