import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Search, User, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatBRL } from "@/lib/cart";

export function Header() {
  const { count, items, total, remove } = useCart();
  const { user, isAdmin, signOut } = useAuth();
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
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">
              D
            </div>
            <div className="hidden sm:block">
              <div className="font-bold leading-tight">Dukamp</div>
              <div className="text-xs text-muted-foreground leading-tight">Saúde Animal</div>
            </div>
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

          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <Link to="/" className="px-3 py-2 hover:text-primary">Início</Link>
            <Link to="/catalogos" className="px-3 py-2 hover:text-primary">Catálogos</Link>
            <Link to="/produtos" className="px-3 py-2 hover:text-primary">Produtos</Link>
            <Link to="/sobre" className="px-3 py-2 hover:text-primary">Sobre</Link>
            <Link to="/contato" className="px-3 py-2 hover:text-primary">Contato</Link>
          </nav>

          <div className="flex items-center gap-1 ml-auto">
            {user ? (
              <>
                {isAdmin && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sair">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button asChild variant="ghost" size="icon" title="Entrar">
                <Link to="/auth"><User className="h-5 w-5" /></Link>
              </Button>
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
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Carrinho ({count})</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-auto">
                  {items.length === 0 && (
                    <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
                  )}
                  {items.map((i) => (
                    <div key={i.id} className="flex gap-3 border-b pb-3">
                      <div className="h-14 w-14 rounded bg-muted shrink-0 overflow-hidden">
                        {i.image && <img src={i.image} alt={i.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="font-medium line-clamp-1">{i.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {i.quantity} × {formatBRL(i.price)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => remove(i.id)}>×</Button>
                    </div>
                  ))}
                </div>
                {items.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatBRL(total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Checkout em breve.</p>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
                <nav className="mt-4 flex flex-col">
                  <Link to="/" className="py-2">Início</Link>
                  <Link to="/catalogos" className="py-2">Catálogos</Link>
                  <Link to="/produtos" className="py-2">Produtos</Link>
                  <Link to="/sobre" className="py-2">Sobre</Link>
                  <Link to="/contato" className="py-2">Contato</Link>
                </nav>
              </SheetContent>
            </Sheet>
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
