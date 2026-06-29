import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contato")({
  head: () => ({ meta: [{ title: "Contato — Dukamp" }] }),
  component: () => (
    <SiteLayout>
      <h1 className="text-2xl font-bold">Contato</h1>
      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); toast.success("Mensagem enviada!"); }}
        >
          <Input placeholder="Seu nome" required />
          <Input type="email" placeholder="Seu e-mail" required />
          <Textarea placeholder="Mensagem" rows={5} required />
          <Button type="submit">Enviar</Button>
        </form>
        <div className="text-sm text-muted-foreground space-y-2">
          <div><strong className="text-foreground">E-mail:</strong> contato@dukamp.com.br</div>
          <div><strong className="text-foreground">Telefone:</strong> (00) 0000-0000</div>
          <div><strong className="text-foreground">Endereço:</strong> Rua Exemplo, 123 — Cidade/UF</div>
        </div>
      </div>
    </SiteLayout>
  ),
});
