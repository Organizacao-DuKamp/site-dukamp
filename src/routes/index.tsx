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

const PRODUCT_COLS =
  "id,name,slug,code,price,consumer_price,reseller_price,producer_price,pix_price,consumer_pix_price,reseller_pix_price,producer_pix_price,images,brand,stock,installments,catalog_id,featured,created_at";

function Home() {
  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_COLS)
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
        .select("id,name,slug,active")
        .eq("active", true)
        .order("name");
      return data ?? [];
    },
  });
  const catIds = (categories.data ?? []).map((c) => c.id).sort().join(",");
  // One query for all categories, grouped client-side (was N queries)
  const allProducts = useQuery({
    enabled: !!categories.data && categories.data.length > 0,
    queryKey: ["products", "home-by-cat", catIds],
    queryFn: async () => {
      const ids = (categories.data ?? []).map((c) => c.id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_COLS)
        .eq("active", true)
        .gt("stock", 0)
        .in("catalog_id", ids)
        .order("created_at", { ascending: false });
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
          {featured.data?.map((p, i) => (
            <ProductCard key={p.id} p={p as any} eager={i < 5} />
          ))}
        </div>
      </section>

      {(() => {
        type CatSec = { cat: { id: string; name: string; slug: string }; prods: any[] };
        const sections: CatSec[] = (categories.data ?? [])
          .map((cat) => ({
            cat,
            prods: (allProducts.data ?? []).filter((p) => p.catalog_id === cat.id).slice(0, 8),
          }))
          .filter((s) => s.prods.length > 0);

        // Pack consecutive "small" categories (<=2 items) into side-by-side pairs
        const rows: CatSec[][] = [];
        for (let i = 0; i < sections.length; i++) {
          const cur = sections[i];
          const nxt = sections[i + 1];
          if (cur.prods.length <= 2 && nxt && nxt.prods.length <= 2) {
            rows.push([cur, nxt]);
            i++;
          } else {
            rows.push([cur]);
          }
        }

        const renderSection = (s: CatSec, paired: boolean) => (
          <section className="h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide border-l-4 border-primary pl-3">
                {s.cat.name}
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/produtos" search={{ categoria: s.cat.slug } as any}>
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div
              className={
                paired
                  ? "grid grid-cols-2 gap-3"
                  : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
              }
            >
              {s.prods.map((p) => (
                <ProductCard key={p.id} p={p as any} />
              ))}
            </div>
          </section>
        );

        return rows.map((row, rowIdx) => {
          const key = row.map((s) => s.cat.id).join("+");
          const content =
            row.length === 2 ? (
              <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8 lg:divide-x lg:divide-border">
                <div className="lg:pr-8">{renderSection(row[0], true)}</div>
                <div className="lg:pl-8">{renderSection(row[1], true)}</div>
              </div>
            ) : (
              <div className="mt-10">{renderSection(row[0], false)}</div>
            );
          if (rowIdx === 0) return <div key={key}>{content}</div>;
          return (
            <LazyMount key={key} minHeight={480}>
              {content}
            </LazyMount>
          );
        });
      })()}
    </SiteLayout>
  );
}
