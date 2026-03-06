import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Receipt, Tag, Gauge, PiggyBank, Target } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Início" },
  { to: "/lancamentos", icon: Receipt, label: "Lançar" },
  { to: "/categorias", icon: Tag, label: "Categorias" },
  { to: "/limites", icon: Gauge, label: "Limites" },
  { to: "/caixinha", icon: PiggyBank, label: "Caixinha" },
  { to: "/desafio", icon: Target, label: "Desafio" },
];

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-card p-4 gap-1 fixed h-full">
        <div className="flex items-center gap-2 px-3 py-4 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          <span className="font-semibold text-lg text-foreground">FinançaJá</span>
        </div>
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
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-6">
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
