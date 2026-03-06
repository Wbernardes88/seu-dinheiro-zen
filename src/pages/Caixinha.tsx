import { savingsGoals, formatCurrency } from "@/lib/data";
import { Progress } from "@/components/ui/progress";

const Caixinha = () => {
  const totalSaved = savingsGoals.reduce((s, g) => s + g.current, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Caixinha</h1>
        <p className="text-sm text-muted-foreground">Suas metas de economia · Total guardado: <span className="font-semibold text-primary">{formatCurrency(totalSaved)}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {savingsGoals.map((goal) => {
          const pct = Math.min((goal.current / goal.target) * 100, 100);
          return (
            <div key={goal.id} className="card-glass p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{goal.icon}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{goal.name}</h3>
                  <p className="text-xs text-muted-foreground">{formatCurrency(goal.current)} de {formatCurrency(goal.target)}</p>
                </div>
                <span className="text-xs font-bold text-primary">{pct.toFixed(0)}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Caixinha;
