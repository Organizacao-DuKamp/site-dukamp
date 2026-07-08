import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { LazyMount } from "@/components/site/LazyMount";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dukamp Saúde Animal — Catálogo de Produtos Veterinários" },
      {
        name: "description",
        content:
          "Catálogo Dukamp Saúde Animal: vermífugos, vacinas, suplementos e rações para bovinos, equinos, ovinos, suínos, aves e pets.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("featured", true)
        .gt("stock", 0)
        .limit(12);
      return data ?? [];
    },
  });
  const categories = useQuery({
    queryKey: ["catalogs", "active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("catalogs")
        .select("*")
        .eq("active", true)
        .order("name");
      return data ?? [];
    },
  });
  const catIds = (categories.data ?? []).map((c) => c.id).sort().join(",");
  const allProducts = useQuery({
    enabled: !!categories.data && categories.data.length > 0,
    queryKey: ["products", "by-cat", catIds],
    queryFn: async () => {
      const ids = (categories.data ?? []).map((c) => c.id);
      const results = await Promise.all(
        ids.map((id) =>
          supabase
            .from("products")
            .select("*")
            .eq("active", true)
            .gt("stock", 0)
            .eq("catalog_id", id)
            .order("created_at", { ascending: false })
            .limit(8),
        ),
      );
      return results.flatMap((r) => r.data ?? []);
    },
  });


  return (
    <SiteLayout>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wide border-l-4 border-primary pl-3">
            Produtos em destaque
          </h1>
          <Button asChild variant="ghost" size="sm">
            <Link to="/produtos">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {featured.data?.map((p, i) => (
            <ProductCard key={p.id} p={p as any} eager={i < 5} />
          ))}
        </div>
      </section>

      {categories.data?.map((cat, catIdx) => {
        const prods = (allProducts.data ?? []).filter((p) => p.catalog_id === cat.id).slice(0, 8);
        if (prods.length === 0) return null;
        const content = (
          <section key={cat.id} className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide border-l-4 border-primary pl-3">
                {cat.name}
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/produtos" search={{ categoria: cat.slug } as any}>
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {prods.map((p) => (
                <ProductCard key={p.id} p={p as any} />
              ))}
            </div>
          </section>
        );
        // First category renders immediately; the rest mount as the user scrolls near them
        if (catIdx === 0) return content;
        return (
          <LazyMount key={cat.id} minHeight={480}>
            {content}
          </LazyMount>
        );
      })}
    </SiteLayout>
  );
}

    </SiteLayout>
  );
}
