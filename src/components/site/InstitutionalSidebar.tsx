import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isVideoUrl } from "@/components/admin/ImageUpload";

type Ad = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  media: string[] | null;
};

function mediaList(ad: Ad): string[] {
  const arr = Array.isArray(ad.media) ? ad.media.filter(Boolean) : [];
  if (arr.length > 0) return arr;
  return ad.image_url ? [ad.image_url] : [];
}

function AdaptiveMedia({ url }: { url: string }) {
  // aspect starts at 4/3 and adapts once we know the natural size
  const [ratio, setRatio] = useState<number>(4 / 3);
  const video = isVideoUrl(url);

  // clamp so extremely tall/wide media stays elegant in the sidebar
  const clamp = (r: number) => Math.max(3 / 4, Math.min(16 / 9, r));

  return (
    <div
      className="w-full bg-muted overflow-hidden"
      style={{ aspectRatio: `${clamp(ratio)}` }}
    >
      {video ? (
        <video
          src={url}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
          }}
        />
      ) : (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onLoad={(e) => {
            const im = e.currentTarget;
            if (im.naturalWidth && im.naturalHeight) setRatio(im.naturalWidth / im.naturalHeight);
          }}
        />
      )}
    </div>
  );
}

function AdCard({ ad }: { ad: Ad }) {
  const items = useMemo(() => mediaList(ad), [ad]);
  const [idx, setIdx] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (items.length <= 1) return;
    timer.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 6000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [items.length]);

  const current = items[idx];

  const inner = (
    <div className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {current && (
        <div className="relative">
          <AdaptiveMedia key={current} url={current} />
          {items.length > 1 && (
            <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
              {items.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="p-3">
        <div className="font-semibold text-sm">{ad.title}</div>
        {ad.content && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{ad.content}</p>
        )}
      </div>
    </div>
  );

  return ad.link_url ? (
    <a href={ad.link_url} className="block">{inner}</a>
  ) : (
    <div>{inner}</div>
  );
}

export function InstitutionalSidebar() {
  const { data } = useQuery({
    queryKey: ["institutional_ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutional_ads")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as Ad[];
    },
  });

  return (
    <aside className="space-y-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-1">
        Institucional
      </div>
      {(data ?? []).map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </aside>
  );
}
