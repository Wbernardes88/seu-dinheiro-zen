import { useState, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, parseLocalDate } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, TrendingUp, Calendar, Target, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { SavingsGoal, Transaction } from "@/lib/data";

function getGoalCalculations(goal: SavingsGoal) {
  const remaining = Math.max(goal.target - goal.current, 0);
  const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;

  let monthsLeft: number | null = null;
  let weeksLeft: number | null = null;
  let perMonth: number | null = null;
  let perWeek: number | null = null;
  let forecastDate: string | null = null;

  if (goal.deadline) {
    const now = new Date();
    const deadline = new Date(goal.deadline + "T00:00:00");
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
    monthsLeft = Math.max(Math.ceil(diffDays / 30), 0);
    weeksLeft = Math.max(Math.ceil(diffDays / 7), 0);

    if (monthsLeft > 0 && remaining > 0) {
      perMonth = Math.round((remaining / monthsLeft) * 100) / 100;
    }
    if (weeksLeft > 0 && remaining > 0) {
      perWeek = Math.round((remaining / weeksLeft) * 100) / 100;
    }
  }

  // Forecast: estimate based on average monthly contribution (current / months elapsed since creation)
  if (goal.current > 0 && remaining > 0) {
    // Simple forecast: if no deadline, show estimated months to completion
    // assuming same pace continues
    const createdAt = (goal as any).createdAt;
    // Use a simpler approach: months needed at current pace
    if (goal.deadline) {
      forecastDate = goal.deadline;
    }
  }

  return { remaining, pct, monthsLeft, weeksLeft, perMonth, perWeek, forecastDate };
}

function getSmartMessages(goal: SavingsGoal): { text: string; color: string }[] {
  const { remaining, pct, monthsLeft, perMonth } = getGoalCalculations(goal);
  const messages: { text: string; color: string }[] = [];

  if (pct >= 100) {
    messages.push({ text: "🎉 Parabéns! Meta alcançada!", color: "text-green-600 dark:text-green-400" });
    return messages;
  }

  // Progress-based
  if (pct >= 75) {
    messages.push({ text: "🔥 Quase lá! Você já passou de 75% da meta!", color: "text-green-600 dark:text-green-400" });
  } else if (pct >= 50) {
    messages.push({ text: "💪 Metade do caminho! Continue firme!", color: "text-primary" });
  } else if (pct > 0) {
    messages.push({ text: "🚀 Bom começo! Mantenha a consistência.", color: "text-muted-foreground" });
  } else {
    messages.push({ text: "✨ Comece hoje! Cada real conta.", color: "text-muted-foreground" });
  }

  // Pace-based
  if (monthsLeft !== null && monthsLeft > 0 && perMonth !== null && perMonth > 0) {
    if (monthsLeft <= 3) {
      messages.push({ text: `⏰ Reta final! Faltam apenas ${monthsLeft} ${monthsLeft === 1 ? "mês" : "meses"}.`, color: "text-amber-600 dark:text-amber-400" });
    } else {
      messages.push({ text: "📊 Você está no ritmo para atingir a meta.", color: "text-muted-foreground" });
    }

    // Aggressive goal warning (high monthly amount)
    if (perMonth > 2000 && goal.responsible !== "both") {
      messages.push({ text: "⚠️ Meta agressiva para uma única renda. Considere dividir ou estender o prazo.", color: "text-amber-600 dark:text-amber-400" });
    }

    // Suggest extending deadline
    if (perMonth > 1000 && monthsLeft < 12) {
      const extendedMonths = monthsLeft + 6;
      const reducedPerMonth = Math.round(remaining / extendedMonths);
      messages.push({ text: `💡 Se aumentar o prazo em 6 meses, o valor mensal cai para R$ ${reducedPerMonth}.`, color: "text-muted-foreground" });
    }
  }

  // Both responsible
  if (goal.responsible === "both" && perMonth !== null && perMonth > 0) {
    const perPerson = Math.round(perMonth / 2);
    messages.push({ text: `👥 Contribuição conjunta: cada pessoa precisa guardar aproximadamente R$ ${perPerson} por mês.`, color: "text-primary" });
  }

  return messages;
}

// Calculate monthly savings capacity from transactions
function getSavingsCapacity(
  transactions: Transaction[],
  responsible: string | undefined,
  coupleMembers: { userId: string; nickname: string; displayName: string }[]
): number | null {
  if (transactions.length === 0) return null;

  const now = new Date();
  // Use last 3 months of data for a more stable average
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  let filtered = transactions.filter((t) => {
    const d = parseLocalDate(t.date);
    return d >= threeMonthsAgo && d <= now;
  });

  // Filter by responsible person
  if (responsible && responsible !== "both") {
    filtered = filtered.filter((t) => t.userId === responsible);
  }

  const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Calculate months in range
  const monthsInRange = Math.max(
    (now.getFullYear() - threeMonthsAgo.getFullYear()) * 12 + (now.getMonth() - threeMonthsAgo.getMonth()),
    1
  );

  const monthlyCapacity = Math.round((income - expense) / monthsInRange);
  return monthlyCapacity;
}

type ViabilityLevel = "viable" | "attention" | "aggressive";

function getViability(capacity: number | null, perMonth: number | null): { level: ViabilityLevel; label: string; message: string } {
  if (capacity === null || perMonth === null || perMonth <= 0) {
    return { level: "viable", label: "Sem dados suficientes", message: "Adicione lançamentos para análise de viabilidade." };
  }

  const ratio = capacity / perMonth;

  if (ratio >= 1) {
    return {
      level: "viable",
      label: "Meta viável",
      message: "Você tem capacidade suficiente para atingir essa meta.",
    };
  } else if (ratio >= 0.6) {
    const gap = Math.round(perMonth - capacity);
    return {
      level: "attention",
      label: "Ajuste necessário",
      message: `Faltam aproximadamente R$ ${gap}/mês para atingir essa meta no prazo.`,
    };
  } else {
    return {
      level: "aggressive",
      label: "Meta agressiva",
      message: "Meta agressiva para o prazo atual. Considere estender o prazo ou aumentar a renda.",
    };
  }
}

const viabilityColors: Record<ViabilityLevel, string> = {
  viable: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  attention: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  aggressive: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

const viabilityIcons: Record<ViabilityLevel, string> = {
  viable: "🟢",
  attention: "🟡",
  aggressive: "🔴",
};

const Caixinha = () => {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, transactions } = useFinance();
  const { coupleMembers, user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("💰");
  const [responsible, setResponsible] = useState("both");

  const totalSaved = savingsGoals.reduce((s, g) => s + g.current, 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + g.target, 0);

  const emojiOptions = ["💰", "✈️", "🛡️", "🚗", "🏠", "📚", "💻", "🎮", "👶", "💍", "🏖️", "🎓"];

  const responsibleOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "both", label: "Ambos" },
    ];
    coupleMembers.forEach((m) => {
      opts.push({ value: m.userId, label: m.nickname || m.displayName });
    });
    return opts;
  }, [coupleMembers]);

  const getResponsibleLabel = (val: string | undefined) => {
    if (!val || val === "both") return "Ambos";
    const member = coupleMembers.find((m) => m.userId === val);
    return member ? (member.nickname || member.displayName) : "—";
  };

  const openNew = () => {
    setEditing(null);
    setName("");
    setTarget("");
    setCurrent("0");
    setDeadline("");
    setIcon("💰");
    setResponsible("both");
    setDialogOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    setName(g.name);
    setTarget(g.target.toString());
    setCurrent(g.current.toString());
    setDeadline(g.deadline || "");
    setIcon(g.icon);
    setResponsible(g.responsible || "both");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !target) {
      toast.error("Preencha nome e valor alvo");
      return;
    }
    const data = {
      name,
      target: parseFloat(target),
      current: parseFloat(current || "0"),
      deadline: deadline || undefined,
      icon,
      responsible,
    };
    if (editing) {
      updateSavingsGoal(editing.id, data);
      toast.success("Meta atualizada!");
    } else {
      addSavingsGoal(data);
      toast.success("Meta criada!");
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Caixinha</h1>
          <p className="text-sm text-muted-foreground">
            Total guardado: <span className="font-semibold text-primary">{formatCurrency(totalSaved)}</span>
            {totalTarget > 0 && (
              <span> de {formatCurrency(totalTarget)}</span>
            )}
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Meta
        </Button>
      </div>

      {savingsGoals.length === 0 ? (
        <div className="card-glass p-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhuma meta criada ainda</p>
          <Button size="sm" className="mt-3" onClick={openNew}>Criar primeira meta</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savingsGoals.map((goal) => {
            const calc = getGoalCalculations(goal);
            const smartMsgs = getSmartMessages(goal);
            return (
              <div key={goal.id} className="card-glass p-4 space-y-3 group">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground truncate">{goal.name}</h3>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(goal)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-expense" onClick={() => { deleteSavingsGoal(goal.id); toast.success("Meta removida!"); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary highlight: monthly target */}
                {calc.perMonth !== null && calc.pct < 100 && (
                  <div className="bg-primary/10 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-muted-foreground">Guardar por mês</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(calc.perMonth))}</p>
                  </div>
                )}

                {/* Progress bar with label */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.current)} de {formatCurrency(goal.target)}
                    </span>
                    <span className="font-semibold text-primary">{Math.round(calc.pct)}% da meta concluída</span>
                  </div>
                  <Progress value={calc.pct} className="h-2" />
                </div>

                {/* Responsible */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Responsável: <span className="font-medium text-foreground">{getResponsibleLabel(goal.responsible)}</span></span>
                </div>

                {/* Secondary info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Target className="h-3 w-3 shrink-0" />
                    <span>Faltam: <span className="font-medium text-foreground">{formatCurrency(Math.round(calc.remaining))}</span></span>
                  </div>
                  {calc.monthsLeft !== null && calc.monthsLeft > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{calc.monthsLeft} {calc.monthsLeft === 1 ? "mês restante" : "meses restantes"}</span>
                    </div>
                  )}
                  {calc.perWeek !== null && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      <span>{formatCurrency(Math.round(calc.perWeek))}/semana</span>
                    </div>
                  )}
                  {goal.deadline && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>Prazo: {new Date(goal.deadline + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                    </div>
                  )}
                </div>

                {/* Smart messages */}
                <div className="space-y-1 border-t border-border/50 pt-2">
                  {smartMsgs.map((msg, i) => (
                    <p key={i} className={`text-xs ${msg.color} italic`}>
                      {msg.text}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Ícone</Label>
              <div className="flex flex-wrap gap-1.5">
                {emojiOptions.map((e) => (
                  <button key={e} type="button" onClick={() => setIcon(e)}
                    className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-colors ${icon === e ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary hover:bg-secondary/80"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input placeholder="Ex: Viagem" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor alvo (R$)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0,00" value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor atual (R$)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0,00" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prazo (opcional)</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Responsável</Label>
              <Select value={responsible} onValueChange={setResponsible}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {responsibleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Caixinha;
