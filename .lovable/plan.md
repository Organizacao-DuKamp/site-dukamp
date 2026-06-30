## Diagnóstico

Investiguei o app no navegador. Encontrei três causas distintas para o que você está vendo:

### 1. "Algo deu errado / Tentar novamente / Início"
Essa tela é o **ErrorComponent global** em `src/routes/__root.tsx`. Ele dispara sempre que algum componente da árvore lança uma exceção em render. Na página `produtos/$slug.tsx` o `useQuery` retorna `undefined` durante o carregamento e o código já tenta usar `p.images`, `p.installments`, etc. Em alguns produtos sem `images`/`installments`/`weight` válidos, o render quebra e cai no boundary — mostrando "Algo deu errado".

### 2. "Clique no card não funciona"
O clique **navega** corretamente (verifiquei com Playwright — a URL muda para `/produtos/<slug>`), porém a página renderiza instantaneamente **"Produto não encontrado."** enquanto o `useQuery` ainda está buscando. Resultado: visualmente parece que nada aconteceu / abriu uma página "vazia". Falta estado de loading e o "not found" só pode aparecer depois que a query terminou.

### 3. "Cards ficaram maiores do que o normal"
A grade atual é `grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4`. No breakpoint `md` (≥768px) ficou em 3 colunas — antes era 4 a partir de `lg`. Como o sidebar institucional ocupa 20rem à direita, sobra pouco espaço e os cards ficam grandes. Voltar para a densidade anterior resolve.

---

## Mudanças (somente front-end, sem mexer em banco/admin)

1. **`src/routes/produtos.$slug.tsx`**
   - Usar `isLoading`/`isFetched` do `useQuery` para mostrar um skeleton enquanto carrega.
   - Só renderizar "Produto não encontrado" após `isFetched && !data`.
   - Proteger acessos: `p.installments ?? 1`, `p.weight ?? "-"`, fallback de imagens.
   - Envolver em try/erro defensivo para que o boundary global não dispare por dados ausentes.

2. **`src/components/site/ProductCard.tsx`**
   - Manter o padrão de Link-overlay (clique no card inteiro funcionando), apenas confirmar que `preload="intent"` está ativo e que o overlay não bloqueia os botões.
   - Reduzir um pouco o padding interno para os cards ficarem mais compactos.

3. **Grades de produto em `src/routes/index.tsx`, `src/routes/produtos.index.tsx`, `src/routes/catalogos.$slug.tsx`**
   - Trocar para `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3` — volta à densidade anterior (4 colunas a partir de ~1024px, 5 em telas grandes).

4. **Verificação**
   - Rodar Playwright: abrir home, clicar em um card, confirmar que a página do produto renderiza (com skeleton → conteúdo) sem cair no ErrorBoundary.
   - Tirar screenshot em 777px e em 1280px para confirmar o tamanho dos cards.

Sem alterações no banco de dados, painel administrativo, autenticação ou rotas de API.