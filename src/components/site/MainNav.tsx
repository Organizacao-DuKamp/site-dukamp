import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { InstitutionalSidebar } from "./InstitutionalSidebar";

const items = [
  { label: "Início", to: "/" as const },
  { label: "Bovinos de Corte", to: "/produtos" as const, search: { categoria: "bovinos-de-corte" } },
  { label: "Bovinos de Leite", to: "/produtos" as const, search: { categoria: "bovinos-de-leite" } },
  { label: "Equinos", to: "/produtos" as const, search: { categoria: "equinos" } },
  { label: "Ovinos", to: "/produtos" as const, search: { categoria: "ovinos" } },
  { label: "Suínos", to: "/produtos" as const, search: { categoria: "suinos" } },
  { label: "Aves", to: "/produtos" as const, search: { categoria: "aves" } },
  { label: "Equipe de Vendas", to: "/contato" as const },
  { label: "Nossas Unidades", to: "/unidades" as const },
];

export function MainNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="bg-[#0f4d2a] text-white border-b border-black/10">
      <div className="container mx-auto px-2">
        {/* Desktop */}
        <ul className="hidden lg:flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm font-medium">
          {items.map((it) => (
            <li key={it.label}>
              <Link
                to={it.to}
                search={(it as any).search}
                className="block px-4 py-3 hover:bg-white/10 transition-colors"
                activeProps={{ className: "block px-4 py-3 bg-white/15" }}
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile */}
        <div className="lg:hidden flex items-center justify-between py-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline-flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-sm font-medium">
              <Menu className="h-5 w-5" /> Menu
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] sm:w-96 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Categorias</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 flex flex-col">
                {items.map((it) => (
                  <li key={it.label}>
                    <Link
                      to={it.to}
                      search={(it as any).search}
                      onClick={() => setOpen(false)}
                      className="block py-2.5 px-2 text-sm border-b hover:text-primary"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <InstitutionalSidebar />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-xs uppercase tracking-wider opacity-80 pr-2">Categorias</span>
        </div>
      </div>
    </nav>
  );
}
