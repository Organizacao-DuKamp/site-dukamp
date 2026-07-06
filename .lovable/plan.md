## Situação atual

Comparando `PROD_WEB.txt` (98 produtos) com a tabela `products` (51 produtos):

- **Todos os 51 produtos já têm `code` preenchido**.
- **Nenhum dos 9 códigos com preço vazio no banco existe no PROD_WEB.txt** — ou seja, casamento por código não resolve. É preciso casar por nome (fuzzy), como você mencionou.
- Só faz sentido atualizar esses 9 produtos (os demais já têm `consumer_price` e `producer_price`).

## Produtos do banco com preço vazio e possíveis matches no arquivo

| # | Produto no banco (code) | Match sugerido no PROD_WEB (code) | Consumidor | Produtor | Confiança |
|---|---|---|---|---|---|
| 1 | DUKAMP 87/S 30KG (005430) | *sem match* (arquivo só tem 40/60/65/80/S) | — | — | nenhum |
| 2 | DUKAMP CONCENTRADO CONFINAMENTO CGI-15/380 30KG (020687) | DUKAMP CONCENTRADO CONFINAMENTO GI-15/380 (020567) | 112,16 | 115,32 | alta |
| 3 | DUKAMP PROTEICO SECA ENGORDA GOLD 30KG (067150) | *sem match direto* (arquivo tem ENGORDA / ADITIVADO / PREMIUM, nenhum "GOLD") | — | — | nenhum |
| 4 | DUKAMP RACAO BABY ELITE 30KG (004920) | DUKAMP RACAO BABY 30KG (001643) — só "BABY", não "BABY ELITE" | 63,52 | 61,44 | baixa |
| 5 | DUKAMP RACAO CONFINAMENTO 18 PREMIUM 30KG (072564) | DUKAMP RACAO CONFINAMENTO PREMIUM 30 KGS (074187) | 53,90 | 53,90 | média |
| 6 | DUKAMP RACAO TOTAL M ENERGETICA 2% 30KG (077118) | DUKAMP RACAO DIETA TOTAL M ENERGETICA 2 % (077119) | 55,90 | 55,90 | alta |
| 7 | RACAO DUKAVALLUS EGUA PELETIZADA 30KG (050652) | *sem match* (arquivo só tem DUKAVALLUS-14) | — | — | nenhum |
| 8 | RACAO DUKAVALLUS POTRO PELETIZADA 30KG (007234) | *sem match* | — | — | nenhum |
| 9 | RACAO PROTEINADA DUKAVALLUS 30KG (052590) | *sem match* | — | — | nenhum |

## Restrições que vou respeitar

- Não criar nem deletar produtos.
- Não sobrescrever preços já preenchidos (`consumer_price`/`producer_price` diferente de 0 e NULL).
- Não alterar `code` (todos já existem).

## O que vou fazer após aprovação

1. **Aplicar automaticamente** os matches de confiança **alta** (linhas 2 e 6): atualizar `consumer_price` e `producer_price` (só onde estão em 0/NULL).
2. **Aguardar sua confirmação** para os matches ambíguos (linhas 4 e 5) — provavelmente são produtos distintos e não devem ser preenchidos com preços de outro item.
3. **Deixar como estão** os produtos sem match no arquivo (linhas 1, 3, 7, 8, 9).

## Perguntas para você

- **Linha 4** (BABY ELITE ↔ BABY): aplicar mesmo assim? Provavelmente **não**, "ELITE" costuma ser produto premium com preço diferente.
- **Linha 5** (CONFINAMENTO 18 PREMIUM ↔ CONFINAMENTO PREMIUM): aplicar? O "18" pode indicar teor proteico distinto.
- **Linhas 1, 3, 7, 8, 9**: quer que eu deixe em 0 mesmo, ou você tem outro arquivo/fonte com esses preços?

Ao aprovar, entro em modo build, aplico as atualizações confirmadas via SQL `UPDATE` na tabela `products` e reporto quantas linhas foram tocadas.
