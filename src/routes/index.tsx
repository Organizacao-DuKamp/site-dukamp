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
        type CatSec = {
          cat: { id: string; name: string; slug: string };
          prods: any[];
          n: 1 | 2 | 3 | 4 | 5;
        };
        const sections: CatSec[] = (categories.data ?? [])
          .map((cat) => {
            const prods = (allProducts.data ?? [])
              .filter((p) => p.catalog_id === cat.id)
              .slice(0, 5);
            return { cat, prods, n: prods.length as CatSec["n"] };
          })
          .filter((s) => s.prods.length > 0);

        // Bin-pack por busca de subconjunto: para cada linha, procuramos o
        // grupo de categorias (entre as restantes) cuja soma de larguras se
        // aproxime mais de 5 sem ultrapassar. Isso permite reordenar (ex.:
        // trazer OVINOS n=1 pra completar uma linha que já tem n=4) em vez
        // de deixar categorias pequenas isoladas.
        const remaining = [...sections];
        const rows: CatSec[][] = [];
        const CAP = 5;
        const pickRow = (): number[] => {
          let best: number[] = [];
          let bestSum = 0;
          const dfs = (start: number, cap: number, sum: number, idxs: number[]) => {
            if (sum > bestSum) {
              bestSum = sum;
              best = idxs.slice();
            }
            if (bestSum === CAP) return;
            for (let i = start; i < remaining.length; i++) {
              const n = remaining[i].n;
              if (n <= cap) {
                idxs.push(i);
                dfs(i + 1, cap - n, sum + n, idxs);
                idxs.pop();
                if (bestSum === CAP) return;
              }
            }
          };
          dfs(0, CAP, 0, []);
          return best;
        };
        while (remaining.length) {
          const idxs = pickRow();
          if (idxs.length === 0) break;
          const row = idxs.map((i) => remaining[i]); // ordem original preservada
          for (let k = idxs.length - 1; k >= 0; k--) remaining.splice(idxs[k], 1);
          rows.push(row);
        }


        // Static class maps so Tailwind JIT picks them up.
        // Packing só é ativado a partir do 2xl (>=1536px), onde 5 colunas
        // garantem ~290px por card. Abaixo disso, cada seção ocupa a linha
        // inteira com seu grid interno responsivo — nunca esprememos cards
        // para forçar encaixe lateral.
        const spanCls: Record<CatSec["n"], string> = {
          1: "2xl:col-span-1",
          2: "2xl:col-span-2",
          3: "2xl:col-span-3",
          4: "2xl:col-span-4",
          5: "2xl:col-span-5",
        };
        const innerCls: Record<CatSec["n"], string> = {
          1: "2xl:grid-cols-1",
          2: "2xl:grid-cols-2",
          3: "2xl:grid-cols-3",
          4: "2xl:grid-cols-4",
          5: "2xl:grid-cols-5",
        };

        return rows.map((row, rowIdx) => {
          const key = row.map((s) => s.cat.id).join("+");
          const content = (
            <div className="mt-10 grid grid-cols-1 gap-6 2xl:grid-cols-5 2xl:gap-6">
              {row.map((s, i) => (
                <section
                  key={s.cat.id}
                  className={`min-w-0 ${spanCls[s.n]} ${
                    row.length > 1 && i > 0
                      ? "2xl:border-l 2xl:border-border 2xl:pl-6"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide border-l-4 border-primary pl-3 truncate min-w-0">
                      {s.cat.name}
                    </h2>
                    <Button asChild variant="ghost" size="sm" className="shrink-0">
                      <Link to="/produtos" search={{ categoria: s.cat.slug } as any}>
                        Ver todos <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${innerCls[s.n]} gap-3`}
                  >
                    {s.prods.map((p) => (
                      <ProductCard key={p.id} p={p as any} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
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
