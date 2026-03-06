import { budgetLimits, formatCurrency } from "@/lib/data";
import { Progress } from "@/components/ui/progress";

const LimiteGastos = () => {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Limite de Gastos</h1>
      <p className="text-sm text-muted-foreground">Acompanhe seus gastos por categoria neste mês.</p>

      <div className="space-y-3">
        {budgetLimits.map((item) => {
          const pct = Math.min((item.spent / item.budget) * 100, 100);
          const remaining = item.budget - item.spent;
          const isOver = remaining < 0;
          return (
            <div key={item.categoryId} className="card-glass p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{item.category}</h3>
                <span className={`text-xs font-medium ${isOver ? "text-expense" : "text-muted-foreground"}`}>
                  {isOver ? "Estourado!" : `Restam ${formatCurrency(remaining)}`}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Gasto: {formatCurrency(item.spent)}</span>
                <span>Limite: {formatCurrency(item.budget)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LimiteGastos;
