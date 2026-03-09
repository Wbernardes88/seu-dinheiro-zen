import { useMemo } from "react";
import { Calculator } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, parseLocalDate } from "@/lib/data";

interface Props {
  month: number;
  year: number;
}

const BalanceForecastCard = ({ month, year }: Props) => {
  const { transactions } = useFinance();

  const forecast = useMemo(() => {
    const now = new Date();
    const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

    const filtered = transactions.filter((t) => {
      const d = parseLocalDate(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    if (!isCurrentMonth) {
      return { predicted: totalIncome - totalExpense, daysLeft: 0, dailyAvg: 0, isProjection: false };
    }

    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysLeft = daysInMonth - dayOfMonth;
    const dailyAvgExpense = dayOfMonth > 0 ? totalExpense / dayOfMonth : 0;
    const projectedExpense = totalExpense + dailyAvgExpense * daysLeft;
    const predicted = totalIncome - projectedExpense;

    return { predicted, daysLeft, dailyAvg: dailyAvgExpense, isProjection: true };
  }, [transactions, month, year]);

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Previsão de saldo</h3>
          {forecast.isProjection && (
            <p className="text-[10px] text-muted-foreground">
              Faltam {forecast.daysLeft} dias · Média diária: {formatCurrency(forecast.dailyAvg)}
            </p>
          )}
        </div>
      </div>
      <p className={`text-2xl font-bold ${forecast.predicted >= 0 ? "text-income" : "text-expense"}`}>
        {formatCurrency(forecast.predicted)}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {forecast.isProjection
          ? "Estimativa baseada no ritmo de gastos atual"
          : "Saldo fechado do período selecionado"}
      </p>
    </div>
  );
};

export default BalanceForecastCard;
