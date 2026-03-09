import React from "react";
import { Trophy } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/data";
import { Progress } from "@/components/ui/progress";

const ChallengeWidget = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { challenge52Weeks } = useFinance();

  const totalTarget = challenge52Weeks.reduce((s, w) => s + w.amount, 0);
  const totalSaved = challenge52Weeks.filter((w) => w.completed).reduce((s, w) => s + w.amount, 0);
  const pct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const completedWeeks = challenge52Weeks.filter((w) => w.completed).length;

  return (
    <div ref={ref} className="bg-card rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-chart-3" />
        <h3 className="text-sm font-semibold text-foreground">Desafio 52 Semanas</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Guardado</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-sm font-medium text-muted-foreground">{formatCurrency(totalTarget)}</p>
          </div>
        </div>
        <Progress value={pct} className="h-2.5" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedWeeks}/52 semanas</span>
          <span className="font-semibold text-primary">{pct}%</span>
        </div>
      </div>
    </div>
  );
};

export default ChallengeWidget;
