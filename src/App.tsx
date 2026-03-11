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
import Dashboard from "./pages/Dashboard";
import Lancamentos from "./pages/Lancamentos";
import Categorias from "./pages/Categorias";
import LimiteGastos from "./pages/LimiteGastos";
import Caixinha from "./pages/Caixinha";
import Desafio52Semanas from "./pages/Desafio52Semanas";
import Auth from "./pages/Auth";
import Documentacao from "./pages/Documentacao";
import ResetPassword from "./pages/ResetPassword";
import CoupleManage from "./pages/CoupleManage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

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
                <Route path="/casal" element={<CoupleManage />} />
                <Route path="/documentacao" element={<Documentacao />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </SoundProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
