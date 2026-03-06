import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SavingsGoal } from "@/lib/data";

const Caixinha = () => {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("💰");

  const totalSaved = savingsGoals.reduce((s, g) => s + g.current, 0);

  const emojiOptions = ["💰", "✈️", "🛡️", "🚗", "🏠", "📚", "💻", "🎮", "👶", "💍", "🏖️", "🎓"];

  const openNew = () => {
    setEditing(null);
    setName("");
    setTarget("");
    setCurrent("0");
    setDeadline("");
    setIcon("💰");
    setDialogOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    setName(g.name);
    setTarget(g.target.toString());
    setCurrent(g.current.toString());
    setDeadline(g.deadline || "");
    setIcon(g.icon);
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
            const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
            return (
              <div key={goal.id} className="card-glass p-4 space-y-3 group">
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
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(goal.current)} de {formatCurrency(goal.target)}
                      {goal.deadline && ` · até ${goal.deadline}`}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary">{pct.toFixed(0)}%</span>
                </div>
                <Progress value={pct} className="h-2" />
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
