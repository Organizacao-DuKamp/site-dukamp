import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TrendingUp } from "lucide-react";
import { getMarketQuotes, type QuoteItem } from "@/lib/quotes.functions";

function formatPrice(item: QuoteItem) {
  if (!item.available || item.price == null) return "indisponível no momento";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(item.price);
}

function formatUpdated(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function QuotesWidget() {
  const fetchQuotes = useServerFn(getMarketQuotes);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["market-quotes"],
    queryFn: () => fetchQuotes(),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/40">
        <TrendingUp className="h-4 w-4 text-primary" />
        <div className="font-semibold text-sm">Cotações do Mercado</div>
      </div>

      <div className="p-3">
        {isLoading ? (
          <ul className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              </li>
            ))}
          </ul>
        ) : isError || !data ? (
          <div className="text-xs text-muted-foreground">
            Não foi possível carregar as cotações.{" "}
            <button onClick={() => refetch()} className="text-primary hover:underline">
              Tentar novamente
            </button>
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-xs text-muted-foreground">Nenhum indicador disponível.</div>
        ) : (
          <ul className="space-y-2">
            {data.items.map((item) => (
              <li key={item.key} className="flex items-start justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{item.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {item.unit} · {formatUpdated(item.updatedAt)}
                  </div>
                </div>
                <div
                  className={
                    "text-right font-semibold shrink-0 " +
                    (item.available ? "text-foreground" : "text-muted-foreground italic font-normal")
                  }
                >
                  {formatPrice(item)}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Fonte: AwesomeAPI / CEPEA</span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="hover:text-primary disabled:opacity-50"
          >
            {isFetching ? "atualizando…" : "atualizar"}
          </button>
        </div>
      </div>
    </div>
  );
}
