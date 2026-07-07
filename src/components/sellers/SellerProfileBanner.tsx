import type { Seller } from "@/lib/sellers";
import { formatPhoneDisplay, telHref, whatsappUrl } from "@/lib/sellers";
import { optimizedImage } from "@/lib/image-url";
import { MapPin, Phone, Star, MessageCircle } from "lucide-react";
import bannerBg from "@/assets/seller-banner-bg.jpg";

export function SellerProfileBanner({ seller }: { seller: Seller }) {
  const wa = whatsappUrl(
    seller.whatsapp ?? seller.phone,
    `Olá ${seller.name}, vim pelo site da Dukamp!`
  );
  const phoneDisplay = formatPhoneDisplay(seller.phone ?? seller.whatsapp);
  const photo = seller.photo_url || seller.cutout_url;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border shadow-md bg-[#f7f2ea]"
      style={{ aspectRatio: "auto" }}
    >
      {/* Fundo sutil de pasto/gado em cinza no lado direito */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{
          backgroundImage: `url(${seller.banner_url || bannerBg})`,
          filter: "grayscale(100%) contrast(0.9)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f7f2ea] via-[#f7f2ea]/70 to-transparent"
        aria-hidden
      />

      {/* Curva amarela grande no canto inferior direito */}
      <div
        className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-[#f6c515] md:h-80 md:w-80"
        aria-hidden
      />
      {/* Curva vermelha menor no canto superior direito */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#d81f26] md:h-52 md:w-52"
        aria-hidden
      />

      <div className="relative grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-center md:gap-10 md:p-8">
        {/* Foto com arcos vermelho + amarelo à direita */}
        <div className="relative mx-auto md:mx-0 w-full max-w-[300px]">
          <div className="relative">
            {/* Arco amarelo (externo) */}
            <div
              className="absolute -right-6 -top-4 -bottom-4 w-10 rounded-r-[999px] bg-[#f6c515] md:-right-8 md:w-12"
              aria-hidden
            />
            {/* Arco vermelho (interno, sobreposto ao amarelo pela esquerda) */}
            <div
              className="absolute -right-2 -top-2 -bottom-2 w-10 rounded-r-[999px] bg-[#d81f26] md:w-12"
              aria-hidden
            />
            {/* Foto */}
            <div className="relative overflow-hidden rounded-2xl bg-muted aspect-[4/3] shadow-lg ring-1 ring-black/5">
              {photo ? (
                <img
                  src={optimizedImage(photo, { width: 700, quality: 85 })}
                  alt={seller.name}
                  className="h-full w-full object-cover"
                  decoding="async"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-6xl font-black text-[#d81f26]">
                  {seller.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="relative text-center md:text-left space-y-2.5 md:pl-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d81f26] text-white px-3 py-1 text-xs font-bold shadow">
            <Star className="h-3.5 w-3.5 fill-white" /> DESTAQUE
          </span>

          <h1 className="text-2xl sm:text-3xl md:text-[2.15rem] font-black leading-tight text-foreground">
            {seller.name}
          </h1>

          {seller.role && (
            <p className="text-base sm:text-lg font-semibold text-[#d81f26]">
              {seller.role}
            </p>
          )}

          <div className="space-y-1.5 text-sm sm:text-base text-foreground/90 pt-1">
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
            <div className="pt-3">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1fbe5a] text-white font-bold px-5 py-2.5 shadow-md transition-colors"
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
