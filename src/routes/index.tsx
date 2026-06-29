import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dukamp Saúde Animal — E-commerce Veterinário" },
      { name: "description", content: "Produtos veterinários para cães, gatos e bovinos. Vermífugos, vacinas, rações e mais." },
    ],
  }),
  component: Home,
});

function Home() {
  const banners = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data } = await supabase.from("banners").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });
  const catalogs = useQuery({
    queryKey: ["catalogs", "active"],
    queryFn: async () => {
      const { data } = await supabase.from("catalogs").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });
  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products").select("*").eq("active", true).eq("featured", true).limit(8);
      return data ?? [];
    },
  });
  const categories = useQuery({
    queryKey: ["categories", "active"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });
  const allProducts = useQuery({
    queryKey: ["products", "all-by-cat"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("active", true).limit(50);
      return data ?? [];
    },
  });

  const heroBanner = banners.data?.[0];

  return (
    <SiteLayout>
      {heroBanner && (
        <Link to={heroBanner.link_url ?? "/produtos"} className="block rounded-xl overflow-hidden bg-gradient-to-r from-primary/90 to-primary text-primary-foreground relative aspect-[16/6] min-h-[180px]">
          {heroBanner.image_url && (
            <img src={heroBanner.image_url} alt={heroBanner.title} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40" />
          )}
          <div className="relative h-full flex flex-col justify-center p-6 md:p-10">
            <h2 className="text-2xl md:text-4xl font-bold max-w-lg">{heroBanner.title}</h2>
            {heroBanner.subtitle && <p className="mt-2 text-sm md:text-base opacity-90 max-w-md">{heroBanner.subtitle}</p>}
          </div>
        </Link>
      )}

      {banners.data && banners.data.length > 1 && (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {banners.data.slice(1, 3).map((b) => (
            <Link key={b.id} to={b.link_url ?? "/produtos"} className="rounded-lg overflow-hidden bg-accent aspect-[16/8] relative">
              {b.image_url && <img src={b.image_url} alt={b.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
              <div className="relative h-full p-4 flex flex-col justify-center">
                <div className="font-semibold">{b.title}</div>
                {b.subtitle && <div className="text-xs text-muted-foreground">{b.subtitle}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Catálogos</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/catalogos">Ver todos <ChevronRight className="h-4 w-4" /></Link></Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {catalogs.data?.map((c) => (
            <Link
              key={c.id}
              to="/catalogos/$slug"
              params={{ slug: c.slug }}
              className="rounded-lg border bg-card p-4 hover:shadow-md hover:border-primary transition-all"
            >
              <div className="font-semibold">{c.name}</div>
              {c.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</div>}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Produtos em destaque</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/produtos">Ver todos <ChevronRight className="h-4 w-4" /></Link></Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {featured.data?.map((p) => <ProductCard key={p.id} p={p as any} />)}
        </div>
      </section>

      {categories.data?.map((cat) => {
        const prods = (allProducts.data ?? []).filter((p) => p.category_id === cat.id).slice(0, 4);
        if (prods.length === 0) return null;
        return (
          <section key={cat.id} className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{cat.name}</h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/produtos" search={{ categoria: cat.slug } as any}>Ver todos <ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {prods.map((p) => <ProductCard key={p.id} p={p as any} />)}
            </div>
          </section>
        );
      })}
    </SiteLayout>
  );
}
