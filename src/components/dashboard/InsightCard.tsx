import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, parseLocalDate } from "@/lib/data";

interface InsightCardProps {
  month: number;
  year: number;
}

const InsightCard = ({ month, year }: InsightCardProps) => {
  const { transactions, categories } = useFinance();

  const insight = useMemo(() => {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) { prevMonth = 11; prevYear--; }

    const curr = transactions.filter((t) => {
      const d = parseLocalDate(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const prev = transactions.filter((t) => {
      const d = parseLocalDate(t.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const currIncome = curr.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const prevIncome = prev.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const currExpense = curr.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const prevExpense = prev.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // Check category-level changes
    const expenseCats = categories.filter((c) => c.type === "expense");
    let biggestChange = { cat: "", pct: 0, icon: "", direction: "" };

    for (const cat of expenseCats) {
      const currCat = curr.filter((t) => t.type === "expense" && t.category === cat.name).reduce((s, t) => s + t.amount, 0);
      const prevCat = prev.filter((t) => t.type === "expense" && t.category === cat.name).reduce((s, t) => s + t.amount, 0);
      if (prevCat > 0 && currCat > 0) {
        const pct = ((currCat - prevCat) / prevCat) * 100;
        if (Math.abs(pct) > Math.abs(biggestChange.pct)) {
          biggestChange = { cat: cat.name, pct, icon: cat.icon, direction: pct > 0 ? "aumentaram" : "diminuíram" };
        }
      }
    }

    if (Math.abs(biggestChange.pct) > 5) {
      return {
        emoji: biggestChange.pct > 0 ? "📈" : "📉",
        text: `Gastos com ${biggestChange.icon} ${biggestChange.cat} ${biggestChange.direction} ${Math.abs(Math.round(biggestChange.pct))}% em relação ao mês passado.`,
        type: biggestChange.pct > 0 ? "warning" : "positive",
      };
    }

    if (prevIncome > 0 && currIncome > prevIncome) {
      const pct = Math.round(((currIncome - prevIncome) / prevIncome) * 100);
      return { emoji: "🚀", text: `Entradas aumentaram ${pct}% comparado ao mês anterior. Continue assim!`, type: "positive" };
    }

    if (prevExpense > 0 && currExpense < prevExpense) {
      const saved = formatCurrency(prevExpense - currExpense);
      return { emoji: "🎉", text: `Você economizou ${saved} em relação ao mês passado. Ótimo trabalho!`, type: "positive" };
    }

    if (currExpense === 0 && currIncome === 0) {
      return { emoji: "📊", text: "Nenhum lançamento neste mês ainda. Comece a registrar!", type: "neutral" };
    }

    return { emoji: "💡", text: `Saldo do mês: ${formatCurrency(currIncome - currExpense)}. Mantenha o controle!`, type: "neutral" };
  }, [transactions, categories, month, year]);

  const bgClass = insight.type === "positive" ? "bg-income/10 border-income/20" : insight.type === "warning" ? "bg-chart-3/10 border-chart-3/20" : "bg-primary/10 border-primary/20";

  return (
    <div className={`rounded-2xl border p-4 ${bgClass} animate-fade-in`}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-card flex items-center justify-center text-lg shrink-0 shadow-sm">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Insight do mês</p>
          <p className="text-sm text-foreground leading-relaxed">
            {insight.emoji} {insight.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
