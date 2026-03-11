import { useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, parseLocalDate } from "@/lib/data";
import { CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreditCardWidget = () => {
  const { creditCards, transactions } = useFinance();
  const navigate = useNavigate();
  const now = new Date();

  const cardData = useMemo(() => {
    return creditCards.map((card) => {
      // Calculate invoice period based on closing day
      const closingDay = card.closingDay;
      const currentDay = now.getDate();
      
      // If we're past closing day, current invoice period is: closingDay of this month to closingDay of next month
      // If we're before/on closing day, current invoice period is: closingDay of last month to closingDay of this month
      let periodStart: Date;
      let periodEnd: Date;
      
      if (currentDay > closingDay) {
        // Last closed invoice: from closingDay+1 of previous month to closingDay of this month
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, closingDay + 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), closingDay);
      } else {
        // Last closed invoice: from closingDay+1 of 2 months ago to closingDay of last month
        periodStart = new Date(now.getFullYear(), now.getMonth() - 2, closingDay + 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() - 1, closingDay);
      }

      // Since imported invoices use the invoice month as transaction date,
      // simply filter by current month/year
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const spent = transactions
        .filter((t) => {
          if (t.creditCardId !== card.id || t.type !== "expense") return false;
          const d = parseLocalDate(t.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const usagePct = card.creditLimit > 0 ? Math.min((spent / card.creditLimit) * 100, 100) : 0;
      const available = Math.max(card.creditLimit - spent, 0);

      return { ...card, spent, usagePct, available };
    });
  }, [creditCards, transactions, now.getMonth(), now.getFullYear(), now.getDate()]);

  if (creditCards.length === 0) return null;

  return (
    <div
      className="bg-card rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => navigate("/cartoes")}
    >
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Cartões de Crédito</h3>
      </div>

      <div className="space-y-3">
        {cardData.map((card) => (
          <div key={card.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: card.color }} />
                <span className="text-xs font-medium text-foreground">{card.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(card.spent)} / {formatCurrency(card.creditLimit)}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  card.usagePct >= 90 ? "bg-destructive" : card.usagePct >= 70 ? "bg-yellow-500" : "bg-primary"
                }`}
                style={{ width: `${card.usagePct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Fatura: {Math.round(card.usagePct)}%</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                Vence dia {card.dueDay}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditCardWidget;
