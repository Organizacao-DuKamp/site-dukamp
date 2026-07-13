## Objetivo

Reformular o dropdown de **Produtos** no navbar (desktop) para:
1. Mostrar apenas 10 categorias específicas, na ordem pedida.
2. Ao passar o mouse em uma categoria, **não navegar** — expandir um painel lateral **dentro do mesmo mega-menu** com os produtos daquela categoria, com animação de entrada.
3. Só navegar para a página da categoria/produto quando houver **clique** real.

## Categorias fixas (na ordem)

1. Suplementos Minerais *(ver observação abaixo)*
2. Rações Gado de Corte
3. Rações Gado Leiteiro
4. Núcleos
5. Concentrados
6. Proteinados Energéticos
7. Equinos
8. Ovinos
9. Confinamento Grão Inteiro
10. Aditivados Premium

**Observação sobre "Suplementos Minerais":** no banco existe hoje `Suplementos Naturais` (slug `suplementos-naturais`) — não existe `Suplementos Minerais`. Vou considerar que se trata da mesma categoria e usar o slug existente, apenas exibindo o rótulo "Suplementos Minerais" no navbar. Se preferir renomear a categoria no banco (ou criar uma nova), me avise antes de implementar.

## Comportamento do mega-menu (desktop)

```text
┌─────────────────────────────────────────────────────────────┐
│  [Categorias]                │   [Preview de produtos]      │
│  • Suplementos Minerais  ►   │   ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  • Rações Gado de Corte      │   │card│ │card│ │card│ │card││
│  • Rações Gado Leiteiro      │   └────┘ └────┘ └────┘ └────┘│
│  • Núcleos                   │   Ver todos em Suplementos → │
│  • Concentrados              │                              │
│  • ...                       │                              │
│  ─────────────────────────   │                              │
│  Ver todos os produtos →     │                              │
└─────────────────────────────────────────────────────────────┘
```

- Layout em duas colunas dentro do painel branco existente. Coluna esquerda = lista das 10 categorias; coluna direita = preview.
- **Hover em uma categoria** → apenas destaca a linha e troca o conteúdo da direita (sem navegar).
- **Clique na categoria** → navega para `/produtos?categoria=<slug>` (comportamento atual).
- **Clique num card de produto do preview** → navega para a página do produto.
- Categoria ativa por padrão (quando o menu abre): a primeira da lista.
- Se o mouse sair do painel, o menu fecha (comportamento atual do `group-hover`).

## Preview de produtos

- Buscar os **primeiros 4 produtos ativos** da categoria em foco (`products` filtrado por `catalog_id` correspondente ao slug, com `active = true`, ordenados por nome).
- Cache via TanStack Query com key `["nav-preview", slug]` — carrega sob demanda no primeiro hover e mantém em cache.
- Cards compactos: imagem quadrada + nome + preço (versão reduzida de `ProductCard`, ou um mini-card local).
- Estado vazio: "Nenhum produto nesta categoria ainda."
- Link final: **"Ver todos em <Categoria> →"** apontando para `/produtos?categoria=<slug>`.

## Animação

- Ao trocar a categoria em foco, o painel de preview aplica `animate-fade-in` (utilitário já disponível no projeto) usando `key={slugAtivo}` no wrapper para reexecutar a animação a cada troca.
- Abertura/fechamento do mega-menu mantém a transição atual (`opacity` + `translate-y`).

## Mobile

Comportamento mobile atual permanece (sheet lateral, lista simples de categorias, cada uma linka para `/produtos?categoria=<slug>`). Não faz sentido preview inline no drawer estreito. Apenas aplico o mesmo **filtro fixo das 10 categorias** e a mesma ordem.

## Detalhes técnicos

- Arquivo alterado: `src/components/site/MainNav.tsx`.
- Constante local `FEATURED_CATEGORIES` com pares `{ slug, label }` na ordem desejada. O `useCategories` existente busca todas do banco; filtro/ordenação aplicados via `FEATURED_CATEGORIES.map(f => catsBySlug.get(f.slug))`, ignorando as que não existirem.
- Estado `hoveredSlug` no `DesktopItem` de produtos (default = primeiro slug da lista); handlers `onMouseEnter` em cada `<li>` de categoria trocam o estado.
- Novo hook local `useCategoryPreview(slug)` — `useQuery` disparado com `enabled: !!slug`, seleciona `id, name, slug, image_url, price, consumer_price, producer_price` de `products` por `catalog_id`, limite 4.
- Cada categoria da coluna esquerda continua sendo um `<Link>` (para permitir clique → navegar) mas com `onMouseEnter` para trocar preview. **Não** trocamos por `<button>` para preservar o clique/navegação e acessibilidade.
- Largura do painel aumenta de `w-[min(90vw,720px)]` para `w-[min(95vw,880px)]` para acomodar as duas colunas.
- Nenhuma alteração de schema, RLS ou rotas.

## Fora do escopo

- Editor admin do navbar (`/admin/navbar`) continua controlando visibilidade/label do item "Produtos" apenas — a lista de 10 categorias é fixa no código, conforme pedido.
- Página `/produtos` e filtros existentes ficam intactos.