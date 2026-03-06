import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTransactions, incomeCategories, expenseCategories, paymentMethods, formatCurrency, type Transaction } from "@/lib/data";
import { toast } from "sonner";

const Lancamentos = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("");

  const categories = type === "income" ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description || !amount || !paymentMethod) {
      toast.error("Preencha todos os campos");
      return;
    }
    const newTx: Transaction = {
      id: Date.now().toString(),
      date,
      type,
      category,
      description,
      paymentMethod,
      amount: parseFloat(amount),
    };
    setTransactions([newTx, ...transactions]);
    setDescription("");
    setAmount("");
    setCategory("");
    setPaymentMethod("");
    toast.success("Lançamento adicionado!");
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Lançamentos</h1>

      <form onSubmit={handleSubmit} className="card-glass p-4 space-y-4">
        {/* Type toggle */}
        <div className="flex rounded-lg overflow-hidden border">
          <button
            type="button"
            onClick={() => { setType("income"); setCategory(""); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              type === "income"
                ? "bg-income text-income-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => { setType("expense"); setCategory(""); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              type === "expense"
                ? "bg-expense text-expense-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            Saída
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs">Data</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs">Descrição</Label>
            <Input id="desc" placeholder="Ex: Supermercado" value={description} onChange={(e) => setDescription(e.target.value)} />
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
          <Label htmlFor="amount" className="text-xs">Valor (R$)</Label>
          <Input id="amount" type="number" step="0.01" min="0" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <Button type="submit" className="w-full">Adicionar lançamento</Button>
      </form>

      {/* Transaction list */}
      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Lançamentos recentes</h3>
        <div className="space-y-2.5">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm ${
                  t.type === "income" ? "bg-income/10" : "bg-expense/10"
                }`}>
                  {t.type === "income" ? "↑" : "↓"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{t.category} · {t.paymentMethod} · {t.date}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Lancamentos;
