import { Toaster } from "@/components/ui/toaster";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { TeamMemberProvider } from "./contexts/TeamMemberContext";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useFavicon } from "./hooks/useFavicon";
import { useDynamicTheme } from "./hooks/useDynamicTheme";
import Index from "./pages/Index";

// Todas as demais páginas são carregadas sob demanda (code splitting por rota),
// para que o primeiro acesso não precise baixar o aplicativo inteiro.
const Auth = lazy(() => import("./pages/Auth"));
const CheckoutEditorPage = lazy(() => import("./pages/CheckoutEditorPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FullOrganizationTable = lazy(() => import("./pages/FullOrganizationTable"));
const AIAgentBuilder = lazy(() => import("./pages/AIAgentBuilder"));
const FunnelBuilder = lazy(() => import("./pages/FunnelBuilder"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EmailConfirmed = lazy(() => import("./pages/EmailConfirmed"));
const PublicChat = lazy(() => import("./pages/PublicChat"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ShortLinkRedirect = lazy(() => import("./pages/ShortLinkRedirect"));
const ClonedPage = lazy(() => import("./pages/ClonedPage"));
const ClonedOrCustomPage = lazy(() => import("./pages/ClonedOrCustomPage"));
const LinkBioPage = lazy(() => import("./pages/LinkBioPage"));
const AgentCustomerAuth = lazy(() => import("./pages/AgentCustomerAuth"));
const AgentCustomerChat = lazy(() => import("./pages/AgentCustomerChat"));
const ChatbotCustomerAuth = lazy(() => import("./pages/ChatbotCustomerAuth"));
const ChatbotCustomerChat = lazy(() => import("./pages/ChatbotCustomerChat"));
const CalculatorPage = lazy(() => import("./pages/CalculatorPage"));
const QuickNotesPage = lazy(() => import("./pages/QuickNotesPage"));
const BriefingPublicPage = lazy(() => import("./pages/BriefingPublicPage"));
const MembersAreaPublic = lazy(() => import("./pages/MembersAreaPublic"));
const ChatbotResetPassword = lazy(() => import("./pages/ChatbotResetPassword"));
const AgentResetPassword = lazy(() => import("./pages/AgentResetPassword"));
const MindMapPresentation = lazy(() => import("./pages/MindMapPresentation"));
const MindMapFullEditor = lazy(() => import("./pages/MindMapFullEditor"));
const ProposalPublicView = lazy(() => import("./pages/ProposalPublicView"));
const ContractPublicView = lazy(() => import("./pages/ContractPublicView"));
const AprovaJobClient = lazy(() => import("./pages/AprovaJobClient"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const CampaignPublicView = lazy(() => import("./pages/CampaignPublicView"));
const ClientCampaignsPublicView = lazy(() => import("./pages/ClientCampaignsPublicView"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CheckoutThankYouPage = lazy(() => import("./pages/CheckoutThankYouPage"));
const PaymentThankYou = lazy(() => import("./pages/PaymentThankYou"));
const TeamMemberAuth = lazy(() => import("./pages/TeamMemberAuth"));
const TeamMemberDashboard = lazy(() => import("./pages/TeamMemberDashboard"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const PageEditor = lazy(() => import("./pages/PageEditor"));
const InvoicePublicPage = lazy(() => import("./pages/InvoicePublicPage"));

import ErrorBoundary from "@/components/ErrorBoundary";
import { RoutePersistence } from "@/components/RoutePersistence";
import { HashScroll } from "@/components/HashScroll";

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);

const AppContent = () => {
  useFavicon(); // Aplica o favicon globalmente
  useDynamicTheme();

  return (
    <BrowserRouter>
            <RoutePersistence />
            <HashScroll />
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/team-login" element={<TeamMemberAuth />} />
              <Route path="/team-dashboard" element={
                <ProtectedRoute>
                  <TeamMemberDashboard />
                </ProtectedRoute>
              } />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/email-confirmed" element={<EmailConfirmed />} />
              <Route path="/s/:shortCode" element={<ShortLinkRedirect />} />
              <Route path="/page/:slug" element={<ClonedPage />} />
              <Route path="/page1/:slug" element={<ClonedPage />} />
              <Route path="/page2/:slug" element={<ClonedPage />} />
              <Route path="/page3/:slug" element={<ClonedPage />} />
              <Route path="/page4/:slug" element={<ClonedPage />} />
              <Route path="/page5/:slug" element={<ClonedPage />} />
              <Route path="/bio/:username" element={<LinkBioPage />} />
              <Route path="/l/:slug" element={<LinkBioPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/chat/:botId" element={<PublicChat />} />
              <Route path="/chat/:botId/:slug" element={<PublicChat />} />
              <Route path="/chat-online/:agentId" element={<AgentCustomerAuth />} />
              <Route path="/chat-online/:agentId/atendimento" element={<AgentCustomerChat />} />
              <Route path="/chatbot-auth/:chatbotId" element={<ChatbotCustomerAuth />} />
              <Route path="/chatbot-chat/:chatbotId" element={<ChatbotCustomerChat />} />
              <Route path="/chatbot-reset-password/:token" element={<ChatbotResetPassword />} />
              <Route path="/agent-reset-password/:token" element={<AgentResetPassword />} />
              <Route path="/calculadora" element={<CalculatorPage />} />
               <Route path="/anotacoes" element={<ProtectedRoute><QuickNotesPage /></ProtectedRoute>} />
          <Route path="/members/:slug" element={<MembersAreaPublic />} />
          <Route path="/briefing/:briefingId" element={<BriefingPublicPage />} />
          <Route path="/mindmap/:id" element={<MindMapPresentation />} />

          <Route path="/mindmap-editor/:id" element={
            <ProtectedRoute>
              <MindMapFullEditor />
            </ProtectedRoute>
          } />
          <Route path="/proposta/:slug" element={<ProposalPublicView />} />
          <Route path="/contrato/:slug" element={<ContractPublicView />} />
          <Route path="/aprova-job/:token" element={<AprovaJobClient />} />
              <Route path="/instalar" element={<InstallApp />} />
              <Route path="/campanha/:campaignId" element={<CampaignPublicView />} />
              <Route path="/cliente-campanhas/:clientId" element={<ClientCampaignsPublicView />} />
              <Route path="/checkout/:checkoutId" element={<CheckoutPage />} />
              <Route path="/checkout/:checkoutId/:slug" element={<CheckoutPage />} />
              <Route path="/checkout/:checkoutId/obrigado" element={<CheckoutThankYouPage />} />
              <Route path="/checkout/:checkoutId/:slug/obrigado" element={<CheckoutThankYouPage />} />
              <Route path="/obrigado" element={<PaymentThankYou />} />
              <Route path="/aceitar-convite" element={<AcceptInvitation />} />

              <Route path="/fatura/:token" element={<InvoicePublicPage />} />

              <Route path="/checkout-editor/:id" element={
                <ProtectedRoute>
                  <CheckoutEditorPage />
                </ProtectedRoute>
              } />
              <Route path="/page-editor/:pageId" element={
                <ProtectedRoute>
                  <PageEditor />
                </ProtectedRoute>
              } />

              <Route path="/chat-online" element={
                <ProtectedRoute>
                  <AIAgentBuilder />
                </ProtectedRoute>
              } />
              <Route path="/tabela-completa/:tableId" element={
                <ProtectedRoute>
                  <FullOrganizationTable />
                </ProtectedRoute>
              } />
              <Route path="/funnel-builder" element={
                <ProtectedRoute>
                  <FunnelBuilder />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
               <Route path="/:slug" element={<ClonedOrCustomPage />} />
               {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
               <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <TeamMemberProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>

            </TooltipProvider>
          </TeamMemberProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
