import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminSalesStats } from "@/lib/orders.functions";
import { Loader2, TrendingUp, Receipt, Wallet, Package, Clock } from "lucide-react";
import { formatBRL } from "@/lib/cart";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/vendas/painel")({
  component: PainelVendas,
});

function Card({ icon: Icon, label, value, hint, className }: { icon: any; label: string; value: string; hint?: string; className?: string }) {
  return (
    <div className={`border rounded-lg p-4 bg-card ${className ?? ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function PainelVendas() {
  const fetchStats = useServerFn(adminSalesStats);
  const q = useQuery({
    queryKey: ["admin-sales-stats"],
    queryFn: () => fetchStats(),
  });

  if (q.isLoading || !q.data) {
    return <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  }
  const s = q.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel de Vendas</h1>
        <p className="text-sm text-muted-foreground">Resumo dos últimos 30 dias.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={TrendingUp} label="Faturamento bruto" value={formatBRL(s.bruto)} hint={`${s.ordersCount} pedidos aprovados`} />
        <Card icon={Wallet} label="Faturamento líquido" value={formatBRL(s.liquido)} hint="Após taxas do Mercado Pago" />
        <Card icon={Receipt} label="Taxas Mercado Pago" value={formatBRL(s.taxas)} hint={`${(s.taxaPct * 100).toFixed(2)}% Pix`} />
        <Card icon={Clock} label="Pagamentos pendentes" value={String(s.pendingCount)} hint="Aguardando confirmação" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card icon={Package} label="Entregas em aberto" value={String(s.openDeliveries)} hint="Preparando ou a caminho" />
        <Card icon={TrendingUp} label="Ticket médio" value={formatBRL(s.ordersCount ? s.bruto / s.ordersCount : 0)} />
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <h2 className="font-semibold mb-4">Vendas dos últimos 7 dias</h2>
        <ChartContainer
          config={{ total: { label: "Total", color: "var(--color-primary)" } }}
          className="h-64 w-full"
        >
          <BarChart data={s.week}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `R$${Number(v).toFixed(0)}`} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatBRL(Number(v))} />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
