import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCart, formatBRL } from "@/lib/cart";
import { useServerFn } from "@tanstack/react-start";
import { createPixOrder, calculateShipping } from "@/lib/checkout.functions";
import { useSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
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
    // Se ainda não temos endereço preenchido, tenta buscar antes
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
  const suportePhoneDisplay = settings?.phone || "(00) 00000-0000";

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl text-center py-20">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-[#0f5132]/10">
            <ShoppingBag className="h-10 w-10 text-[#0f5132]" />
          </div>
          <h1 className="text-3xl font-black text-zinc-800">Seu carrinho está vazio</h1>
          <p className="mt-3 text-lg text-zinc-500">Escolha os produtos antes de finalizar a compra.</p>
          <Button asChild size="lg" className="mt-8 h-14 bg-[#0f5132] px-8 text-lg font-bold uppercase hover:bg-[#0a3a24]">
            <Link to="/produtos">Ver produtos</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl font-sans">
        {/* Título + progresso */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">Finalizar sua compra</h1>
          <p className="mt-2 text-lg text-zinc-500 font-medium">
            Siga os 3 passos abaixo. É simples e seguro.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-8 space-y-8">
            {/* Seção 1 — Revisão */}
            <SectionCard number={1} icon={<ClipboardList className="h-6 w-6" />} title="O que você está comprando">
              <div className="p-6 space-y-4">
                {items.map((i) => (
                  <div key={i.id} className="flex items-center gap-4 sm:gap-6 border-b-2 border-dashed border-zinc-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 grid place-items-center">
                      {i.image ? (
                        <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-800 line-clamp-2">{i.name}</h3>
                      <p className="text-zinc-500 font-bold text-base sm:text-lg">
                        {String(i.quantity).padStart(2, "0")} {i.quantity === 1 ? "Unidade" : "Unidades"} · {formatBRL(i.price)} cada
                      </p>
                      <p className="text-[#0f5132] font-black text-xl sm:text-2xl mt-1">{formatBRL(i.price * i.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Seção 2 — Entrega */}
            <SectionCard number={2} icon={<MapPin className="h-6 w-6" />} title="Onde vamos entregar?">
              <div className="p-6 space-y-8">
                {/* CEP grande + calcular */}
                <div>
                  <label className="block text-lg sm:text-xl font-extrabold text-zinc-700 mb-3">
                    Qual o seu CEP?
                    <span className="ml-2 text-sm font-medium text-zinc-500">(8 números)</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 15000-000"
                        value={form.cep}
                        onChange={(e) => set("cep", e.target.value)}
                        onBlur={(e) => lookupCep(e.target.value)}
                        className="w-full h-16 sm:h-20 rounded-2xl border-4 border-zinc-200 bg-white px-5 sm:px-6 text-2xl sm:text-3xl font-black text-zinc-800 outline-none transition-colors focus:border-[#0f5132]"
                      />
                      {loadingCep && (
                        <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 animate-spin text-[#0f5132]" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleCalcFrete}
                      disabled={loadingFrete || form.cep.replace(/\D/g, "").length !== 8}
                      className="h-16 sm:h-20 rounded-2xl bg-zinc-800 px-8 sm:px-10 font-black text-lg sm:text-xl text-white transition-all hover:bg-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loadingFrete ? <Loader2 className="h-6 w-6 animate-spin" /> : <Truck className="h-6 w-6" />}
                      CALCULAR
                    </button>
                  </div>
                  {frete && (
                    <div className="mt-4 rounded-2xl border-2 border-green-100 bg-green-50 p-4 flex flex-wrap items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-[#0f5132] shrink-0" />
                      <div className="text-base sm:text-lg">
                        <span className="font-black text-[#0f5132] uppercase">{frete.servico}</span>
                        <span className="text-zinc-700 font-bold"> — {formatBRL(frete.valor)}</span>
                        <span className="text-zinc-600 font-semibold"> · entrega em até {frete.prazoDias} dia(s){frete.dataMaxima ? ` (até ${frete.dataMaxima})` : ""}</span>
                      </div>
                    </div>
                  )}
                  {!frete && (
                    <p className="mt-3 text-sm text-zinc-500 font-medium">Digite o CEP e clique em <b>CALCULAR</b> para ver o valor e o prazo do frete pelos Correios.</p>
                  )}
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <BigField className="md:col-span-2" label="Rua, Estrada ou Localidade" placeholder="Ex: Estrada da Fazenda Velha, KM 10">
                    <input value={form.rua} onChange={(e) => set("rua", e.target.value)} placeholder="Ex: Estrada da Fazenda Velha, KM 10" className="input-agro" />
                  </BigField>
                  <BigField label="Número / KM" placeholder="Ex: 500">
                    <input value={form.numero} onChange={(e) => set("numero", e.target.value)} placeholder="Ex: 500" className="input-agro" />
                  </BigField>

                  <BigField className="md:col-span-2" label="Complemento / Ponto de referência" placeholder="Ex: Próximo à ponte do rio (opcional)">
                    <input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} placeholder="Ex: Próximo à ponte do rio (opcional)" className="input-agro" />
                  </BigField>
                  <BigField label="Bairro" placeholder="Ex: Zona Rural">
                    <input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} placeholder="Ex: Zona Rural" className="input-agro" />
                  </BigField>

                  <BigField className="md:col-span-2" label="Cidade" placeholder="Ex: São José do Rio Preto">
                    <input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} placeholder="Ex: São José do Rio Preto" className="input-agro" />
                  </BigField>
                  <BigField label="UF (Estado)" placeholder="Ex: SP">
                    <input value={form.estado} maxLength={2} onChange={(e) => set("estado", e.target.value.toUpperCase())} placeholder="Ex: SP" className="input-agro uppercase" />
                  </BigField>
                </div>

                {/* Dados pessoais */}
                <div className="pt-4 border-t-2 border-dashed border-zinc-100">
                  <h3 className="text-lg sm:text-xl font-extrabold text-zinc-700 mb-4">Seus dados para contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <BigField label="Nome completo" placeholder="Ex: José Pereira de Souza">
                      <input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="Ex: José Pereira de Souza" className="input-agro" />
                    </BigField>
                    <BigField label="Telefone / WhatsApp" placeholder="Ex: (17) 99999-9999">
                      <input value={form.phone} inputMode="tel" onChange={(e) => set("phone", e.target.value)} placeholder="Ex: (17) 99999-9999" className="input-agro" />
                    </BigField>
                    <BigField label="E-mail" placeholder="Ex: seunome@email.com">
                      <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Ex: seunome@email.com" className="input-agro" />
                    </BigField>
                    <BigField label="CPF ou CNPJ" placeholder="Somente números">
                      <input value={form.cpf_cnpj} inputMode="numeric" onChange={(e) => set("cpf_cnpj", e.target.value)} placeholder="Somente números" className="input-agro" />
                    </BigField>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Seção 3 — Pagamento */}
            <SectionCard number={3} icon={<Wallet className="h-6 w-6" />} title="Escolha como pagar">
              <div className="p-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setMethod("pix")}
                  className={`w-full flex items-center justify-between gap-4 rounded-3xl border-4 p-5 sm:p-8 text-left transition-all ${
                    method === "pix" ? "border-[#0f5132] bg-green-50" : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#32bcad] shadow-lg shadow-teal-900/10">
                      <PixIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl sm:text-3xl font-black text-zinc-800">PIX</p>
                      <p className="text-sm sm:text-base font-bold uppercase text-green-700">Pague e receba mais rápido</p>
                    </div>
                  </div>
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-4 ${method === "pix" ? "border-[#0f5132]" : "border-zinc-300"}`}>
                    {method === "pix" && <div className="h-4 w-4 rounded-full bg-[#0f5132]" />}
                  </div>
                </button>

                <div className="w-full flex items-center justify-between gap-4 rounded-3xl border-4 border-zinc-100 bg-zinc-50 p-5 sm:p-8 opacity-60 grayscale cursor-not-allowed">
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-zinc-400">
                      <CreditCard className="h-8 w-8 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-bold text-zinc-500">Cartão de Crédito</p>
                      <p className="text-sm font-bold uppercase text-zinc-400">Em breve — indisponível no momento</p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Sidebar de resumo */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 space-y-6">
              <div className="overflow-hidden rounded-3xl border-4 border-[#0f5132] bg-white shadow-2xl shadow-green-900/10">
                <div className="p-6 sm:p-8">
                  <h2 className="mb-6 flex items-center gap-3 text-xl sm:text-2xl font-black uppercase text-zinc-800">
                    <ClipboardList className="h-7 w-7 text-[#0f5132]" />
                    Total da compra
                  </h2>

                  <div className="space-y-3 border-b-4 border-zinc-100 pb-6 mb-6">
                    <SummaryRow label={`Produtos (${totalItens})`} value={formatBRL(subtotal)} />
                    <SummaryRow label="Frete" value={frete ? formatBRL(frete.valor) : "A calcular"} />
                    {frete && (
                      <div className="mt-4 flex items-center justify-between rounded-2xl border-2 border-green-100 bg-green-50 p-3">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0f5132]">Entrega em:</span>
                        <span className="text-base sm:text-lg font-black text-[#0f5132]">
                          {frete.prazoDias} DIA{frete.prazoDias === 1 ? "" : "S"} ÚTE{frete.prazoDias === 1 ? "L" : "IS"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-6 text-center">
                    <span className="mb-1 block text-xs font-bold uppercase text-zinc-400">Valor final a pagar</span>
                    <span className="block text-4xl sm:text-5xl font-black tracking-tighter text-[#0f5132]">{formatBRL(total)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={loadingPay || method !== "pix"}
                    className="w-full rounded-3xl border-b-8 border-[#073621] bg-[#0f5132] py-6 sm:py-7 text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white shadow-2xl shadow-green-900/30 transition-all hover:bg-[#0a3a24] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-3"
                  >
                    {loadingPay ? <Loader2 className="h-7 w-7 animate-spin" /> : <Lock className="h-6 w-6" />}
                    PAGAR AGORA
                  </button>

                  <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 rounded-full bg-zinc-50 px-4 py-2 text-xs font-black uppercase text-[#0f5132]">
                      <ShieldCheck className="h-4 w-4" />
                      Ambiente 100% seguro
                    </div>
                    <p className="text-center text-[11px] font-bold text-zinc-400">
                      Dukamp Saúde Animal · Pagamento processado por Mercado Pago
                    </p>
                  </div>
                </div>
              </div>

              {/* Card de ajuda */}
              <div className="rounded-2xl bg-zinc-800 p-6 text-white">
                <p className="text-lg font-black">Dificuldade para comprar?</p>
                <p className="mt-1 text-sm font-bold text-zinc-400">Fale com a gente. Nossa equipe te ajuda por telefone ou WhatsApp:</p>
                <div className="mt-4 space-y-2">
                  <a
                    href={`tel:${suportePhoneDigits || ""}`}
                    className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3 transition-colors hover:bg-white/20"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0f5132]">
                      <Phone className="h-4 w-4" />
                    </span>
                    <span className="text-base sm:text-lg font-black">{suportePhoneDisplay}</span>
                  </a>
                  {suportePhoneDigits && (
                    <a
                      href={`https://wa.me/${suportePhoneDigits}`}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3 transition-colors hover:bg-white/20"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-green-500">
                        <MessageCircle className="h-4 w-4" />
                      </span>
                      <span className="text-base sm:text-lg font-black">Chamar no WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

/* ---------- pieces ---------- */

function SectionCard({
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
    <section className="overflow-hidden rounded-3xl border-2 border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-4 bg-[#0f5132] p-5 sm:p-6">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl font-black text-[#0f5132]">
          {number}
        </div>
        <div className="hidden sm:grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white">
          {icon}
        </div>
        <h2 className="min-w-0 truncate text-lg sm:text-xl font-black uppercase tracking-tight text-white">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function BigField({
  label,
  placeholder,
  className = "",
  children,
}: {
  label: string;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-base sm:text-lg font-bold text-zinc-700">
        {label}
        {placeholder && <span className="ml-2 text-xs font-medium text-zinc-400 hidden sm:inline">{placeholder}</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-lg">
      <span className="font-bold text-zinc-500">{label}</span>
      <span className="font-black text-zinc-800">{value}</span>
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
