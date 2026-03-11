import { useState, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useSounds } from "@/contexts/SoundContext";
import { formatCurrency, parseLocalDate } from "@/lib/data";
import type { CreditCard } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, CreditCard as CreditCardIcon, Calendar, AlertTriangle, ChevronLeft, ChevronRight, FileUp } from "lucide-react";
import { toast } from "sonner";
import InvoiceImportDialog from "@/components/cartoes/InvoiceImportDialog";

const brands = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard", "Outro"];
const cardColors = [
  { label: "Azul Escuro", value: "#1a1a2e" },
  { label: "Roxo", value: "#6c3483" },
  { label: "Verde", value: "#1e8449" },
  { label: "Vermelho", value: "#c0392b" },
  { label: "Dourado", value: "#b7950b" },
  { label: "Cinza", value: "#2c3e50" },
  { label: "Rosa", value: "#c2185b" },
  { label: "Preto", value: "#1a1a1a" },
];

function getInvoicePeriod(closingDay: number, month: number, year: number) {
  // Invoice period: from closing day of previous month to closing day of current month
  let startMonth = month - 1;
  let startYear = year;
  if (startMonth < 0) { startMonth = 11; startYear--; }
  
  const startDate = new Date(startYear, startMonth, closingDay + 1);
  const endDate = new Date(year, month, closingDay);
  
  return { startDate, endDate };
}

function getBestPurchaseInfo(closingDay: number) {
  const today = new Date();
  const currentDay = today.getDate();
  
  // Best time to buy = right after closing day (max days to pay)
  if (currentDay <= closingDay) {
    // We're before closing — buying now goes to current invoice
    const daysUntilClose = closingDay - currentDay;
    if (daysUntilClose <= 3) {
      return { status: "warning" as const, message: `Fatura fecha em ${daysUntilClose} dia${daysUntilClose !== 1 ? 's' : ''}. Considere esperar!` };
    }
    return { status: "ok" as const, message: `${daysUntilClose} dias até o fechamento` };
  } else {
    // After closing — buying now goes to NEXT invoice (best time!)
    return { status: "great" as const, message: "Melhor momento para comprar! Vai para a próxima fatura." };
  }
}

const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const Cartoes = () => {
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard, transactions, deleteTransaction } = useFinance();
  const { play } = useSounds();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("Visa");
  const [color, setColor] = useState("#1a1a2e");
  const [creditLimit, setCreditLimit] = useState("");
  const [closingDay, setClosingDay] = useState("1");
  const [dueDay, setDueDay] = useState("10");

  // Invoice view state
  const now = new Date();
  const [invoiceMonth, setInvoiceMonth] = useState(now.getMonth());
  const [invoiceYear, setInvoiceYear] = useState(now.getFullYear());
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const openNew = () => {
    setEditing(null);
    setName("");
    setBrand("Visa");
    setColor("#1a1a2e");
    setCreditLimit("");
    setClosingDay("1");
    setDueDay("10");
    setDialogOpen(true);
  };

  const openEdit = (card: CreditCard) => {
    setEditing(card);
    setName(card.name);
    setBrand(card.brand);
    setColor(card.color);
    setCreditLimit(card.creditLimit.toString());
    setClosingDay(card.closingDay.toString());
    setDueDay(card.dueDay.toString());
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name || !creditLimit) {
      toast.error("Preencha nome e limite");
      return;
    }
    const data = {
      name,
      brand,
      color,
      creditLimit: parseFloat(creditLimit),
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
    };
    if (editing) {
      updateCreditCard(editing.id, data);
      toast.success("Cartão atualizado!");
      play("success");
    } else {
      addCreditCard(data);
      toast.success("Cartão adicionado!");
      play("kaching");
    }
    setDialogOpen(false);
  };

  // Get invoice transactions for a specific card/month
  const getCardInvoice = (card: CreditCard) => {
    const { startDate, endDate } = getInvoicePeriod(card.closingDay, invoiceMonth, invoiceYear);
    return transactions.filter((t) => {
      if (t.creditCardId !== card.id) return false;
      const d = parseLocalDate(t.date);
      return d >= startDate && d <= endDate;
    });
  };

  // Current month spending per card (for limit usage)
  const getCardMonthSpending = (cardId: string) => {
    return transactions
      .filter((t) => {
        if (t.creditCardId !== cardId || t.type !== "expense") return false;
        const d = parseLocalDate(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const prevMonth = () => {
    if (invoiceMonth === 0) { setInvoiceMonth(11); setInvoiceYear((y) => y - 1); }
    else setInvoiceMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (invoiceMonth === 11) { setInvoiceMonth(0); setInvoiceYear((y) => y + 1); }
    else setInvoiceMonth((m) => m + 1);
  };

  const activeCard = selectedCardId ? creditCards.find((c) => c.id === selectedCardId) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Cartões de Crédito</h1>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {/* Card list */}
      {creditCards.length === 0 ? (
        <div className="card-glass p-8 text-center">
          <CreditCardIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum cartão cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione seus cartões para controlar faturas e limites</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {creditCards.map((card) => {
            const spent = getCardMonthSpending(card.id);
            const usagePct = card.creditLimit > 0 ? Math.min((spent / card.creditLimit) * 100, 100) : 0;
            const purchaseInfo = getBestPurchaseInfo(card.closingDay);

            return (
              <div
                key={card.id}
                className={`rounded-2xl p-5 text-white relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${selectedCardId === card.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)` }}
                onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs text-white/60 font-medium uppercase tracking-wider">{card.brand}</p>
                    <p className="text-lg font-bold">{card.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                      onClick={(e) => { e.stopPropagation(); openEdit(card); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ok = await deleteCreditCard(card.id);
                        if (ok) { play("delete"); toast.success("Cartão removido!"); }
                      }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Limit usage */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">Usado: {formatCurrency(spent)}</span>
                    <span className="text-white/70">Limite: {formatCurrency(card.creditLimit)}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${usagePct >= 90 ? "bg-red-400" : usagePct >= 70 ? "bg-yellow-400" : "bg-green-400"}`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/50">{Math.round(usagePct)}% do limite utilizado</p>
                </div>

                {/* Info row */}
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    purchaseInfo.status === "great" ? "bg-green-500/30 text-green-200" :
                    purchaseInfo.status === "warning" ? "bg-yellow-500/30 text-yellow-200" :
                    "bg-white/10 text-white/70"
                  }`}>
                    {purchaseInfo.status === "great" ? "🟢" : purchaseInfo.status === "warning" ? "⚠️" : "ℹ️"} {purchaseInfo.message}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice view */}
      {activeCard && (
        <div className="card-glass p-5 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Fatura — {activeCard.name}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setImportDialogOpen(true)}
              >
                <FileUp className="h-3.5 w-3.5" />
                Importar PDF
              </Button>
              <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
                {months[invoiceMonth]} {invoiceYear}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            </div>
          </div>

          {(() => {
            const invoiceTx = getCardInvoice(activeCard);
            const total = invoiceTx.reduce((sum, t) => sum + (t.type === "expense" ? t.amount : -t.amount), 0);

            return (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <span className="text-sm text-muted-foreground">Total da fatura</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(total)}</span>
                </div>

                {invoiceTx.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum lançamento nesta fatura</p>
                ) : (
                  <div className="space-y-1">
                    {invoiceTx.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                            {t.description}
                            {t.totalInstallments && t.totalInstallments > 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                                {t.installmentNumber}/{t.totalInstallments}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{t.category} · {t.date}</p>
                        </div>
                        <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cartão" : "Novo Cartão"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do cartão</Label>
              <Input placeholder="Ex: Nubank" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Bandeira</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cor</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full" style={{ background: color }} />
                      <span>{cardColors.find(c => c.value === color)?.label || "Custom"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {cardColors.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full" style={{ background: c.value }} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Limite (R$)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Dia do fechamento</Label>
                <Input type="number" min="1" max="28" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dia do vencimento</Label>
                <Input type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Import Dialog */}
      {activeCard && (
        <InvoiceImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          card={activeCard}
        />
      )}
    </div>
  );
};

export default Cartoes;
