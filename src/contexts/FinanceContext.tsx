import React, { createContext, useContext, useState, useCallback } from "react";
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
    setTransactions((prev) => [{ ...t, id: Date.now().toString() }, ...prev]);
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
