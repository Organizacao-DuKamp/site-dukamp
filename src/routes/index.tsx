import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Projeto Vazio" },
      { name: "description", content: "Projeto inicial com frontend e backend prontos para construir." },
      { property: "og:title", content: "Projeto Vazio" },
      { property: "og:description", content: "Projeto inicial com frontend e backend prontos para construir." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Pronto para começar
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Projeto vazio
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Frontend e backend já configurados. Diga o que você quer construir e começamos.
        </p>
      </div>
    </main>
  );
}
