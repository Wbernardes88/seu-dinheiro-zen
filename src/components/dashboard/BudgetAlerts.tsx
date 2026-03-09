import { AlertTriangle, AlertCircle } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";

const BudgetAlerts = () => {
  const { budgetLimits } = useFinance();

  const alerts = budgetLimits
    .filter((bl) => bl.budget > 0)
    .map((bl) => {
      const pct = (bl.spent / bl.budget) * 100;
      if (pct >= 100) return { ...bl, pct, level: "critical" as const };
      if (pct >= 80) return { ...bl, pct, level: "warning" as const };
      return null;
    })
    .filter(Boolean) as Array<{ category: string; pct: number; level: "critical" | "warning" }>;

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 animate-fade-in">
      {alerts.map((alert) => (
        <div
          key={alert.category}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
            alert.level === "critical"
              ? "bg-expense/10 border-expense/20 text-expense"
              : "bg-chart-3/10 border-chart-3/20 text-chart-3"
          }`}
        >
          {alert.level === "critical" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">
            {alert.level === "critical"
              ? `🚨 ${alert.category} ultrapassou o limite mensal! (${Math.round(alert.pct)}%)`
              : `⚠️ ${alert.category} já atingiu ${Math.round(alert.pct)}% do limite.`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BudgetAlerts;
