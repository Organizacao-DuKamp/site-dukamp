import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t bg-card mt-12">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">D</div>
            <div className="font-bold">Dukamp Saúde Animal</div>
          </div>
          <p className="text-muted-foreground">Mais de 20 anos cuidando da saúde dos animais.</p>
        </div>
        <div>
          <div className="font-semibold mb-3">Loja</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/produtos" className="hover:text-primary">Produtos</Link></li>
            <li><Link to="/catalogos" className="hover:text-primary">Catálogos</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Institucional</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/sobre" className="hover:text-primary">Sobre</Link></li>
            <li><Link to="/contato" className="hover:text-primary">Contato</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Contato</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>contato@dukamp.com.br</li>
            <li>(00) 0000-0000</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Dukamp Saúde Animal. Todos os direitos reservados.
      </div>
    </footer>
  );
}
