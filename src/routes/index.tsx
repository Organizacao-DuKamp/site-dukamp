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
        .limit(12);
      return data ?? [];
    },
  });
  const categories = useQuery({
    queryKey: ["categories", "active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      return data ?? [];
    },
  });
  const allProducts = useQuery({
    queryKey: ["products", "all-by-cat"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("active", true).limit(100);
      return data ?? [];
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
          {featured.data?.map((p) => (
            <ProductCard key={p.id} p={p as any} />
          ))}
        </div>
      </section>

      {categories.data?.map((cat) => {
        const prods = (allProducts.data ?? []).filter((p) => p.category_id === cat.id).slice(0, 8);
        if (prods.length === 0) return null;
        return (
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
      })}
    </SiteLayout>
  );
}
