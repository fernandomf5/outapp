import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useFavicon } from "./hooks/useFavicon";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BotBuilder from "./pages/BotBuilder";
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
import SitePage from "./pages/SitePage";
import MembersAreaView from "./pages/MembersAreaView";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const AppContent = () => {
  useFavicon(); // Aplica o favicon globalmente
  
  return (
    <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
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
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<Blog />} />
              <Route path="/calculadora" element={<CalculatorPage />} />
               <Route path="/quiz/:quizId" element={<QuizPage />} />
               <Route path="/site/:slug" element={<SitePage />} />
               <Route path="/members/:areaId" element={<MembersAreaView />} />
               <Route path="/briefing/:briefingId" element={<BriefingPublicPage />} />
               
              <Route path="/bot-builder" element={
                <ProtectedRoute>
                  <BotBuilder />
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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
