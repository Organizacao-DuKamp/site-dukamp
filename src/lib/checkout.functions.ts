import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CEP_ORIGEM = "15150104";
// PAC contrato (código padrão do MVP). Pode ser trocado por SEDEX (03220) etc.
const CORREIOS_SERVICO = "03298";
const CORREIOS_SERVICO_NOME = "PAC";

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
  const usuario = normalizeCorreiosUser(process.env.CORREIOS_USUARIO);
  const senha = cleanSecret(process.env.CORREIOS_SENHA);
  const cartao = onlyDigits(cleanSecret(process.env.CORREIOS_CARTAO_POSTAGEM));
  if (!usuario || !senha || !cartao) throw new Error("Credenciais Correios ausentes");
  const basic = Buffer.from(`${usuario}:${senha}`).toString("base64");
  const headers = { Authorization: `Basic ${basic}`, "Content-Type": "application/json", Accept: "application/json" };
  const cardRes = await fetch("https://api.correios.com.br/token/v1/autentica/cartaopostagem", {
    method: "POST",
    headers,
    body: JSON.stringify({ numero: cartao }),
  });

  if (cardRes.ok) return (await cardRes.json()) as { token: string; ambiente?: string };

  const cardError = await readCorreiosError(cardRes);
  const defaultRes = await fetch("https://api.correios.com.br/token/v1/autentica", {
    method: "POST",
    headers,
  });

  if (!defaultRes.ok) {
    const defaultError = await readCorreiosError(defaultRes);
    throw new Error(
      `Correios auth falhou: ${defaultRes.status}. Confira CNPJ/usuário e código de acesso da API. Detalhe: ${defaultError || cardError}`,
    );
  }

  return (await defaultRes.json()) as { token: string; ambiente?: string };
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

    // Agregar peso e dimensões (empilha por comprimento como aproximação)
    let pesoTotal = 0;
    let altura = 0;
    let largura = 0;
    let comprimento = 0;
    for (const item of data.items) {
      const p = prods?.find((x) => x.id === item.product_id);
      if (!p) continue;
      const w = Number(p.peso ?? 0) * item.quantity;
      pesoTotal += w;
      altura = Math.max(altura, Number(p.altura ?? 0));
      largura = Math.max(largura, Number(p.largura ?? 0));
      comprimento += Number(p.comprimento ?? 0) * item.quantity;
    }
    // Limites/mínimos Correios
    if (pesoTotal <= 0) pesoTotal = 1;
    if (altura < 2) altura = 2;
    if (largura < 11) largura = 11;
    if (comprimento < 16) comprimento = 16;
    // Máximos PAC
    altura = Math.min(altura, 105);
    largura = Math.min(largura, 105);
    comprimento = Math.min(comprimento, 105);

    const { token } = await correiosToken();
    const contrato = onlyDigits(cleanSecret(process.env.CORREIOS_CONTRATO));

    // Preço
    const precoRes = await fetch("https://api.correios.com.br/preco/v1/nacional", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        idLote: "1",
        parametrosProduto: [
          {
            coProduto: CORREIOS_SERVICO,
            nuRequisicao: "1",
            nuContrato: contrato,
            cepOrigem: CEP_ORIGEM,
            cepDestino: cepDest,
            psObjeto: String(Math.ceil(pesoTotal * 1000)), // gramas
            tpObjeto: "2",
            comprimento: String(Math.ceil(comprimento)),
            largura: String(Math.ceil(largura)),
            altura: String(Math.ceil(altura)),
            servicosAdicionais: ["001"],
            vlDeclarado: "0",
          },
        ],
      }),
    });
    if (!precoRes.ok) {
      const t = await precoRes.text();
      throw new Error(`Correios preço falhou: ${precoRes.status} ${t}`);
    }
    const precoJson = (await precoRes.json()) as Array<{ pcFinal?: string; txErro?: string }>;
    const preco = precoJson?.[0];
    if (!preco || preco.txErro) throw new Error(preco?.txErro || "Frete indisponível para este CEP");
    const valor = Number((preco.pcFinal || "0").replace(",", "."));

    // Prazo
    const prazoRes = await fetch("https://api.correios.com.br/prazo/v1/nacional", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        idLote: "1",
        parametrosPrazo: [
          {
            coProduto: CORREIOS_SERVICO,
            nuRequisicao: "1",
            cepOrigem: CEP_ORIGEM,
            cepDestino: cepDest,
            dtEvento: new Date().toISOString().slice(0, 10).split("-").reverse().join("/"),
          },
        ],
      }),
    });
    let prazoDias = 7;
    if (prazoRes.ok) {
      const prazoJson = (await prazoRes.json()) as Array<{ prazoEntrega?: number }>;
      prazoDias = Number(prazoJson?.[0]?.prazoEntrega ?? 7) || 7;
    }

    return {
      servico: CORREIOS_SERVICO_NOME,
      valor,
      prazoDias,
    };
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
