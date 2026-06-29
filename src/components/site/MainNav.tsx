import { Link } from "@tanstack/react-router";

const items = [
  { label: "Início", to: "/" as const },
  { label: "Bovinos de Corte", to: "/produtos" as const, search: { categoria: "bovinos-de-corte" } },
  { label: "Bovinos de Leite", to: "/produtos" as const, search: { categoria: "bovinos-de-leite" } },
  { label: "Equinos", to: "/produtos" as const, search: { categoria: "equinos" } },
  { label: "Ovinos", to: "/produtos" as const, search: { categoria: "ovinos" } },
  { label: "Suínos", to: "/produtos" as const, search: { categoria: "suinos" } },
  { label: "Aves", to: "/produtos" as const, search: { categoria: "aves" } },
  { label: "Equipe de Vendas", to: "/contato" as const },
  { label: "Nossas Unidades", to: "/sobre" as const },
];

export function MainNav() {
  return (
    <nav className="bg-[#0f4d2a] text-white border-b border-black/10">
      <div className="container mx-auto px-2">
        <ul className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm font-medium">
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
      </div>
    </nav>
  );
}
