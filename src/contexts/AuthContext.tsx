import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  coupleId: string | null;
  coupleLoading: boolean;
  nickname: string;
  coupleMembers: { userId: string; nickname: string; displayName: string }[];
  signUp: (email: string, password: string, displayName: string, nickname: string) => Promise<{ error: Error | null }>;
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
  const { data, error } = await supabase.rpc("auto_create_couple" as any, { p_user_id: userId });
  if (error) {
    console.error("Auto-create couple error:", error);
    return null;
  }
  return data as string;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [coupleLoading, setCoupleLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [coupleMembers, setCoupleMembers] = useState<{ userId: string; nickname: string; displayName: string }[]>([]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("nickname, display_name")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setNickname((data as any).nickname || (data as any).display_name || "");
    }
  };

  const fetchCoupleMembers = async (cId: string) => {
    const { data: members } = await supabase
      .from("couple_members")
      .select("user_id")
      .eq("couple_id", cId);
    if (!members || members.length === 0) return;

    const userIds = members.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, nickname")
      .in("id", userIds);

    if (profiles) {
      setCoupleMembers(
        profiles.map((p) => ({
          userId: p.id,
          nickname: (p as any).nickname || p.display_name,
          displayName: p.display_name,
        }))
      );
    }
  };

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
      await fetchCoupleMembers(data.couple_id);
      setCoupleLoading(false);
    } else {
      const newCoupleId = await autoCreateCouple(uid);
      setCoupleId(newCoupleId);
      if (newCoupleId) await fetchCoupleMembers(newCoupleId);
      setCoupleLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
          fetchCoupleId(session.user.id);
        }, 0);
      } else {
        setCoupleId(null);
        setCoupleLoading(false);
        setNickname("");
        setCoupleMembers([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchCoupleId(session.user.id);
      } else {
        setCoupleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, nick: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, nickname: nick },
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
    setNickname("");
    setCoupleMembers([]);
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
      value={{ user, session, loading, coupleId, coupleLoading, nickname, coupleMembers, signUp, signIn, signOut, resetPassword, refreshCouple }}
    >
      {children}
    </AuthContext.Provider>
  );
};
