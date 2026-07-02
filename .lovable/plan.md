# Correção do frete dos Correios

## Diagnóstico

Os logs do servidor mostram que a autenticação Basic Auth está sendo rejeitada em **todos** os endpoints (`autentica`, `contrato`, `cartaopostagem`) com `401 Unauthorized` e header `WWW-Authenticate: Basic realm="Realm"`. Isso significa que os Correios recusam as credenciais **antes** de olhar contrato ou cartão.

Comparando as tentativas registradas nos logs:

- Tentativa anterior: `senhaLen: 40` → mesmo assim 401 (o código CWS anterior não estava correto/liberado).
- Tentativa mais recente: `senhaLen: 11` → 401 imediato.

O código de acesso às APIs do CWS dos Correios tem **40 caracteres**. Uma senha de 11 caracteres é a senha comum do "Meu Correios" — essa API REST não aceita ela. Ou seja, o valor atual em `CORREIOS_SENHA` está no formato errado.

O `CORREIOS_USUARIO` tem 10 caracteres (idCorreios), que é o formato esperado, então esse está OK.

Também verifiquei:
- CEP é normalizado (`onlyDigits`) antes das chamadas ✅
- CEP de origem definido (`15150104`) ✅
- Dimensões dos produtos são agregadas com mínimos/máximos dos Correios ✅
- Endpoints REST (`api.correios.com.br/token/v1/...` e `/preco/v1/nacional`) estão corretos ✅
- Nenhuma chave é exposta no frontend ✅
- O código já bloqueia agora quando `senhaLen ≠ 40` com mensagem clara

Portanto o problema **não está no código**. Está no valor da variável de ambiente `CORREIOS_SENHA`.

## O que precisa ser feito (sem código)

Substituir `CORREIOS_SENHA` pelo **Código de Acesso às APIs do CWS** correto (40 caracteres).

### Como obter esse código

1. Entrar em https://cws.correios.com.br/ com o mesmo login/idCorreios usado em `CORREIOS_USUARIO`.
2. Menu **Meus Serviços → API dos Correios → Gestão de acesso a APIs** (também chamado "Gerar código de acesso").
3. Clicar em **Gerar novo código de acesso** (ou copiar o vigente).
4. Copiar o valor completo — deve ter ~40 caracteres alfanuméricos.

> Importante: esse código é vinculado ao contrato/cartão de postagem. Se o CWS mostrar aviso de "sem serviços habilitados para API REST", o gerente comercial dos Correios precisa liberar seu contrato para a API REST — isso é feito por eles, não tem como resolver no código.

### Aplicação

Assim que você tiver o código, me diga **"pode abrir o formulário para atualizar CORREIOS_SENHA"** que eu abro o campo seguro para você colar (não gasta crédito significativo).

## Estimativa de custo

Nenhuma alteração de código é necessária — apenas atualização de um secret via formulário seguro. Muito abaixo do limite de 3 créditos.

## Arquivos alterados

Nenhum.

## Setup manual pendente

- Atualizar `CORREIOS_SENHA` com o Código de Acesso às APIs do CWS (40 caracteres).
- Se após atualizar continuar dando 401, confirmar com o gerente dos Correios que o contrato/idCorreios está habilitado para a API REST nova.
