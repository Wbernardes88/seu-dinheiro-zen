import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { parseLocalDate } from "@/lib/data";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction, Category, BudgetLimit, SavingsGoal } from "@/lib/data";

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

  loading: boolean;
};

const FinanceContext = createContext<FinanceContextType | null>(null);

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, coupleId } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetLimitsRaw, setBudgetLimitsRaw] = useState<{ id: string; categoryId: string; category: string; budget: number }[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [weeks, setWeeks] = useState<{ week: number; amount: number; completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- FETCH ALL DATA ----
  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      const [txRes, catRes, blRes, sgRes, cwRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("couple_id", coupleId).order("date", { ascending: false }),
        supabase.from("categories").select("*").eq("couple_id", coupleId),
        supabase.from("budget_limits").select("*").eq("couple_id", coupleId),
        supabase.from("savings_goals").select("*").eq("couple_id", coupleId),
        supabase.from("challenge_weeks").select("*").eq("couple_id", coupleId).order("week"),
      ]);

      if (txRes.data) {
        setTransactions(txRes.data.map((t) => ({
          id: t.id,
          date: t.date,
          type: t.type as "income" | "expense",
          category: t.category,
          description: t.description,
          paymentMethod: t.payment_method,
          amount: Number(t.amount),
          isRecurring: t.is_recurring,
          userId: t.user_id,
        })));
      }

      if (catRes.data) {
        setCategories(catRes.data.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          type: c.type as "income" | "expense",
        })));
      }

      if (blRes.data) {
        setBudgetLimitsRaw(blRes.data.map((b) => ({
          id: b.id,
          categoryId: b.category_id || b.id,
          category: b.category,
          budget: Number(b.budget),
        })));
      }

      if (sgRes.data) {
        setSavingsGoals(sgRes.data.map((g) => ({
          id: g.id,
          name: g.name,
          target: Number(g.target),
          current: Number(g.current),
          icon: g.icon,
          deadline: g.deadline || undefined,
        })));
      }

      if (cwRes.data) {
        setWeeks(cwRes.data.map((w) => ({
          week: w.week,
          amount: Number(w.amount),
          completed: w.completed,
        })));
      }

      setLoading(false);
    };

    fetchAll();

    // Real-time subscriptions
    const channel = supabase
      .channel(`couple-${coupleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `couple_id=eq.${coupleId}` }, () => {
        supabase.from("transactions").select("*").eq("couple_id", coupleId).order("date", { ascending: false }).then(({ data }) => {
          if (data) setTransactions(data.map((t) => ({
            id: t.id, date: t.date, type: t.type as "income" | "expense", category: t.category,
            description: t.description, paymentMethod: t.payment_method, amount: Number(t.amount), isRecurring: t.is_recurring, userId: t.user_id,
          })));
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "categories", filter: `couple_id=eq.${coupleId}` }, () => {
        supabase.from("categories").select("*").eq("couple_id", coupleId).then(({ data }) => {
          if (data) setCategories(data.map((c) => ({ id: c.id, name: c.name, icon: c.icon, type: c.type as "income" | "expense" })));
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "budget_limits", filter: `couple_id=eq.${coupleId}` }, () => {
        supabase.from("budget_limits").select("*").eq("couple_id", coupleId).then(({ data }) => {
          if (data) setBudgetLimitsRaw(data.map((b) => ({ id: b.id, categoryId: b.category_id || b.id, category: b.category, budget: Number(b.budget) })));
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_goals", filter: `couple_id=eq.${coupleId}` }, () => {
        supabase.from("savings_goals").select("*").eq("couple_id", coupleId).then(({ data }) => {
          if (data) setSavingsGoals(data.map((g) => ({ id: g.id, name: g.name, target: Number(g.target), current: Number(g.current), icon: g.icon, deadline: g.deadline || undefined })));
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_weeks", filter: `couple_id=eq.${coupleId}` }, () => {
        supabase.from("challenge_weeks").select("*").eq("couple_id", coupleId).order("week").then(({ data }) => {
          if (data) setWeeks(data.map((w) => ({ week: w.week, amount: Number(w.amount), completed: w.completed })));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  // ---- TRANSACTIONS ----
  const addTransaction = useCallback(async (t: Omit<Transaction, "id">) => {
    if (!coupleId || !user) return;

    const insertOne = async (data: Omit<Transaction, "id">) => {
      const result = await supabase.from("transactions").insert({
        couple_id: coupleId,
        user_id: user.id,
        date: data.date,
        type: data.type,
        category: data.category,
        description: data.description,
        payment_method: data.paymentMethod,
        amount: data.amount,
        is_recurring: data.isRecurring || false,
      });
      return result;
    };

    const { error } = await insertOne(t);
    if (error) {
      console.error("addTransaction error:", error);
      toast.error("Erro ao adicionar lançamento. Tente novamente.");
      return;
    }

    if (t.isRecurring) {
      const baseDate = parseLocalDate(t.date);
      for (let i = 1; i <= 11; i++) {
        const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, Math.min(baseDate.getDate(), new Date(baseDate.getFullYear(), baseDate.getMonth() + i + 1, 0).getDate()));
        const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
        await insertOne({ ...t, date: dateStr });
      }
    }

    // Manual refetch as fallback in case realtime doesn't trigger
    const { data } = await supabase.from("transactions").select("*").eq("couple_id", coupleId).order("date", { ascending: false });
    if (data) {
      setTransactions(data.map((t) => ({
        id: t.id, date: t.date, type: t.type as "income" | "expense", category: t.category,
        description: t.description, paymentMethod: t.payment_method, amount: Number(t.amount), isRecurring: t.is_recurring,
      })));
    }
  }, [coupleId, user]);

  const deleteTransaction = useCallback(async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
  }, []);

  // ---- CATEGORIES ----
  const addCategory = useCallback(async (c: Omit<Category, "id">) => {
    if (!coupleId) return;
    await supabase.from("categories").insert({
      couple_id: coupleId,
      name: c.name,
      icon: c.icon,
      type: c.type,
    });
  }, [coupleId]);

  const updateCategory = useCallback(async (id: string, c: Partial<Omit<Category, "id">>) => {
    await supabase.from("categories").update({
      ...(c.name !== undefined && { name: c.name }),
      ...(c.icon !== undefined && { icon: c.icon }),
      ...(c.type !== undefined && { type: c.type }),
    }).eq("id", id);
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
  }, []);

  // ---- BUDGET LIMITS ----
  const setBudgetLimit = useCallback(async (categoryId: string, category: string, budget: number) => {
    if (!coupleId) return;
    const existing = budgetLimitsRaw.find((b) => b.categoryId === categoryId);
    if (existing) {
      await supabase.from("budget_limits").update({ budget }).eq("id", existing.id);
    } else {
      await supabase.from("budget_limits").insert({
        couple_id: coupleId,
        category_id: categoryId,
        category,
        budget,
      });
    }
  }, [coupleId, budgetLimitsRaw]);

  const deleteBudgetLimit = useCallback(async (categoryId: string) => {
    const existing = budgetLimitsRaw.find((b) => b.categoryId === categoryId);
    if (existing) {
      await supabase.from("budget_limits").delete().eq("id", existing.id);
    }
  }, [budgetLimitsRaw]);

  // ---- SAVINGS GOALS ----
  const addSavingsGoal = useCallback(async (g: Omit<SavingsGoal, "id">) => {
    if (!coupleId) return;
    await supabase.from("savings_goals").insert({
      couple_id: coupleId,
      name: g.name,
      target: g.target,
      current: g.current,
      icon: g.icon,
      deadline: g.deadline || null,
    });
  }, [coupleId]);

  const updateSavingsGoal = useCallback(async (id: string, g: Partial<Omit<SavingsGoal, "id">>) => {
    await supabase.from("savings_goals").update({
      ...(g.name !== undefined && { name: g.name }),
      ...(g.target !== undefined && { target: g.target }),
      ...(g.current !== undefined && { current: g.current }),
      ...(g.icon !== undefined && { icon: g.icon }),
      ...(g.deadline !== undefined && { deadline: g.deadline || null }),
    }).eq("id", id);
  }, []);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    await supabase.from("savings_goals").delete().eq("id", id);
  }, []);

  // ---- CHALLENGE 52 WEEKS ----
  const toggleWeek = useCallback(async (week: number) => {
    if (!coupleId) return;

    const currentWeek = weeks.find((w) => w.week === week);
    if (!currentWeek) return;

    const nextCompleted = !currentWeek.completed;

    // Optimistic update so UI reflects immediately
    setWeeks((prev) =>
      prev.map((w) => (w.week === week ? { ...w, completed: nextCompleted } : w))
    );

    // Use SECURITY DEFINER function to bypass RLS issues in live environment
    const { error } = await supabase.rpc("toggle_challenge_week" as any, {
      p_couple_id: coupleId,
      p_week: week,
    });

    if (error) {
      // Rollback optimistic update if request fails
      setWeeks((prev) =>
        prev.map((w) => (w.week === week ? { ...w, completed: currentWeek.completed } : w))
      );
      console.error("toggleWeek error:", error);
      toast.error("Erro ao atualizar semana. Tente novamente.");
    }
  }, [coupleId, weeks]);

  // Compute spent per category from transactions for budget limits
  const computedBudgetLimits = useMemo(() => {
    const now = new Date();
    return budgetLimitsRaw.map((bl) => {
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
  }, [budgetLimitsRaw, transactions]);

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
        loading,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
