import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { InstitutionalSidebar } from "./InstitutionalSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavItems, type NavItem } from "@/lib/navbar-settings";
import { useAuth } from "@/lib/auth";

function useCategories() {
  return useQuery({
    queryKey: ["catalogs", "nav"],
    queryFn: async () => {
      const { data } = await supabase
        .from("catalogs")
        .select("id,name,slug")
        .eq("active", true)
        .order("name");
      return data ?? [];
    },
  });
}

function DesktopItem({ item }: { item: NavItem }) {
  const cats = useCategories();

  if (item.key === "produtos") {
    return (
      <li className="relative group">
        <Link
          to={item.to}
          className="flex items-center gap-1 px-4 py-3 hover:bg-white/10 transition-colors"
          activeProps={{ className: "flex items-center gap-1 px-4 py-3 bg-white/15" }}
        >
          {item.label} <ChevronDown className="h-3.5 w-3.5 opacity-80" />
        </Link>
        {/* Mega panel */}
        <div
          className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute left-0 top-full z-50 pt-1
                     translate-y-1 group-hover:translate-y-0 transition-all duration-200 ease-out"
        >
          <div className="rounded-b-md bg-white text-foreground shadow-xl border border-black/10 p-3
                          w-[min(90vw,720px)]">
            {cats.data?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-0.5">
                {cats.data.map((c) => (
                  <Link
                    key={c.id}
                    to="/produtos"
                    search={{ categoria: c.slug } as any}
                    className="block px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma categoria</div>
            )}
            <div className="border-t mt-2 pt-2">
              <Link to="/produtos" className="block px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md">
                Ver todos os produtos →
              </Link>
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={item.to}
        className="block px-4 py-3 hover:bg-white/10 transition-colors"
        activeProps={{ className: "block px-4 py-3 bg-white/15" }}
      >
        {item.label}
      </Link>
    </li>
  );
}

export function MainNav() {
  const [open, setOpen] = useState(false);
  const [mobileProdOpen, setMobileProdOpen] = useState(false);
  const { data: navItems } = useNavItems();
  const { user } = useAuth();
  const cats = useCategories();
  const baseItems = (navItems ?? []).filter((n) => n.visible);
  const items: NavItem[] = user
    ? [...baseItems, { key: "minhas-compras" as any, label: "Minhas Compras", to: "/minhas-compras", visible: true }]
    : baseItems;

  const mobCls = "block py-2.5 px-2 text-sm border-b hover:text-primary";

  return (
    <nav className="bg-[#0f4d2a] text-white border-b border-black/10">
      <div className="container mx-auto px-2">
        {/* Desktop */}
        <ul className="hidden lg:flex items-center gap-1 whitespace-nowrap text-sm font-medium">
          {items.map((it) => <DesktopItem key={it.key} item={it} />)}
        </ul>

        {/* Mobile */}
        <div className="lg:hidden flex items-center justify-between py-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline-flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-sm font-medium">
              <Menu className="h-5 w-5" /> Menu
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] sm:w-96 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Navegação</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 flex flex-col">
                {items.map((it) => {
                  if (it.key === "produtos") {
                    return (
                      <li key={it.key} className="border-b">
                        <button
                          onClick={() => setMobileProdOpen((v) => !v)}
                          className="w-full flex items-center justify-between py-2.5 px-2 text-sm hover:text-primary"
                        >
                          <span>{it.label}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${mobileProdOpen ? "rotate-180" : ""}`} />
                        </button>
                        {mobileProdOpen && (
                          <div className="pb-2 pl-3">
                            <Link
                              to="/produtos"
                              onClick={() => setOpen(false)}
                              className="block py-1.5 text-sm font-medium text-primary"
                            >
                              Todos os produtos
                            </Link>
                            {cats.data?.map((c) => (
                              <Link
                                key={c.id}
                                to="/produtos"
                                search={{ categoria: c.slug } as any}
                                onClick={() => setOpen(false)}
                                className="block py-1.5 text-sm text-muted-foreground hover:text-primary"
                              >
                                {c.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  }
                  return (
                    <li key={it.key}>
                      <Link to={it.to} onClick={() => setOpen(false)} className={mobCls}>
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-6">
                <InstitutionalSidebar />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-xs uppercase tracking-wider opacity-80 pr-2">Menu</span>
        </div>
      </div>
    </nav>
  );
}
