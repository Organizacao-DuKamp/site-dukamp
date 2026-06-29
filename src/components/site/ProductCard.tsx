import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart, formatBRL } from "@/lib/cart";
import { toast } from "sonner";

export type ProductLite = {
  id: string;
  name: string;
  slug: string;
  code: string;
  price: number;
  pix_price: number | null;
  images: string[];
  brand: string | null;
  stock: number;
};

export function ProductCard({ p }: { p: ProductLite }) {
  const { add } = useCart();
  const image = p.images?.[0] || "/placeholder.svg";
  return (
    <div className="group rounded-lg border bg-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      <Link to="/produtos/$slug" params={{ slug: p.slug }} className="aspect-square bg-muted overflow-hidden block">
        <img src={image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      </Link>
      <div className="p-3 flex-1 flex flex-col">
        {p.brand && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.brand}</div>}
        <Link to="/produtos/$slug" params={{ slug: p.slug }} className="font-medium text-sm line-clamp-2 mt-1 hover:text-primary">
          {p.name}
        </Link>
        <div className="mt-auto pt-3">
          <div className="text-lg font-bold text-foreground">{formatBRL(p.price)}</div>
          {p.pix_price && (
            <div className="text-xs text-primary">ou {formatBRL(p.pix_price)} no PIX</div>
          )}
          <Button
            size="sm"
            className="w-full mt-2"
            disabled={p.stock <= 0}
            onClick={() => {
              add({ id: p.id, name: p.name, price: p.price, image });
              toast.success("Adicionado ao carrinho");
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-1" /> {p.stock > 0 ? "Comprar" : "Indisponível"}
          </Button>
        </div>
      </div>
    </div>
  );
}
