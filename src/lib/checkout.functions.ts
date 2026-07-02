import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CEP_ORIGEM = "15150104";
// PAC contrato (código padrão do MVP). Pode ser trocado por SEDEX (03220) etc.
const CORREIOS_SERVICO = "03298";
const CORREIOS_SERVICO_PUBLICO = "04510";
const CORREIOS_SERVICO_NOME = "PAC";

type ShippingPackage = {
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function cleanSecret(value?: string) {
  return (value || "").trim();
}

function normalizeCorreiosUser(value?: string) {
  const raw = cleanSecret(value);
  const digits = onlyDigits(raw);
  return digits.length === 11 || digits.length === 14 ? digits : raw;
}

function summarizeCorreiosAuthIssue(attempts: Array<{ name: string; status: number; detail: string }>, usuario: string) {
  const allUnauthorized = attempts.length > 0 && attempts.every((attempt) => attempt.status === 401);
  if (!allUnauthorized) return "";

  const userHint =
    onlyDigits(usuario).length === 14
      ? " O usuário configurado parece ser CNPJ; use o login/idCorreios do Meu Correios, não CNPJ."
      : "";

  return `${userHint} O retorno 401 em todos os endpoints significa que os Correios recusaram o Basic Auth antes de validar contrato/cartão. O problema está em CORREIOS_USUARIO ou CORREIOS_SENHA: o usuário deve ser exatamente o login/idCorreios exibido em Credenciais no CWS, e a senha deve ser o código de acesso às APIs gerado em Gestão de acesso a APIs. Se ambos estiverem corretos, esse contrato/login ainda não está habilitado/autorizado para a API REST nova dos Correios e precisa ser liberado pelo gerente/suporte tecnológico dos Correios.`;
}

function validateCorreiosCredentials(usuario: string, senha: string, cartao: string) {
  if (!usuario || !senha || !cartao) {
    console.error("[Correios] credenciais ausentes", { usuario: !!usuario, senha: !!senha, cartao: !!cartao });
    throw new Error("Credenciais Correios ausentes (usuário/senha/cartão)");
  }
}

function toCorreiosDimension(value: unknown, min: number) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return min;
  return Math.min(Math.max(Math.ceil(n), min), 105);
}

function toCorreiosWeight(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(Math.max(n, 0.3), 30);
}

function parseCorreiosXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

async function calculateLegacyCorreiosPackage(cepDest: string, pacote: ShippingPackage) {
  const url = new URL("https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx");
  url.searchParams.set("nCdEmpresa", "");
  url.searchParams.set("sDsSenha", "");
  url.searchParams.set("sCepOrigem", CEP_ORIGEM);
  url.searchParams.set("sCepDestino", cepDest);
  url.searchParams.set("nVlPeso", pacote.pesoKg.toFixed(3));
  url.searchParams.set("nCdFormato", "1");
  url.searchParams.set("nVlComprimento", String(pacote.comprimentoCm));
  url.searchParams.set("nVlAltura", String(pacote.alturaCm));
  url.searchParams.set("nVlLargura", String(pacote.larguraCm));
  url.searchParams.set("nVlDiametro", "0");
  url.searchParams.set("sCdMaoPropria", "N");
  url.searchParams.set("nVlValorDeclarado", "0");
  url.searchParams.set("sCdAvisoRecebimento", "N");
  url.searchParams.set("nCdServico", CORREIOS_SERVICO_PUBLICO);
  url.searchParams.set("StrRetorno", "xml");
  url.searchParams.set("nIndicaCalculo", "3");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  let xml = "";
  let res: Response;
  try {
    res = await fetch(url.toString(), { method: "GET", signal: controller.signal });
    xml = await res.text();
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new Error(`calculador público HTTP ${res.status}`);

  const erro = parseCorreiosXmlTag(xml, "Erro");
  const msgErro = parseCorreiosXmlTag(xml, "MsgErro");
  if (erro && erro !== "0") throw new Error(msgErro || `calculador público retornou erro ${erro}`);

  const valor = Number(parseCorreiosXmlTag(xml, "Valor").replace(".", "").replace(",", "."));
  const prazoDias = Number(parseCorreiosXmlTag(xml, "PrazoEntrega"));
  if (!Number.isFinite(valor) || valor <= 0) throw new Error("calculador público não retornou valor de frete");

  return { valor, prazoDias: Number.isFinite(prazoDias) && prazoDias > 0 ? prazoDias : 7 };
}

async function calculateLegacyCorreiosShipping(cepDest: string, pacotes: ShippingPackage[]) {
  let valor = 0;
  let prazoDias = 0;

  for (const pacote of pacotes) {
    const result = await calculateLegacyCorreiosPackage(cepDest, pacote);
    valor += result.valor;
    prazoDias = Math.max(prazoDias, result.prazoDias);
  }

  return {
    servico: CORREIOS_SERVICO_NOME,
    valor: Number(valor.toFixed(2)),
    prazoDias: prazoDias || 7,
  };
}

async function calculateCorreiosRestShipping(token: string, cepDest: string, contrato: string, pacotes: ShippingPackage[]) {
  const parametrosProduto = pacotes.map((pacote, index) => ({
    coProduto: CORREIOS_SERVICO,
    nuRequisicao: String(index + 1),
    nuContrato: contrato || undefined,
    cepOrigem: CEP_ORIGEM,
    cepDestino: cepDest,
    psObjeto: String(Math.ceil(pacote.pesoKg * 1000)),
    tpObjeto: "2",
    comprimento: String(pacote.comprimentoCm),
    largura: String(pacote.larguraCm),
    altura: String(pacote.alturaCm),
    servicosAdicionais: ["001"],
    vlDeclarado: "0",
  }));

  const precoRes = await fetch("https://api.correios.com.br/preco/v1/nacional", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ idLote: "1", parametrosProduto }),
  });
  if (!precoRes.ok) {
    const t = await precoRes.text();
    throw new Error(`Correios preço falhou: ${precoRes.status} ${t}`);
  }
  const precoJson = (await precoRes.json()) as Array<{ pcFinal?: string; txErro?: string }>;
  let valor = 0;
  for (const preco of precoJson || []) {
    if (!preco || preco.txErro) throw new Error(preco?.txErro || "Frete indisponível para este CEP");
    valor += Number((preco.pcFinal || "0").replace(",", "."));
  }

  const prazoRes = await fetch("https://api.correios.com.br/prazo/v1/nacional", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      idLote: "1",
      parametrosPrazo: pacotes.map((_, index) => ({
        coProduto: CORREIOS_SERVICO,
        nuRequisicao: String(index + 1),
        cepOrigem: CEP_ORIGEM,
        cepDestino: cepDest,
        dtEvento: new Date().toISOString().slice(0, 10).split("-").reverse().join("/"),
      })),
    }),
  });

  let prazoDias = 7;
  if (prazoRes.ok) {
    const prazoJson = (await prazoRes.json()) as Array<{ prazoEntrega?: number }>;
    prazoDias = Math.max(...(prazoJson || []).map((item) => Number(item?.prazoEntrega ?? 7)).filter(Number.isFinite), 7);
  }

  return {
    servico: CORREIOS_SERVICO_NOME,
    valor: Number(valor.toFixed(2)),
    prazoDias,
  };
}

async function readCorreiosError(res: Response) {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { msgs?: string[]; mensagem?: string; message?: string; erro?: string };
    return json.msgs?.join("; ") || json.mensagem || json.message || json.erro || text;
  } catch {
    return text;
  }
}

// ---------- Correios CWS ----------
async function correiosToken() {
  const rawUsuario = cleanSecret(process.env.CORREIOS_USUARIO);
  const usuario = normalizeCorreiosUser(process.env.CORREIOS_USUARIO);
  const senha = cleanSecret(process.env.CORREIOS_SENHA);
  const cartao = onlyDigits(cleanSecret(process.env.CORREIOS_CARTAO_POSTAGEM));
  const contrato = onlyDigits(cleanSecret(process.env.CORREIOS_CONTRATO));

  const senhaFingerprint = senha
    ? `${senha.slice(0, 2)}***${senha.slice(-2)} (len=${senha.length})`
    : "vazia";
  const senhaHasWhitespace = /\s/.test(process.env.CORREIOS_SENHA || "");
  const senhaHasQuotes = /["']/.test(process.env.CORREIOS_SENHA || "");
  const usuarioPreview = usuario ? `${usuario.slice(0, 2)}***${usuario.slice(-2)}` : "vazio";

  console.log("[Correios] auth start", {
    usuarioPreview,
    usuarioLen: usuario.length,
    usuarioDigits: onlyDigits(usuario).length,
    usuarioNormalizedEqualsRaw: usuario === rawUsuario,
    senhaFingerprint,
    senhaHasWhitespace,
    senhaHasQuotes,
    cartaoLen: cartao.length,
    contratoLen: contrato.length,
  });

  validateCorreiosCredentials(usuario, senha, cartao);

  const basic = Buffer.from(`${usuario}:${senha}`).toString("base64");
  console.log("[Correios] basic auth header", { basicLen: basic.length, basicPreview: `${basic.slice(0, 6)}...${basic.slice(-4)}` });
  const headers = { Authorization: `Basic ${basic}`, "Content-Type": "application/json", Accept: "application/json" };
  const attempts: Array<{ name: string; status: number; detail: string }> = [];

  async function tryToken(name: string, url: string, body?: Record<string, string | number>) {
    console.log(`[Correios] tentando ${name}`, {
      hasBody: !!body,
      bodyKeys: body ? Object.keys(body) : [],
    });

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.ok) {
      const json = (await res.json()) as { token: string; ambiente?: string };
      console.log(`[Correios] auth OK via ${name}`, { ambiente: json.ambiente, tokenLen: json.token?.length });
      return json;
    }

    const detail = await readCorreiosError(res);
    attempts.push({ name, status: res.status, detail });
    console.error(`[Correios] ${name} falhou`, {
      status: res.status,
      statusText: res.statusText,
      body: detail?.slice(0, 500),
      wwwAuthenticate: res.headers.get("www-authenticate") || null,
    });
    return null;
  }

  const defaultToken =
    (await tryToken("autentica-v1", "https://api.correios.com.br/token/v1/autentica")) ||
    (await tryToken("autentica", "https://api.correios.com.br/token/autentica"));
  if (defaultToken) return defaultToken;

  if (contrato) {
    const contractToken =
      (await tryToken("contrato-v1", "https://api.correios.com.br/token/v1/autentica/contrato", {
        numero: contrato,
      })) ||
      (await tryToken("contrato", "https://api.correios.com.br/token/autentica/contrato", {
        numero: contrato,
      }));
    if (contractToken) return contractToken;
  }

  const cardBody: Record<string, string> = { numero: cartao };
  if (contrato) cardBody.contrato = contrato;
  const cardToken =
    (await tryToken("cartaopostagem-v1", "https://api.correios.com.br/token/v1/autentica/cartaopostagem", cardBody)) ||
    (await tryToken("cartaopostagem", "https://api.correios.com.br/token/autentica/cartaopostagem", cardBody));
  if (cardToken) return cardToken;

  const details = attempts
    .map((attempt) => `${attempt.name}=${attempt.status} (${attempt.detail?.slice(0, 200) || "sem detalhe"})`)
    .join(". ");
  const authIssue = summarizeCorreiosAuthIssue(attempts, usuario);

  throw new Error(`Correios auth falhou: ${attempts.at(-1)?.status || 401}. ${details}.${authIssue}`);
}

export const calculateShipping = createServerFn({ method: "POST" })
  .inputValidator((data: { cepDestino: string; items: Array<{ product_id: string; quantity: number }> }) =>
    z
      .object({
        cepDestino: z.string().min(8),
        items: z
          .array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive() }))
          .min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const cepDest = onlyDigits(data.cepDestino);
    if (cepDest.length !== 8) throw new Error("CEP de destino inválido");

    // Buscar dimensões dos produtos
    const { createClient } = await import("@supabase/supabase-js");
    const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    const ids = data.items.map((i) => i.product_id);
    const { data: prods, error } = await supa
      .from("products")
      .select("id,name,peso,altura,largura,comprimento")
      .in("id", ids);
    if (error) throw new Error(error.message);

    const pacotes: ShippingPackage[] = [];
    for (const item of data.items) {
      const p = prods?.find((x) => x.id === item.product_id);
      if (!p) continue;
      const pacote = {
        pesoKg: toCorreiosWeight(p.peso),
        alturaCm: toCorreiosDimension(p.altura, 2),
        larguraCm: toCorreiosDimension(p.largura, 11),
        comprimentoCm: toCorreiosDimension(p.comprimento, 16),
      };
      for (let q = 0; q < item.quantity; q += 1) pacotes.push(pacote);
    }

    if (!pacotes.length) throw new Error("Produto inválido no carrinho");

    try {
      const { token } = await correiosToken();
      const contrato = onlyDigits(cleanSecret(process.env.CORREIOS_CONTRATO));
      return await calculateCorreiosRestShipping(token, cepDest, contrato, pacotes);
    } catch (error) {
      console.error("[Correios] API REST indisponível; usando calculador público", {
        reason: error instanceof Error ? error.message.slice(0, 500) : String(error),
        packages: pacotes.length,
      });
      try {
        return await calculateLegacyCorreiosShipping(cepDest, pacotes);
      } catch (legacyError) {
        console.error("[Correios] calculador público falhou", {
          reason: legacyError instanceof Error ? legacyError.message.slice(0, 500) : String(legacyError),
        });
        throw new Error("Não foi possível calcular o frete pelos Correios agora. Verifique o CEP ou tente novamente em alguns minutos.");
      }
    }
  });

// ---------- Order + Mercado Pago Pix ----------

const orderSchema = z.object({
  customer_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(30),
  cpf_cnpj: z.string().min(11).max(20),
  cep: z.string().min(8),
  rua: z.string().min(2).max(200),
  numero: z.string().min(1).max(20),
  complemento: z.string().max(120).optional().nullable(),
  bairro: z.string().min(2).max(120),
  cidade: z.string().min(2).max(120),
  estado: z.string().length(2),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
        unit_price: z.number().positive(),
      }),
    )
    .min(1),
  shipping_cost: z.number().nonnegative(),
  shipping_service: z.string().min(1),
  shipping_deadline_days: z.number().int().nonnegative(),
});

export const createPixOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    // Buscar produtos autoritativos (preços/nome/stock)
    const ids = data.items.map((i) => i.product_id);
    const { data: prods, error: pe } = await supa
      .from("products")
      .select("id,name,code,price,consumer_price,producer_price,peso,altura,largura,comprimento,stock,active")
      .in("id", ids);
    if (pe) throw new Error(pe.message);
    if (!prods || prods.length !== ids.length) throw new Error("Produto inválido no carrinho");

    // Monta itens usando o preço enviado pelo cliente, mas validando limites
    let subtotal = 0;
    const orderItems = data.items.map((i) => {
      const p = prods.find((x) => x.id === i.product_id)!;
      if (!p.active) throw new Error(`Produto indisponível: ${p.name}`);
      if ((p.stock ?? 0) < i.quantity) throw new Error(`Estoque insuficiente: ${p.name}`);
      const unit = Number(i.unit_price);
      const sub = unit * i.quantity;
      subtotal += sub;
      return {
        product_id: p.id,
        product_code: p.code,
        name: p.name,
        unit_price: unit,
        quantity: i.quantity,
        subtotal: sub,
        peso: p.peso,
        altura: p.altura,
        largura: p.largura,
        comprimento: p.comprimento,
      };
    });

    const total = Number((subtotal + data.shipping_cost).toFixed(2));

    // Cria ordem
    const { data: order, error: oe } = await supa
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        email: data.email,
        phone: data.phone,
        cpf_cnpj: data.cpf_cnpj,
        cep: onlyDigits(data.cep),
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento || null,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado.toUpperCase(),
        subtotal,
        shipping_cost: data.shipping_cost,
        shipping_service: data.shipping_service,
        shipping_deadline_days: data.shipping_deadline_days,
        total,
        payment_method: "pix",
        payment_status: "pending",
      })
      .select("*")
      .single();
    if (oe || !order) throw new Error(oe?.message || "Falha ao criar pedido");

    const { error: ie } = await supa
      .from("order_items")
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));
    if (ie) throw new Error(ie.message);

    // Cria Pix no Mercado Pago
    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN!;
    if (!mpToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente");

    const [firstName, ...rest] = data.customer_name.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;
    const cpf = onlyDigits(data.cpf_cnpj);
    const idType = cpf.length === 14 ? "CNPJ" : "CPF";

    const notifBase = process.env.PUBLIC_APP_URL || "https://dukamp.lovable.app";
    const notification_url = `${notifBase.replace(/\/$/, "")}/api/public/mercadopago-webhook`;

    const expires = new Date(Date.now() + 30 * 60 * 1000);
    const expiresIso =
      expires.toISOString().replace("Z", "-00:00"); // MP exige offset

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": order.id,
      },
      body: JSON.stringify({
        transaction_amount: total,
        description: `Pedido ${order.order_number} - Dukamp`,
        payment_method_id: "pix",
        external_reference: order.id,
        notification_url,
        date_of_expiration: expiresIso,
        payer: {
          email: data.email,
          first_name: firstName,
          last_name: lastName,
          identification: { type: idType, number: cpf },
        },
      }),
    });
    if (!mpRes.ok) {
      const t = await mpRes.text();
      throw new Error(`Mercado Pago falhou: ${mpRes.status} ${t}`);
    }
    const mp = (await mpRes.json()) as {
      id: number | string;
      status: string;
      point_of_interaction?: {
        transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
      };
    };

    const td = mp.point_of_interaction?.transaction_data;
    await supa
      .from("orders")
      .update({
        mp_payment_id: String(mp.id),
        mp_qr_code: td?.qr_code || null,
        mp_qr_code_base64: td?.qr_code_base64 || null,
        mp_ticket_url: td?.ticket_url || null,
        mp_expires_at: expires.toISOString(),
        payment_status: (mp.status as "pending" | "approved" | "in_process") || "pending",
      })
      .eq("id", order.id);

    return { orderId: order.id, orderNumber: order.order_number };
  });

export const getOrderPublic = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    const { data: order, error } = await supa
      .from("orders")
      .select(
        "id,order_number,customer_name,email,total,subtotal,shipping_cost,shipping_service,shipping_deadline_days,payment_method,payment_status,mp_qr_code,mp_qr_code_base64,mp_ticket_url,mp_expires_at,created_at",
      )
      .eq("id", data.id)
      .single();
    if (error || !order) throw new Error("Pedido não encontrado");
    const { data: items } = await supa
      .from("order_items")
      .select("name,quantity,unit_price,subtotal")
      .eq("order_id", data.id);
    return { order, items: items || [] };
  });
