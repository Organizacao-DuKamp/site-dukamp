import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Package, Tag, FolderTree, Image as ImageIcon,
  Megaphone, Users, Settings, LogOut, ExternalLink, MessageSquare, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/catalogos", label: "Catálogos", icon: FolderTree },
  { to: "/admin/categorias", label: "Categorias", icon: Tag },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon },
  { to: "/admin/anuncios", label: "Anúncios", icon: Megaphone },
  { to: "/admin/atendimentos", label: "Atendimentos", icon: MessageSquare },
  { to: "/admin/contas", label: "Contas", icon: Users },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function SidebarContent({ pathname, onNavigate, signOut, isMaster }: { pathname: string; onNavigate?: () => void; signOut: () => void; isMaster: boolean }) {
  const items = NAV.filter((n) => n.to !== "/admin/contas" || isMaster);
  return (
    <>
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2 px-4 h-16 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">D</div>
        <div>
          <div className="font-bold text-sm">Dukamp</div>
          <div className="text-[10px] text-muted-foreground">Painel Admin</div>
        </div>
      </Link>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t space-y-1">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent">
          <ExternalLink className="h-4 w-4" /> Ver site
        </Link>
        <button onClick={() => { onNavigate?.(); signOut(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </>
  );
}

function AdminLayout() {
  const { user, isAdmin, isMasterAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-4">
        <div>
          <h1 className="text-xl font-bold">Acesso negado</h1>
          <p className="text-sm text-muted-foreground mt-2">Sua conta não tem permissão de administrador.</p>
          <Button className="mt-4" variant="outline" onClick={() => signOut()}>Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="hidden lg:flex w-60 bg-sidebar border-r flex-col shrink-0">
        <SidebarContent pathname={pathname} signOut={signOut} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-2 border-b bg-card px-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col">
              <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} signOut={signOut} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary grid place-items-center text-primary-foreground font-bold text-sm">D</div>
            <span className="font-bold text-sm">Painel Admin</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
