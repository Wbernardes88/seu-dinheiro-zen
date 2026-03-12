import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "./contexts/FinanceContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { SoundProvider } from "./contexts/SoundContext";
import AppLayout from "./components/AppLayout";
import { Loader2 } from "lucide-react";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Lancamentos = lazy(() => import("./pages/Lancamentos"));
const Categorias = lazy(() => import("./pages/Categorias"));
const LimiteGastos = lazy(() => import("./pages/LimiteGastos"));
const Caixinha = lazy(() => import("./pages/Caixinha"));
const Desafio52Semanas = lazy(() => import("./pages/Desafio52Semanas"));
const Cartoes = lazy(() => import("./pages/Cartoes"));
const Auth = lazy(() => import("./pages/Auth"));
const Documentacao = lazy(() => import("./pages/Documentacao"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CoupleManage = lazy(() => import("./pages/CoupleManage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, coupleLoading } = useAuth();

  if (loading || coupleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SoundProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <FinanceProvider>
                        <AppLayout />
                      </FinanceProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/lancamentos" element={<Lancamentos />} />
                  <Route path="/categorias" element={<Categorias />} />
                  <Route path="/limites" element={<LimiteGastos />} />
                  <Route path="/caixinha" element={<Caixinha />} />
                  <Route path="/desafio" element={<Desafio52Semanas />} />
                  <Route path="/cartoes" element={<Cartoes />} />
                  <Route path="/casal" element={<CoupleManage />} />
                  <Route path="/documentacao" element={<Documentacao />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </SoundProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
