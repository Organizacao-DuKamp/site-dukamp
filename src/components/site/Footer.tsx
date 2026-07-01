import { Link, useNavigate } from "@tanstack/react-router";
import { useSiteSettings } from "@/lib/site-settings";
import { FOOTER_PAGES } from "@/lib/footer-pages";
import { useAuth } from "@/lib/auth";
import { useSupport } from "@/lib/support";

export function Footer() {
  const { data: settings } = useSiteSettings();
  const { user, isAdmin } = useAuth();
  const { openChat } = useSupport();
  const nav = useNavigate();
  const siteName = settings?.site_name || "Dukamp Saúde Animal";
  const tagline = settings?.tagline || "Mais de 20 anos cuidando da saúde dos animais.";
  const email = settings?.email || "contato@dukamp.com.br";
  const phone = settings?.phone || "(00) 0000-0000";
  const address = settings?.address || "";
  const logoUrl = settings?.logo_url;

  const informacoes = FOOTER_PAGES.filter((p) => p.group === "informacoes");
  const seguranca = FOOTER_PAGES.filter((p) => p.group === "seguranca");

  function handleFaleConosco(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    if (isAdmin) {
      nav({ to: "/admin/atendimentos" });
      return;
    }
    openChat();
  }

  return (
    <footer className="border-t bg-card mt-12">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-8 w-auto max-w-[140px] object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">D</div>
            )}
            <div className="font-bold">{siteName}</div>
          </div>
          <p className="text-muted-foreground">{tagline}</p>
        </div>

        <div>
          <div className="font-semibold mb-3">Institucional</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/unidades" className="hover:text-primary">Nossas Unidades</Link></li>
            <li><Link to="/sobre" className="hover:text-primary">Sobre Nós</Link></li>
            <li>
              <a href="/contato" onClick={handleFaleConosco} className="hover:text-primary cursor-pointer">
                Fale Conosco
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold mb-3">Informações</div>
          <ul className="space-y-2 text-muted-foreground">
            {informacoes.map((p) => (
              <li key={p.slug}>
                <Link to="/paginas/$slug" params={{ slug: p.slug }} className="hover:text-primary">{p.title}</Link>
              </li>
            ))}
          </ul>
          <div className="font-semibold mt-6 mb-3">Segurança</div>
          <ul className="space-y-2 text-muted-foreground">
            {seguranca.map((p) => (
              <li key={p.slug}>
                <Link to="/paginas/$slug" params={{ slug: p.slug }} className="hover:text-primary">{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="font-semibold mb-3">Contato</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>{email}</li>
            <li>{phone}</li>
            {address && <li className="whitespace-pre-line">{address}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteName}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
