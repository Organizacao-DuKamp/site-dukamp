import type { Seller } from "@/lib/sellers";
import { formatPhoneDisplay, telHref, whatsappUrl } from "@/lib/sellers";
import { optimizedImage } from "@/lib/image-url";
import { MapPin, Phone, Star, MessageCircle, ImageIcon } from "lucide-react";
import bannerBg from "@/assets/seller-banner-bg.jpg";

export function SellerProfileBanner({ seller }: { seller: Seller }) {
  const wa = whatsappUrl(
    seller.whatsapp ?? seller.phone,
    `Olá ${seller.name}, vim pelo site da Dukamp!`,
  );
  const phoneDisplay = formatPhoneDisplay(seller.phone ?? seller.whatsapp);
  const heroImage = seller.banner_url || bannerBg;
  const hasHero = !!seller.banner_url || !!bannerBg;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-xl">
      <div className="grid md:grid-cols-2 md:min-h-[360px]">
        {/* ============ ESQUERDA — arte pronta enviada pelo admin ============ */}
        <div className="relative min-h-[240px] md:min-h-full bg-muted">
          {hasHero ? (
            <img
              src={optimizedImage(heroImage, { width: 1200, quality: 90 })}
              alt={`Banner do vendedor ${seller.name}`}
              className="absolute inset-0 h-full w-full object-cover"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-10 w-10" />
                <span className="text-sm">Sem imagem cadastrada</span>
              </div>
            </div>
          )}
        </div>

        {/* ============ DIREITA — informações do vendedor ============ */}
        <div className="relative bg-white p-6 sm:p-8 md:p-10 flex flex-col justify-center">
          <div className="space-y-3 text-center md:text-left">
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
