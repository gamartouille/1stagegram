Deno.serve(async (req) => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${Deno.env.get('CF_ACCOUNT_ID')}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('CF_API_TOKEN')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ maxDurationSeconds: 180 })
    }
  );

  const data = await response.json();

  return new Response(JSON.stringify({
    uploadURL: data.result.uploadURL,
    uid: data.result.uid
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});