import { useState, useRef } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSounds } from "@/contexts/SoundContext";
import { formatCurrency, getInvoiceDateStr1Based } from "@/lib/data";
import type { CreditCard, Category } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUp, Loader2, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type ExtractedTransaction = {
  date: string;
  originalDate: string;
  description: string;
  amount: number;
  category: string;
  installment_number?: number;
  total_installments?: number;
  selected: boolean;
};

type InvoiceMeta = {
  invoice_year: number;
  invoice_month: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CreditCard;
  onImportComplete?: (month0based: number, year: number) => void;
};

const InvoiceImportDialog = ({ open, onOpenChange, card, onImportComplete }: Props) => {
  const { categories, refreshTransactions } = useFinance();
  const { user, coupleId } = useAuth();
  const { play } = useSounds();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "processing" | "preview" | "saving" | "done">("upload");
  const [transactions, setTransactions] = useState<ExtractedTransaction[]>([]);
  const [invoiceMeta, setInvoiceMeta] = useState<InvoiceMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const resetState = () => {
    setStep("upload");
    setTransactions([]);
    setError(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB)");
      return;
    }

    setStep("processing");
    setError(null);

    try {
      const base64 = await fileToBase64(file);

      const { data, error: fnError } = await supabase.functions.invoke("parse-invoice", {
        body: {
          pdfBase64: base64,
          categories: categories.map((c) => ({ name: c.name, type: c.type })),
        },
      });

      if (fnError) throw new Error(fnError.message || "Erro ao processar fatura");

      if (data?.error) throw new Error(data.error);

      if (!data?.transactions || data.transactions.length === 0) {
        throw new Error("Nenhum lançamento encontrado na fatura");
      }

      // Capture invoice month/year from AI response
      const invYear = data.invoice_year || new Date().getFullYear();
      const invMonth = data.invoice_month || (new Date().getMonth() + 1); // 1-based
      setInvoiceMeta({ invoice_year: invYear, invoice_month: invMonth });

      // Use day=1 to avoid month overflow (e.g. April 31 → May 1)
      const invoiceDate = getInvoiceDateStr1Based(invYear, invMonth);

      const mapped: ExtractedTransaction[] = data.transactions.map((t: any) => ({
        date: invoiceDate,
        originalDate: t.date,
        description: t.description,
        amount: Number(t.amount),
        category: matchCategory(t.category, expenseCategories),
        installment_number: t.installment_number || undefined,
        total_installments: t.total_installments || undefined,
        selected: true,
      }));

      setTransactions(mapped);
      setStep("preview");
      play("success");
    } catch (err: any) {
      console.error("Invoice parse error:", err);
      setError(err.message || "Erro ao processar fatura");
      setStep("upload");
    }

    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    const selected = transactions.filter((t) => t.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um lançamento");
      return;
    }

    setStep("saving");

    try {
      if (!coupleId || !user) {
        toast.error("Erro de autenticação");
        setStep("preview");
        return;
      }

      // Insert transactions using invoice month date
      // For installments, project remaining parcels to future months
      for (const t of selected) {
        const groupId = (t.total_installments && t.total_installments > 1 && t.installment_number)
          ? crypto.randomUUID()
          : null;

        // Insert the current installment (from the imported invoice)
        const { error } = await supabase.from("transactions").insert({
          couple_id: coupleId,
          user_id: user!.id,
          date: t.date,
          type: "expense",
          category: t.category,
          description: t.description,
          payment_method: "Cartão crédito",
          amount: t.amount,
          is_recurring: false,
          is_fixed: t.total_installments && t.total_installments > 1,
          credit_card_id: card.id,
          installment_number: t.installment_number || null,
          total_installments: t.total_installments || null,
          installment_group_id: groupId,
        });

        if (error) {
          console.error("Insert error:", error);
          throw new Error("Erro ao salvar lançamento");
        }

        // Project future installments if applicable
        if (t.total_installments && t.installment_number && t.total_installments > t.installment_number && invoiceMeta) {
          const remaining = t.total_installments - t.installment_number;
          for (let i = 1; i <= remaining; i++) {
            const futureInstallment = t.installment_number + i;
            // Use day=1 to avoid month overflow
            const futureMonth0 = invoiceMeta.invoice_month - 1 + i; // 0-based
            const futureDate = new Date(invoiceMeta.invoice_year, futureMonth0, 1);
            const futureDateStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-01`;

            // Check for existing duplicate (same card, same description, same installment, same month)
            const { data: existing } = await supabase
              .from("transactions")
              .select("id")
              .eq("couple_id", coupleId)
              .eq("credit_card_id", card.id)
              .eq("description", t.description)
              .eq("installment_number", futureInstallment)
              .eq("total_installments", t.total_installments)
              .eq("date", futureDateStr)
              .limit(1);

            if (existing && existing.length > 0) {
              console.log(`Skipping duplicate installment ${futureInstallment}/${t.total_installments} for "${t.description}"`);
              continue;
            }

            const { error: futureError } = await supabase.from("transactions").insert({
              couple_id: coupleId,
              user_id: user!.id,
              date: futureDateStr,
              type: "expense",
              category: t.category,
              description: t.description,
              payment_method: "Cartão crédito",
              amount: t.amount,
              is_recurring: false,
              is_fixed: true,
              credit_card_id: card.id,
              installment_number: futureInstallment,
              total_installments: t.total_installments,
              installment_group_id: groupId,
            });

            if (futureError) {
              console.error("Future installment error:", futureError);
            }
          }
        }
      }

      // Manual refetch to ensure UI updates even if realtime fails
      if (coupleId) {
        const { data: refreshed } = await supabase
          .from("transactions")
          .select("*")
          .eq("couple_id", coupleId)
          .order("date", { ascending: false });
        // We can't directly setTransactions here since we're outside FinanceContext,
        // but the realtime subscription + this callback will handle it
      }

      setStep("done");
      play("kaching");
      toast.success(`${selected.length} lançamentos importados!`);

      // Navigate parent to the imported month
      if (invoiceMeta && onImportComplete) {
        onImportComplete(invoiceMeta.invoice_month - 1, invoiceMeta.invoice_year);
      }

      setTimeout(() => handleClose(false), 1500);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Erro ao salvar lançamentos");
      setStep("preview");
    }
  };

  const toggleTransaction = (index: number) => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const updateCategory = (index: number, category: string) => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, category } : t))
    );
  };

  const removeTransaction = (index: number) => {
    setTransactions((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAll = (checked: boolean) => {
    setTransactions((prev) => prev.map((t) => ({ ...t, selected: checked })));
  };

  const selectedCount = transactions.filter((t) => t.selected).length;
  const selectedTotal = transactions.filter((t) => t.selected).reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Importar Fatura — {card.name}
          </DialogTitle>
        </DialogHeader>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileUp className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                Envie o PDF da fatura do seu cartão
              </p>
              <p className="text-xs text-muted-foreground">
                A IA vai extrair automaticamente todos os lançamentos
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileRef.current?.click()} className="gap-2">
              <FileUp className="h-4 w-4" />
              Selecionar PDF
            </Button>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Processando fatura...</p>
              <p className="text-xs text-muted-foreground">A IA está lendo e extraindo os lançamentos</p>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <>
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCount === transactions.length}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
                <span className="text-xs text-muted-foreground">
                  {selectedCount} de {transactions.length} selecionados
                </span>
              </div>
              <div className="text-sm font-semibold text-foreground">
                Total: {formatCurrency(selectedTotal)}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-1 pr-1" style={{ maxHeight: "45vh" }}>
              {transactions.map((t, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    t.selected ? "bg-card border-border" : "bg-muted/30 border-transparent opacity-60"
                  }`}
                >
                  <Checkbox
                    checked={t.selected}
                    onCheckedChange={() => toggleTransaction(i)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                      {t.description}
                      {t.total_installments && t.total_installments > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                          {t.installment_number}/{t.total_installments}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Compra: {t.originalDate}</p>
                  </div>
                  <Select value={t.category} onValueChange={(v) => updateCategory(i, v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm font-semibold text-expense whitespace-nowrap">
                    {formatCurrency(t.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeTransaction(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={selectedCount === 0} className="gap-1.5">
                Importar {selectedCount} lançamento{selectedCount !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Saving Step */}
        {step === "saving" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Salvando lançamentos...</p>
              <p className="text-xs text-muted-foreground">{selectedCount} lançamentos sendo importados</p>
            </div>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Importação concluída!</p>
              <p className="text-xs text-muted-foreground">
                {selectedCount} lançamentos adicionados ao cartão {card.name}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helpers

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function matchCategory(aiCategory: string, userCategories: Category[]): string {
  if (!aiCategory) return userCategories[0]?.name || "Outros";

  // Direct match
  const direct = userCategories.find(
    (c) => c.name.toLowerCase() === aiCategory.toLowerCase()
  );
  if (direct) return direct.name;

  // Partial match
  const partial = userCategories.find(
    (c) =>
      aiCategory.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(aiCategory.toLowerCase())
  );
  if (partial) return partial.name;

  // Default to first category or the AI suggestion
  return userCategories[0]?.name || aiCategory;
}

export default InvoiceImportDialog;
