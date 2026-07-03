import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCart, formatBRL } from "@/lib/cart";
import { useServerFn } from "@tanstack/react-start";
import { createPixOrder } from "@/lib/checkout.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard, QrCode, Lock } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  head: () => ({ meta: [{ title: "Finalizar compra — Dukamp" }] }),
  component: CheckoutPage,
});

type Form = {
  customer_name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

const emptyForm: Form = {
  customer_name: "",
  email: "",
  phone: "",
  cpf_cnpj: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

function CheckoutPage() {
  const { items, total: subtotal, clear } = useCart();
  const nav = useNavigate();
  const [form, setForm] = useState<Form>(emptyForm);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [method, setMethod] = useState<"pix" | "card">("pix");

  const createOrder = useServerFn(createPixOrder);


  function set<K extends keyof Form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const j = await r.json();
      if (j.erro) throw new Error("CEP não encontrado");
      setForm((f) => ({
        ...f,
        cep: digits,
        rua: j.logradouro || f.rua,
        bairro: j.bairro || f.bairro,
        cidade: j.localidade || f.cidade,
        estado: j.uf || f.estado,
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  }

  function validateDelivery(): string | null {
    for (const k of ["customer_name", "email", "phone", "cpf_cnpj", "cep", "rua", "numero", "bairro", "cidade", "estado"] as const) {
      if (!form[k]?.trim()) return `Preencha ${k.replace("_", " ")}`;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "E-mail inválido";
    if (form.estado.length !== 2) return "UF deve ter 2 letras";
    return null;
  }


  async function handleBuy() {
    const err = validateDelivery();
    if (err) return toast.error(err);
    if (method !== "pix") return;
    setLoadingPay(true);
    try {
      const r = await createOrder({
        data: {
          ...form,
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price })),
          shipping_cost: 0,
          shipping_service: "A combinar",
          shipping_deadline_days: 0,
        },
      });
      clear();
      nav({ to: "/pedido/$id", params: { id: r.orderId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar pedido");
    } finally {
      setLoadingPay(false);
    }
  }


  const total = subtotal;

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold">Carrinho vazio</h1>
          <Button asChild className="mt-4">
            <Link to="/produtos">Ver produtos</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <h1 className="text-2xl font-bold mb-6">Finalizar compra</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Revisão */}
          <section className="border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-3">1. Revisão do pedido</h2>
            <div className="divide-y">
              {items.map((i) => (
                <div key={i.id} className="py-2 flex justify-between text-sm">
                  <div>
                    <div className="font-medium">{i.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {i.quantity} × {formatBRL(i.price)}
                    </div>
                  </div>
                  <div className="font-semibold">{formatBRL(i.price * i.quantity)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Entrega */}
          <section className="border rounded-lg p-4 bg-card space-y-3">
            <h2 className="font-semibold">2. Dados de entrega</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome completo *"><Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} /></Field>
              <Field label="E-mail *"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Telefone *"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="CPF/CNPJ *"><Input value={form.cpf_cnpj} onChange={(e) => set("cpf_cnpj", e.target.value)} /></Field>
              <Field label="CEP *">
                <div className="flex gap-2">
                  <Input value={form.cep} onChange={(e) => set("cep", e.target.value)} onBlur={(e) => lookupCep(e.target.value)} />
                  {loadingCep && <Loader2 className="h-4 w-4 animate-spin self-center" />}
                </div>
              </Field>
              <Field label="Rua *"><Input value={form.rua} onChange={(e) => set("rua", e.target.value)} /></Field>
              <Field label="Número *"><Input value={form.numero} onChange={(e) => set("numero", e.target.value)} /></Field>
              <Field label="Complemento"><Input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} /></Field>
              <Field label="Bairro *"><Input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} /></Field>
              <Field label="Cidade *"><Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} /></Field>
              <Field label="UF *"><Input maxLength={2} value={form.estado} onChange={(e) => set("estado", e.target.value.toUpperCase())} /></Field>
            </div>
            <p className="text-xs text-muted-foreground">
              O frete será combinado separadamente após a confirmação do pedido.
            </p>
          </section>

          {/* Pagamento */}
          <section className="border rounded-lg p-4 bg-card space-y-3">
            <h2 className="font-semibold">3. Forma de pagamento</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("pix")}
                className={`border rounded-lg p-3 text-left flex items-center gap-3 ${method === "pix" ? "border-primary ring-2 ring-primary/30" : ""}`}
              >
                <QrCode className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium">Pix</div>
                  <div className="text-xs text-muted-foreground">Aprovação imediata</div>
                </div>
              </button>
              <div className="border rounded-lg p-3 flex items-center gap-3 opacity-60 cursor-not-allowed">
                <CreditCard className="h-6 w-6" />
                <div>
                  <div className="font-medium">Cartão de crédito</div>
                  <div className="text-xs text-muted-foreground">Em breve — indisponível no momento</div>
                </div>
              </div>
            </div>
            <Button onClick={handleBuy} disabled={loadingPay || method !== "pix"} className="w-full">
              {loadingPay ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Comprar — {formatBRL(total)}
            </Button>
          </section>

        </div>

        <aside>
          <div className="border rounded-lg p-4 bg-card sticky top-4 space-y-2 text-sm">
            <h2 className="font-semibold">Resumo</h2>
            <Row label="Subtotal" value={formatBRL(subtotal)} />
            <Row label="Frete" value="A combinar" />
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Total</span><span>{formatBRL(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
