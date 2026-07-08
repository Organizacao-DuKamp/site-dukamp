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
  const cutout = seller.cutout_url || seller.photo_url;
  const bg = seller.banner_url || bannerBg;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-xl">
      <div className="relative grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:min-h-[360px]">
        {/* ============ LADO ESQUERDO — pasto + pessoa + faixas ============ */}
        <div className="relative min-h-[320px] md:min-h-full overflow-hidden">
          {/* Fundo rural */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bg})` }}
            aria-hidden
          />
          {/* Vinheta quente de fim de tarde */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-amber-900/25 via-transparent to-yellow-200/20"
            aria-hidden
          />
          {/* Transição p/ branco (desktop → direita) */}
          <div
            className="hidden md:block absolute inset-y-0 right-0 w-40 bg-gradient-to-r from-transparent to-white"
            aria-hidden
          />
          {/* Transição p/ branco (mobile → baixo) */}
          <div
            className="md:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white"
            aria-hidden
          />

          {/* --- PESSOA (camada intermediária z-10) --- */}
          <div className="relative z-10 h-full flex items-end justify-center pt-6 md:pt-8">
            {cutout ? (
              <div className="relative flex items-end justify-center">
                {/* Sombra elíptica no chão */}
                <div
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-2 h-5 w-[65%] rounded-[50%] bg-black/40 blur-lg"
                  aria-hidden
                />
                {/* Halo suave */}
                <div
                  className="pointer-events-none absolute left-1/2 bottom-6 -translate-x-1/2 h-[65%] w-[80%] rounded-[50%] bg-white/20 blur-3xl"
                  aria-hidden
                />
                <img
                  src={optimizedImage(cutout, { width: 900, quality: 92 })}
                  alt={seller.name}
                  decoding="async"
                  className="relative max-h-[300px] md:max-h-[380px] w-auto object-contain object-bottom"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(to bottom, #000 0%, #000 90%, rgba(0,0,0,0.5) 97%, rgba(0,0,0,0) 100%)",
                    maskImage:
                      "linear-gradient(to bottom, #000 0%, #000 90%, rgba(0,0,0,0.5) 97%, rgba(0,0,0,0) 100%)",
                    filter:
                      "drop-shadow(0 22px 14px rgba(0,0,0,0.35)) drop-shadow(0 4px 2px rgba(0,0,0,0.15))",
                  }}
                />
                {/* Camada quente casando luz do campo com a pessoa */}
                <div
                  className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,214,140,0.35) 0%, rgba(255,180,90,0.10) 60%, rgba(120,70,20,0.25) 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, #000 0%, #000 88%, rgba(0,0,0,0) 100%)",
                    maskImage:
                      "linear-gradient(to bottom, #000 0%, #000 88%, rgba(0,0,0,0) 100%)",
                  }}
                  aria-hidden
                />
              </div>
            ) : (
              <div className="mb-6 grid h-40 w-40 place-items-center rounded-full bg-white/80 text-[#d81f26] shadow-lg md:h-56 md:w-56">
                <UserRound className="h-24 w-24 md:h-32 md:w-32" strokeWidth={1.5} />
              </div>
            )}
          </div>

          {/* --- FAIXAS CURVAS (camada frente z-20) --- */}
          {/* SVG com dois swooshes finos que atravessam a base da foto */}
          <svg
            className="pointer-events-none absolute inset-0 z-20 h-full w-full"
            viewBox="0 0 600 400"
            preserveAspectRatio="none"
            aria-hidden
          >
            {/* Faixa AMARELA — arco baixo, atrás da vermelha */}
            <path
              d="M -40 340 Q 220 240 680 330 L 680 420 L -40 420 Z"
              fill="#f6c515"
            />
            {/* Faixa VERMELHA — arco mais alto, cortando a base da pessoa */}
            <path
              d="M -40 305 Q 240 210 680 300 L 680 360 Q 240 260 -40 355 Z"
              fill="#d81f26"
            />
            {/* Fio amarelo fino de contorno */}
            <path
              d="M -40 300 Q 240 205 680 295"
              stroke="#f6c515"
              strokeWidth="4"
              fill="none"
              opacity="0.9"
            />
          </svg>
        </div>

        {/* ============ LADO DIREITO — infos ============ */}
        <div className="relative bg-white p-6 sm:p-8 md:p-10 flex flex-col justify-center">
          {/* Marca d'água rural sutil */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05] bg-cover bg-center"
            style={{ backgroundImage: `url(${bg})` }}
            aria-hidden
          />
          {/* Curvinhas discretas no canto direito (identidade) */}
          <svg
            className="pointer-events-none absolute -right-2 -top-2 h-40 w-40 md:h-52 md:w-52"
            viewBox="0 0 200 200"
            aria-hidden
          >
            <path d="M200,0 Q120,20 200,120 Z" fill="#d81f26" />
            <path d="M200,20 Q150,60 200,140 Z" fill="#f6c515" opacity="0.9" />
          </svg>
          <svg
            className="pointer-events-none absolute -right-2 -bottom-2 h-32 w-32 md:h-44 md:w-44 rotate-180"
            viewBox="0 0 200 200"
            aria-hidden
          >
            <path d="M200,0 Q120,20 200,120 Z" fill="#f6c515" />
          </svg>

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
