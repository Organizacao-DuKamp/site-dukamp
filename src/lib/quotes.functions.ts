import { createServerFn } from "@tanstack/react-start";

export type QuoteItem = {
  key: string;
  name: string;
  unit: string;
  price: number | null;
  updatedAt: string | null;
  source: string;
  available: boolean;
  region?: string;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function parseBrNumber(s: string | undefined | null): number | null {
  if (!s) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/json" },
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ---------- Dólar (melhorcambio.com) ----------
async function fetchDolar(): Promise<QuoteItem> {
  const base: QuoteItem = {
    key: "usd",
    name: "Dólar",
    unit: "R$/US$",
    price: null,
    updatedAt: null,
    source: "melhorcambio.com",
    available: false,
  };
  const html = await fetchText("https://www.melhorcambio.com/dolar-hoje");
  if (!html) return base;
  const m = html.match(/id=["']comercial["'][^>]*value=["']([\d.,]+)["']/i);
  const price = m ? Number(m[1]) : null;
  if (!Number.isFinite(price as number)) return base;
  return { ...base, price: price as number, updatedAt: new Date().toISOString(), available: true };
}

// ---------- Noticias Agricolas (Boi Gordo, Vaca Gorda, Novilha) ----------
type NaRow = { region: string; price: number };

function findFirstRowAfter(html: string, headerNeedle: string): NaRow | null {
  const i = html.indexOf(headerNeedle);
  if (i < 0) return null;
  const tbodyStart = html.indexOf("<tbody>", i);
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
  if (tbodyStart < 0 || tbodyEnd < 0) return null;
  const block = html.slice(tbodyStart, tbodyEnd);
  const rowRe = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([\d.,]+)<\/td>/g;
  const rows: NaRow[] = [];
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(block))) {
    const price = parseBrNumber(m[2]);
    if (price != null) rows.push({ region: m[1].trim(), price });
  }
  if (!rows.length) return null;
  // Prefer São Paulo row if present, otherwise first row
  const sp = rows.find((r) => /s(ão|ao)\s*paulo|^sp\b/i.test(r.region));
  return sp ?? rows[0];
}

async function fetchNoticiasAgricolas(): Promise<{
  boiGordo: QuoteItem;
  vacaGorda: QuoteItem;
  novilha: QuoteItem;
}> {
  const src = "noticiasagricolas.com.br";
  const now = new Date().toISOString();
  const mk = (key: string, name: string): QuoteItem => ({
    key,
    name,
    unit: "R$/@",
    price: null,
    updatedAt: null,
    source: src,
    available: false,
  });
  const out = {
    boiGordo: mk("boi_gordo", "Boi Gordo"),
    vacaGorda: mk("vaca_gorda", "Vaca Gorda"),
    novilha: mk("novilha", "Novilha"),
  };
  const html = await fetchText("https://www.noticiasagricolas.com.br/cotacoes/boi");
  if (!html) return out;

  const bg = findFirstRowAfter(html, "Boi Gordo - (R$/@ - à vista)");
  if (bg) out.boiGordo = { ...out.boiGordo, price: bg.price, region: bg.region, updatedAt: now, available: true };

  const vg = findFirstRowAfter(html, "Vaca Gorda (R$/@ - à vista)");
  if (vg) out.vacaGorda = { ...out.vacaGorda, price: vg.price, region: vg.region, updatedAt: now, available: true };

  const nv = findFirstRowAfter(html, "Indicador da Novilha");
  if (nv) out.novilha = { ...out.novilha, price: nv.price, region: nv.region, updatedAt: now, available: true };

  return out;
}

// ---------- Scot Consultoria (Boi China) ----------
async function fetchBoiChina(): Promise<QuoteItem> {
  const base: QuoteItem = {
    key: "boi_china",
    name: "Boi China",
    unit: "R$/@",
    price: null,
    updatedAt: null,
    source: "scotconsultoria.com.br",
    available: false,
  };
  const html = await fetchText("https://www.scotconsultoria.com.br/cotacoes/boi-gordo/");
  if (!html) return base;

  // Extract date from the "Boi China a Prazo (R$/@) - dd/mm/yyyy" header
  const hdr = html.match(/Boi China a Prazo\s*\(R\$\/@\)\s*-\s*(\d{2}\/\d{2}\/\d{4})/);
  const dateStr = hdr?.[1] ?? null;

  const i = html.indexOf("Boi China a Prazo");
  if (i < 0) return base;
  const tbodyStart = html.indexOf("<tbody>", i);
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
  if (tbodyStart < 0 || tbodyEnd < 0) return base;
  const block = html.slice(tbodyStart, tbodyEnd);

  // Row: <td>São Paulo ...</td><td>338,00</td><td>332,50</td>
  const rowRe = /<td[^>]*>\s*([^<]+?)\s*<\/td>\s*<td[^>]*>\s*([\d.,]+)\s*<\/td>/g;
  const rows: NaRow[] = [];
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(block))) {
    const price = parseBrNumber(m[2]);
    if (price != null) rows.push({ region: m[1].trim(), price });
  }
  if (!rows.length) return base;
  const sp = rows.find((r) => /s(ão|ao)\s*paulo/i.test(r.region)) ?? rows[0];

  let iso: string | null = new Date().toISOString();
  if (dateStr) {
    const [d, mo, y] = dateStr.split("/");
    const dt = new Date(`${y}-${mo}-${d}T12:00:00Z`);
    if (!Number.isNaN(dt.getTime())) iso = dt.toISOString();
  }

  return { ...base, price: sp.price, region: sp.region, updatedAt: iso, available: true };
}

export const getMarketQuotes = createServerFn({ method: "GET" }).handler(async () => {
  const [dolar, na, boiChina] = await Promise.all([
    fetchDolar(),
    fetchNoticiasAgricolas(),
    fetchBoiChina(),
  ]);
  const items: QuoteItem[] = [dolar, boiChina, na.boiGordo, na.vacaGorda, na.novilha];
  return { items, fetchedAt: new Date().toISOString() };
});
