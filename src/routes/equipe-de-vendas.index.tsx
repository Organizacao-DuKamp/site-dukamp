import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useActiveSellers } from "@/lib/sellers";
import { SellerCard } from "@/components/sellers/SellerCard";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/equipe-de-vendas/")({
  head: () => ({
    meta: [
      { title: "Equipe de Vendas — Dukamp" },
      { name: "description", content: "Conheça nossa equipe de vendas Dukamp. Fale diretamente com um representante da sua região pelo WhatsApp." },
      { property: "og:title", content: "Equipe de Vendas — Dukamp" },
      { property: "og:description", content: "Conheça nossa equipe de vendas Dukamp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellersPage,
});

function SellersPage() {
  const { data: sellers, isLoading } = useActiveSellers();

  return (
    <SiteLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground">Equipe de Vendas</h1>
        <p className="text-muted-foreground mt-2">
          Fale diretamente com um dos nossos representantes.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !sellers?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          Nenhum vendedor cadastrado ainda.
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {sellers.map((s) => (
            <SellerCard key={s.id} seller={s} />
          ))}
        </div>
      )}
    </SiteLayout>
  );
}
