import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Search, User, LogOut, LayoutDashboard, MessageCircle, UserCircle, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, formatBRL } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useSupport } from "@/lib/support";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FacebookBrand, InstagramBrand, YoutubeBrand, TikTokBrand } from "./BrandIcons";
import fixedLogo from "@/assets/dukamp-logo.webp";

const socials = [
  { href: "https://www.facebook.com/AgromonteRioPreto21", label: "Facebook", Icon: FacebookBrand },
  { href: "https://www.instagram.com/dukampsaudeanimal/", label: "Instagram", Icon: InstagramBrand },
  { href: "https://www.youtube.com/c/DUKAMP?reload=9", label: "YouTube", Icon: YoutubeBrand },
  { href: "https://www.tiktok.com/@dukampsaudeanimaloficial", label: "TikTok", Icon: TikTokBrand },
];



export function Header() {
  const { count, items, total, remove, setQty } = useCart();
  const { user, isAdmin, accountType, signOut } = useAuth();
  const { ticket, openChat } = useSupport();
  
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate({ to: "/produtos", search: { q: q.trim() } as any });
  }



  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center shrink-0" aria-label="Início">
            <img
              src={fixedLogo}
              alt="Dukamp Saúde Animal"
              width={168}
              height={56}
              fetchPriority="high"
              decoding="async"
              className="h-12 sm:h-14 w-auto object-contain select-none"
              draggable={false}
            />

          </Link>

          <form onSubmit={onSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar produtos..."
                className="pl-9"
              />
            </div>
          </form>

          <div className="flex items-center gap-1 ml-auto">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="Minha conta">
                    <UserCircle className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">
                    <div className="truncate">{user.email}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        {accountType === "cliente" ? "Consumidor" : accountType === "produtor" ? "Produtor Rural" : accountType === "empresa" ? "Empresa" : "Admin"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><LayoutDashboard className="h-4 w-4 mr-2" />Painel Administrativo</Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />Meu Painel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      if (isAdmin) navigate({ to: "/admin/atendimentos" });
                      else openChat();
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Atendimento{!isAdmin && ticket && ticket.status !== "closed" ? " (aberto)" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/minha-conta"><User className="h-4 w-4 mr-2" />Minha Conta</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  asChild
                  size="sm"
                  className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm gap-1.5 animate-in fade-in"
                  title="Criar sua conta"
                >
                  <Link to="/auth" hash="cadastro">
                    <Plus className="h-4 w-4" />
                    Novo cliente? Cadastre-se
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" title="Entrar">
                  <Link to="/auth">
                    <User className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Entrar</span>
                  </Link>
                </Button>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" title="Carrinho">
                  <ShoppingCart className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-5 min-w-5 px-1 grid place-items-center font-medium">
                      {count}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>Carrinho ({count})</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3 flex-1 overflow-auto pr-1">
                  {items.length === 0 && (
                    <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
                  )}
                  {items.map((i) => (
                    <div key={i.id} className="flex gap-3 border-b pb-3">
                      <div className="h-16 w-16 rounded bg-muted shrink-0 overflow-hidden">
                        {i.image && <img src={i.image} alt={i.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0 text-sm">
                        <div className="font-medium line-clamp-2">{i.name}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">{formatBRL(i.price)}</div>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <div className="inline-flex items-center border rounded-md">
                            <button
                              onClick={() => setQty(i.id, i.quantity - 1)}
                              disabled={i.quantity <= 1}
                              className="h-7 w-7 grid place-items-center disabled:opacity-40"
                              aria-label="Diminuir"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={i.quantity}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "");
                                if (raw === "") { setQty(i.id, 1); return; }
                                const n = parseInt(raw, 10);
                                if (Number.isFinite(n) && n > 0) setQty(i.id, n);
                              }}
                              onBlur={(e) => {
                                const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                                setQty(i.id, Number.isFinite(n) && n > 0 ? n : 1);
                              }}
                              className="w-8 text-center text-xs bg-transparent outline-none border-0 focus:ring-0"
                              aria-label="Quantidade"
                            />

                            <button
                              onClick={() => setQty(i.id, i.quantity + 1)}
                              className="h-7 w-7 grid place-items-center"
                              aria-label="Aumentar"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="font-semibold text-xs">{formatBRL(i.price * i.quantity)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => remove(i.id)}
                        className="text-muted-foreground hover:text-destructive self-start p-1"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {items.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatBRL(total)}</span>
                    </div>
                    <Button asChild className="w-full">
                      <Link to="/carrinho">Ver carrinho completo</Link>
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center gap-1 ml-2 pl-2 border-l">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="h-8 w-8 grid place-items-center rounded hover:bg-accent"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={onSearch} className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="pl-9" />
          </div>
        </form>
      </div>
    </header>
  );
}
