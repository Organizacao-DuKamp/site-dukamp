import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatBRL, useCart } from "@/lib/cart";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/produtos/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const { data: p } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await supabase.from("products").select("*").eq("slug", slug).maybeSingle()).data,
  });
  if (!p) return <SiteLayout><p>Produto não encontrado.</p></SiteLayout>;
  const image = p.images?.[0] || "/placeholder.svg";
  return (
    <SiteLayout>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-lg bg-muted overflow-hidden">
          <img src={image} alt={p.name} className="w-full h-full object-cover" />
        </div>
        <div>
          {p.brand && <div className="text-xs uppercase text-muted-foreground tracking-wider">{p.brand}</div>}
          <h1 className="text-2xl font-bold mt-1">{p.name}</h1>
          <div className="text-xs text-muted-foreground mt-1">Cód: {p.code}</div>
          <div className="mt-4">
            <div className="text-3xl font-bold">{formatBRL(p.price)}</div>
            {p.pix_price && <div className="text-sm text-primary mt-1">ou {formatBRL(p.pix_price)} no PIX</div>}
            {p.installments > 1 && <div className="text-sm text-muted-foreground">em até {p.installments}x sem juros</div>}
          </div>
          <Button
            className="mt-6 w-full md:w-auto"
            disabled={p.stock <= 0}
            onClick={() => { add({ id: p.id, name: p.name, price: p.price, image }); toast.success("Adicionado ao carrinho"); }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" /> {p.stock > 0 ? "Adicionar ao carrinho" : "Indisponível"}
          </Button>
          <div className="mt-6 text-sm text-muted-foreground">
            <div>Estoque: {p.stock}</div>
            <div>Peso: {p.weight} kg</div>
          </div>
          {p.description && (
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Descrição</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description}</p>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
