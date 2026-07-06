import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCart, formatBRL } from "@/lib/cart";
import { useServerFn } from "@tanstack/react-start";
import { createPixOrder, calculateShipping } from "@/lib/checkout.functions";
import { useSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapCepPicker } from "@/components/site/MapCepPicker";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  CreditCard,
  Lock,
  Truck,
  ShieldCheck,
  ClipboardList,
  MapPin,
  Wallet,
  ShoppingBag,
  Phone,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Finalizar compra — Dukamp" },
      { name: "description", content: "Finalize sua compra na Dukamp Saúde Animal com Pix e entrega para todo o Brasil." },
    ],
  }),
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
  const { data: settings } = useSiteSettings();
  const nav = useNavigate();
  const [form, setForm] = useState<Form>(emptyForm);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [frete, setFrete] = useState<{ valor: number; prazoDias: number; servico: string; dataMaxima?: string } | null>(null);

  const createOrder = useServerFn(createPixOrder);
  const calcFrete = useServerFn(calculateShipping);

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

  async function handleCalcFrete() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return toast.error("Informe um CEP válido (8 números)");
    if (items.length === 0) return;
    if (!form.rua) await lookupCep(cep);
    setLoadingFrete(true);
    try {
      const r = await calcFrete({
        data: {
          cepDestino: cep,
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        },
      });
      setFrete(r);
      toast.success(`Frete ${r.servico}: ${formatBRL(r.valor)} em até ${r.prazoDias} dia(s)`);
    } catch (e) {
      setFrete(null);
      toast.error(e instanceof Error ? e.message : "Erro ao calcular frete");
    } finally {
      setLoadingFrete(false);
    }
  }

  function validateDelivery(): string | null {
    const labels: Record<keyof Form, string> = {
      customer_name: "Nome completo",
      email: "E-mail",
      phone: "Telefone / WhatsApp",
      cpf_cnpj: "CPF ou CNPJ",
      cep: "CEP",
      rua: "Rua / Estrada",
      numero: "Número / KM",
      complemento: "Complemento",
      bairro: "Bairro",
      cidade: "Cidade",
      estado: "UF",
    };
    for (const k of ["customer_name", "email", "phone", "cpf_cnpj", "cep", "rua", "numero", "bairro", "cidade", "estado"] as const) {
      if (!form[k]?.trim()) return `Preencha o campo: ${labels[k]}`;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "E-mail inválido — confira o endereço digitado";
    if (form.estado.length !== 2) return "UF deve ter 2 letras (ex: SP, MG, GO)";
    if (!frete) return "Calcule o frete antes de finalizar";
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
          shipping_cost: frete?.valor ?? 0,
          shipping_service: frete?.servico ?? "A combinar",
          shipping_deadline_days: frete?.prazoDias ?? 0,
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

  const total = subtotal + (frete?.valor ?? 0);
  const totalItens = items.reduce((n, i) => n + i.quantity, 0);
  const suportePhoneDigits = (settings?.phone ?? "").replace(/\D/g, "");
  const suportePhoneDisplay = settings?.phone || "";

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl text-center py-16">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
          <p className="mt-2 text-muted-foreground">Escolha os produtos antes de finalizar a compra.</p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/produtos">Ver produtos</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Finalizar compra</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Revise seu pedido, calcule o frete e finalize com Pix.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            {/* 1 — Revisão */}
            <Section number={1} icon={<ClipboardList className="h-4 w-4" />} title="Seu pedido">
              <div className="space-y-3">
                {items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 sm:gap-4 py-2 border-b last:border-b-0">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white grid place-items-center">
                      {i.image ? (
                        <img src={i.image} alt={i.name} className="h-full w-full object-contain p-1" />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-medium line-clamp-2">{i.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {i.quantity} × {formatBRL(i.price)}
                      </p>
                    </div>
                    <div className="text-sm sm:text-base font-semibold whitespace-nowrap">
                      {formatBRL(i.price * i.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 2 — Entrega */}
            <Section number={2} icon={<MapPin className="h-4 w-4" />} title="Entrega">
              <div className="space-y-6">
                {/* CEP + Calcular frete (destaque) */}
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                  <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Calcule seu frete pelos Correios
                  </Label>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <div className="relative min-w-0">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Digite seu CEP"
                        value={form.cep}
                        onChange={(e) => set("cep", e.target.value)}
                        onBlur={(e) => lookupCep(e.target.value)}
                        className="h-11 text-base font-medium"
                      />
                      {loadingCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleCalcFrete}
                      disabled={loadingFrete || form.cep.replace(/\D/g, "").length !== 8}
                      size="lg"
                      className="h-11 px-4 sm:px-6 gap-2"
                    >
                      {loadingFrete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                      <span className="hidden sm:inline">Calcular frete</span>
                      <span className="sm:hidden">Calcular</span>
                    </Button>
                  </div>
                  {frete && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-background p-3 border">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <div className="text-sm min-w-0">
                        <span className="font-semibold">{frete.servico}</span>
                        <span className="text-muted-foreground"> — entrega em até {frete.prazoDias} dia(s){frete.dataMaxima ? ` (${frete.dataMaxima})` : ""}</span>
                      </div>
                      <div className="ml-auto text-base font-bold text-primary">{formatBRL(frete.valor)}</div>
                    </div>
                  )}
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                  <Field className="sm:col-span-4" label="Rua / Estrada">
                    <Input value={form.rua} onChange={(e) => set("rua", e.target.value)} placeholder="Ex: Estrada da Fazenda, KM 10" />
                  </Field>
                  <Field className="sm:col-span-2" label="Número / KM">
                    <Input value={form.numero} onChange={(e) => set("numero", e.target.value)} placeholder="500" />
                  </Field>
                  <Field className="sm:col-span-4" label="Complemento (opcional)">
                    <Input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} placeholder="Ponto de referência" />
                  </Field>
                  <Field className="sm:col-span-2" label="Bairro">
                    <Input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} placeholder="Zona Rural" />
                  </Field>
                  <Field className="sm:col-span-4" label="Cidade">
                    <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} placeholder="São José do Rio Preto" />
                  </Field>
                  <Field className="sm:col-span-2" label="UF">
                    <Input value={form.estado} maxLength={2} onChange={(e) => set("estado", e.target.value.toUpperCase())} placeholder="SP" className="uppercase" />
                  </Field>
                </div>

                <Separator />

                {/* Dados pessoais */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Dados para contato</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Nome completo">
                      <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="Ex: José Pereira" />
                    </Field>
                    <Field label="Telefone / WhatsApp">
                      <Input value={form.phone} inputMode="tel" onChange={(e) => set("phone", e.target.value)} placeholder="(17) 99999-9999" />
                    </Field>
                    <Field label="E-mail">
                      <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="seunome@email.com" />
                    </Field>
                    <Field label="CPF ou CNPJ">
                      <Input value={form.cpf_cnpj} inputMode="numeric" onChange={(e) => set("cpf_cnpj", e.target.value)} placeholder="Somente números" />
                    </Field>
                  </div>
                </div>
              </div>
            </Section>

            {/* 3 — Pagamento */}
            <Section number={3} icon={<Wallet className="h-4 w-4" />} title="Pagamento">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setMethod("pix")}
                  className={`w-full flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                    method === "pix" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#32bcad] text-white">
                    <PixIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">PIX</p>
                    <p className="text-xs text-muted-foreground">Aprovação imediata — receba mais rápido</p>
                  </div>
                  <div className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${method === "pix" ? "border-primary" : "border-muted-foreground/40"}`}>
                    {method === "pix" && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </button>

                <div className="flex items-center gap-3 rounded-lg border-2 border-dashed p-4 opacity-60 cursor-not-allowed">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Cartão de crédito</p>
                    <p className="text-xs text-muted-foreground">Em breve</p>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 min-w-0">
            <div className="lg:sticky lg:top-6 space-y-4">
              <Card className="border-2 border-primary/30 shadow-md overflow-hidden">
                <CardHeader className="bg-primary/5 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <Row label={`Produtos (${totalItens})`} value={formatBRL(subtotal)} />
                  <Row
                    label="Frete"
                    value={frete ? formatBRL(frete.valor) : <span className="text-muted-foreground text-sm">A calcular</span>}
                  />
                  {frete && (
                    <div className="text-xs text-muted-foreground">
                      Entrega em até <b className="text-foreground">{frete.prazoDias} dia{frete.prazoDias === 1 ? "" : "s"} úte{frete.prazoDias === 1 ? "l" : "is"}</b>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">{formatBRL(total)}</span>
                  </div>

                  <Button
                    type="button"
                    onClick={handleBuy}
                    disabled={loadingPay || method !== "pix"}
                    size="lg"
                    className="w-full h-12 text-base font-bold gap-2 mt-2"
                  >
                    {loadingPay ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
                    PAGAR AGORA
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Ambiente seguro · Mercado Pago
                  </div>
                </CardContent>
              </Card>

              {suportePhoneDigits && (
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-sm font-semibold">Precisa de ajuda?</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Nossa equipe atende por telefone ou WhatsApp.</p>
                    <div className="mt-3 space-y-2">
                      <a
                        href={`tel:${suportePhoneDigits}`}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
                      >
                        <Phone className="h-4 w-4 text-primary" />
                        {suportePhoneDisplay}
                      </a>
                      <a
                        href={`https://wa.me/${suportePhoneDigits}`}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-2 rounded-md bg-[#25D366] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1ebe57] transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chamar no WhatsApp
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

/* ---------- pieces ---------- */

function Section({
  number,
  icon,
  title,
  children,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {number}
          </span>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
          <span className="min-w-0 truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function PixIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
