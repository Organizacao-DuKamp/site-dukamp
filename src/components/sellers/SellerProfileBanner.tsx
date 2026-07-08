import type { Seller } from "@/lib/sellers";
import { formatPhoneDisplay, telHref, whatsappUrl } from "@/lib/sellers";
import { optimizedImage } from "@/lib/image-url";
import { MapPin, Phone, Star, MessageCircle, UserRound } from "lucide-react";
import bannerBg from "@/assets/seller-banner-bg.jpg";

export function SellerProfileBanner({ seller }: { seller: Seller }) {
  const wa = whatsappUrl(
    seller.whatsapp ?? seller.phone,
    `Olá ${seller.name}, vim pelo site da Dukamp!`,
  );
  const phoneDisplay = formatPhoneDisplay(seller.phone ?? seller.whatsapp);
  // Prioriza a foto SEM FUNDO (cutout) para o banner
  const cutout = seller.cutout_url || seller.photo_url;
  const bg = seller.banner_url || bannerBg;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-xl">
      {/* ============ MOBILE / DESKTOP UNIFIED ============ */}
      <div className="relative grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:min-h-[340px]">
        {/* ---------- LADO ESQUERDO: pasto + pessoa recortada ---------- */}
        <div className="relative min-h-[280px] md:min-h-full overflow-hidden">
          {/* Fundo de pasto/fazenda */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bg})` }}
            aria-hidden
          />
          {/* Leve calor / vinheta pra dar clima de fim de tarde */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-amber-900/20 via-transparent to-yellow-200/20"
            aria-hidden
          />
          {/* Transição para o branco do lado direito (desktop) */}
          <div
            className="hidden md:block absolute inset-y-0 right-0 w-40 bg-gradient-to-r from-transparent to-white"
            aria-hidden
          />
          {/* Transição para o branco embaixo (mobile) */}
          <div
            className="md:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white"
            aria-hidden
          />

          {/* Curva amarela decorativa - canto inferior esquerdo */}
          <div
            className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-[#f6c515]/90 md:h-72 md:w-72"
            aria-hidden
          />
          {/* Curva vermelha decorativa - sobre a amarela */}
          <div
            className="pointer-events-none absolute -left-10 -bottom-24 h-48 w-48 rounded-full bg-[#d81f26] md:h-64 md:w-64"
            aria-hidden
          />

          {/* Pessoa recortada (sem fundo) por cima de tudo */}
          <div className="relative z-10 h-full flex items-end justify-center pt-6 md:pt-8">
            {cutout ? (
              <img
                src={optimizedImage(cutout, { width: 800, quality: 90 })}
                alt={seller.name}
                className="max-h-[260px] md:max-h-[340px] w-auto object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.35)]"
                decoding="async"
              />
            ) : (
              <div className="mb-6 grid h-40 w-40 place-items-center rounded-full bg-white/80 text-[#d81f26] shadow-lg md:h-56 md:w-56">
                <UserRound className="h-24 w-24 md:h-32 md:w-32" strokeWidth={1.5} />
              </div>
            )}
          </div>
        </div>

        {/* ---------- LADO DIREITO: informações ---------- */}
        <div className="relative bg-white p-6 sm:p-8 md:p-10 flex flex-col justify-center">
          {/* Textura rural sutil de fundo */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05] bg-cover bg-center"
            style={{ backgroundImage: `url(${bg})` }}
            aria-hidden
          />
          {/* Curva vermelha decorativa - canto superior direito */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#d81f26] md:h-60 md:w-60"
            aria-hidden
          />
          {/* Curva amarela decorativa - canto inferior direito */}
          <div
            className="pointer-events-none absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-[#f6c515] md:h-64 md:w-64"
            aria-hidden
          />

          <div className="relative z-10 space-y-3 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d81f26] px-3 py-1 text-xs font-bold text-white shadow">
              <Star className="h-3.5 w-3.5 fill-white" /> DESTAQUE
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-foreground">
              {seller.name}
            </h1>

            {seller.role && (
              <p className="text-base sm:text-lg font-semibold text-[#d81f26]">
                {seller.role}
              </p>
            )}

            <div className="space-y-1.5 pt-1 text-sm sm:text-base text-foreground/90">
              {seller.region && (
                <p className="flex items-center justify-center gap-2 md:justify-start">
                  <MapPin className="h-4 w-4 shrink-0 text-[#d81f26]" />
                  <span>{seller.region}</span>
                </p>
              )}
              {phoneDisplay && (
                <p className="flex items-center justify-center gap-2 md:justify-start">
                  <Phone className="h-4 w-4 shrink-0 text-[#d81f26]" />
                  <a
                    href={telHref(seller.phone ?? seller.whatsapp)}
                    className="hover:underline"
                  >
                    Tel: {phoneDisplay}
                  </a>
                </p>
              )}
            </div>

            {(seller.whatsapp || seller.phone) && (
              <div className="pt-4">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-[#1fbe5a] sm:w-auto"
                >
                  <MessageCircle className="h-5 w-5 fill-white" />
                  Falar no WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
