import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/sobre")({
  head: () => ({ meta: [{ title: "Sobre — Dukamp Saúde Animal" }] }),
  component: () => (
    <SiteLayout>
      <h1 className="text-2xl font-bold">Sobre a Dukamp</h1>
      <div className="prose prose-sm max-w-none mt-4 text-muted-foreground space-y-4">
        <p>A Dukamp Saúde Animal atua há mais de 20 anos no mercado de produtos veterinários, oferecendo soluções confiáveis para cães, gatos e bovinos.</p>
        <p>Nossa missão é cuidar da saúde dos animais com produtos de qualidade, procedência garantida e atendimento especializado.</p>
      </div>
    </SiteLayout>
  ),
});
