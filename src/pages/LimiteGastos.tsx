import { useState, useEffect, useRef } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useSounds } from "@/contexts/SoundContext";
import { formatCurrency } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const getAlertTier = (pct: number) => {
  if (pct >= 100) return "critical";
  if (pct >= 90) return "high";
  if (pct >= 79) return "warning";
  return "normal";
};

const alertColors = {
  normal: { text: "text-income", badge: "bg-income/10 text-income", border: "", progress: "" },
  warning: { text: "text-yellow-600 dark:text-yellow-500", badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500", border: "border-yellow-500/40", progress: "[&>div]:bg-yellow-500" },
  high: { text: "text-orange-600 dark:text-orange-500", badge: "bg-orange-500/10 text-orange-600 dark:text-orange-500", border: "border-orange-500/40", progress: "[&>div]:bg-orange-500" },
  critical: { text: "text-expense", badge: "bg-expense/10 text-expense", border: "border-expense/40", progress: "[&>div]:bg-expense" },
};

const LimiteGastos = () => {
  const { budgetLimits, setBudgetLimit, deleteBudgetLimit, categories } = useFinance();
  const { play } = useSounds();
  const toastShownRef = useRef<Set<string>>(new Set());

  // Automatic toasts when limits reach alert thresholds
  useEffect(() => {
    budgetLimits.forEach((bl) => {
      if (bl.budget <= 0) return;
      const pct = (bl.spent / bl.budget) * 100;
      const tier = getAlertTier(pct);
      if (tier === "normal") return;

      const key = `${bl.categoryId}-${tier}`;
      if (toastShownRef.current.has(key)) return;
      toastShownRef.current.add(key);

      const messages: Record<string, string> = {
        warning: `⚠️ Atenção: ${bl.category} já utilizou ${Math.round(pct)}% do limite definido.`,
        high: `🔶 Cuidado: ${bl.category} está em ${Math.round(pct)}% — muito próximo de atingir o limite.`,
        critical: `🚨 ${bl.category}: limite atingido ou ultrapassado (${Math.round(pct)}%). Revise seus gastos.`,
      };

      toast(messages[tier], {
        duration: tier === "critical" ? 10000 : 7000,
        closeButton: true,
      });
    });
  }, [budgetLimits]);
  const expCats = categories.filter((c) => c.type === "expense");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState("");
  const [editingCatName, setEditingCatName] = useState("");
  const [budgetValue, setBudgetValue] = useState("");

  const openNew = () => {
    setEditingCatId("");
    setEditingCatName("");
    setBudgetValue("");
    setDialogOpen(true);
  };

  const openEdit = (bl: { categoryId: string; category: string; budget: number }) => {
    setEditingCatId(bl.categoryId);
    setEditingCatName(bl.category);
    setBudgetValue(bl.budget.toString());
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingCatId || !budgetValue) {
      toast.error("Preencha todos os campos");
      return;
    }
    const cat = expCats.find((c) => c.id === editingCatId);
    setBudgetLimit(editingCatId, cat?.name || editingCatName, parseFloat(budgetValue));
    toast.success("Limite salvo!");
    play("success");
    setDialogOpen(false);
  };

  const catsWithoutLimit = expCats.filter((c) => !budgetLimits.find((bl) => bl.categoryId === c.id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Limite de Gastos</h1>
          <p className="text-sm text-muted-foreground">Controle seus gastos mensais por categoria</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5" disabled={catsWithoutLimit.length === 0}>
          <Plus className="h-4 w-4" />
          Limite
        </Button>
      </div>

      {budgetLimits.length === 0 ? (
        <div className="card-glass p-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhum limite definido ainda</p>
          <Button size="sm" className="mt-3" onClick={openNew}>Definir primeiro limite</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetLimits.map((item) => {
            const rawPct = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
            const clampedPct = Math.min(rawPct, 100);
            const remaining = item.budget - item.spent;
            const isOver = remaining < 0;
            const tier = getAlertTier(rawPct);
            const colors = alertColors[tier];
            return (
              <div key={item.categoryId} className={`card-glass p-4 space-y-2.5 group ${colors.border}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${tier === "critical" ? "text-expense" : tier === "high" ? "text-orange-600 dark:text-orange-500" : "text-foreground"}`}>{item.category}</h3>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${isOver ? "text-expense" : tier !== "normal" ? colors.text : "text-muted-foreground"}`}>
                      {isOver ? "Estourado!" : `Restam ${formatCurrency(remaining)}`}
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                      {Math.round(rawPct)}%
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-expense" onClick={() => { deleteBudgetLimit(item.categoryId); play("delete"); toast.success("Limite removido!"); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Progress value={clampedPct} className={`h-2 ${colors.progress}`} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Gasto: {formatCurrency(item.spent)}</span>
                  <span>Limite: {formatCurrency(item.budget)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCatName ? `Editar limite: ${editingCatName}` : "Novo Limite"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingCatName && (
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={editingCatId} onValueChange={(v) => { setEditingCatId(v); setEditingCatName(expCats.find((c) => c.id === v)?.name || ""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {catsWithoutLimit.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Limite mensal (R$)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={budgetValue} onChange={(e) => setBudgetValue(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LimiteGastos;
