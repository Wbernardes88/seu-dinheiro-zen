import { useMemo } from "react";
import { Calculator, AlertTriangle, TrendingDown } from "lucide-react";
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

    // Exclude credit card transactions — they don't affect cash balance until invoice is paid
    const cashFiltered = filtered.filter((t) => !t.creditCardId);
    const totalIncome = cashFiltered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = cashFiltered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    if (!isCurrentMonth) {
      return { predicted: totalIncome - totalExpense, daysLeft: 0, dailyAvg: 0, isProjection: false, dailyReduction: 0, fixedExpense: 0, variableExpense: 0 };
    }

    // Separate fixed (recurring) and variable expenses
    const fixedExpense = filtered.filter((t) => t.type === "expense" && t.isFixed).reduce((s, t) => s + t.amount, 0);
    const variableExpense = filtered.filter((t) => t.type === "expense" && !t.isFixed).reduce((s, t) => s + t.amount, 0);

    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysLeft = daysInMonth - dayOfMonth;

    // Only project variable expenses forward; fixed are already fully accounted
    const dailyAvgVariable = dayOfMonth > 0 ? Math.round((variableExpense / dayOfMonth) * 100) / 100 : 0;
    const projectedVariableExpense = variableExpense + dailyAvgVariable * daysLeft;
    const projectedExpense = fixedExpense + projectedVariableExpense;
    const predicted = Math.round((totalIncome - projectedExpense) * 100) / 100;

    // How much to reduce daily to end positive
    const dailyReduction = predicted < 0 && daysLeft > 0
      ? (Math.abs(predicted) / daysLeft)
      : 0;

    return { predicted, daysLeft, dailyAvg: dailyAvgVariable, isProjection: true, dailyReduction, fixedExpense, variableExpense };
  }, [transactions, month, year]);

  const isNegative = forecast.predicted < 0;

  return (
    <div className={`rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md animate-fade-in ${
      isNegative && forecast.isProjection ? "bg-expense/5 border-expense/20" : "bg-card"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
          isNegative && forecast.isProjection ? "bg-expense/10" : "bg-primary/10"
        }`}>
          {isNegative && forecast.isProjection
            ? <AlertTriangle className="h-4.5 w-4.5 text-expense" />
            : <Calculator className="h-4.5 w-4.5 text-primary" />
          }
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isNegative && forecast.isProjection ? "⚠️ Risco de saldo negativo" : "Previsão de saldo"}
          </h3>
          {forecast.isProjection && (
            <p className="text-[10px] text-muted-foreground">
              Faltam {forecast.daysLeft} dias · Média variável/dia: {formatCurrency(forecast.dailyAvg)}
            </p>
          )}
        </div>
      </div>

      <p className={`text-2xl font-bold ${isNegative ? "text-expense" : "text-income"}`}>
        {formatCurrency(forecast.predicted)}
      </p>

      {isNegative && forecast.isProjection ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            Se continuar gastando nesse ritmo, seu saldo pode ficar negativo até o fim do mês.
          </p>
          {forecast.dailyReduction > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-expense bg-expense/10 rounded-lg px-3 py-1.5">
              <TrendingDown className="h-3.5 w-3.5 shrink-0" />
              Reduza gastos em ~{formatCurrency(forecast.dailyReduction)}/dia para fechar positivo
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">
          {forecast.isProjection
            ? "Estimativa baseada no ritmo de gastos atual"
            : "Saldo fechado do período selecionado"}
        </p>
      )}
    </div>
  );
};

export default BalanceForecastCard;
