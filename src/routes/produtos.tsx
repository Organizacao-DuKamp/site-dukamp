import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";

type Search = { q?: string; categoria?: string };

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Dukamp" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
  }),
  component: Page,
});

function Page() {
  const { q, categoria } = Route.useSearch();
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const catId = cats.data?.find((c) => c.slug === categoria)?.id;
  const prods = useQuery({
    queryKey: ["products", { q, catId }],
    queryFn: async () => {
      let qy = supabase.from("products").select("*").eq("active", true);
      if (catId) qy = qy.eq("category_id", catId);
      if (q) qy = qy.ilike("name", `%${q}%`);
      const { data } = await qy.order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <SiteLayout>
      <h1 className="text-2xl font-bold mb-2">Produtos</h1>
      {q && <p className="text-sm text-muted-foreground mb-4">Resultados para "{q}"</p>}
      {categoria && <p className="text-sm text-muted-foreground mb-4">Categoria: {categoria}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {prods.data?.map((p) => <ProductCard key={p.id} p={p as any} />)}
      </div>
      {prods.data?.length === 0 && <p className="text-muted-foreground">Nenhum produto encontrado.</p>}
    </SiteLayout>
  );
}
