import { createServerFn } from "@tanstack/react-start";

export type QuoteItem = {
  key: string;
  name: string;
  unit: string;
  price: number | null;
  updatedAt: string | null;
  source: string;
  available: boolean;
};

async function fetchUsd(): Promise<QuoteItem> {
  const base: QuoteItem = {
    key: "usd",
    name: "Dólar",
    unit: "R$/US$",
    price: null,
    updatedAt: null,
    source: "AwesomeAPI",
    available: false,
  };
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return base;
    const json = (await res.json()) as { USDBRL?: { bid?: string; create_date?: string } };
    const bid = Number(json?.USDBRL?.bid);
    if (!Number.isFinite(bid)) return base;
    return {
      ...base,
      price: bid,
      updatedAt: json?.USDBRL?.create_date ?? new Date().toISOString(),
      available: true,
    };
  } catch {
    return base;
  }
}

function placeholderCattle(key: string, name: string): QuoteItem {
  // Placeholder integration layer. CEPEA/Esalq is the reference source
  // for cattle indicators in Brazil, but it requires a paid subscription.
  // When a data source becomes available, replace this with a real fetcher.
  return {
    key,
    name,
    unit: "R$/@",
    price: null,
    updatedAt: null,
    source: "CEPEA/Esalq (pendente)",
    available: false,
  };
}

export const getMarketQuotes = createServerFn({ method: "GET" }).handler(async () => {
  const [usd] = await Promise.all([fetchUsd()]);
  const items: QuoteItem[] = [
    usd,
    placeholderCattle("boi_china", "Boi China"),
    placeholderCattle("boi_gordo", "Boi Gordo"),
    placeholderCattle("vaca_gorda", "Vaca Gorda"),
    placeholderCattle("novilha", "Novilha"),
  ];
  return { items, fetchedAt: new Date().toISOString() };
});
