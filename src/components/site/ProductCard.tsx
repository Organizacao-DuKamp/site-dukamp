import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart, formatBRL } from "@/lib/cart";
import { useSiteSettings, whatsappLink } from "@/lib/site-settings";
import { useAuth, priceForAccount, pixPriceForAccount } from "@/lib/auth";
import { toast } from "sonner";

export type ProductLite = {
  id: string;
  name: string;
  slug: string;
  code: string;
  price: number;
  consumer_price?: number | null;
  reseller_price?: number | null;
  producer_price?: number | null;
  pix_price: number | null;
  consumer_pix_price?: number | null;
  reseller_pix_price?: number | null;
  producer_pix_price?: number | null;
  images: string[];
  brand: string | null;
  stock: number;
  installments?: number | null;
};

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l.6.95-1 3.648 3.74-.978.94.42zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
  </svg>
);

export function ProductCard({ p }: { p: ProductLite }) {
  const { add } = useCart();
  const { data: settings } = useSiteSettings();
  const { accountType } = useAuth();
  const image = p.images?.[0] || "/placeholder.svg";
  const installments = Math.max(1, Number(p.installments ?? 1));
  const displayPrice = priceForAccount(p, accountType);
  const displayPix = pixPriceForAccount(p, accountType);
  const parcela = displayPrice / installments;
  const tierLabel = accountType === "produtor" ? "Produtor Rural" : null;
  const wa = whatsappLink(
    settings?.phone,
    `Olá, tenho interesse no produto: ${p.name} (cód. ${p.code}) - ${formatBRL(displayPrice)}`,
  );

  const stopNav = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="group relative rounded-lg border bg-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
    >
      <Link
        to="/produtos/$slug"
        params={{ slug: p.slug }}
        preload="intent"
        aria-label={`Ver detalhes de ${p.name}`}
        className="absolute inset-0 z-10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="sr-only">Ver detalhes de {p.name}</span>
      </Link>
      <div className="aspect-square bg-white overflow-hidden">
        <img src={image} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
      </div>
      <div className="p-3 flex-1 flex flex-col">
        {p.brand && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.brand}</div>}
        <div className="font-medium text-sm line-clamp-2 mt-1 min-h-[2.5rem] group-hover:text-primary">
          {p.name}
        </div>
        <div className="mt-3 space-y-0.5">
          {tierLabel && <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">Preço {tierLabel}</div>}
          <div className="text-xl font-bold text-foreground">{formatBRL(displayPrice)}</div>
          {displayPix != null && (
            <div className="text-xs text-primary font-medium">ou {formatBRL(displayPix)} no PIX</div>
          )}
          {installments > 1 && (
            <div className="text-xs text-muted-foreground">
              em até {installments}x de {formatBRL(parcela)}
            </div>
          )}
        </div>
        <div className="mt-auto pt-3 space-y-2">
          <Button
            size="sm"
            className="relative z-20 w-full"
            disabled={p.stock <= 0}
            onClick={(e) => {
              stopNav(e);
              add({ id: p.id, name: p.name, price: displayPrice, image });
              toast.success("Adicionado ao carrinho");
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-1" /> {p.stock > 0 ? "Comprar" : "Indisponível"}
          </Button>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="relative z-20 w-full inline-flex items-center justify-center gap-1 rounded-md bg-[#25D366] hover:bg-[#1ebe57] text-white text-sm font-medium h-9 px-3 transition-colors"
          >
            <WhatsAppIcon className="h-4 w-4" /> Comprar pelo WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
