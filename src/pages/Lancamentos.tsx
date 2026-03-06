import { useState, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, paymentMethods } from "@/lib/data";
import { toast } from "sonner";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const Lancamentos = () => {
  const { transactions, addTransaction, deleteTransaction, categories } = useFinance();

  // Form state
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("");

  // Filter state
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const formCategories = categories.filter((c) => c.type === type);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      if (d.getMonth() !== filterMonth || d.getFullYear() !== filterYear) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      return true;
    });
  }, [transactions, filterMonth, filterYear, filterType, filterCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description || !amount || !paymentMethod) {
      toast.error("Preencha todos os campos");
      return;
    }
    addTransaction({
      date,
      type,
      category,
      description,
      paymentMethod,
      amount: parseFloat(amount),
    });
    setDescription("");
    setAmount("");
    setCategory("");
    setPaymentMethod("");
    toast.success("Lançamento adicionado!");
  };

  const prevMonth = () => {
    if (filterMonth === 0) { setFilterMonth(11); setFilterYear((y) => y - 1); }
    else setFilterMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (filterMonth === 11) { setFilterMonth(0); setFilterYear((y) => y + 1); }
    else setFilterMonth((m) => m + 1);
  };

  const uniqueCategories = [...new Set(transactions.map((t) => t.category))];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Lançamentos</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-glass p-4 space-y-4">
        <div className="flex rounded-lg overflow-hidden border">
          <button type="button" onClick={() => { setType("income"); setCategory(""); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${type === "income" ? "bg-income text-income-foreground" : "bg-secondary text-muted-foreground"}`}>
            Entrada
          </button>
          <button type="button" onClick={() => { setType("expense"); setCategory(""); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${type === "expense" ? "bg-expense text-expense-foreground" : "bg-secondary text-muted-foreground"}`}>
            Saída
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {formCategories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Input placeholder="Ex: Supermercado" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Valor (R$)</Label>
          <Input type="number" step="0.01" min="0" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <Button type="submit" className="w-full">Adicionar lançamento</Button>
      </form>

      {/* Filters */}
      <div className="card-glass p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground">
            {months[filterMonth]} {filterYear}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | "income" | "expense")}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Entradas</SelectItem>
              <SelectItem value="expense">Saídas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {uniqueCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction list */}
      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {filteredTransactions.length} lançamento{filteredTransactions.length !== 1 ? "s" : ""}
        </h3>
        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum lançamento neste período</p>
        ) : (
          <div className="space-y-1 mt-3">
            {filteredTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm ${t.type === "income" ? "bg-income/10" : "bg-expense/10"}`}>
                    {t.type === "income" ? "↑" : "↓"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · {t.paymentMethod} · {t.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-expense" onClick={() => { deleteTransaction(t.id); toast.success("Removido!"); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lancamentos;
