import { useMemo } from "react";
import { CircleDollarSign, AlertCircle } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, parseLocalDate } from "@/lib/data";

interface Props {
  month: number;
  year: number;
}

const DailyBudgetCard = ({ month, year }: Props) => {
  const { transactions } = useFinance();

  const data = useMemo(() => {
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
    const balance = totalIncome - totalExpense;

    if (!isCurrentMonth) {
      return { daily: 0, isCurrentMonth: false, exceeded: false, todaySpent: 0 };
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const daily = daysLeft > 0 ? balance / daysLeft : balance;

    // Today's spending (using local date to avoid UTC shift)
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todaySpent = filtered
      .filter((t) => t.type === "expense" && t.date === todayStr)
      .reduce((s, t) => s + t.amount, 0);

    return { daily: Math.max(0, daily), isCurrentMonth: true, exceeded: todaySpent > daily && daily > 0, todaySpent };
  }, [transactions, month, year]);

  if (!data.isCurrentMonth) return null;

  return (
    <div className={`bg-card rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md animate-fade-in ${
      data.exceeded ? "border-expense/30" : ""
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
          data.exceeded ? "bg-expense/10" : "bg-primary/10"
        }`}>
          {data.exceeded
            ? <AlertCircle className="h-4.5 w-4.5 text-expense" />
            : <CircleDollarSign className="h-4.5 w-4.5 text-primary" />
          }
        </div>
        <h3 className="text-sm font-semibold text-foreground">Disponível para gastar hoje</h3>
      </div>

      <p className={`text-2xl font-bold ${data.daily <= 0 ? "text-expense" : "text-income"}`}>
        {formatCurrency(data.daily)}
      </p>

      <p className="text-xs text-muted-foreground mt-1">
        Baseado no saldo atual e nos dias restantes do mês
      </p>

      {data.exceeded && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-expense bg-expense/10 rounded-lg px-3 py-1.5 mt-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Você já gastou {formatCurrency(data.todaySpent)} hoje — acima do recomendado
        </div>
      )}
    </div>
  );
};

export default DailyBudgetCard;
