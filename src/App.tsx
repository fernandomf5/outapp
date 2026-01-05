import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { TeamMemberProvider } from "./contexts/TeamMemberContext";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useFavicon } from "./hooks/useFavicon";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

import AIAgentBuilder from "./pages/AIAgentBuilder";
import FunnelBuilder from "./pages/FunnelBuilder";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import EmailConfirmed from "./pages/EmailConfirmed";
import PublicChat from "./pages/PublicChat";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ShortLinkRedirect from "./pages/ShortLinkRedirect";
import ClonedPage from "./pages/ClonedPage";
import ClonedOrCustomPage from "./pages/ClonedOrCustomPage";
import BuilderPagePublic from "./pages/BuilderPagePublic";
import LinkBioPage from "./pages/LinkBioPage";
import AgentCustomerAuth from "./pages/AgentCustomerAuth";
import AgentCustomerChat from "./pages/AgentCustomerChat";
import ChatbotCustomerAuth from "./pages/ChatbotCustomerAuth";
import ChatbotCustomerChat from "./pages/ChatbotCustomerChat";
import Blog from "./pages/Blog";
import CalculatorPage from "./pages/CalculatorPage";
import QuizPage from "./pages/QuizPage";
import BriefingPublicPage from "./pages/BriefingPublicPage";
import CustomPage from "./pages/CustomPage";
import MembersAreaView from "./pages/MembersAreaView";
import MembersAreaAuth from "./pages/MembersAreaAuth";
import MembersAreaPublic from "./pages/MembersAreaPublic";
import ChatbotResetPassword from "./pages/ChatbotResetPassword";
import AgentResetPassword from "./pages/AgentResetPassword";
import MindMapPresentation from "./pages/MindMapPresentation";
import MindMapFullEditor from "./pages/MindMapFullEditor";
import ProposalPublicView from "./pages/ProposalPublicView";
import AprovaJobClient from "./pages/AprovaJobClient";
import PortfolioPublicPage from "./pages/PortfolioPublicPage";
import InstallApp from "./pages/InstallApp";
import TeamMemberAuth from "./pages/TeamMemberAuth";
import TeamMemberDashboard from "./pages/TeamMemberDashboard";
import AcceptInvitation from "./pages/AcceptInvitation";
import PageEditor from "./pages/PageEditor";
import PageBuilder from "./pages/PageBuilder";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CookieNotice } from "@/components/CookieNotice";

const queryClient = new QueryClient();

const AppContent = () => {
  useFavicon(); // Aplica o favicon globalmente
  
  return (
    <BrowserRouter>
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
              <Route path="/agent-auth/:agentId" element={<AgentCustomerAuth />} />
              <Route path="/agent-chat/:agentId" element={<AgentCustomerChat />} />
              <Route path="/chatbot-auth/:chatbotId" element={<ChatbotCustomerAuth />} />
              <Route path="/chatbot-chat/:chatbotId" element={<ChatbotCustomerChat />} />
              <Route path="/chatbot-reset-password/:token" element={<ChatbotResetPassword />} />
              <Route path="/agent-reset-password/:token" element={<AgentResetPassword />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<Blog />} />
              <Route path="/calculadora" element={<CalculatorPage />} />
               <Route path="/quiz/:quizId" element={<QuizPage />} />
          <Route path="/members-area/:areaId" element={<MembersAreaView />} />
          <Route path="/members-area-auth" element={<MembersAreaAuth />} />
          <Route path="/members-area-auth/:areaId" element={<MembersAreaAuth />} />
          <Route path="/members/:slug" element={<MembersAreaPublic />} />
          <Route path="/briefing/:briefingId" element={<BriefingPublicPage />} />
          <Route path="/mindmap/:id" element={<MindMapPresentation />} />
          <Route path="/mindmap-editor/:id" element={
            <ProtectedRoute>
              <MindMapFullEditor />
            </ProtectedRoute>
          } />
          <Route path="/proposta/:slug" element={<ProposalPublicView />} />
          <Route path="/aprova-job/:token" element={<AprovaJobClient />} />
          <Route path="/portfolio/:portfolioId" element={<PortfolioPublicPage />} />
              <Route path="/portfolio/:portfolioId/:slug" element={<PortfolioPublicPage />} />
              <Route path="/p/:slug" element={<BuilderPagePublic />} />
              <Route path="/instalar" element={<InstallApp />} />
              <Route path="/aceitar-convite" element={<AcceptInvitation />} />
              <Route path="/page-editor/:pageId" element={
                <ProtectedRoute>
                  <PageEditor />
                </ProtectedRoute>
              } />
              <Route path="/page-builder" element={
                <ProtectedRoute>
                  <PageBuilder />
                </ProtectedRoute>
              } />
              <Route path="/page-builder/:pageId" element={
                <ProtectedRoute>
                  <PageBuilder />
                </ProtectedRoute>
              } />
               
              <Route path="/ai-agent" element={
                <ProtectedRoute>
                  <AIAgentBuilder />
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
              <CookieNotice />
            </TooltipProvider>
          </TeamMemberProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
