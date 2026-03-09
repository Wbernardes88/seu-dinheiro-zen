import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
    setCoupleId(data?.couple_id ?? null);
    setCoupleLoading(false);
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        // Defer couple fetch to avoid Supabase deadlocks
        setTimeout(() => fetchCoupleId(session.user.id), 0);
      } else {
        setCoupleId(null);
        setCoupleLoading(false);
      }
    });

    // THEN check current session
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
