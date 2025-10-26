import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import LinkBioPage from "./pages/LinkBioPage";
import AgentCustomerAuth from "./pages/AgentCustomerAuth";
import AgentCustomerChat from "./pages/AgentCustomerChat";
import ChatbotCustomerAuth from "./pages/ChatbotCustomerAuth";
import ChatbotCustomerChat from "./pages/ChatbotCustomerChat";
import { CustomCursor } from "./components/CustomCursor";

const queryClient = new QueryClient();

const CursorGuard = () => {
  const location = useLocation();
  const [shouldShowCursor, setShouldShowCursor] = useState(false);
  
  useEffect(() => {
    const customCursorEnabled = localStorage.getItem("customCursorEnabled");
    const isEnabled = customCursorEnabled !== null ? customCursorEnabled === "true" : true;
    const isDashboard = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/admin");

    setShouldShowCursor(isEnabled && isDashboard);

    const sync = () => {
      const cursorEls = document.querySelectorAll('.custom-cursor, .custom-cursor-trail, .cursor-ripple');
      if (!isEnabled || !isDashboard) {
        document.body.classList.remove("custom-cursor-active");
        if (cursorEls.length) cursorEls.forEach(el => el.remove());
      }
    };

    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [location.pathname]);
  
  return shouldShowCursor ? <CustomCursor /> : null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CursorGuard />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
