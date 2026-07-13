Atualizar o slogan da Dukamp de **"Saúde animal de confiança"** para **"Alimentando a pecuária brasileira"**.

## Onde está

O slogan não é hardcoded no código — fica em `site_settings` (chave `general`, campo `tagline`) e é lido no `Footer.tsx`.

## Mudança

Uma única atualização de dado no banco:

```sql
UPDATE site_settings
SET value = jsonb_set(value, '{tagline}', '"Alimentando a pecuária brasileira"'::jsonb)
WHERE key = 'general';
```

Isso reflete automaticamente no Footer (e em qualquer outro lugar que leia `tagline`).

Nenhum arquivo será editado.