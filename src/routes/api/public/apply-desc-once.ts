import { createFileRoute } from '@tanstack/react-router';
// @ts-expect-error - raw text import
import proddescRaw from '../../../../proddesc.txt?raw';

const SECRET = 'dukamp-desc-2026-one-shot';

type Row = { code: string; name: string; desc: string };

function parse(text: string): Row[] {
  let t = text;
  if (!t.startsWith('-------')) t = '-------\n' + t;
  const blocks = ('\n' + t).split('\n-------\n');
  const out: Row[] = [];
  for (const raw of blocks) {
    const b = raw.trim();
    if (!b || b === '-------') continue;
    const m = b.match(/^(\d{6})\s*-\s*([^\n]+)\n([\s\S]*)$/);
    if (!m) continue;
    out.push({ code: m[1], name: m[2].trim(), desc: m[3].trim() });
  }
  return out;
}

export const Route = createFileRoute('/api/public/apply-desc-once')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get('x-admin-secret') !== SECRET) {
          return new Response('Forbidden', { status: 403 });
        }
        const rows = parse(proddescRaw as unknown as string);
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const results: { code: string; ok: boolean; error?: string; matched?: boolean }[] = [];
        for (const r of rows) {
          const { data, error } = await supabaseAdmin
            .from('products')
            .update({ description: r.desc })
            .eq('code', r.code)
            .select('id');
          if (error) results.push({ code: r.code, ok: false, error: error.message });
          else results.push({ code: r.code, ok: true, matched: (data?.length ?? 0) > 0 });
        }
        const updated = results.filter((r) => r.ok && r.matched).length;
        const notFound = results.filter((r) => r.ok && !r.matched).length;
        const failed = results.filter((r) => !r.ok);
        return new Response(
          JSON.stringify({ total: rows.length, updated, notFound, failed }, null, 2),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      },
    },
  },
});
