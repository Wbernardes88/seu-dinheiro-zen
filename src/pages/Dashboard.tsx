import { useState, useMemo } from "react";
import { Plus, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const pieColors = [
  "hsl(162, 63%, 41%)", "hsl(200, 70%, 50%)", "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)", "hsl(120, 50%, 45%)",
  "hsl(340, 65%, 50%)", "hsl(50, 80%, 48%)",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { transactions, categories } = useFinance();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [transactions, month, year]);

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const barData = [
    { name: "Entradas", value: totalIncome },
    { name: "Saídas", value: totalExpense },
  ];

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const categorySpending = expenseCategories
    .map((cat) => {
      const total = filtered.filter((t) => t.type === "expense" && t.category === cat.name).reduce((s, t) => s + t.amount, 0);
      return { name: cat.name, value: total, icon: cat.icon };
    })
    .filter((c) => c.value > 0);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Button size="sm" onClick={() => navigate("/lancamentos")} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Lançamento</span>
        </Button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
          {months[month]} {year}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card-glass p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Saldo</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-income/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-income" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Entradas</p>
              <p className="text-xl font-bold text-income">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-expense/10 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-expense" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Saídas</p>
              <p className="text-xl font-bold text-expense">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-glass p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Entradas vs Saídas</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                <Cell fill="hsl(152, 60%, 42%)" />
                <Cell fill="hsl(0, 72%, 51%)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card-glass p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Gastos por Categoria</h3>
          {categorySpending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Sem gastos neste período</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categorySpending} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {categorySpending.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {categorySpending.map((c, i) => (
                  <span key={c.name} className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ background: pieColors[i % pieColors.length] }} />
                    {c.icon} {c.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Últimos lançamentos</h3>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum lançamento neste período</p>
        ) : (
          <div className="space-y-2.5">
            {filtered.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm ${t.type === "income" ? "bg-income/10" : "bg-expense/10"}`}>
                    {t.type === "income" ? "↑" : "↓"}
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

export default Dashboard;
