import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { uid, status } = await req.json();

  if (status.state === 'ready') {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_KEY')!
    );

    await supabase
      .from('videos')
      .update({ status: 'ready' })
      .eq('cloudflare_uid', uid);
  }

  return new Response('ok', { status: 200 });
});