import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, parseLocalDate } from "@/lib/data";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";

const shortMonths = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

interface Props {
  month: number;
  year: number;
}

const BalanceEvolutionChart = ({ month, year }: Props) => {
  const { transactions } = useFinance();

  const data = useMemo(() => {
    const result: { name: string; saldo: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m < 0) { m += 12; y--; }
      const inc = transactions.filter((t) => { const d = parseLocalDate(t.date); return t.type === "income" && !t.creditCardId && d.getMonth() === m && d.getFullYear() === y; }).reduce((s, t) => s + t.amount, 0);
      const exp = transactions.filter((t) => { const d = parseLocalDate(t.date); return t.type === "expense" && !t.creditCardId && d.getMonth() === m && d.getFullYear() === y; }).reduce((s, t) => s + t.amount, 0);
      result.push({ name: shortMonths[m], saldo: inc - exp });
    }
    return result;
  }, [transactions, month, year]);

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Evolução do Saldo</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <YAxis hide />
          <Tooltip
            formatter={(v: number) => [formatCurrency(v), "Saldo"]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
            labelStyle={{ color: "hsl(var(--popover-foreground))" }}
            itemStyle={{ color: "hsl(var(--popover-foreground))" }}
          />
          <Area
            type="monotone"
            dataKey="saldo"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#saldoGrad)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceEvolutionChart;
