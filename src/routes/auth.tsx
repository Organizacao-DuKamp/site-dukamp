import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { traduzErroAuth } from "@/lib/auth-errors";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Dukamp" }] }),
  component: AuthPage,
});

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
      <div className="w-full max-w-sm">
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

function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [challenge, setChallenge] = useState(makeChallenge);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Informe seu nome completo.");
    if (password.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não conferem.");
    if (Number(answer) !== challenge.answer) {
      setChallenge(makeChallenge());
      setAnswer("");
      return toast.error("Resposta do desafio incorreta.");
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(traduzErroAuth(error.message));
      setChallenge(makeChallenge());
      setAnswer("");
    } else {
      toast.success("Conta criada! Você já está conectado.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="r-name">Nome completo</Label>
        <Input id="r-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="r-email">E-mail</Label>
        <Input id="r-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="r-password">Senha</Label>
        <Input id="r-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="r-confirm">Confirmar senha</Label>
        <Input id="r-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="r-challenge">
          Quanto é {challenge.a} + {challenge.b}?
        </Label>
        <Input
          id="r-challenge"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
