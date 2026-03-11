import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useSounds } from "@/contexts/SoundContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/lib/data";

const Categorias = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const { play } = useSounds();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState("");

  const incCats = categories.filter((c) => c.type === "income");
  const expCats = categories.filter((c) => c.type === "expense");

  const openNew = () => {
    setEditing(null);
    setName("");
    setType("expense");
    setIcon("");
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }
    if (editing) {
      updateCategory(editing.id, { name, type, icon: icon || "📁" });
      toast.success("Categoria atualizada!");
    } else {
      addCategory({ name, type, icon: icon || "📁" });
      toast.success("Categoria criada!");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteCategory(id);
    toast.success("Categoria removida!");
  };

  const emojiOptions = ["💰", "💻", "📈", "📦", "🍔", "🚗", "🏠", "💊", "📚", "🎮", "👕", "📱", "🎬", "🐾", "💇", "🎁", "⚽", "✈️", "🔧", "📁"];

  const CategoryCard = ({ cat }: { cat: Category }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{cat.icon}</span>
        <span className="text-sm font-medium text-foreground">{cat.name}</span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-expense" onClick={() => handleDelete(cat.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova
        </Button>
      </div>

      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-income" />
          Receitas ({incCats.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {incCats.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>
        {incCats.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria de receita</p>
        )}
      </div>

      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-expense" />
          Despesas ({expCats.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {expCats.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>
        {expCats.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria de despesa</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input placeholder="Ex: Alimentação" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ícone</Label>
              <div className="flex flex-wrap gap-1.5">
                {emojiOptions.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                      icon === e ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
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

export default Categorias;
