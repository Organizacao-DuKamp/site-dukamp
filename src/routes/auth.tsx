import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { traduzErroAuth } from "@/lib/auth-errors";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Dukamp" }] }),
  component: AuthPage,
});

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function makeChallenge() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

function AuthPage() {
  const { signIn, user, isAdmin } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (user && isAdmin) nav({ to: "/admin" });
    else if (user) nav({ to: "/dashboard" });
  }, [user, isAdmin, nav]);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">D</div>
          <div className="font-bold">Dukamp Saúde Animal</div>
        </Link>
        <div className="rounded-lg border bg-card p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm onLogin={signIn} />
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: (e: string, p: string) => Promise<{ error?: string }> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await onLogin(email, password);
    setLoading(false);
    if (error) toast.error(traduzErroAuth(error));
    else toast.success("Bem-vindo!");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="login-email">E-mail</Label>
        <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="login-password">Senha</Label>
        <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

type AccountKind = "cliente" | "revendedor" | "produtor";

function RegisterForm() {
  const [accountKind, setAccountKind] = useState<AccountKind>("cliente");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [uf, setUf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [challenge, setChallenge] = useState(makeChallenge);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const needsExtra = accountKind !== "cliente";
  const requiresCnpj = needsExtra && uf === "SP";
  const requiresCpf = needsExtra && uf !== "" && uf !== "SP";

  const helper = useMemo(() => {
    if (accountKind === "cliente") return "Conta padrão. Acesso imediato.";
    return "Solicitação enviada para aprovação da equipe Dukamp. Você poderá entrar, mas o acesso ao tipo solicitado só vale após aprovação.";
  }, [accountKind]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Informe seu nome completo.");
    if (password.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não conferem.");
    if (needsExtra) {
      if (!uf) return toast.error("Selecione a UF.");
      if (requiresCnpj && !cnpj.trim()) return toast.error("CNPJ é obrigatório para SP.");
      if (requiresCpf && !cpf.trim()) return toast.error("CPF é obrigatório.");
      if (!phone.trim()) return toast.error("Informe o telefone.");
      if (!contactEmail.trim()) return toast.error("Informe o e-mail de contato.");
    }
    if (Number(answer) !== challenge.answer) {
      setChallenge(makeChallenge());
      setAnswer("");
      return toast.error("Resposta do desafio incorreta.");
    }

    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { full_name: fullName },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(traduzErroAuth(error.message));
      setChallenge(makeChallenge());
      setAnswer("");
      return;
    }

    // If Produtor/Revendedor, create account_request (account stays as 'cliente' until approved)
    if (needsExtra && signUpData.user?.id) {
      const { error: reqErr } = await (supabase as any).from("account_requests").insert({
        user_id: signUpData.user.id,
        full_name: fullName,
        email,
        requested_type: accountKind,
        uf,
        cnpj: requiresCnpj ? cnpj : null,
        cpf: requiresCpf ? cpf : null,
        phone,
        contact_email: contactEmail,
      });
      if (reqErr) {
        setLoading(false);
        toast.error("Conta criada, mas a solicitação falhou: " + reqErr.message);
        return;
      }
      toast.success("Solicitação enviada! Aguarde aprovação da equipe Dukamp.");
    } else {
      toast.success("Conta criada! Você já está conectado.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label>Tipo de conta</Label>
        <Select value={accountKind} onValueChange={(v) => setAccountKind(v as AccountKind)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cliente">Consumidor</SelectItem>
            <SelectItem value="revendedor">Revendedor</SelectItem>
            <SelectItem value="produtor">Produtor Rural</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground mt-1">{helper}</p>
      </div>

      <div>
        <Label htmlFor="r-name">Nome completo</Label>
        <Input id="r-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="r-email">E-mail</Label>
        <Input id="r-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="r-password">Senha</Label>
          <Input id="r-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="r-confirm">Confirmar</Label>
          <Input id="r-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
      </div>

      {needsExtra && (
        <div className="space-y-3 rounded-md border bg-muted/40 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>UF</Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="r-phone">Telefone</Label>
              <Input id="r-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
          {requiresCnpj && (
            <div>
              <Label htmlFor="r-cnpj">CNPJ (obrigatório para SP)</Label>
              <Input id="r-cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
          )}
          {requiresCpf && (
            <div>
              <Label htmlFor="r-cpf">CPF</Label>
              <Input id="r-cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>
          )}
          <div>
            <Label htmlFor="r-cemail">E-mail de contato</Label>
            <Input id="r-cemail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="r-challenge">Quanto é {challenge.a} + {challenge.b}?</Label>
        <Input id="r-challenge" inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando..." : needsExtra ? "Enviar solicitação" : "Criar conta"}
      </Button>
    </form>
  );
}
