## Objetivo
Preencher o campo `description` dos 83 produtos que aparecem no arquivo `descricoes_produtos_rtpi_consolidado_negrito.txt`, casando pelo **código**, com o texto convertido para HTML (`**…**` → `<strong>…</strong>`) e quebras de linha preservadas.

## Cobertura (já verificada)
- Arquivo: 128 fichas RTPI, 334 linhas de código, **83 códigos únicos**.
- Banco: 98 produtos. **Todos os 83 códigos do arquivo existem no banco** — nenhum "não encontrado" esperado.
- 15 produtos do banco não aparecem no arquivo → ficam intocados.

## Passos

1. **Parser (Node, executado no sandbox — 0 créditos)**
   - Ler o arquivo, dividir pelas linhas `====…====`.
   - Em cada bloco:
     - Extrair códigos do bloco `**Código(s):**` (regex `^- (\d{6}) —`).
     - Pegar o corpo a partir de `**Descrição / Informações do produto:**` (ou início da ficha) até o fim do bloco.
     - Remover a seção final `**DADOS DA EMPRESA:**` e cabeçalhos de "Arquivo origem".
   - Converter para HTML preservando o significado:
     - `**texto**` → `<strong>texto</strong>` (títulos de seção em negrito).
     - Quebras de linha → `<br>` dentro de parágrafos; linhas em branco separam `<p>`.
     - Escapar `<`, `>`, `&` do texto original antes da substituição do negrito.
   - Todos os códigos do mesmo bloco recebem a **mesma descrição** (é o padrão do arquivo: várias apresentações do mesmo produto).
   - Gravar `/tmp/updates.json` com `[{code, html}]`.

2. **Update no banco (via `supabase--insert` — 1 chamada, 83 UPDATEs)**
   - Um único statement com `UPDATE products AS p SET description = v.html FROM (VALUES …) AS v(code, html) WHERE p.code = v.code`.
   - Só o campo `description` é tocado. Nome, preço, imagens, categoria, estoque, slug, SKU permanecem.

3. **Renderização (ajuste mínimo de UI, necessário para o negrito aparecer)**
   - Hoje `src/routes/produtos.$slug.tsx` renderiza a descrição como texto puro (`whitespace-pre-wrap`), o que faria as tags aparecerem como texto.
   - Trocar aquele bloco por `<RichContent html={p.description} />` (componente já existe em `src/components/site/RichContent.tsx`). Nenhuma outra mudança no arquivo.

4. **Verificação**
   - `SELECT code, length(description) FROM products WHERE code IN (…)` para confirmar as 83 linhas atualizadas.
   - Abrir 1 produto no preview para confirmar que os títulos aparecem em negrito.

## Estimativa de créditos
- Parsing e escrita do JSON: shell/Node no sandbox → 0 créditos.
- 1 chamada `supabase--insert` com UPDATE em lote → custo baixo, muito abaixo de 5 créditos.
- 1 edição em `produtos.$slug.tsx` (troca de 3 linhas) → custo baixo.
- **Total estimado: bem abaixo de 5 créditos → prossigo sem cancelar.**

## Resumo final que será entregue
- Nº de produtos atualizados (esperado: 83).
- Nº de códigos não encontrados (esperado: 0 — todos presentes).
- Nº de produtos do banco intocados (esperado: 15).
- Aviso: pequeno ajuste de UI em `produtos.$slug.tsx` foi necessário para renderizar o negrito.
