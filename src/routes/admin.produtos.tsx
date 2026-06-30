import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ResourceCrud } from "@/components/admin/ResourceCrud";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/produtos")({
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const cats = useQuery({
    queryKey: ["categories", "opts"],
    queryFn: async () => (await supabase.from("categories").select("id,name").order("name")).data ?? [],
  });
  const catalogs = useQuery({
    queryKey: ["catalogs", "opts"],
    queryFn: async () => (await supabase.from("catalogs").select("id,name").order("name")).data ?? [],
  });

  return (
    <ResourceCrud
      title="Produtos"
      table="products"
      orderBy={{ column: "created_at", ascending: false }}
      columns={[
        { key: "name", label: "Nome" },
        { key: "code", label: "Código" },
        { key: "consumer_price", label: "Cliente", format: (v) => v != null ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—" },
        { key: "reseller_price", label: "Revendedor", format: (v) => v != null ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—" },
        { key: "producer_price", label: "Produtor", format: (v) => v != null ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—" },
        { key: "stock", label: "Estoque" },
        { key: "active", label: "Ativo", format: (v) => v ? "Sim" : "Não" },
      ]}
      fields={[
        { name: "name", label: "Nome", required: true },
        { name: "code", label: "Código", required: true },
        { name: "slug", label: "Slug (URL)", required: true },
        { name: "brand", label: "Marca" },
        { name: "category_id", label: "Categoria", type: "select", options: (cats.data ?? []).map((c) => ({ value: c.id, label: c.name })) },
        { name: "catalog_id", label: "Catálogo", type: "select", options: (catalogs.data ?? []).map((c) => ({ value: c.id, label: c.name })) },
        { name: "consumer_price", label: "Preço — Cliente", type: "number", step: "0.01", required: true, defaultValue: 0 },
        { name: "reseller_price", label: "Preço — Revendedor", type: "number", step: "0.01" },
        { name: "producer_price", label: "Preço — Produtor", type: "number", step: "0.01" },
        { name: "price", label: "Preço base (legado)", type: "number", step: "0.01", defaultValue: 0 },
        { name: "pix_price", label: "Preço PIX (legado)", type: "number", step: "0.01" },
        { name: "consumer_pix_price", label: "PIX — Cliente", type: "number", step: "0.01" },
        { name: "reseller_pix_price", label: "PIX — Revendedor", type: "number", step: "0.01" },
        { name: "producer_pix_price", label: "PIX — Produtor", type: "number", step: "0.01" },
        { name: "installments", label: "Parcelas", type: "number", defaultValue: 1 },
        { name: "stock", label: "Estoque", type: "number", defaultValue: 0 },
        { name: "weight", label: "Peso (kg)", type: "number", step: "0.001", defaultValue: 0 },
        { name: "description", label: "Descrição", type: "textarea" },
        { name: "images", label: "Imagens", type: "imageList" },
        { name: "active", label: "Ativo", type: "boolean", defaultValue: true },
        { name: "featured", label: "Destaque", type: "boolean", defaultValue: false },
      ]}
    />
  );
}
