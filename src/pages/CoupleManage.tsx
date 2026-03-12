import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, UserPlus, Copy, Check, Users, Unlink } from "lucide-react";

const CoupleManage = () => {
  const { user, coupleId, refreshCouple } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<{ user_id: string; role: string; display_name: string }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (!coupleId) return;
    const fetchMembers = async () => {
      setLoadingMembers(true);
      const { data } = await supabase
        .from("couple_members")
        .select("user_id, role")
        .eq("couple_id", coupleId);

      if (data) {
        const membersList = await Promise.all(
          data.map(async (m) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", m.user_id)
              .maybeSingle();
            return {
              user_id: m.user_id,
              role: m.role,
              display_name: profile?.display_name || "Usuário",
            };
          })
        );
        setMembers(membersList);
      }
      setLoadingMembers(false);
    };
    fetchMembers();
  }, [coupleId]);

  const hasPartner = members.length > 1;
  const [dissolving, setDissolving] = useState(false);

  const handleDissolveCouple = async () => {
    if (!coupleId || !user) return;
    setDissolving(true);
    const { error } = await supabase.rpc("dissolve_couple" as any, { p_couple_id: coupleId });
    if (error) {
      toast.error("Erro ao desvincular: " + error.message);
      setDissolving(false);
      return;
    }
    toast.success("Casal desvinculado. Criando seu espaço individual...");
    await refreshCouple();
    setDissolving(false);
    window.location.reload();
  };

  const generateInvite = async () => {
    if (!coupleId || !user) return;
    setSubmitting(true);
    const { data: invite, error } = await supabase
      .from("couple_invites")
      .insert({ couple_id: coupleId, created_by: user.id })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao gerar código: " + error.message);
    } else if (invite) {
      setGeneratedCode(invite.invite_code);
      toast.success("Código gerado!");
    }
    setSubmitting(false);
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setSubmitting(true);
    const code = joinCode.trim().toUpperCase();

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

    // Remove from current couple first
    if (coupleId) {
      await supabase.from("couple_members").delete().eq("user_id", user.id).eq("couple_id", coupleId);
    }

    // Join new couple
    const { error: joinErr } = await supabase
      .from("couple_members")
      .insert({ couple_id: invite.couple_id, user_id: user.id });

    if (joinErr) {
      toast.error("Erro ao entrar: " + joinErr.message);
      setSubmitting(false);
      return;
    }

    await supabase
      .from("couple_invites")
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq("id", invite.id);

    await refreshCouple();
    setSubmitting(false);
    toast.success("Parceiro(a) vinculado! Os dados agora são compartilhados 🎉");
    window.location.reload();
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Casal</h1>
        <p className="text-muted-foreground">Convide seu parceiro(a) para compartilhar finanças</p>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-xs font-semibold">
                      {m.display_name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.user_id === user?.id ? "Você" : "Parceiro(a)"}
                    </p>
                  </div>
                </div>
              ))}
              {!hasPartner && (
                <p className="text-sm text-muted-foreground mt-2">
                  Você está usando sozinho(a). Convide seu parceiro(a) abaixo!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite */}
      {!hasPartner && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Convidar parceiro(a)
              </CardTitle>
              <CardDescription>
                Gere um código de 6 dígitos e envie para seu parceiro(a)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedCode ? (
                <div className="space-y-3">
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
                </div>
              ) : (
                <Button onClick={generateInvite} disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Gerar código de convite
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tenho um código</CardTitle>
              <CardDescription>
                Recebeu um código do seu parceiro(a)? Digite aqui para vincular
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Ex: A1B2C3"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
              <Button
                className="w-full"
                onClick={handleJoin}
                disabled={submitting || joinCode.length < 6}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Vincular parceiro(a)
              </Button>
            </CardContent>
          </Card>
        </>
      )}
      {hasPartner && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Unlink className="h-5 w-5" />
              Desvincular casal
            </CardTitle>
            <CardDescription>
              Desfaça a conexão com seu parceiro(a). Cada um voltará a ter uma conta individual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={dissolving}>
                  {dissolving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Sair do casal
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza que deseja desfazer a conexão?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Ao desvincular o casal:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>As contas deixam de compartilhar dados</li>
                      <li>Cada usuário voltará a ter sua conta individual</li>
                      <li>O código de convite anterior deixará de funcionar</li>
                      <li>Os dados financeiros já registrados <strong>não serão apagados</strong></li>
                    </ul>
                    <p className="font-medium mt-2">Essa ação não pode ser desfeita.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDissolveCouple}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, desvincular
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoupleManage;
