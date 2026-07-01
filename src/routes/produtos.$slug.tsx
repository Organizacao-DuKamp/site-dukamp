import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { formatBRL, useCart } from "@/lib/cart";
import { useAuth, priceForAccount, pixPriceForAccount } from "@/lib/auth";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RichContent } from "@/components/site/RichContent";


export const Route = createFileRoute("/produtos/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const { accountType } = useAuth();
  const [activeImg, setActiveImg] = useState(0);
  const { data: p, isLoading, isFetched } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await supabase.from("products").select("*").eq("slug", slug).maybeSingle()).data,
  });
  if (isLoading || !isFetched) {
    return (
      <SiteLayout>
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square rounded-lg bg-muted" />
          <div className="space-y-3">
            <div className="h-6 w-2/3 bg-muted rounded" />
            <div className="h-4 w-1/3 bg-muted rounded" />
            <div className="h-10 w-1/2 bg-muted rounded mt-6" />
            <div className="h-10 w-40 bg-muted rounded mt-4" />
          </div>
        </div>
      </SiteLayout>
    );
  }
  if (!p) return <SiteLayout><p>Produto não encontrado.</p></SiteLayout>;
  const images: string[] = (p.images && p.images.length > 0) ? p.images : ["/placeholder.svg"];
  const displayPrice = priceForAccount(p as any, accountType);
  const displayPix = pixPriceForAccount(p as any, accountType);
  const installments = Math.max(1, Number(p.installments ?? 1));
  const tierLabel = accountType === "produtor" ? "Produtor Rural" : null;
  return (
    <SiteLayout>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          {images.length > 1 ? (
            <Carousel opts={{ loop: true, startIndex: activeImg }} className="w-full">
              <CarouselContent>
                {images.map((src, i) => (
                  <CarouselItem key={i}>
                    <div className="aspect-square rounded-lg bg-white border overflow-hidden">
                      <img src={src} alt={`${p.name} ${i + 1}`} className="w-full h-full object-contain p-4" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          ) : (
            <div className="aspect-square rounded-lg bg-white border overflow-hidden">
              <img src={images[0]} alt={p.name} className="w-full h-full object-contain p-4" />
            </div>
          )}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "aspect-square rounded border bg-white overflow-hidden",
                    activeImg === i ? "ring-2 ring-primary" : "hover:border-primary/60",
                  )}
                >
                  <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          {p.brand && <div className="text-xs uppercase text-muted-foreground tracking-wider">{p.brand}</div>}
          <h1 className="text-2xl font-bold mt-1">{p.name}</h1>
          <div className="text-xs text-muted-foreground mt-1">Cód: {p.code}</div>
          <div className="mt-4">
            {tierLabel && <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">Preço {tierLabel}</div>}
            <div className="text-3xl font-bold">{formatBRL(displayPrice)}</div>
            {displayPix != null && <div className="text-sm text-primary mt-1">ou {formatBRL(displayPix)} no PIX</div>}
            {installments > 1 && <div className="text-sm text-muted-foreground">em até {installments}x sem juros</div>}
          </div>
          <Button
            className="mt-6 w-full md:w-auto"
            disabled={p.stock <= 0}
            onClick={() => { add({ id: p.id, name: p.name, price: displayPrice, image: images[0] }); toast.success("Adicionado ao carrinho"); }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" /> {p.stock > 0 ? "Adicionar ao carrinho" : "Indisponível"}
          </Button>
          <div className="mt-6 text-sm text-muted-foreground">
            <div>Estoque: {p.stock}</div>
            {p.weight != null && <div>Peso: {p.weight} kg</div>}
          </div>
          {p.description && (
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Descrição</h2>
              <RichContent html={p.description} className="text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
