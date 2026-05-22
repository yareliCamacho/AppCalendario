// Edge Function: envía push vía Expo cuando se inserta una notificación
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  const { record } = await req.json();
  const { data: user } = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/users?id=eq.${record.user_id}&select=push_token`,
    {
      headers: {
        apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
    },
  ).then((r) => r.json());

  const token = user?.[0]?.push_token;
  if (!token) return new Response(JSON.stringify({ skipped: true }), { status: 200 });

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title: record.title,
      body: record.body,
    }),
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
