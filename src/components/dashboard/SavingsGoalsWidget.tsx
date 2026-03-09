import React from "react";
import { Target } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/data";
import { Progress } from "@/components/ui/progress";

const SavingsGoalsWidget = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { savingsGoals } = useFinance();

  if (savingsGoals.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Metas (Caixinha)</h3>
      </div>
      <div className="space-y-4">
        {savingsGoals.slice(0, 3).map((goal) => {
          const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  {goal.icon} {goal.name}
                </span>
                <span className="text-xs text-muted-foreground">{Math.round(pct)}%</span>
              </div>
              <Progress value={pct} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavingsGoalsWidget;
