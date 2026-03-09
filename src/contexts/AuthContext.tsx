import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { incomeCategories, expenseCategories } from "@/lib/data";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  coupleId: string | null;
  coupleLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshCouple: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const autoCreateCouple = async (userId: string): Promise<string | null> => {
  // Create a personal couple space
  const { data: couple, error: coupleErr } = await supabase
    .from("couples")
    .insert({ name: "Meu Espaço" })
    .select()
    .single();

  if (coupleErr || !couple) return null;

  const { error: memberErr } = await supabase
    .from("couple_members")
    .insert({ couple_id: couple.id, user_id: userId, role: "owner" });

  if (memberErr) return null;

  // Seed default categories
  const allCats = [...incomeCategories, ...expenseCategories].map((c) => ({
    couple_id: couple.id,
    name: c.name,
    icon: c.icon,
    type: c.type,
  }));
  await supabase.from("categories").insert(allCats);

  // Seed challenge 52 weeks
  const weeks = Array.from({ length: 52 }, (_, i) => ({
    couple_id: couple.id,
    week: i + 1,
    amount: (i + 1) * 5,
    completed: false,
  }));
  await supabase.from("challenge_weeks").insert(weeks);

  return couple.id;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [coupleLoading, setCoupleLoading] = useState(true);

  const fetchCoupleId = async (userId?: string) => {
    const uid = userId || user?.id;
    if (!uid) {
      setCoupleId(null);
      setCoupleLoading(false);
      return;
    }
    setCoupleLoading(true);
    const { data } = await supabase
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", uid)
      .maybeSingle();

    if (data?.couple_id) {
      setCoupleId(data.couple_id);
      setCoupleLoading(false);
    } else {
      // Auto-create a personal space
      const newCoupleId = await autoCreateCouple(uid);
      setCoupleId(newCoupleId);
      setCoupleLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setTimeout(() => fetchCoupleId(session.user.id), 0);
      } else {
        setCoupleId(null);
        setCoupleLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchCoupleId(session.user.id);
      } else {
        setCoupleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCoupleId(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const refreshCouple = async () => {
    await fetchCoupleId();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, coupleId, coupleLoading, signUp, signIn, signOut, resetPassword, refreshCouple }}
    >
      {children}
    </AuthContext.Provider>
  );
};
