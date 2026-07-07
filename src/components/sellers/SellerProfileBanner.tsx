import type { Seller } from "@/lib/sellers";
import { formatPhoneDisplay, telHref, whatsappUrl } from "@/lib/sellers";
import { optimizedImage } from "@/lib/image-url";
import { MapPin, Phone, Star, MessageCircle } from "lucide-react";

export function SellerProfileBanner({ seller }: { seller: Seller }) {
  const wa = whatsappUrl(seller.whatsapp ?? seller.phone, `Olá ${seller.name}, vim pelo site da Dukamp!`);
  const phoneDisplay = formatPhoneDisplay(seller.phone ?? seller.whatsapp);
  const hasCustomBanner = !!seller.banner_url;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-md"
      style={
        hasCustomBanner
          ? {
              backgroundImage: `url(${seller.banner_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {/* Curvas decorativas (só quando não há banner customizado) */}
      {!hasCustomBanner && (
        <>
          <svg
            aria-hidden
            className="pointer-events-none absolute -left-8 -top-10 h-[130%] w-[55%]"
            viewBox="0 0 400 500"
            preserveAspectRatio="none"
          >
            <path d="M -50 0 C 250 0, 350 250, 100 500 L -50 500 Z" fill="#d81f26" opacity="0.95" />
            <path d="M -50 60 C 220 60, 320 260, 60 500 L -50 500 Z" fill="#f6c515" opacity="0.85" />
          </svg>
          <svg
            aria-hidden
            className="pointer-events-none absolute -right-10 -bottom-16 h-[130%] w-[55%]"
            viewBox="0 0 400 500"
            preserveAspectRatio="none"
          >
            <path d="M 450 0 C 150 0, 50 250, 300 500 L 450 500 Z" fill="#f6c515" opacity="0.9" />
            <path d="M 450 40 C 200 40, 100 260, 340 500 L 450 500 Z" fill="#d81f26" opacity="0.6" />
          </svg>
        </>
      )}

      {/* Fundo do gado (subtle) — só quando não há banner customizado */}
      {!hasCustomBanner && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 40%, #000 0.5px, transparent 0.5px), radial-gradient(circle at 30% 60%, #000 0.5px, transparent 0.5px)",
            backgroundSize: "40px 40px",
          }}
        />
      )}

      <div
        className={`relative grid gap-6 p-6 sm:p-8 md:grid-cols-[auto,1fr] md:items-center ${
          hasCustomBanner ? "bg-white/85 backdrop-blur-sm" : ""
        }`}
      >
        {/* Foto */}
        <div className="relative mx-auto md:mx-0">
          <div
            className="absolute -inset-2 rounded-full"
            style={{
              background:
                "conic-gradient(from 220deg, #d81f26 0deg, #d81f26 130deg, #f6c515 130deg, #f6c515 230deg, #d81f26 230deg)",
            }}
            aria-hidden
          />
          <div className="relative h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 rounded-full overflow-hidden bg-muted ring-4 ring-white shadow-xl">
            {seller.photo_url ? (
              <img
                src={optimizedImage(seller.photo_url, { width: 600, quality: 85 })}
                alt={seller.name}
                className="h-full w-full object-cover"
                decoding="async"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-4xl font-bold text-muted-foreground">
                {seller.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="text-center md:text-left space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d81f26] text-white px-3 py-1 text-xs font-bold shadow">
            <Star className="h-3.5 w-3.5 fill-white" /> DESTAQUE
          </span>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-foreground">
            {seller.name}
          </h1>

          {seller.role && (
            <p className="text-lg sm:text-xl font-semibold text-[#d81f26]">{seller.role}</p>
          )}

          <div className="space-y-2 text-sm sm:text-base text-foreground/90">
            {seller.region && (
              <p className="flex items-center gap-2 justify-center md:justify-start">
                <MapPin className="h-4 w-4 text-[#d81f26] shrink-0" />
                <span>{seller.region}</span>
              </p>
            )}
            {phoneDisplay && (
              <p className="flex items-center gap-2 justify-center md:justify-start">
                <Phone className="h-4 w-4 text-[#d81f26] shrink-0" />
                <a href={telHref(seller.phone ?? seller.whatsapp)} className="hover:underline">
                  Tel: {phoneDisplay}
                </a>
              </p>
            )}
          </div>

          {(seller.whatsapp || seller.phone) && (
            <div className="pt-2">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1fbe5a] text-white font-bold px-6 py-3 shadow-lg transition-colors"
              >
                <MessageCircle className="h-5 w-5 fill-white" />
                Falar no WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
