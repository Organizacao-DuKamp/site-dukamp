import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useServerFn } from "@tanstack/react-start";
import { getOrderPublic } from "@/lib/checkout.functions";
import { useQuery } from "@tanstack/react-query";
import { formatBRL } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pedido/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Pedido — Dukamp" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrderPublic);
  const q = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
    refetchInterval: (query) => {
      const s = query.state.data?.order.payment_status;
      return s === "approved" || s === "rejected" || s === "cancelled" ? false : 5000;
    },
  });

  if (q.isLoading) return <SiteLayout><div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div></SiteLayout>;
  if (q.error || !q.data) return <SiteLayout><div className="py-12 text-center text-destructive">Pedido não encontrado</div></SiteLayout>;

  const { order, items } = q.data;
  const isPaid = order.payment_status === "approved";
  const isFailed = order.payment_status === "rejected" || order.payment_status === "cancelled";

  function copyPix() {
    if (!order.mp_qr_code) return;
    navigator.clipboard.writeText(order.mp_qr_code);
    toast.success("Código Pix copiado");
  }

  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border rounded-lg p-6 bg-card text-center">
          {isPaid ? (
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
          ) : isFailed ? (
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
          ) : (
            <Clock className="h-12 w-12 text-amber-500 mx-auto mb-2 animate-pulse" />
          )}
          <h1 className="text-2xl font-bold">Pedido {order.order_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status: <strong className="uppercase">{order.payment_status}</strong>
          </p>
        </div>

        {!isPaid && !isFailed && order.mp_qr_code_base64 && (
          <div className="border rounded-lg p-6 bg-card space-y-4">
            <h2 className="font-semibold text-lg text-center">Pague com Pix — {formatBRL(Number(order.total))}</h2>
            <img
              src={`data:image/png;base64,${order.mp_qr_code_base64}`}
              alt="QR Code Pix"
              className="mx-auto w-64 h-64 border rounded"
            />
            <div>
              <label className="text-xs text-muted-foreground">Pix copia e cola:</label>
              <div className="flex gap-2 mt-1">
                <textarea
                  readOnly
                  value={order.mp_qr_code || ""}
                  className="flex-1 text-xs p-2 border rounded font-mono h-20 resize-none"
                />
                <Button onClick={copyPix} variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Esta página atualiza automaticamente quando o pagamento for confirmado.
            </p>
          </div>
        )}

        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">Itens</h2>
          <div className="divide-y text-sm">
            {items.map((i, idx) => (
              <div key={idx} className="py-2 flex justify-between">
                <span>{i.quantity}× {i.name}</span>
                <span>{formatBRL(Number(i.subtotal))}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatBRL(Number(order.subtotal))}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Frete ({order.shipping_service})</span><span>{formatBRL(Number(order.shipping_cost))}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatBRL(Number(order.total))}</span></div>
          </div>
        </div>

        <div className="text-center">
          <Button asChild variant="outline"><Link to="/produtos">Continuar comprando</Link></Button>
        </div>
      </div>
    </SiteLayout>
  );
}
