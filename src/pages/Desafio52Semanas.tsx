import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSounds } from "@/contexts/SoundContext";
import { formatCurrency } from "@/lib/data";
import { CheckCircle2, Circle, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Desafio52Semanas = () => {
  const { challenge52Weeks, toggleWeek } = useFinance();
  const { coupleId } = useAuth();
  const { play } = useSounds();

  const defaultGoal = challenge52Weeks.reduce((s, w) => s + w.amount, 0);
  const [customGoal, setCustomGoal] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const goal = customGoal ?? defaultGoal;
  const scale = goal / defaultGoal;
  const scaledWeeks = challenge52Weeks.map((w) => ({ ...w, amount: Math.round(w.amount * scale * 100) / 100 }));
  const totalSaved = scaledWeeks.filter((w) => w.completed).reduce((s, w) => s + w.amount, 0);
  const pct = Math.min((totalSaved / goal) * 100, 100);

  const handleEditStart = () => {
    setEditValue(goal.toString());
    setEditing(true);
  };

  const handleEditConfirm = async () => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) {
      setCustomGoal(val);
      // Reset all weeks when goal changes
      if (coupleId) {
        const { error } = await supabase.rpc("reset_challenge_weeks" as any, {
          p_couple_id: coupleId,
        });
        if (error) {
          console.error("reset error:", error);
          toast.error("Erro ao resetar semanas.");
        } else {
          toast.success("Meta atualizada e semanas resetadas!");
        }
      }
    }
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Desafio 52 Semanas</h1>
        <p className="text-sm text-muted-foreground">Toque em uma semana para marcar/desmarcar</p>
      </div>

      <div className="card-glass p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso geral</span>
          <span className="text-sm font-bold text-primary">{pct.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3">
          <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Guardado: {formatCurrency(totalSaved)}</span>
          <div className="flex items-center gap-1">
            <span>Meta:</span>
            {editing ? (
              <form onSubmit={(e) => { e.preventDefault(); handleEditConfirm(); }} className="inline-flex items-center gap-1">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleEditConfirm}
                  autoFocus
                  className="h-6 w-24 text-xs px-1"
                />
              </form>
            ) : (
              <button onClick={handleEditStart} className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                <span className="font-semibold text-foreground">{formatCurrency(goal)}</span>
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Semanas</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {scaledWeeks.map((w) => (
            <button
              key={w.week}
              onClick={() => { toggleWeek(w.week); play(w.completed ? "tap" : "success"); }}
              className={`flex flex-col items-center p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                w.completed ? "bg-accent text-accent-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {w.completed ? (
                <CheckCircle2 className="h-4 w-4 text-primary mb-0.5" />
              ) : (
                <Circle className="h-4 w-4 mb-0.5" />
              )}
              <span className="font-medium">S{w.week}</span>
              <span className="text-[10px]">{formatCurrency(w.amount)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Desafio52Semanas;
