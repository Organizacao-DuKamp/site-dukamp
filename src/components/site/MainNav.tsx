import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { InstitutionalSidebar } from "./InstitutionalSidebar";
import { supabase } from "@/integrations/supabase/client";

export function MainNav() {
  const [open, setOpen] = useState(false);
  const catalogs = useQuery({
    queryKey: ["catalogs", "nav"],
    queryFn: async () => {
      const { data } = await supabase
        .from("catalogs")
        .select("id,name,slug")
        .eq("active", true)
        .order("sort_order");
      return data ?? [];
    },
  });

  const renderLinks = (onClick?: () => void, className?: string, activeClassName?: string) => (
    <>
      <li>
        <Link to="/" onClick={onClick} className={className} activeProps={activeClassName ? { className: activeClassName } : undefined}>
          Início
        </Link>
      </li>
      {catalogs.data?.map((c) => (
        <li key={c.id}>
          <Link
            to="/catalogos/$slug"
            params={{ slug: c.slug }}
            onClick={onClick}
            className={className}
            activeProps={activeClassName ? { className: activeClassName } : undefined}
          >
            {c.name}
          </Link>
        </li>
      ))}
      <li>
        <Link to="/contato" onClick={onClick} className={className} activeProps={activeClassName ? { className: activeClassName } : undefined}>
          Equipe de Vendas
        </Link>
      </li>
      <li>
        <Link to="/unidades" onClick={onClick} className={className} activeProps={activeClassName ? { className: activeClassName } : undefined}>
          Nossas Unidades
        </Link>
      </li>
    </>
  );

  const deskCls = "block px-4 py-3 hover:bg-white/10 transition-colors";
  const deskActive = "block px-4 py-3 bg-white/15";
  const mobCls = "block py-2.5 px-2 text-sm border-b hover:text-primary";

  return (
    <nav className="bg-[#0f4d2a] text-white border-b border-black/10">
      <div className="container mx-auto px-2">
        {/* Desktop */}
        <ul className="hidden lg:flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm font-medium">
          {renderLinks(undefined, deskCls, deskActive)}
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
              <ul className="mt-4 flex flex-col">{renderLinks(() => setOpen(false), mobCls)}</ul>
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
