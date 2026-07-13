import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
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
  "id,name,slug,code,price,consumer_price,reseller_price,producer_price,pix_price,consumer_pix_price,reseller_pix_price,producer_pix_price,images,brand,stock,installments,catalog_id,featured,created_at,category_position";

const HOME_PRODUCT_LIMIT = 5;

function Home() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
        .select("id,name,slug,active,sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
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
      <section className="lg:min-h-[calc(100vh-var(--site-header-offset,12rem))] lg:pb-8">
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
        <div className="product-showcase-grid">
          {featured.data?.map((p, i) => (
            <div key={p.id} className="product-showcase-card">
              <ProductCard p={p as any} eager={i < HOME_PRODUCT_LIMIT} />
            </div>
          ))}
        </div>
      </section>

      {(() => {
        const sections = (categories.data ?? [])
          .map((cat) => {
            const prods = (allProducts.data ?? [])
              .filter((p) => p.catalog_id === cat.id)
              .sort((a: any, b: any) => {
                const ap = a.category_position;
                const bp = b.category_position;
                if (ap != null && bp != null) return ap - bp;
                if (ap != null) return -1;
                if (bp != null) return 1;
                return (
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
                );
              });
            return { cat, prods };
          })
          .filter((s) => s.prods.length > 0);

        // Group consecutive small categories (<=2 visible products, not expanded)
        // into shared rows so they sit side-by-side on desktop.
        type Row = { small: boolean; items: typeof sections; slots: number };
        const rows: Row[] = [];
        let current: Row | null = null;
        for (const s of sections) {
          const isExpanded = !!expanded[s.cat.id];
          const vc = Math.min(s.prods.length, HOME_PRODUCT_LIMIT);
          const isSmall = !isExpanded && vc <= 2;
          if (isSmall) {
            if (current && current.slots + vc <= HOME_PRODUCT_LIMIT) {
              current.items.push(s);
              current.slots += vc;
            } else {
              if (current) rows.push(current);
              current = { small: true, items: [s], slots: vc };
            }
          } else {
            if (current) { rows.push(current); current = null; }
            rows.push({ small: false, items: [s], slots: HOME_PRODUCT_LIMIT });
          }
        }
        if (current) rows.push(current);

        const renderSection = (s: (typeof sections)[number]) => {
          const isExpanded = !!expanded[s.cat.id];
          const hasMore = s.prods.length > HOME_PRODUCT_LIMIT;
          const visible = isExpanded
            ? s.prods
            : s.prods.slice(0, HOME_PRODUCT_LIMIT);
          return (
            <section className="mt-10 min-w-0">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide border-l-4 border-primary pl-3 truncate min-w-0">
                  {s.cat.name}
                </h2>
                {hasMore ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [s.cat.id]: !prev[s.cat.id],
                      }))
                    }
                  >
                    {isExpanded ? "Ver menos" : "Ver todos"}{" "}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link to="/produtos" search={{ categoria: s.cat.slug } as any}>
                      Ver todos <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
              <div className="product-showcase-grid">
                {visible.map((p) => (
                  <div key={p.id} className="product-showcase-card">
                    <ProductCard p={p as any} />
                  </div>
                ))}
              </div>
            </section>
          );
        };

        return rows.map((row, idx) => {
          const key = row.items.map((s) => s.cat.id).join("+");
          let content: ReactNode;
          if (row.small && row.items.length > 1) {
            // Side-by-side small categories on lg+, stacked on mobile.
            content = (
              <div
                className="grid grid-cols-1 lg:grid-cols-5 gap-x-6"
                style={{ alignItems: "start" }}
              >
                {row.items.map((s) => {
                  const vc = Math.min(s.prods.length, HOME_PRODUCT_LIMIT);
                  const span =
                    vc >= 5
                      ? "lg:col-span-5"
                      : vc === 4
                        ? "lg:col-span-4"
                        : vc === 3
                          ? "lg:col-span-3"
                          : vc === 2
                            ? "lg:col-span-2"
                            : "lg:col-span-1";
                  return (
                    <div key={s.cat.id} className={span}>
                      {renderSection(s)}
                    </div>
                  );
                })}
              </div>
            );
          } else {
            content = renderSection(row.items[0]);
          }

          if (idx === 0) return <div key={key}>{content}</div>;
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

