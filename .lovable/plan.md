Cole estas variáveis no Netlify em **Site settings → Environment variables** (ou num arquivo `.env` local, se for pra rodar fora do Lovable):

```env
VITE_SUPABASE_URL=https://mkehkhngltpltrtxdksi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_D2K_2kVyuP2jluJvowPBWA_gshiIUDp
VITE_SUPABASE_PROJECT_ID=mkehkhngltpltrtxdksi

SUPABASE_URL=https://mkehkhngltpltrtxdksi.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_D2K_2kVyuP2jluJvowPBWA_gshiIUDp
```

## Passos no Netlify

1. **Site settings → Environment variables** — apague qualquer variável antiga apontando pra `ymujutvxlbwhnsfdlwpz` (URL, publishable key, anon key).
2. Adicione as 5 variáveis acima com os valores novos.
3. Se existir uma **integração da Supabase** conectada em Site settings → Integrations, **desconecte** — ela reinjeta as variáveis do projeto antigo a cada deploy e sobrescreve o que você colocar manualmente.
4. **Deploys → Trigger deploy → Clear cache and deploy site** (não basta um redeploy normal).
5. Abra o site publicado, DevTools → Network, confirme que as chamadas vão pra `mkehkhngltpltrtxdksi.supabase.co`.

## Segredos server-side (Mercado Pago, Correios)

Estes **não** vão no Netlify como env vars públicas — ficam nos secrets do Lovable Cloud (já configurados: `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `CORREIOS_*`). Não precisa mexer.

## Observação técnica

O `vite.config.ts` já tem fallback pras credenciais novas, mas ele só é usado quando `process.env.SUPABASE_URL` está **ausente** no build. Como o Netlify tem a variável antiga definida, o fallback é ignorado — por isso o build sai apontando pra Supabase velha mesmo com o código atualizado.