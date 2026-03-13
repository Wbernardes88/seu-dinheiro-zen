import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";

const BudgetAlerts = () => {
  const { budgetLimits } = useFinance();

  const alerts = budgetLimits
    .filter((bl) => bl.budget > 0)
    .map((bl) => {
      const pct = (bl.spent / bl.budget) * 100;
      if (pct >= 100) return { ...bl, pct, level: "critical" as const };
      if (pct >= 90) return { ...bl, pct, level: "high" as const };
      if (pct >= 79) return { ...bl, pct, level: "warning" as const };
      return null;
    })
    .filter(Boolean) as Array<{ category: string; pct: number; level: "critical" | "high" | "warning" }>;

  if (alerts.length === 0) return null;

  const levelStyles = {
    critical: "bg-expense/10 border-expense/20 text-expense",
    high: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-500",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-500",
  };

  const levelMessages = {
    critical: (cat: string, pct: number) => `🚨 ${cat} ultrapassou o limite mensal! (${Math.round(pct)}%)`,
    high: (cat: string, pct: number) => `🔶 ${cat} está em ${Math.round(pct)}% — muito próximo do limite.`,
    warning: (cat: string, pct: number) => `⚠️ ${cat} já atingiu ${Math.round(pct)}% do limite.`,
  };

  return (
    <div className="space-y-2 animate-fade-in">
      {alerts.map((alert) => (
        <div
          key={alert.category}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${levelStyles[alert.level]}`}
        >
          {alert.level === "critical" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : alert.level === "high" ? (
            <AlertOctagon className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">
            {levelMessages[alert.level](alert.category, alert.pct)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BudgetAlerts;
