import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QuotesWidget } from "./QuotesWidget";
import { QuotesPanel } from "./QuotesPanel";
import { useQuotesPanel } from "@/lib/quotes-panel";

export function InstitutionalSidebar() {
  const { expanded } = useQuotesPanel();
  const { data } = useQuery({
    queryKey: ["institutional_ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutional_ads")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !expanded,
  });

  if (expanded) {
    return (
      <aside className="animate-quotes-panel-in">
        <QuotesPanel />
      </aside>
    );
  }

  return (
    <aside className="space-y-4">
      <QuotesWidget />
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-1">
        Institucional
      </div>
      {(data ?? []).map((ad) => {
        const inner = (
          <div className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
            {ad.image_url && (
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                <img src={ad.image_url} alt={ad.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-3">
              <div className="font-semibold text-sm">{ad.title}</div>
              {ad.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{ad.content}</p>}
            </div>
          </div>
        );
        return ad.link_url ? (
          <a key={ad.id} href={ad.link_url} className="block">{inner}</a>
        ) : (
          <div key={ad.id}>{inner}</div>
        );
      })}
    </aside>
  );
}
