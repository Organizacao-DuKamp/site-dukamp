import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSellerBySlug } from "@/lib/sellers";
import { SellerProfileBanner } from "@/components/sellers/SellerProfileBanner";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/equipe-de-vendas/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Equipe de Vendas Dukamp` },
      { property: "og:title", content: `Equipe de Vendas Dukamp` },
      { property: "og:type", content: "profile" },
    ],
  }),
  component: SellerDetailPage,
});

function SellerDetailPage() {
  const { slug } = Route.useParams();
  const { data: seller, isLoading } = useSellerBySlug(slug);

  return (
    <SiteLayout>
      <Link
        to="/equipe-de-vendas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à equipe
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !seller ? (
        <div className="text-center py-16 text-muted-foreground">Vendedor não encontrado.</div>
      ) : (
        <SellerProfileBanner seller={seller} />
      )}
    </SiteLayout>
  );
}
