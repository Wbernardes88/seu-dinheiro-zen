import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, Tag, Gauge, PiggyBank, Target, Sun, Moon, LogOut, Users, BookOpen, Menu, Volume2, VolumeX, CreditCard } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useSounds } from "@/contexts/SoundContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Início" },
  { to: "/lancamentos", icon: Receipt, label: "Lançar" },
  { to: "/cartoes", icon: CreditCard, label: "Cartões" },
  { to: "/categorias", icon: Tag, label: "Categorias" },
  { to: "/limites", icon: Gauge, label: "Limites" },
  { to: "/caixinha", icon: PiggyBank, label: "Caixinha" },
  { to: "/desafio", icon: Target, label: "Desafio" },
];

const AppLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, nickname, coupleMembers } = useAuth();
  const { soundEnabled, toggleSound, play } = useSounds();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = nickname || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.slice(0, 1).toUpperCase();
  const isCoupleMode = coupleMembers.length >= 2;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-card p-4 gap-1 fixed h-full">
        <div className="flex items-center justify-between px-3 py-4 mb-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="FinançasJá" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-semibold text-lg text-foreground">FinançasJá</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => { toggleSound(); play("tap"); }}
              title={soundEnabled ? "Desativar sons" : "Ativar sons"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={toggleTheme}
              title={theme === "light" ? "Modo escuro" : "Modo claro"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isCoupleMode && (
          <div className="mx-3 mb-3 px-2 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium text-center">
            💑 Modo casal ativo
          </div>
        )}

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}

        {/* User info + logout at bottom */}
        <div className="mt-auto border-t pt-3 px-2 space-y-1">
          <div className="flex items-center gap-2 px-1 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-semibold">{initials}</span>
            </div>
            <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => navigate("/casal")}
          >
            <Users className="h-4 w-4 mr-2" />
            Convidar parceiro(a)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => navigate("/documentacao")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Documentação
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-6">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <img src={logo} alt="FinançasJá" className="h-7 w-7 rounded-lg object-contain" />
            <span className="font-semibold text-foreground">FinançasJá</span>
            {isCoupleMode && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">💑 Casal</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => { toggleSound(); play("tap"); }}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-4">
                <div className="flex items-center gap-2 mb-6 mt-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm font-semibold">{initials}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
                </div>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => { navigate("/casal"); setMobileMenuOpen(false); }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Convidar parceiro(a)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => { navigate("/documentacao"); setMobileMenuOpen(false); }}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Documentação
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
        <div className="flex justify-around items-center py-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
