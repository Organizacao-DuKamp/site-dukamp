## Alteração

No `src/components/site/Footer.tsx`, coluna "Contato", trocar a lista atual (email + telefone único + endereço único) por três blocos:

1. **E-mail** (mantido no topo)
   - contato@dukamp.com.br

2. **Matriz** (indústria · administrativa · logística)
   - (17) 3275-3106
   - Av. Santos Dumont, 403 — Monte Aprazível/SP

3. **Filial — São José do Rio Preto**
   - (17) 2136-1111
   - R. Pedro Amaral, 3409 — Vila Ercília, São José do Rio Preto/SP, 15014-000

## Detalhes técnicos

- Os valores das duas unidades ficam **hardcoded** no `Footer.tsx` (o `site_settings.phone`/`address` continua existindo no banco para outros usos, mas o footer deixa de exibi-los para evitar duplicidade/conflito com os dois endereços).
- E-mail continua vindo de `settings?.email` (com fallback).
- Cada bloco terá um subtítulo pequeno em negrito ("Matriz", "Filial — São José do Rio Preto") para separação visual, seguindo o estilo já usado nas outras colunas.
- Nenhuma outra parte da página é alterada (header, navbar, produtos, etc.).

## Fora do escopo

- Página `/unidades` não é alterada nesta task.
- Não mexo em `site_settings` no banco.