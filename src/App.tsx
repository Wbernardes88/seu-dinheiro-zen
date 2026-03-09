import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "./contexts/FinanceContext";
import { ThemeProvider } from "./components/ThemeProvider";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Lancamentos from "./pages/Lancamentos";
import Categorias from "./pages/Categorias";
import LimiteGastos from "./pages/LimiteGastos";
import Caixinha from "./pages/Caixinha";
import Desafio52Semanas from "./pages/Desafio52Semanas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <FinanceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lancamentos" element={<Lancamentos />} />
                <Route path="/categorias" element={<Categorias />} />
                <Route path="/limites" element={<LimiteGastos />} />
                <Route path="/caixinha" element={<Caixinha />} />
                <Route path="/desafio" element={<Desafio52Semanas />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FinanceProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
