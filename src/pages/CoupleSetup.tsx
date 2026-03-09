import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserPlus, Users, LogOut, Copy, Check } from "lucide-react";
import { incomeCategories, expenseCategories } from "@/lib/data";

const CoupleSetup = () => {
  const { user, signOut, refreshCouple } = useAuth();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const seedDefaultCategories = async (coupleId: string) => {
    const allCats = [...incomeCategories, ...expenseCategories].map((c) => ({
      couple_id: coupleId,
      name: c.name,
      icon: c.icon,
      type: c.type,
    }));
    await supabase.from("categories").insert(allCats);
  };

  const seedChallenge52Weeks = async (coupleId: string) => {
    const weeks = Array.from({ length: 52 }, (_, i) => ({
      couple_id: coupleId,
      week: i + 1,
      amount: (i + 1) * 5,
      completed: false,
    }));
    await supabase.from("challenge_weeks").insert(weeks);
  };

  const handleCreate = async () => {
    if (!user) return;
    setSubmitting(true);

    // Create couple
    const { data: couple, error: coupleErr } = await supabase
      .from("couples")
      .insert({ name: "Nosso Casal" })
      .select()
      .single();

    if (coupleErr || !couple) {
      toast.error("Erro ao criar casal: " + (coupleErr?.message || ""));
      setSubmitting(false);
      return;
    }

    // Add self as member
    const { error: memberErr } = await supabase
      .from("couple_members")
      .insert({ couple_id: couple.id, user_id: user.id, role: "owner" });

    if (memberErr) {
      toast.error("Erro ao vincular: " + memberErr.message);
      setSubmitting(false);
      return;
    }

    // Seed default data
    await seedDefaultCategories(couple.id);
    await seedChallenge52Weeks(couple.id);

    // Create invite code
    const { data: invite } = await supabase
      .from("couple_invites")
      .insert({ couple_id: couple.id, created_by: user.id })
      .select()
      .single();

    if (invite) {
      setGeneratedCode(invite.invite_code);
    }

    await refreshCouple();
    setSubmitting(false);
    toast.success("Casal criado! Compartilhe o código com seu parceiro(a).");
  };

  const handleJoin = async () => {
    if (!user || !inviteCode.trim()) return;
    setSubmitting(true);

    const code = inviteCode.trim().toUpperCase();

    // Find invite
    const { data: invite, error: findErr } = await supabase
      .from("couple_invites")
      .select("*")
      .eq("invite_code", code)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (findErr || !invite) {
      toast.error("Código inválido ou expirado");
      setSubmitting(false);
      return;
    }

    // Join couple
    const { error: joinErr } = await supabase
      .from("couple_members")
      .insert({ couple_id: invite.couple_id, user_id: user.id });

    if (joinErr) {
      toast.error("Erro ao entrar: " + joinErr.message);
      setSubmitting(false);
      return;
    }

    // Mark invite as used
    await supabase
      .from("couple_invites")
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq("id", invite.id);

    await refreshCouple();
    setSubmitting(false);
    toast.success("Você entrou no casal! 🎉");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generatedCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <CardTitle>Casal criado!</CardTitle>
            <CardDescription>
              Compartilhe este código com seu parceiro(a) para vocês ficarem conectados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 text-center text-3xl font-mono font-bold tracking-widest bg-muted rounded-lg p-4">
                {generatedCode}
              </div>
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              O código expira em 7 dias
            </p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Ir para o app
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">F</span>
            </div>
          </div>
          <CardTitle>Configurar casal</CardTitle>
          <CardDescription>
            Para compartilhar finanças, você precisa criar ou entrar num casal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "choose" && (
            <div className="space-y-3">
              <Button
                variant="default"
                className="w-full h-auto py-4 flex-col gap-1"
                onClick={() => setMode("create")}
              >
                <Users className="h-5 w-5" />
                <span className="font-semibold">Criar novo casal</span>
                <span className="text-xs opacity-80">Gere um código para convidar seu parceiro(a)</span>
              </Button>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex-col gap-1"
                onClick={() => setMode("join")}
              >
                <UserPlus className="h-5 w-5" />
                <span className="font-semibold">Tenho um código</span>
                <span className="text-xs opacity-80">Entrar no casal do meu parceiro(a)</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ao criar o casal, você receberá um código de 6 dígitos para compartilhar.
              </p>
              <Button className="w-full" onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar casal e gerar código
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setMode("choose")}>
                Voltar
              </Button>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Digite o código (ex: A1B2C3)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleJoin}
                disabled={submitting || inviteCode.length < 6}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Entrar no casal
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setMode("choose")}>
                Voltar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoupleSetup;
