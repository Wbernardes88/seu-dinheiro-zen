import { useState, useMemo } from "react";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, parseLocalDate } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

import InsightCard from "@/components/dashboard/InsightCard";
import BudgetAlerts from "@/components/dashboard/BudgetAlerts";
import SavingsGoalsWidget from "@/components/dashboard/SavingsGoalsWidget";
import ChallengeWidget from "@/components/dashboard/ChallengeWidget";
import BalanceEvolutionChart from "@/components/dashboard/BalanceEvolutionChart";

const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const shortMonthLabels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const pieColors = [
  "hsl(162, 63%, 41%)", "hsl(200, 70%, 50%)", "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)", "hsl(120, 50%, 45%)",
  "hsl(340, 65%, 50%)", "hsl(50, 80%, 48%)",
];

const yearOptions = Array.from({ length: 5 }, (_, i) => 2024 + i);

const Dashboard = () => {
  const navigate = useNavigate();
  const { transactions, categories } = useFinance();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = parseLocalDate(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [transactions, month, year]);

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const monthlyBarData = useMemo(() => {
    const data: { name: string; entradas: number; saidas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m < 0) { m += 12; y--; }
      const inc = transactions.filter(t => { const d = parseLocalDate(t.date); return t.type === "income" && d.getMonth() === m && d.getFullYear() === y; }).reduce((s, t) => s + t.amount, 0);
      const exp = transactions.filter(t => { const d = parseLocalDate(t.date); return t.type === "expense" && d.getMonth() === m && d.getFullYear() === y; }).reduce((s, t) => s + t.amount, 0);
      data.push({ name: shortMonthLabels[m], entradas: inc, saidas: exp });
    }
    return data;
  }, [transactions, month, year]);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const categorySpending = expenseCategories
    .map((cat) => {
      const total = filtered.filter((t) => t.type === "expense" && t.category === cat.name).reduce((s, t) => s + t.amount, 0);
      return { name: cat.name, value: total, icon: cat.icon };
    })
    .filter((c) => c.value > 0);

  const totalCategorySpending = categorySpending.reduce((s, c) => s + c.value, 0);

  const getCategoryIcon = (categoryName: string) => {
    const cat = categories.find((c) => c.name === categoryName);
    return cat?.icon || (categoryName === "income" ? "↑" : "↓");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá! 👋</h1>
          <p className="text-sm text-muted-foreground">{months[now.getMonth()]} de {now.getFullYear()}</p>
        </div>
        <Button size="sm" onClick={() => navigate("/lancamentos")} className="gap-1.5 shadow-md hover:shadow-lg transition-shadow">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Lançamento</span>
        </Button>
      </div>

      {/* Month/Year selector */}
      <div className="flex items-center gap-3">
        <Select value={month.toString()} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-[140px] bg-card shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[100px] bg-card shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Budget Alerts */}
      <BudgetAlerts />

      {/* Insight */}
      <InsightCard month={month} year={year} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Wallet className="h-6 w-6 text-primary" />}
          label="Saldo"
          value={formatCurrency(balance)}
          colorClass="text-foreground"
          bgClass="bg-primary/10"
        />
        <SummaryCard
          icon={<TrendingUp className="h-6 w-6 text-income" />}
          label="Entradas"
          value={formatCurrency(totalIncome)}
          colorClass="text-income"
          bgClass="bg-income/10"
        />
        <SummaryCard
          icon={<TrendingDown className="h-6 w-6 text-expense" />}
          label="Saídas"
          value={formatCurrency(totalExpense)}
          colorClass="text-expense"
          bgClass="bg-expense/10"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="bg-card rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold text-foreground mb-4">Entradas vs Saídas</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyBarData} barGap={4}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--income))" radius={[6, 6, 0, 0]} animationDuration={800} />
              <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--expense))" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-income inline-block" /> Entradas
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-expense inline-block" /> Saídas
            </span>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-card rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold text-foreground mb-4">Gastos por Categoria</h3>
          {categorySpending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">Sem gastos neste período</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categorySpending}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    animationDuration={800}
                  >
                    {categorySpending.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [
                      `${formatCurrency(v)} (${totalCategorySpending > 0 ? Math.round((v / totalCategorySpending) * 100) : 0}%)`,
                      "",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
                {categorySpending.map((c, i) => (
                  <span key={c.name} className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full inline-block shrink-0" style={{ background: pieColors[i % pieColors.length] }} />
                    {c.icon} {c.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Balance evolution */}
      <BalanceEvolutionChart month={month} year={year} />

      {/* Goals & Challenge widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SavingsGoalsWidget />
        <ChallengeWidget />
      </div>

      {/* Recent transactions */}
      <div className="bg-card rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md">
        <h3 className="text-sm font-semibold text-foreground mb-4">Últimos lançamentos</h3>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum lançamento neste período</p>
        ) : (
          <div className="space-y-1">
            {filtered.slice(0, 5).map((t, index) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors hover:bg-muted/50"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg ${t.type === "income" ? "bg-income/10" : "bg-expense/10"}`}>
                    {getCategoryIcon(t.category)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · {t.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                  {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon, label, value, colorClass, bgClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
  bgClass: string;
}) => (
  <div className="bg-card rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 animate-fade-in">
    <div className="flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold ${colorClass} truncate`}>{value}</p>
      </div>
    </div>
  </div>
);

export default Dashboard;
