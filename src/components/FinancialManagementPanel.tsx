import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard, Receipt, Wallet, FileBarChart, History, ChevronLeft, ChevronRight, Building2, User, Loader2, CalendarDays, CircleDollarSign, Layers3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { getMonthTransactions, MONTH_NAMES, buildPeriodKey, EntityType } from "./finance/monthUtils";

// New Components
import { FinancialOverview } from "./finance/FinancialOverview";
import { TransactionManager } from "./finance/TransactionManager";
import { BankAccountSection } from "./finance/BankAccountSection";
import { ReportCenter } from "./finance/ReportCenter";
import { TransactionHistory } from "./finance/TransactionHistory";
import { BusinessSelector } from "@/components/financial/BusinessSelector";
import { useFinancialFolders } from "@/hooks/useFinancialFolders";
import { FinancialFolderTabs } from "./finance/FinancialFolderTabs";
import "./finance/financial-folders.css";
import "./finance/finance-management.css";

interface Business {
  id: string;
  name: string;
  business_type: 'personal' | 'company';
  description?: string;
}

interface FinancialManagementPanelProps {
  initialBusinessId?: string;
  onBack?: () => void;
  teamContext?: {
    adminUserId: string;
    allowedIds: string[];
  };
}

export const FinancialManagementPanel = ({ teamContext, initialBusinessId, onBack }: FinancialManagementPanelProps) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(initialBusinessId ?? '');
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [isConsolidatedView, setIsConsolidatedView] = useState(false);
  const [viewMode, setViewMode] = useState<'selection' | 'management'>(initialBusinessId ? 'management' : 'selection');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [entityType, setEntityType] = useState<EntityType>('pf');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [activeFinanceTab, setActiveFinanceTab] = useState<string>('overview');
  const { folders, loading: foldersLoading, error: foldersError, createFolder, renameFolder, removeFolder } = useFinancialFolders(selectedBusinessId, Boolean(teamContext) || isConsolidatedView);

  const { bankAccounts, refetch: refetchBankAccounts } = useBankAccounts(selectedBusinessId);
  const { categories } = useFinancialCategories(selectedBusinessId || undefined);

  /** Nomes (normalizados) das categorias marcadas como recorrentes, ex.: "Contas fixas". */
  const recurringCategoryNames = useMemo(
    () => new Set(categories.filter((c) => c.is_recurring).map((c) => c.name.trim().toLowerCase())),
    [categories]
  );

  /** Transações do mês selecionado, já separadas por PF/PJ e com as contas fixas repetidas. */
  const periodTransactions = useMemo(
    () => getMonthTransactions(transactions, selectedYear, selectedMonth, recurringCategoryNames, entityType),
    [transactions, selectedYear, selectedMonth, recurringCategoryNames, entityType]
  );

  // Keep selection on an existing custom tab when switching businesses or deleting tabs.
  useEffect(() => {
    if (foldersLoading || foldersError || isConsolidatedView || teamContext) return;
    if (!folders.some(folder => folder.id === selectedFolderId)) {
      setSelectedFolderId(folders[0]?.id ?? "");
    }
  }, [folders, foldersLoading, foldersError, isConsolidatedView, teamContext, selectedFolderId]);

  /** Abas filtram somente lancamentos; categorias e contas bancarias permanecem compartilhadas. */
  const visibleTransactions = useMemo(
    () => isConsolidatedView || Boolean(teamContext) || Boolean(foldersError)
      ? periodTransactions
      : periodTransactions.filter(t => Boolean(selectedFolderId) && t.folder_id === selectedFolderId),
    [periodTransactions, selectedFolderId]
  );

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
} else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  useEffect(() => {
    if (initialBusinessId) {
      setSelectedFolderId("");
      setSelectedBusinessId(initialBusinessId);
      setSelectedBusinessIds([]);
      setIsConsolidatedView(false);
      setViewMode('management');
    }
  }, [initialBusinessId]);

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
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (teamContext?.allowedIds && teamContext.allowedIds.length > 0) {
        query = query.in('id', teamContext.allowedIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBusinesses((data || []) as Business[]);
    } catch (error: any) {
      toast.error('Erro ao carregar negócios');
    } finally {
      setLoadingBusinesses(false);
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
        .order('order_index', { ascending: true, nullsFirst: false })
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
    setSelectedFolderId("");
    setActiveFinanceTab('overview');
    setSelectedBusinessId(businessId);
    setIsConsolidatedView(false);
    setSelectedBusinessIds([]);
    setViewMode('management');
  };

  const handleSelectMultipleBusinesses = (businessIds: string[]) => {
    setSelectedFolderId("");
    setActiveFinanceTab('overview');
    setSelectedBusinessIds(businessIds);
    setSelectedBusinessId('');
    setIsConsolidatedView(true);
    setViewMode('management');
  };

  const handleBackToSelection = () => {
    setSelectedFolderId("");
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

  const handleCreateBusinessesFromRegistrations = async (
    items: { name: string; business_type: 'personal' | 'company'; description: string; contact_id?: string; category_id?: string | null }[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: created, error } = await supabase
        .from('financial_businesses')
        .insert(
          items.map((item) => ({
            user_id: user.id,
            name: item.name,
            business_type: item.business_type,
            description: item.description || null,
          }))
        )
        .select('id, name');

      if (error) throw error;

      // Register the link between each created management and its cadastro
      const links = (created || [])
        .map((biz: any, index: number) => {
          const source = items[index];
          if (!source?.contact_id) return null;
          return {
            user_id: user.id,
            contact_id: source.contact_id,
            category_id: source.category_id ?? null,
            resource_type: 'financial_business',
            resource_id: biz.id,
            resource_title: biz.name,
            resource_url: `/dashboard?tab=financeiro&resourceId=${biz.id}`,
          };
        })
        .filter(Boolean);

      if (links.length > 0) {
        await supabase.from('contact_resource_links' as any).insert(links as any);
      }

      toast.success(
        items.length > 1
          ? `${items.length} gestões criadas a partir dos cadastros!`
          : 'Gestão criada a partir do cadastro!'
      );
      loadBusinesses();
    } catch (error: any) {
      toast.error('Erro ao criar gestões a partir dos cadastros');
    }
  };




  const handleUpdateBusiness = async (id: string, data: { name: string; business_type: 'personal' | 'company'; description: string }) => {
    try {
      const { error } = await supabase
        .from('financial_businesses')
        .update({
          name: data.name,
          business_type: data.business_type,
          description: data.description || null,
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Gestão atualizada com sucesso!');
      loadBusinesses();
    } catch (error: any) {
      toast.error('Erro ao atualizar gestão');
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_businesses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Gestão excluída com sucesso!');
      loadBusinesses();
    } catch (error: any) {
      toast.error('Erro ao excluir gestão');
    }
  };

  const handleReorderBusinesses = async (orderedIds: string[]) => {
    // Optimistic local update
    setBusinesses(prev => {
      const map = new Map(prev.map(b => [b.id, b]));
      return orderedIds.map(id => map.get(id)).filter(Boolean) as Business[];
    });
    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('financial_businesses').update({ sort_order: index }).eq('id', id)
        )
      );
    } catch (error: any) {
      toast.error('Erro ao reordenar gestões');
      loadBusinesses();
    }
  };

  if (loadingBusinesses) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm">Carregando gestão financeira...</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'selection') {
    return (
      <div className="container mx-auto py-6">
        <BusinessSelector 
          businesses={businesses}
          onSelectBusiness={handleSelectBusiness}
          onSelectMultipleBusinesses={handleSelectMultipleBusinesses}
          onCreateBusiness={handleCreateBusiness}
          onCreateBusinessesFromRegistrations={handleCreateBusinessesFromRegistrations}
          onUpdateBusiness={handleUpdateBusiness}
          onDeleteBusiness={handleDeleteBusiness}
          onReorderBusinesses={handleReorderBusinesses}
        />
      </div>
    );
  }

  const selectedBusinessName = isConsolidatedView
    ? "Visão Consolidada"
    : businesses.find(b => b.id === selectedBusinessId)?.name || "Negócio";
  const periodTitle = `${MONTH_NAMES[selectedMonth]} de ${selectedYear}`;
  const pendingCount = visibleTransactions.filter((t) => t.status === "pending").length;

  return (
    <div className="finance-app">
      <header className="finance-app-header">
        <div className="finance-app-heading">
          <Button variant="ghost" size="icon" className="finance-back-button" onClick={onBack || handleBackToSelection} aria-label="Voltar ao painel">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="finance-title-symbol" aria-hidden="true"><CircleDollarSign size={23} /></div>
          <div className="finance-title-copy">
            <span className="finance-eyebrow">CENTRAL FINANCEIRA</span>
            <h1>{selectedBusinessName}</h1>
            <p>Seus números, suas contas e seus próximos passos em um só lugar.</p>
          </div>
        </div>
        <div className="finance-person-switch" role="group" aria-label="Tipo de movimentação">
          <button type="button" onClick={() => setEntityType('pf')} className={entityType === 'pf' ? "is-current" : ""} aria-pressed={entityType === 'pf'}>
            <User size={15} /> Pessoa física
          </button>
          <button type="button" onClick={() => setEntityType('pj')} className={entityType === 'pj' ? "is-current" : ""} aria-pressed={entityType === 'pj'}>
            <Building2 size={15} /> Pessoa jurídica
          </button>
        </div>
      </header>

      {!isConsolidatedView && selectedBusinessId && (
        <div className="finance-app-folders">
          {foldersError ? (
            <div className="finance-folders-unavailable" role="alert">
              <strong>Abas financeiras indisponíveis neste momento.</strong>
              <p>Seus lançamentos permanecem salvos. A configuração das abas no banco precisa ser verificada.</p>
            </div>
          ) : foldersLoading ? (
            <div className="finance-folder-loading"><Loader2 size={17} className="animate-spin" /> Carregando suas abas financeiras...</div>
          ) : (
            <FinancialFolderTabs
              key={selectedBusinessId}
              folders={folders}
              transactions={periodTransactions}
              selected={selectedFolderId}
              onSelect={setSelectedFolderId}
              onCreate={createFolder}
              onEdit={renameFolder}
              onDelete={removeFolder}
              onRefreshTransactions={loadTransactions}
              disabled={Boolean(teamContext)}
            />
          )}
        </div>
      )}

      <div className="finance-toolbar">
        <div className="finance-period" aria-label="Período financeiro">
          <span className="finance-toolbar-icon"><CalendarDays size={18} /></span>
          <div className="finance-period-title">
            <span>PERÍODO SELECIONADO</span>
            <strong>{periodTitle}</strong>
          </div>
          <div className="finance-period-controls">
            <button type="button" onClick={goToPreviousMonth} aria-label="Mês anterior" title="Mês anterior"><ChevronLeft size={18}/></button>
            <button type="button" onClick={goToNextMonth} aria-label="Próximo mês" title="Próximo mês"><ChevronRight size={18}/></button>
          </div>
        </div>
        <div className="finance-toolbar-meta">
          <span><Layers3 size={14}/>{isConsolidatedView ? "Consolidado" : folders.find(f => f.id === selectedFolderId)?.name || "Sem aba selecionada"}</span>
          <span className="finance-toolbar-count">{visibleTransactions.length} lançamento(s)</span>
          <button type="button" className="finance-today-button" onClick={() => { setSelectedMonth(new Date().getMonth()); setSelectedYear(new Date().getFullYear()); }}>
            Mês atual
          </button>
        </div>
      </div>

      <Tabs value={activeFinanceTab} onValueChange={setActiveFinanceTab} className="finance-sections">
        <TabsList className="finance-navigation" aria-label="Áreas da gestão financeira">
          <TabsTrigger value="overview" className="finance-nav-item"><LayoutDashboard size={18}/><span>Dashboard</span></TabsTrigger>
          <TabsTrigger value="transactions" className="finance-nav-item"><Receipt size={18}/><span>Transações</span></TabsTrigger>
          <TabsTrigger value="accounts" className="finance-nav-item"><Wallet size={18}/><span>Contas bancárias</span></TabsTrigger>
          <TabsTrigger value="history" className="finance-nav-item"><History size={18}/><span>Histórico</span></TabsTrigger>
          <TabsTrigger value="reports" className="finance-nav-item"><FileBarChart size={18}/><span>Relatórios</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="finance-section-content">
          <FinancialOverview
            transactions={visibleTransactions}
            bankAccounts={bankAccounts}
            showBankBalance={isConsolidatedView || Boolean(teamContext)}
            onShowTransactions={() => setActiveFinanceTab("transactions")}
          />
        </TabsContent>

        <TabsContent value="transactions" className="finance-section-content">
          <section className="finance-ledger" aria-label="Lançamentos financeiros">
            <div className="finance-section-header">
              <div>
                <span className="finance-eyebrow">MOVIMENTAÇÕES</span>
                <h2>Suas transações</h2>
                <p>Cadastre, acompanhe e atualize receitas e despesas da aba selecionada.</p>
              </div>
              <div className="finance-ledger-stats">
                <span>{visibleTransactions.length} lançamentos</span>
                {pendingCount > 0 && <span className="finance-ledger-pending">{pendingCount} pendente(s)</span>}
              </div>
            </div>
            <TransactionManager
              transactions={visibleTransactions}
              bankAccounts={bankAccounts}
              folders={folders}
              defaultFolderId={folders.some(folder => folder.id === selectedFolderId) ? selectedFolderId : ""}
              folderStorageReady={!foldersError && !foldersLoading && !teamContext}
              onRefresh={async () => {
                await Promise.all([loadTransactions(), Promise.resolve(refetchBankAccounts())]);
              }}
              businessId={selectedBusinessId}
              entityType={entityType}
              periodKey={buildPeriodKey(selectedYear, selectedMonth)}
              periodLabel={periodTitle}
            />
          </section>
        </TabsContent>

        <TabsContent value="accounts" className="finance-section-content">
          <section className="finance-ledger">
            <div className="finance-section-header">
              <div>
                <span className="finance-eyebrow">CONTROLE BANCÁRIO</span>
                <h2>Contas bancárias</h2>
                <p>Gerencie suas contas. Seus saldos bancários são compartilhados entre as abas financeiras.</p>
              </div>
            </div>
            <BankAccountSection businessId={selectedBusinessId} bankAccounts={bankAccounts} onRefresh={refetchBankAccounts} />
          </section>
        </TabsContent>

        <TabsContent value="history" className="finance-section-content">
          <section className="finance-ledger">
            <div className="finance-section-header"><div>
              <span className="finance-eyebrow">REGISTROS</span>
              <h2>Histórico financeiro</h2>
              <p>Consulte os lançamentos do período e da aba selecionados.</p>
            </div></div>
            <TransactionHistory transactions={visibleTransactions} bankAccounts={bankAccounts} />
          </section>
        </TabsContent>

        <TabsContent value="reports" className="finance-section-content">
          <section className="finance-ledger">
            <div className="finance-section-header"><div>
              <span className="finance-eyebrow">ANÁLISE FINANCEIRA</span>
              <h2>Relatórios</h2>
              <p>Visualize os resultados financeiros da aba e do período selecionados.</p>
            </div></div>
            <ReportCenter transactions={visibleTransactions} />
          </section>
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