import { useMemo } from "react";
import { Activity } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import { parseLocalDate } from "@/lib/data";

interface Props {
  month: number;
  year: number;
}

const levels = [
  { min: 80, label: "Excelente", color: "text-income", bg: "bg-income", ring: "ring-income/30" },
  { min: 60, label: "Boa", color: "text-primary", bg: "bg-primary", ring: "ring-primary/30" },
  { min: 40, label: "Atenção", color: "text-yellow-500", bg: "bg-yellow-500", ring: "ring-yellow-500/30" },
  { min: 0, label: "Crítica", color: "text-expense", bg: "bg-expense", ring: "ring-expense/30" },
];

const FinancialHealthCard = ({ month, year }: Props) => {
  const { transactions, budgetLimits, savingsGoals } = useFinance();

  const { score, level } = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const d = parseLocalDate(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // Factor 1: Balance ratio (0-30 pts)
    let balanceScore = 0;
    if (income > 0) {
      const ratio = (income - expense) / income;
      balanceScore = Math.max(0, Math.min(30, ratio * 60));
    }

    // Factor 2: Budget adherence (0-30 pts)
    let budgetScore = 30;
    if (budgetLimits.length > 0) {
      const overBudget = budgetLimits.filter((b) => b.budget > 0 && b.spent > b.budget).length;
      const nearBudget = budgetLimits.filter((b) => b.budget > 0 && b.spent >= b.budget * 0.8 && b.spent <= b.budget).length;
      budgetScore = Math.max(0, 30 - overBudget * 10 - nearBudget * 3);
    }

    // Factor 3: Savings goals progress (0-20 pts)
    let savingsScore = 10;
    if (savingsGoals.length > 0) {
      const avgProgress = savingsGoals.reduce((s, g) => s + Math.min(1, g.current / g.target), 0) / savingsGoals.length;
      savingsScore = avgProgress * 20;
    }

    // Factor 4: Has income (0-20 pts)
    const incomeScore = income > 0 ? 20 : 0;

    const total = Math.round(Math.min(100, balanceScore + budgetScore + savingsScore + incomeScore));
    const lvl = levels.find((l) => total >= l.min) || levels[levels.length - 1];

    return { score: total, level: lvl };
  }, [transactions, budgetLimits, savingsGoals, month, year]);

  const circumference = 2 * Math.PI * 40;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Saúde financeira</h3>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - strokeDash}
              className={`${level.color} transition-all duration-1000`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${level.color}`}>{score}</span>
          </div>
        </div>
        <div>
          <span className={`text-lg font-bold ${level.color}`}>{level.label}</span>
          <p className="text-xs text-muted-foreground mt-1">
            Score baseado em saldo, limites, metas e receitas do mês.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthCard;
