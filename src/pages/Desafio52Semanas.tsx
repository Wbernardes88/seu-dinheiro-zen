import { challenge52Weeks, formatCurrency } from "@/lib/data";
import { CheckCircle2, Circle } from "lucide-react";

const Desafio52Semanas = () => {
  const totalSaved = challenge52Weeks.filter((w) => w.completed).reduce((s, w) => s + w.amount, 0);
  const totalGoal = challenge52Weeks.reduce((s, w) => s + w.amount, 0);
  const pct = (totalSaved / totalGoal) * 100;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Desafio 52 Semanas</h1>
        <p className="text-sm text-muted-foreground">Guarde um pouquinho a cada semana e veja o resultado!</p>
      </div>

      {/* Progress summary */}
      <div className="card-glass p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso geral</span>
          <span className="text-sm font-bold text-primary">{pct.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3">
          <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Guardado: {formatCurrency(totalSaved)}</span>
          <span>Meta: {formatCurrency(totalGoal)}</span>
        </div>
      </div>

      {/* Weeks grid */}
      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Semanas</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {challenge52Weeks.map((w) => (
            <div
              key={w.week}
              className={`flex flex-col items-center p-2 rounded-lg text-xs transition-colors ${
                w.completed
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary/50 text-muted-foreground"
              }`}
            >
              {w.completed ? (
                <CheckCircle2 className="h-4 w-4 text-primary mb-0.5" />
              ) : (
                <Circle className="h-4 w-4 mb-0.5" />
              )}
              <span className="font-medium">S{w.week}</span>
              <span className="text-[10px]">{formatCurrency(w.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Desafio52Semanas;
