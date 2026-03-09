import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { parseLocalDate } from "@/lib/data";
import {
  type Transaction,
  type Category,
  type BudgetLimit,
  type SavingsGoal,
  mockTransactions,
  incomeCategories as defaultIncomeCategories,
  expenseCategories as defaultExpenseCategories,
  budgetLimits as defaultBudgetLimits,
  savingsGoals as defaultSavingsGoals,
  challenge52Weeks as defaultChallenge52Weeks,
} from "@/lib/data";

type FinanceContextType = {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;

  categories: Category[];
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, c: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;

  budgetLimits: BudgetLimit[];
  setBudgetLimit: (categoryId: string, category: string, budget: number) => void;
  deleteBudgetLimit: (categoryId: string) => void;

  savingsGoals: SavingsGoal[];
  addSavingsGoal: (g: Omit<SavingsGoal, "id">) => void;
  updateSavingsGoal: (id: string, g: Partial<Omit<SavingsGoal, "id">>) => void;
  deleteSavingsGoal: (id: string) => void;

  challenge52Weeks: { week: number; amount: number; completed: boolean }[];
  toggleWeek: (week: number) => void;
};

const FinanceContext = createContext<FinanceContextType | null>(null);

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [categories, setCategories] = useState<Category[]>([
    ...defaultIncomeCategories,
    ...defaultExpenseCategories,
  ]);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>(defaultBudgetLimits);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(defaultSavingsGoals);
  const [weeks, setWeeks] = useState(defaultChallenge52Weeks);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = { ...t, id: Date.now().toString() };

    if (t.isRecurring) {
      // Generate base + 11 recurring months in a single setState
      const baseDate = parseLocalDate(t.date);
      const recurring: Transaction[] = [];
      for (let i = 1; i <= 11; i++) {
        const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, Math.min(baseDate.getDate(), new Date(baseDate.getFullYear(), baseDate.getMonth() + i + 1, 0).getDate()));
        const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
        recurring.push({
          ...t,
          id: `${Date.now()}-rec-${i}`,
          date: dateStr,
        });
      }
      setTransactions((prev) => [newTransaction, ...recurring, ...prev]);
    } else {
      setTransactions((prev) => [newTransaction, ...prev]);
    }
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addCategory = useCallback((c: Omit<Category, "id">) => {
    setCategories((prev) => [...prev, { ...c, id: Date.now().toString() }]);
  }, []);

  const updateCategory = useCallback((id: string, c: Partial<Omit<Category, "id">>) => {
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...c } : cat)));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  }, []);

  const setBudgetLimit = useCallback((categoryId: string, category: string, budget: number) => {
    setBudgetLimits((prev) => {
      const exists = prev.find((b) => b.categoryId === categoryId);
      if (exists) {
        return prev.map((b) => (b.categoryId === categoryId ? { ...b, budget } : b));
      }
      return [...prev, { categoryId, category, budget, spent: 0 }];
    });
  }, []);

  const deleteBudgetLimit = useCallback((categoryId: string) => {
    setBudgetLimits((prev) => prev.filter((b) => b.categoryId !== categoryId));
  }, []);

  const addSavingsGoal = useCallback((g: Omit<SavingsGoal, "id">) => {
    setSavingsGoals((prev) => [...prev, { ...g, id: Date.now().toString() }]);
  }, []);

  const updateSavingsGoal = useCallback((id: string, g: Partial<Omit<SavingsGoal, "id">>) => {
    setSavingsGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, ...g } : goal)));
  }, []);

  const deleteSavingsGoal = useCallback((id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const toggleWeek = useCallback((week: number) => {
    setWeeks((prev) =>
      prev.map((w) => (w.week === week ? { ...w, completed: !w.completed } : w))
    );
  }, []);

  // Compute spent per category from transactions for budget limits
  const computedBudgetLimits = budgetLimits.map((bl) => {
    const now = new Date();
    const spent = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category === bl.category &&
           parseLocalDate(t.date).getMonth() === now.getMonth() &&
           parseLocalDate(t.date).getFullYear() === now.getFullYear()
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...bl, spent };
  });

  // Track previous percentages to only alert on changes
  const prevPctRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const prev = prevPctRef.current;
    const newPct: Record<string, number> = {};

    computedBudgetLimits.forEach((bl) => {
      if (bl.budget <= 0) return;
      const pct = (bl.spent / bl.budget) * 100;
      newPct[bl.categoryId] = pct;
      const prevVal = prev[bl.categoryId];

      // Only alert when crossing a threshold (not on initial load)
      if (prevVal === undefined) return;

      if (pct >= 100 && prevVal < 100) {
        toast.error(`🚨 ${bl.category}: Limite estourado! Você ultrapassou 100% do orçamento.`, { duration: Infinity });
      } else if (pct >= 80 && prevVal < 80) {
        toast.warning(`⚠️ ${bl.category}: Atenção! Você já usou ${Math.round(pct)}% do limite. Hora de segurar os gastos!`, { duration: Infinity });
      } else if (pct > 0 && prevVal === 0) {
        toast.info(`💡 ${bl.category}: Gastos iniciados. Você está em ${Math.round(pct)}% do limite — tudo sob controle!`, { duration: Infinity });
      }
    });

    prevPctRef.current = newPct;
  }, [computedBudgetLimits]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        budgetLimits: computedBudgetLimits,
        setBudgetLimit,
        deleteBudgetLimit,
        savingsGoals,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        challenge52Weeks: weeks,
        toggleWeek,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
