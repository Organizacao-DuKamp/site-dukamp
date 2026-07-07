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

  // Cenário: banner personalizado do admin OU plantação padrão
  const bgImage = seller.banner_url || bannerBg;

  // Foto sobreposta no banner: preferir cutout (sem fundo). Fallback: photo_url
  const cutout = seller.cutout_url || seller.photo_url;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border shadow-xl bg-white">
      {/* Fundo da plantação */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden
      />
      {/* Leve escurecimento à esquerda para leitura do texto */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/40 to-transparent md:from-white/80 md:via-white/20"
        aria-hidden
      />

      {/* Curva vermelha lateral esquerda (identidade Dukamp) */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -left-10 top-0 h-full w-[45%] md:w-[35%]"
        viewBox="0 0 400 500"
        preserveAspectRatio="none"
      >
        <path d="M -50 0 C 260 0, 340 260, 80 500 L -50 500 Z" fill="#d81f26" opacity="0.92" />
        <path d="M -50 70 C 230 70, 310 270, 40 500 L -50 500 Z" fill="#f6c515" opacity="0.85" />
      </svg>

      {/* Curva amarela canto inferior direito */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-10 -bottom-16 h-[70%] w-[40%]"
        viewBox="0 0 400 500"
        preserveAspectRatio="none"
      >
        <path d="M 450 500 C 150 500, 60 260, 320 0 L 450 0 Z" fill="#f6c515" opacity="0.9" />
      </svg>

      {/* Conteúdo */}
      <div className="relative grid gap-6 p-6 sm:p-10 md:grid-cols-[auto,1fr] md:items-end min-h-[380px] md:min-h-[440px]">
        {/* Foto do vendedor sem fundo */}
        <div className="relative mx-auto md:mx-0 md:self-end">
          {cutout ? (
            <img
              src={optimizedImage(cutout, { width: 700, quality: 90 })}
              alt={seller.name}
              className="relative h-64 sm:h-80 md:h-[420px] w-auto object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.35)]"
              decoding="async"
            />
          ) : (
            <div className="h-64 w-64 rounded-full bg-white/70 grid place-items-center text-6xl font-black text-[#d81f26]">
              {seller.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center md:text-left space-y-3 md:pb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d81f26] text-white px-3 py-1 text-xs font-bold shadow-lg">
            <Star className="h-3.5 w-3.5 fill-white" /> DESTAQUE
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-foreground drop-shadow-sm">
            {seller.name}
          </h1>

          {seller.role && (
            <p className="text-lg sm:text-xl font-bold text-[#d81f26] uppercase tracking-wide">
              {seller.role}
            </p>
          )}

          <div className="space-y-2 text-sm sm:text-base font-medium text-foreground">
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
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1fbe5a] text-white font-bold px-6 py-3 shadow-xl transition-colors"
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
